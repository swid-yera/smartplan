package repository

import (
	"context"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type WebhookRepository interface {
	UpdateUserLastSeenAt(ctx context.Context, sessionID uuid.UUID, lastSeenAt time.Time) error
	UpdateUserRoles(ctx context.Context, sessionID uuid.UUID, roles []string) error
	UpdateUserPasswordChangedAt(ctx context.Context, sessionID uuid.UUID, changedAt time.Time) error
	DeleteUser(ctx context.Context, sessionID uuid.UUID) error
}

func (r *PostgresUserRepository) UpdateUserLastSeenAt(
	ctx context.Context,
	sessionID uuid.UUID,
	lastSeenAt time.Time,
) error {
	return r.queries.UpdateUserLastSeenAt(
		ctx,
		storage.UpdateUserLastSeenAtParams{
			LastSeenAt: pgtype.Timestamptz{
				Time:  lastSeenAt,
				Valid: true,
			},
		},
	)
}

func (r *PostgresUserRepository) UpdateUserRoles(
	ctx context.Context,
	sessionID uuid.UUID,
	roles []string,
) error {
	return r.queries.UpdateUserRoles(
		ctx,
		storage.UpdateUserRolesParams{
			KeycloakID: uuid.UUID{},
			Roles:      roles,
		},
	)
}

func (r *PostgresUserRepository) UpdateUserPasswordChangedAt(
	ctx context.Context,
	keycloak_id uuid.UUID,
	changedAt time.Time,
) error {
	return r.queries.UpdateUserPasswordChangedAt(
		ctx,
		storage.UpdateUserPasswordChangedAtParams{
			KeycloakID: uuid.UUID{},
			PasswordChangedAt: pgtype.Timestamptz{
				Time:  changedAt,
				Valid: true,
			},
		},
	)
}

func (r *PostgresUserRepository) DeleteUser(
	ctx context.Context,
	sessionID uuid.UUID,
) error {
	return r.queries.DeleteUser(ctx, sessionID)
}
