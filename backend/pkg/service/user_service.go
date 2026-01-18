package service

import (
	"context"

	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type User struct {
	KeycloakID uuid.UUID `json:"keycloakId"`
	Email      string    `json:"email"`
	Username   string    `json:"userName"`
	FirstName  *string   `json:"firstName"`
	LastName   *string   `json:"lastName"`
	Role       string    `json:"role"`
	Phone      *string   `json:"phone"`
}

type UserService interface {
	GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*User, error)
	GetAllUsers(ctx context.Context) ([]*User, error)
	GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*User, error)
	GetUserBySessionIDFromStorageUser(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
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

func toServiceUser(u *storage.User) *User {
	var firstName, lastName, phone *string

	if u.FirstName.Valid {
		firstName = &u.FirstName.String
	}
	if u.LastName.Valid {
		lastName = &u.LastName.String
	}
	if u.Phone.Valid {
		phone = &u.Phone.String
	}

	return &User{
		KeycloakID: u.KeycloakID,
		Email:      u.Email,
		Username:   u.Username,
		FirstName:  firstName,
		LastName:   lastName,
		Role:       string(u.Role),
		Phone:      phone,
	}
}

func (s *userService) GetAllUsers(ctx context.Context) ([]*User, error) {
	dbUsers, err := s.repo.GetAllUsers(ctx)
	if err != nil {
		return nil, err
	}

	if len(dbUsers) == 0 {
		return []*User{}, nil
	}

	serviceUsers := make([]*User, 0, len(dbUsers))

	for i := range dbUsers {
		u := toServiceUser(&dbUsers[i])
		serviceUsers = append(serviceUsers, u)
	}

	return serviceUsers, nil
}

func (s *userService) GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*User, error) {
	dbUser, err := s.repo.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, err
	}

	return toServiceUser(dbUser), nil
}
