package service

import (
	"context"

	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type UserService interface {
	GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
}

type userService struct {
	repo  repository.UsersRepository
	redis *redis.Client
}

func NewUserService(repo repository.UsersRepository, redisClient *redis.Client) UserService {
	return &userService{repo: repo, redis: redisClient}
}

func (s *userService) GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error) {

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
