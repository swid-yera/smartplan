package repository

import (
	"context"
	"fmt"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type AuthRepository interface {
	GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.User, error)
	CreateUser(ctx context.Context, keycloakID uuid.UUID, email, username, firstName, lastName string) (*storage.User, error)
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

func (r *AuthPostgres) CreateUser(
	ctx context.Context,
	keycloakID uuid.UUID,
	email, username, firstName, lastName string,
) (*storage.User, error) {
	fmt.Printf("HandleCallback: keycloakID=%s email=%s username=%s firstName=%s lastName=%s\n",
		keycloakID, email, username, firstName, lastName)

	user, err := r.queries.CreateUser(ctx, storage.CreateUserParams{
		KeycloakID: keycloakID,
		Email:      email,
		Username:   username,
		FirstName:  pgtype.Text{String: firstName, Valid: true},
		LastName:   pgtype.Text{String: lastName, Valid: true},
		Roles:      []string{},
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	// возвращаем указатель, чтобы соответствовать интерфейсу
	return &user, nil
}
