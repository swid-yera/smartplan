package repository

import (
	"context"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

type Users interface {
	CreateUser(ctx context.Context, params storage.CreateUserParams) (*storage.User, error)
	UpsertFromKeycloak(ctx context.Context, keycloakID uuid.UUID, email string, roles []string) error
	DeleteByKeycloakID(ctx context.Context, keycloakID uuid.UUID) error
	UpdateLastSeenAt(ctx context.Context, keycloakID uuid.UUID, at time.Time) error
	UpdatePasswordChangedAt(ctx context.Context, keycloakID uuid.UUID, at time.Time) error
	UpdateRoles(ctx context.Context, keycloakID uuid.UUID, roles []string) error
}

type Auth interface {
	GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
}

type Repository struct {
	Users Users
	Auth  Auth
}

func NewRepository(queries *storage.Queries) *Repository {
	return &Repository{
		Users: UsersPostgres(queries),
		Auth:  NewAuthPostgres(queries),
	}
}
