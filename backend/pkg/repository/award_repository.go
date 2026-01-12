package repository

import (
	"context"
	storage "eduplan/backend/pkg/sqlc/generated"
	"io"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/minio/minio-go/v7"
)

type AwardRepository struct {
	queries *storage.Queries
	minio   *MinioRepository
}

func NewAwardRepository(queries *storage.Queries, minio *MinioRepository) *AwardRepository {
	return &AwardRepository{queries: queries, minio: minio}
}

func (r *AwardRepository) UploadToMinIO(ctx context.Context, fileName string, reader io.Reader, size int64) (string, error) {
	uniqueName := uuid.New().String() + "_" + fileName

	_, err := r.minio.Client.PutObject(ctx, r.minio.Bucket, uniqueName, reader, size, minio.PutObjectOptions{})
	if err != nil {
		return "", err
	}
	return uniqueName, nil
}

func (r *AwardRepository) CreateAward(ctx context.Context, params *storage.CreateAwardParams) (storage.Award, error) {
	return r.queries.CreateAward(ctx, *params)
}

func (r *AwardRepository) GetAwardByID(ctx context.Context, id uuid.UUID) (storage.Award, error) {
	return r.queries.GetAwardByID(ctx, id)
}

func (r *AwardRepository) GetAllAwards(ctx context.Context) ([]storage.Award, error) {
	return r.queries.GetAllAwards(ctx)
}

func (r *AwardRepository) UpdateAwardStatus(ctx context.Context, params storage.UpdateAwardStatusParams) (storage.Award, error) {
	err := r.queries.UpdateAwardStatus(ctx, params)
	if err != nil {
		return storage.Award{}, err
	}
	return storage.Award{}, nil
}

func (r *AwardRepository) DeleteAward(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteAward(ctx, id)
}

func (r *AwardRepository) GetAwardsByMethodist(ctx context.Context, methodist pgtype.UUID) ([]storage.Award, error) {
	return r.queries.GetAwardsByMethodist(ctx, methodist)
}
