package repository

import (
	"context"
	"fmt"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

type AuthRepository interface {
	GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
}

func (r *PostgresUserRepository) GetUserBySessionID(
	ctx context.Context,
	sessionID uuid.UUID,
) (*storage.User, error) {
	user, err := r.queries.GetUserByKeycloakID(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("get user by session id: %w", err)
	}
	return &user, nil
}
