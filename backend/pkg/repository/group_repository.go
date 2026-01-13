package repository

import (
	"context"
	"fmt"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GroupsRepository interface {
	CreateGroups(ctx context.Context, groups []storage.UpsertGroupParams) error
	DeleteGroupsNotInKeycloak(ctx context.Context, keycloakID []uuid.UUID) error
	GetGroupByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (storage.Group, error)
	GetAllGroups(ctx context.Context) ([]storage.Group, error)
}

type GroupsPostgres struct {
	pool    *pgxpool.Pool
	queries *storage.Queries
}

func NewGroupsPostgres(pool *pgxpool.Pool) *GroupsPostgres {
	return &GroupsPostgres{
		pool:    pool,
		queries: storage.New(pool),
	}
}

func (r *GroupsPostgres) CreateGroups(ctx context.Context, groups []storage.UpsertGroupParams) error {
	if len(groups) == 0 {
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := r.queries.WithTx(tx)

	for _, g := range groups {
		_, err := qtx.UpsertGroup(ctx, g)
		if err != nil {
			return fmt.Errorf("upsert group %s (%s): %w", g.Name, g.KeycloakID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}

func (r *GroupsPostgres) GetGroupByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (storage.Group, error) {
	return r.queries.GetGroupByKeycloakID(ctx, keycloakID)
}

func (r *GroupsPostgres) GetAllGroups(ctx context.Context) ([]storage.Group, error) {
	return r.queries.GetAllGroups(ctx)
}

func (r *GroupsPostgres) DeleteGroupsNotInKeycloak(ctx context.Context, keycloakID []uuid.UUID) error {

	if len(keycloakID) == 0 {
		return fmt.Errorf("refusing to delete all groups: empty keycloak ids")
	}

	return r.queries.DeleteGroupsNotInKeycloak(ctx, keycloakID)
}
