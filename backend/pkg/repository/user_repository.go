package repository

import (
	"context"
	"fmt"

	storage "eduplan/backend/pkg/sqlc/generated"
)

type UsersRepository interface {
	CreateUser(ctx context.Context, params storage.CreateUserParams) (*storage.User, error)
}

type PostgresUserRepository struct {
	*PostgresRepository
}

func NewPostgresUserRepository(queries *storage.Queries) *PostgresUserRepository {
	return &PostgresUserRepository{
		PostgresRepository: NewPostgresRepository(queries),
	}
}

func (r *PostgresUserRepository) CreateUser(
	ctx context.Context,
	params storage.CreateUserParams,
) (*storage.User, error) {
	user, err := r.queries.CreateUser(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &user, nil
}
