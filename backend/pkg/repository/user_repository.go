package repository

import (
	"context"
	"fmt"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UsersRepository interface {
	CreateUser(ctx context.Context, params storage.CreateUserParams) (*storage.User, error)
	DeleteByKeycloakID(ctx context.Context, keycloakID uuid.UUID) error
	UpdateLastSeenAt(ctx context.Context, keycloakID uuid.UUID, at time.Time) error
	UpdatePasswordChangedAt(ctx context.Context, keycloakID uuid.UUID, at time.Time) error
	UpdateRoles(ctx context.Context, keycloakID uuid.UUID, roles []string) error
	GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.User, error)
	GetAllUsers(ctx context.Context) ([]storage.User, error)
}

type UsersPostgres struct {
	queries *storage.Queries
}

func NewUsersPostgres(queries *storage.Queries) *UsersPostgres {
	return &UsersPostgres{queries: queries}
}

func (r *UsersPostgres) CreateUser(
	ctx context.Context,
	params storage.CreateUserParams,
) (*storage.User, error) {
	user, err := r.queries.CreateUser(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &user, nil
}

func (r *UsersPostgres) GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.User, error) {
	user, err := r.queries.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, fmt.Errorf("get user by keycloak id: %w", err)
	}
	return &user, nil
}

func (r *UsersPostgres) DeleteByKeycloakID(
	ctx context.Context,
	keycloakID uuid.UUID,
) error {
	return r.queries.DeleteUser(ctx, keycloakID)
}

func (r *UsersPostgres) UpdateLastSeenAt(
	ctx context.Context,
	keycloakID uuid.UUID,
	at time.Time,
) error {
	return r.queries.UpdateUserLastSeenAt(
		ctx,
		storage.UpdateUserLastSeenAtParams{
			KeycloakID: keycloakID,
			LastSeenAt: pgtype.Timestamptz{
				Time:  at,
				Valid: true,
			},
		},
	)
}

func (r *UsersPostgres) UpdatePasswordChangedAt(
	ctx context.Context,
	keycloakID uuid.UUID,
	at time.Time,
) error {
	return r.queries.UpdateUserPasswordChangedAt(
		ctx,
		storage.UpdateUserPasswordChangedAtParams{
			KeycloakID: keycloakID,
			PasswordChangedAt: pgtype.Timestamptz{
				Time:  at,
				Valid: true,
			},
		},
	)
}

func (r *UsersPostgres) UpdateRoles(
	ctx context.Context,
	keycloakID uuid.UUID,
	roles []string,
) error {
	return r.queries.UpdateUserRoles(
		ctx,
		storage.UpdateUserRolesParams{
			KeycloakID: keycloakID,
			Roles:      roles,
		},
	)
}

func (r *UsersPostgres) GetAllUsers(ctx context.Context) ([]storage.User, error) {
	return r.queries.GetAllUsers(ctx)
}
