package repository

import (
	"context"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

type Users interface {
	CreateUser(ctx context.Context, params storage.CreateUserParams) (*storage.User, error)
	DeleteByKeycloakID(ctx context.Context, keycloakID uuid.UUID) error
	UpdateLastSeenAt(ctx context.Context, keycloakID uuid.UUID, at time.Time) error
	UpdatePasswordChangedAt(ctx context.Context, keycloakID uuid.UUID, at time.Time) error
	UpdateRoles(ctx context.Context, keycloakID uuid.UUID, roles []string) error
}

type Auth interface {
	GetUserByKeycloakID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
}

type Repository struct {
	Users Users
	Auth  Auth
}

func NewRepository(queries *storage.Queries) *Repository {
	return &Repository{
		Users: NewUsersPostgres(queries),
		Auth:  NewAuthPostgres(queries),
	}
}
