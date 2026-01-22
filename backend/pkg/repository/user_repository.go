package repository

import (
	"context"
	"fmt"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UsersPostgres struct {
	queries *storage.Queries
}

func NewUsersPostgres(queries *storage.Queries) *UsersPostgres {
	return &UsersPostgres{queries: queries}
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
	roles storage.UserRole,
) error {
	return r.queries.UpdateUserRole(
		ctx,
		storage.UpdateUserRoleParams{
			KeycloakID: keycloakID,
			Role:       roles,
		},
	)
}

func (r *UsersPostgres) GetAllUsers(ctx context.Context, limit int32, offset int32, search string) ([]storage.User, error) {
	return r.queries.GetAllUsers(ctx, storage.GetAllUsersParams{
		Limit:  limit,
		Offset: offset,
	})
}
func (r *UsersPostgres) CountUsers(ctx context.Context) (int64, error) {
	return r.queries.CountUsers(ctx)
}

func (r *UsersPostgres) GetUsersPaginated(ctx context.Context, limit int32, offset int32, search string) ([]storage.User, error) {
	return r.queries.GetUsersPaginated(ctx, storage.GetUsersPaginatedParams{
		Column1: search,
		Limit:   limit,
		Offset:  offset,
	})
}

func (r *UsersPostgres) CountUsersFiltered(ctx context.Context, search string) (int64, error) {
	return r.queries.CountUsersFiltered(ctx, search)
}
