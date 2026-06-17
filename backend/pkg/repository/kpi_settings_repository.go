package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type KPIUploadSettingsPostgres struct {
	pool *pgxpool.Pool
}

func NewKPIUploadSettingsPostgres(pool *pgxpool.Pool) *KPIUploadSettingsPostgres {
	return &KPIUploadSettingsPostgres{pool: pool}
}

func (r *KPIUploadSettingsPostgres) GetKpiUploadSettings(ctx context.Context) (*KPIUploadSettingsData, error) {
	const query = `SELECT blocked_after_date, exception_user_ids FROM kpi_upload_settings WHERE id = 1`

	var blockedAfterDate pgtype.Date
	var exceptionUserIDs []uuid.UUID
	if err := r.pool.QueryRow(ctx, query).Scan(&blockedAfterDate, &exceptionUserIDs); err != nil {
		return nil, err
	}

	var date *time.Time
	if blockedAfterDate.Valid {
		normalized := time.Date(
			blockedAfterDate.Time.Year(),
			blockedAfterDate.Time.Month(),
			blockedAfterDate.Time.Day(),
			0,
			0,
			0,
			0,
			blockedAfterDate.Time.Location(),
		)
		date = &normalized
	}

	return &KPIUploadSettingsData{
		BlockedAfterDate: date,
		ExceptionUserIDs: exceptionUserIDs,
	}, nil
}

func (r *KPIUploadSettingsPostgres) SetKpiUploadSettings(ctx context.Context, settings KPIUploadSettingsData) error {
	const query = `
		INSERT INTO kpi_upload_settings (id, blocked_after_date, exception_user_ids)
		VALUES (1, $1, $2)
		ON CONFLICT (id) DO UPDATE
		SET blocked_after_date = EXCLUDED.blocked_after_date,
		    exception_user_ids = EXCLUDED.exception_user_ids,
		    updated_at = NOW()
	`

	var dbDate pgtype.Date
	if settings.BlockedAfterDate != nil {
		dbDate = pgtype.Date{Time: *settings.BlockedAfterDate, Valid: true}
	}

	_, err := r.pool.Exec(ctx, query, dbDate, settings.ExceptionUserIDs)
	return err
}
