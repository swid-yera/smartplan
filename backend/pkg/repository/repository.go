package repository

import (
	storage "eduplan/backend/pkg/sqlc/generated"
)

// PostgresRepository is a base postgres repository wrapper.
type PostgresRepository struct {
	queries *storage.Queries
}

func NewPostgresRepository(queries *storage.Queries) *PostgresRepository {
	return &PostgresRepository{queries: queries}
}
