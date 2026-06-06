package repository

import (
	"context"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

type PermissionsPostgres struct {
	queries *storage.Queries
}

func NewPermissionsPostgres(queries *storage.Queries) *PermissionsPostgres {
	return &PermissionsPostgres{queries: queries}
}

func (r *PermissionsPostgres) UpsertUserPermissions(ctx context.Context, userID uuid.UUID, codes []storage.PermissionCode) (storage.Permission, error) {
	return r.queries.UpsertUserPermissions(ctx, storage.UpsertUserPermissionsParams{
		UserID:      userID,
		Permissions: codes,
	})
}

func (r *PermissionsPostgres) GetUserPermissions(ctx context.Context, userID uuid.UUID) (storage.Permission, error) {
	return r.queries.GetUserPermissions(ctx, userID)
}

func (r *PermissionsPostgres) DeleteUserPermissions(ctx context.Context, userID uuid.UUID) error {
	return r.queries.DeleteUserPermissions(ctx, userID)
}

func (r *PermissionsPostgres) GetUsersWithPermissions(ctx context.Context) ([]storage.GetUsersWithPermissionsRow, error) {
	return r.queries.GetUsersWithPermissions(ctx)
}
