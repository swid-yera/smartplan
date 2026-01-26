package service

import (
	"context"
	"math"

	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type User struct {
	KeycloakID  uuid.UUID `json:"keycloakId"`
	Email       string    `json:"email"`
	Username    string    `json:"username"`
	FirstName   string    `json:"firstName"`
	LastName    string    `json:"lastName"`
	Role        string    `json:"role"`
	Phone       string    `json:"phone"`
	TotalPoints int32     `json:"totalPoints"`
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
	GetUsersPaginated(ctx context.Context, CurrentPage int, pageSize int, search string) (*PaginatedUsersResponse, error)
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

	return toServiceUser(dbUser), nil
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
) (*PaginatedUsersResponse, error) {

	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountUsersFiltered(ctx, search)
	if err != nil {
		return nil, err
	}

	dbUsers, err := s.repo.GetUsersPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		search,
	)
	if err != nil {
		return nil, err
	}

	users := make([]*User, 0, len(dbUsers))
	for _, u := range dbUsers {
		users = append(users, toServiceUser(&u))
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

	total, err := s.repo.CountUsersFiltered(ctx, search)
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
	for _, u := range dbUsers {
		users = append(users, toServiceUser(&u))
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

func toServiceUser(u *storage.User) *User {
	firstName := ""
	lastName := ""
	phone := ""

	if u.FirstName.Valid {
		firstName = u.FirstName.String
	}
	if u.LastName.Valid {
		lastName = u.LastName.String
	}
	if u.Phone.Valid {
		phone = u.Phone.String
	}

	return &User{
		KeycloakID:  u.KeycloakID,
		Email:       u.Email,
		Username:    u.Username,
		FirstName:   firstName,
		LastName:    lastName,
		Role:        string(u.Role),
		Phone:       phone,
		TotalPoints: u.TotalPoints,
	}
}

func (s *userService) GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*User, error) {
	dbUser, err := s.repo.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, err
	}

	return toServiceUser(dbUser), nil
}

func (r *userService) CountUsers(ctx context.Context) (int64, error) {
	return r.repo.CountUsers(ctx)
}
