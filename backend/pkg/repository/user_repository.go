package repository

import (
	"context"
	"fmt"

	storage "eduplan/backend/pkg/sqlc/generated"
)

type UsersRepository interface {
	CreateUser(ctx context.Context, params storage.CreateUserParams) (*storage.User, error)
}

type UsersServices struct {
	queries *storage.Queries
}

func NewUsersPostgres(queries *storage.Queries) *UsersServices {
	return &UsersServices{queries: queries}
}

func (r *UsersServices) CreateUser(
	ctx context.Context,
	params storage.CreateUserParams,
) (*storage.User, error) {
	user, err := r.queries.CreateUser(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &user, nil
}
