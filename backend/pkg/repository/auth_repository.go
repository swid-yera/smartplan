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
	CreateUser(ctx context.Context, keycloakID uuid.UUID, role storage.UserRole, email, username, firstName, lastName, phone string) (*storage.User, error)
	UpdateUser(ctx context.Context, keycloakID uuid.UUID, role storage.UserRole, email, username, firstName, lastName, phone string) error
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
	role storage.UserRole,
	email, username, firstName, lastName, phone string,
) (*storage.User, error) {
	fmt.Printf("HandleCallback: keycloakID=%s roles=%s email=%s username=%s firstName=%s lastName=%s phone=%s\n",
		keycloakID, role, email, username, firstName, lastName, phone)

	user, err := r.queries.CreateUser(ctx, storage.CreateUserParams{
		KeycloakID: keycloakID,
		Email:      email,
		Username:   username,
		FirstName:  pgtype.Text{String: firstName, Valid: true},
		LastName:   pgtype.Text{String: lastName, Valid: true},
		Role:       role,
		Phone:      pgtype.Text{String: phone, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	// возвращаем указатель, чтобы соответствовать интерфейсу
	return &user, nil
}

func (r *AuthPostgres) UpdateUser(
	ctx context.Context,
	keycloakID uuid.UUID,
	role storage.UserRole,
	email, username, firstName, lastName, phone string,
) error {
	fmt.Printf("HandleCallback: keycloakID=%s roles=%s email=%s username=%s firstName=%s lastName=%s phone=%s\n",
		keycloakID, role, email, username, firstName, lastName, phone)

	err := r.queries.UpdateUserProfile(ctx, storage.UpdateUserProfileParams{
		KeycloakID: keycloakID,
		Email:      email,
		Username:   username,
		Role:       role,
		FirstName:  pgtype.Text{String: firstName, Valid: true},
		LastName:   pgtype.Text{String: lastName, Valid: true},
		Phone:      pgtype.Text{String: phone, Valid: true},
	})

	if err != nil {
		return nil
	}

	return nil
}
