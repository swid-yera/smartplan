package service

import (
	"context"
	"math"

	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

type UserDepartment struct {
	KeycloakID uuid.UUID               `json:"keycloakId"`
	Name       localization.LocaleText `json:"name"`
}

type User struct {
	KeycloakID  uuid.UUID        `json:"keycloakId"`
	Email       string           `json:"email"`
	Username    string           `json:"username"`
	FirstName   string           `json:"firstName"`
	LastName    string           `json:"lastName"`
	Role        string           `json:"role"`
	Phone       string           `json:"phone"`
	Departments []UserDepartment `json:"departments"`
	TotalPoints int32            `json:"totalPoints"`
}

type PaginationMeta struct {
	CurrentPage int `json:"currentPage"`
	Pages       int `json:"pages"`
	Total       int `json:"total"`
	PageSize    int `json:"pageSize"`
}

type PaginatedUsersResponse struct {
	Data []*User        `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type UserService interface {
	GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*User, error)
	GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*User, error)
	GetUserBySessionIDFromStorageUser(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
	GetUsersPaginated(ctx context.Context, CurrentPage int, pageSize int, search string, departmentID pgtype.UUID) (*PaginatedUsersResponse, error)
	GetUsersRatingPaginated(ctx context.Context, CurrentPage int, pageSize int, search string) (*PaginatedUsersResponse, error)
	CountUsers(ctx context.Context) (int64, error)
}

type userService struct {
	repo  repository.UsersRepository
	redis *redis.Client
}

func NewUserService(repo repository.UsersRepository, redisClient *redis.Client) UserService {
	return &userService{repo: repo, redis: redisClient}
}

func (s *userService) GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*User, error) {
	sessionKey := "session:" + sessionID.String()

	keycloakIDStr, err := s.redis.HGet(ctx, sessionKey, "keycloak_id").Result()
	if err != nil {
		return nil, err
	}

	keycloakID, err := uuid.Parse(keycloakIDStr)
	if err != nil {
		return nil, err
	}

	dbUser, err := s.repo.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, err
	}

	return s.toServiceUser(ctx, dbUser)
}

func (s *userService) GetUserBySessionIDFromStorageUser(ctx context.Context, sessionID uuid.UUID) (*storage.User, error) {
	sessionKey := "session:" + sessionID.String()

	keycloakIDStr, err := s.redis.HGet(ctx, sessionKey, "keycloak_id").Result()
	if err != nil {
		return nil, err
	}

	keycloakID, err := uuid.Parse(keycloakIDStr)
	if err != nil {
		return nil, err
	}
	return s.repo.GetUserByKeycloakID(ctx, keycloakID)
}

func (s *userService) GetUsersPaginated(
	ctx context.Context,
	currentPage int,
	pageSize int,
	search string,
	departmentID pgtype.UUID,
) (*PaginatedUsersResponse, error) {
	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountUsersFiltered(ctx, search, departmentID)
	if err != nil {
		return nil, err
	}

	dbUsers, err := s.repo.GetUsersPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		search,
		departmentID,
	)
	if err != nil {
		return nil, err
	}

	users := make([]*User, 0, len(dbUsers))
	for _, dbUser := range dbUsers {
		mapped, mapErr := s.toServiceUser(ctx, &dbUser)
		if mapErr != nil {
			return nil, mapErr
		}
		users = append(users, mapped)
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	return &PaginatedUsersResponse{
		Data: users,
		Meta: PaginationMeta{
			CurrentPage: currentPage,
			Pages:       pages,
			Total:       int(total),
			PageSize:    pageSize,
		},
	}, nil
}

func (s *userService) GetUsersRatingPaginated(
	ctx context.Context,
	currentPage int,
	pageSize int,
	search string,
) (*PaginatedUsersResponse, error) {
	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountUsersRatingFiltered(ctx, search)
	if err != nil {
		return nil, err
	}

	dbUsers, err := s.repo.GetUsersRatingPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		search,
	)
	if err != nil {
		return nil, err
	}

	users := make([]*User, 0, len(dbUsers))
	for _, dbUser := range dbUsers {
		mapped, mapErr := s.toServiceUser(ctx, &dbUser)
		if mapErr != nil {
			return nil, mapErr
		}
		users = append(users, mapped)
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	return &PaginatedUsersResponse{
		Data: users,
		Meta: PaginationMeta{
			CurrentPage: currentPage,
			Pages:       pages,
			Total:       int(total),
			PageSize:    pageSize,
		},
	}, nil
}

func (s *userService) toServiceUser(ctx context.Context, user *storage.User) (*User, error) {
	firstName := ""
	lastName := ""
	phone := ""

	if user.FirstName.Valid {
		firstName = user.FirstName.String
	}
	if user.LastName.Valid {
		lastName = user.LastName.String
	}
	if user.Phone.Valid {
		phone = user.Phone.String
	}

	departments, err := s.repo.GetDepartmentsByUserID(ctx, user.KeycloakID)
	if err != nil {
		return nil, err
	}

	mappedDepartments := make([]UserDepartment, 0, len(departments))
	for _, department := range departments {
		mappedDepartments = append(mappedDepartments, UserDepartment{
			KeycloakID: department.KeycloakID,
			Name:       localization.LocaleTextFromJSONB(department.Name),
		})
	}

	return &User{
		KeycloakID:  user.KeycloakID,
		Email:       user.Email,
		Username:    user.Username,
		FirstName:   firstName,
		LastName:    lastName,
		Role:        string(user.Role),
		Phone:       phone,
		Departments: mappedDepartments,
		TotalPoints: user.TotalPoints,
	}, nil
}

func (s *userService) GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*User, error) {
	dbUser, err := s.repo.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, err
	}

	return s.toServiceUser(ctx, dbUser)
}

func (s *userService) CountUsers(ctx context.Context) (int64, error) {
	return s.repo.CountUsers(ctx)
}
