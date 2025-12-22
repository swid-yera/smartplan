package service

import (
	"context"

	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

type UserService interface {
	GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
}

type userService struct {
	repo repository.AuthRepository
}

func NewUserService(repo repository.AuthRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetUserBySessionID(
	ctx context.Context,
	sessionID uuid.UUID,
) (*storage.User, error) {
	return s.repo.GetUserByKeycloakID(ctx, sessionID)
}
