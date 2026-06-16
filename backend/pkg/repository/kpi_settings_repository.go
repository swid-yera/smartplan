package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type KPIUploadSettingsPostgres struct {
	pool *pgxpool.Pool
}

func NewKPIUploadSettingsPostgres(pool *pgxpool.Pool) *KPIUploadSettingsPostgres {
	return &KPIUploadSettingsPostgres{pool: pool}
}

func (r *KPIUploadSettingsPostgres) GetKpiUploadBlockDate(ctx context.Context) (*time.Time, error) {
	const query = `SELECT blocked_after_date FROM kpi_upload_settings WHERE id = 1`

	var blockedAfterDate pgtype.Date
	if err := r.pool.QueryRow(ctx, query).Scan(&blockedAfterDate); err != nil {
		return nil, err
	}

	if !blockedAfterDate.Valid {
		return nil, nil
	}

	date := time.Date(
		blockedAfterDate.Time.Year(),
		blockedAfterDate.Time.Month(),
		blockedAfterDate.Time.Day(),
		0,
		0,
		0,
		0,
		blockedAfterDate.Time.Location(),
	)

	return &date, nil
}

func (r *KPIUploadSettingsPostgres) SetKpiUploadBlockDate(ctx context.Context, blockedAfterDate *time.Time) error {
	const query = `
		INSERT INTO kpi_upload_settings (id, blocked_after_date)
		VALUES (1, $1)
		ON CONFLICT (id) DO UPDATE
		SET blocked_after_date = EXCLUDED.blocked_after_date,
		    updated_at = NOW()
	`

	var dbDate pgtype.Date
	if blockedAfterDate != nil {
		dbDate = pgtype.Date{Time: *blockedAfterDate, Valid: true}
	}

	_, err := r.pool.Exec(ctx, query, dbDate)
	return err
}
