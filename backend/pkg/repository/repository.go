package repository

import (
	"context"
	storage "eduplan/backend/pkg/sqlc/generated"
	"time"

	"github.com/google/uuid"
)

type Webhook interface {
	UpdateUserLastSeenAt(ctx context.Context, sessionID uuid.UUID, lastSeenAt time.Time) error
	UpdateUserRoles(ctx context.Context, sessionID uuid.UUID, roles []string) error
	UpdateUserPasswordChangedAt(ctx context.Context, sessionID uuid.UUID, changedAt time.Time) error
	DeleteUser(ctx context.Context, sessionID uuid.UUID) error
}

type Users interface {
	CreateUser(ctx context.Context, params storage.CreateUserParams) (*storage.User, error)
}

type Auth interface {
	GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
}

type Repository struct {
	Webhook Webhook
	Users   Users
	Auth    Auth
}

func NewRepository(queries *storage.Queries) *Repository {
	return &Repository{
		Webhook: NewWebhookPostgres(queries),
		Users:   NewUsersPostgres(queries),
		Auth:    NewAuthPostgres(queries),
	}
}
