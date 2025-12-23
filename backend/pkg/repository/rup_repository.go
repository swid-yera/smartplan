package repository

import (
	"context"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type RupRepository interface {
	CreateRup(ctx context.Context, params storage.CreateRupsParams) (*storage.Rup, error)
	GetRupByID(ctx context.Context, id uuid.UUID) (*storage.Rup, error)
	GetAllRups(ctx context.Context) ([]storage.Rup, error)
	UpdateRupStatus(ctx context.Context, id uuid.UUID, status storage.RupsStatus, reason pgtype.Text) error
	GetRupsByMethodist(ctx context.Context, methodist pgtype.UUID) ([]storage.Rup, error)
	DeleteRup(ctx context.Context, id uuid.UUID) error
}

type RupPostgres struct {
	queries *storage.Queries
}

func NewRupPostgres(queries *storage.Queries) *RupPostgres {
	return &RupPostgres{queries: queries}
}

func (r *RupPostgres) CreateRup(ctx context.Context, params storage.CreateRupsParams) (*storage.Rup, error) {
	rup, err := r.queries.CreateRups(ctx, params)
	if err != nil {
		return nil, err
	}
	return &rup, nil
}

func (r *RupPostgres) GetRupByID(ctx context.Context, id uuid.UUID) (*storage.Rup, error) {
	rup, err := r.queries.GetRupsByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &rup, nil
}

func (r *RupPostgres) GetAllRups(ctx context.Context) ([]storage.Rup, error) {
	return r.queries.GetAllRups(ctx)
}

func (r *RupPostgres) UpdateRupStatus(ctx context.Context, id uuid.UUID, status storage.RupsStatus, reason pgtype.Text) error {
	return r.queries.UpdateRupsStatus(ctx, storage.UpdateRupsStatusParams{
		ID:     id,
		Status: status,
		Reason: reason,
	})
}

func (r *RupPostgres) GetRupsByMethodist(ctx context.Context, methodist pgtype.UUID) ([]storage.Rup, error) {
	return r.queries.GetRupsByMethodist(ctx, methodist)
}

func (r *RupPostgres) DeleteRup(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteRup(ctx, id)
}
