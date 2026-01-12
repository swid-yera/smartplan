package repository

import (
	"context"
	storage "eduplan/backend/pkg/sqlc/generated"
	"io"

	"github.com/google/uuid"
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
