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
	fmt.Printf("[groups-repo] CreateGroups called: %d items\n", len(groups))

	if len(groups) == 0 {
		fmt.Printf("[groups-repo] nothing to save, returning\n")
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := r.queries.WithTx(tx)

	okCount := 0
	for i, g := range groups {
		// покажем первые 3 записи, чтобы убедиться что параметры норм
		if i < 3 {
			fmt.Printf("[groups-repo] upsert sample[%d]: keycloak_id=%s name=%q qual.valid=%v spec.valid=%v\n",
				i, g.KeycloakID, g.Name, g.Qualification.Valid, g.Specialty.Valid)
		}

		res, err := qtx.UpsertGroup(ctx, g)
		if err != nil {
			return fmt.Errorf("upsert group %s (%s): %w", g.Name, g.KeycloakID, err)
		}
		okCount++

		// Если UpsertGroup возвращает строку/ID — покажем (если тип не поддерживается, просто убери res)
		_ = res
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}

	fmt.Printf("[groups-repo] saved/updated: %d groups, committed\n", okCount)
	return nil
}

func (r *GroupsPostgres) GetGroupByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (storage.Group, error) {
	return r.queries.GetGroupByKeycloakID(ctx, keycloakID)
}

func (r *GroupsPostgres) GetAllGroups(ctx context.Context) ([]storage.Group, error) {
	return r.queries.GetAllGroups(ctx)
}
