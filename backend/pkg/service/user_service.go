package service

import (
	"context"
	"errors"
	"math"
	"strings"
	"time"

	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

type UserDepartment struct {
	KeycloakID uuid.UUID               `json:"keycloakId"`
	Name       localization.LocaleText `json:"name"`
}

type User struct {
	KeycloakID  uuid.UUID          `json:"keycloakId"`
	Email       string             `json:"email"`
	Username    string             `json:"username"`
	FirstName   string             `json:"firstName"`
	LastName    string             `json:"lastName"`
	Role        string             `json:"role"`
	Phone       string             `json:"phone"`
	Departments []UserDepartment   `json:"departments"`
	TotalPoints int32              `json:"totalPoints"`
	Violation   string             `json:"violation"`
	Violations  []*ViolationRecord `json:"violations"`
}

type Penalty struct {
	ID          uuid.UUID `json:"id"`
	Points      int32     `json:"points"`
	TeacherID   uuid.UUID `json:"teacherId"`
	MethodistID uuid.UUID `json:"methodistId"`
	Note        string    `json:"note"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ViolationRecord struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	IssuedBy  uuid.UUID `json:"issuedBy"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ViolationActionResponse struct {
	Violation *ViolationRecord `json:"violation"`
	User      *User            `json:"user"`
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
	GetUsersPaginated(ctx context.Context, CurrentPage int, pageSize int, search string, sort string, departmentID pgtype.UUID) (*PaginatedUsersResponse, error)
	GetUsersRatingPaginated(ctx context.Context, CurrentPage int, pageSize int, search string, sort string) (*PaginatedUsersResponse, error)
	IssueViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, note string) (*ViolationActionResponse, error)
	UpdateViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, violationID uuid.UUID, note string) (*ViolationActionResponse, error)
	CreatePenalty(ctx context.Context, methodistID uuid.UUID, teacherID uuid.UUID, points int32, note string) (*Penalty, error)
	GetPenaltiesByTeacherID(ctx context.Context, teacherID uuid.UUID) ([]*Penalty, error)
	GetPenaltyByIDAndTeacherID(ctx context.Context, penaltyID uuid.UUID, teacherID uuid.UUID) (*Penalty, error)
	DeletePenaltyByIDAndTeacherID(ctx context.Context, penaltyID uuid.UUID, teacherID uuid.UUID) error
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
	sort string,
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
		sort,
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
	sort string,
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
		sort,
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

	violations := make([]*ViolationRecord, 0)
	if len(user.ViolationIds) > 0 {
		dbViolations, err := s.repo.GetViolationsByIDs(ctx, user.ViolationIds)
		if err != nil {
			return nil, err
		}
		violations = make([]*ViolationRecord, 0, len(dbViolations))
		for _, dbViolation := range dbViolations {
			violations = append(violations, mapViolationRecord(dbViolation))
		}
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
		Violation:   string(user.Violation),
		Violations:  violations,
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

func (s *userService) CreatePenalty(ctx context.Context, methodistID uuid.UUID, teacherID uuid.UUID, points int32, note string) (*Penalty, error) {
	if points <= 0 {
		return nil, &HTTPStatusError{StatusCode: 400, Message: "points must be greater than 0"}
	}

	note = strings.TrimSpace(note)
	if note == "" {
		return nil, &HTTPStatusError{StatusCode: 400, Message: "note is required"}
	}

	teacher, err := s.repo.GetUserByKeycloakID(ctx, teacherID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "teacher not found"}
	}

	_, err = s.repo.GetUserByKeycloakID(ctx, methodistID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "methodist not found"}
	}

	penaltyID := uuid.New()
	err = s.repo.CreatePenalty(ctx, storage.CreatePenaltyParams{
		ID:        penaltyID,
		Points:    []int32{points},
		Teacher:   pgtype.UUID{Bytes: teacher.KeycloakID, Valid: true},
		Methodist: pgtype.UUID{Bytes: methodistID, Valid: true},
		Note:      pgtype.Text{String: note, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	if err = s.repo.UpdateUserTotalPoints(ctx, teacherID, -points); err != nil {
		return nil, err
	}

	return s.GetPenaltyByIDAndTeacherID(ctx, penaltyID, teacherID)
}

func (s *userService) GetPenaltiesByTeacherID(ctx context.Context, teacherID uuid.UUID) ([]*Penalty, error) {
	dbPenalties, err := s.repo.GetPenaltiesByTeacherID(ctx, teacherID)
	if err != nil {
		return nil, err
	}

	penalties := make([]*Penalty, 0, len(dbPenalties))
	for _, dbPenalty := range dbPenalties {
		penalties = append(penalties, mapPenalty(dbPenalty))
	}

	return penalties, nil
}

func (s *userService) GetPenaltyByIDAndTeacherID(ctx context.Context, penaltyID uuid.UUID, teacherID uuid.UUID) (*Penalty, error) {
	dbPenalty, err := s.repo.GetPenaltyByIDAndTeacherID(ctx, storage.GetPenaltyByIDAndTeacherIDParams{
		ID:      penaltyID,
		Teacher: pgtype.UUID{Bytes: teacherID, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	return mapPenalty(dbPenalty), nil
}

func (s *userService) DeletePenaltyByIDAndTeacherID(ctx context.Context, penaltyID uuid.UUID, teacherID uuid.UUID) error {
	dbPenalty, err := s.repo.GetPenaltyByIDAndTeacherID(ctx, storage.GetPenaltyByIDAndTeacherIDParams{
		ID:      penaltyID,
		Teacher: pgtype.UUID{Bytes: teacherID, Valid: true},
	})
	if err != nil {
		return err
	}

	if err = s.repo.DeletePenaltyByIDAndTeacherID(ctx, storage.DeletePenaltyByIDAndTeacherIDParams{
		ID:      penaltyID,
		Teacher: pgtype.UUID{Bytes: teacherID, Valid: true},
	}); err != nil {
		return err
	}

	penaltyPoints := int32(0)
	if len(dbPenalty.Points) > 0 {
		penaltyPoints = dbPenalty.Points[0]
	}

	if penaltyPoints != 0 {
		if err = s.repo.UpdateUserTotalPoints(ctx, teacherID, penaltyPoints); err != nil {
			return err
		}
	}

	return nil
}

func mapPenalty(dbPenalty storage.Penalty) *Penalty {
	points := int32(0)
	if len(dbPenalty.Points) > 0 {
		points = dbPenalty.Points[0]
	}

	note := ""
	if dbPenalty.Note.Valid {
		note = dbPenalty.Note.String
	}

	return &Penalty{
		ID:          dbPenalty.ID,
		Points:      points,
		TeacherID:   dbPenalty.Teacher.Bytes,
		MethodistID: dbPenalty.Methodist.Bytes,
		Note:        note,
		CreatedAt:   dbPenalty.CreatedAt.Time,
		UpdatedAt:   dbPenalty.UpdatedAt.Time,
	}
}

func (s *userService) IssueViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, note string) (*ViolationActionResponse, error) {
	note = strings.TrimSpace(note)

	if err := s.ensureViolationIssuer(ctx, issuedByID); err != nil {
		return nil, err
	}

	_, err := s.repo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}

	dbViolation, err := s.repo.CreateViolation(ctx, storage.CreateViolationParams{
		UserID:   userID,
		IssuedBy: issuedByID,
		Note: pgtype.Text{
			String: note,
			Valid:  note != "",
		},
	})
	if err != nil {
		return nil, err
	}

	updatedUser, err := s.repo.ApplyViolationToUser(ctx, storage.ApplyViolationToUserParams{
		ViolationID: dbViolation.ID,
		KeycloakID:  userID,
	})
	if err != nil {
		return nil, err
	}

	mappedUser, err := s.toServiceUser(ctx, updatedUser)
	if err != nil {
		return nil, err
	}

	return &ViolationActionResponse{
		Violation: mapViolationRecord(dbViolation),
		User:      mappedUser,
	}, nil
}

func (s *userService) UpdateViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, violationID uuid.UUID, note string) (*ViolationActionResponse, error) {
	note = strings.TrimSpace(note)

	if err := s.ensureViolationIssuer(ctx, issuedByID); err != nil {
		return nil, err
	}

	_, err := s.repo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}

	dbViolation, err := s.repo.UpdateViolationByIDAndUserID(ctx, storage.UpdateViolationByIDAndUserIDParams{
		ID:     violationID,
		UserID: userID,
		Note: pgtype.Text{
			String: note,
			Valid:  note != "",
		},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &HTTPStatusError{StatusCode: 404, Message: "violation not found"}
		}
		return nil, err
	}

	updatedUser, err := s.repo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, err
	}

	mappedUser, err := s.toServiceUser(ctx, updatedUser)
	if err != nil {
		return nil, err
	}

	return &ViolationActionResponse{
		Violation: mapViolationRecord(dbViolation),
		User:      mappedUser,
	}, nil
}

func (s *userService) ensureViolationIssuer(ctx context.Context, issuedByID uuid.UUID) error {
	issuer, err := s.repo.GetUserByKeycloakID(ctx, issuedByID)
	if err != nil {
		return &HTTPStatusError{StatusCode: 404, Message: "issuer not found"}
	}
	if issuer.Role != storage.UserRoleMETHODIST && issuer.Role != storage.UserRoleADMIN {
		return &HTTPStatusError{StatusCode: 403, Message: "forbidden"}
	}
	return nil
}

func mapViolationRecord(dbViolation storage.Violation) *ViolationRecord {
	note := ""
	if dbViolation.Note.Valid {
		note = dbViolation.Note.String
	}

	return &ViolationRecord{
		ID:        dbViolation.ID,
		UserID:    dbViolation.UserID,
		IssuedBy:  dbViolation.IssuedBy,
		Note:      note,
		CreatedAt: dbViolation.CreatedAt.Time,
		UpdatedAt: dbViolation.UpdatedAt.Time,
	}
}
