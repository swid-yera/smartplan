package repository

import (
	"context"
	"fmt"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

type AuthRepository interface {
	GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.User, error)
}

type AuthPostgres struct {
	queries *storage.Queries
}

func NewAuthPostgres(queries *storage.Queries) *AuthPostgres {
	return &AuthPostgres{queries: queries}
}

func (r *AuthPostgres) GetUserByKeycloakID(
	ctx context.Context,
	keycloakID uuid.UUID,
) (*storage.User, error) {
	user, err := r.queries.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, fmt.Errorf("get user by keycloak id: %w", err)
	}
	return &user, nil
}
