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
	CreateUser(ctx context.Context, keycloakID uuid.UUID, role storage.UserRole, userType storage.UserType, email, username, firstName, lastName, phone string) (*storage.User, error)
	UpdateUser(ctx context.Context, keycloakID uuid.UUID, role storage.UserRole, userType storage.UserType, email, username, firstName, lastName, phone string) error
	SyncUserDepartments(ctx context.Context, userID uuid.UUID, departments []DepartmentMembershipInput) error
}

type DepartmentMembershipInput struct {
	KeycloakID uuid.UUID
	Name       []byte
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
	userType storage.UserType,
	email, username, firstName, lastName, phone string,
) (*storage.User, error) {
	user, err := r.queries.CreateUser(ctx, storage.CreateUserParams{
		KeycloakID: keycloakID,
		Email:      email,
		Username:   username,
		FirstName:  pgtype.Text{String: firstName, Valid: true},
		LastName:   pgtype.Text{String: lastName, Valid: true},
		Role:       role,
		UserType:   userType,
		Phone:      pgtype.Text{String: phone, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return &user, nil
}

func (r *AuthPostgres) UpdateUser(
	ctx context.Context,
	keycloakID uuid.UUID,
	role storage.UserRole,
	userType storage.UserType,
	email, username, firstName, lastName, phone string,
) error {
	err := r.queries.UpdateUserProfile(ctx, storage.UpdateUserProfileParams{
		KeycloakID: keycloakID,
		Email:      email,
		Username:   username,
		Role:       role,
		UserType:   userType,
		FirstName:  pgtype.Text{String: firstName, Valid: true},
		LastName:   pgtype.Text{String: lastName, Valid: true},
		Phone:      pgtype.Text{String: phone, Valid: true},
	})

	if err != nil {
		return err
	}

	return nil
}

func (r *AuthPostgres) SyncUserDepartments(ctx context.Context, userID uuid.UUID, departments []DepartmentMembershipInput) error {
	if err := r.queries.RemoveUserFromAllDepartments(ctx, userID); err != nil {
		return fmt.Errorf("clear user departments: %w", err)
	}

	for _, department := range departments {
		if _, err := r.queries.UpsertDepartment(ctx, storage.UpsertDepartmentParams{
			KeycloakID: department.KeycloakID,
			Name:       department.Name,
		}); err != nil {
			return fmt.Errorf("upsert department %s: %w", department.KeycloakID, err)
		}

		if err := r.queries.AddUserToDepartment(ctx, storage.AddUserToDepartmentParams{
			KeycloakID: department.KeycloakID,
			Column2:    userID,
		}); err != nil {
			return fmt.Errorf("add user to department %s: %w", department.KeycloakID, err)
		}
	}

	return nil
}
