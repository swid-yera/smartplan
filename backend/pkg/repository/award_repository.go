package repository

import (
	"context"
	storage "eduplan/backend/pkg/sqlc/generated"
	"fmt"
	"io"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/minio/minio-go/v7"
)

type AwardRepository struct {
	queries *storage.Queries
	minio   *MinioRepository
}

func (r *AwardRepository) GetAwardTypeVariantByID(ctx context.Context, vID uuid.UUID) (storage.AwardTypeVariant, error) {
	return r.queries.GetAwardTypeVariantByID(ctx, vID)
}

func (r *AwardRepository) GetAwardTypeCriteriaByID(ctx context.Context, cID uuid.UUID) (storage.AwardTypeCriterium, error) {
	return r.queries.GetAwardTypeCriteriaByID(ctx, cID)
}

func NewAwardRepository(queries *storage.Queries, minio *MinioRepository) *AwardRepository {
	return &AwardRepository{queries: queries, minio: minio}
}

func (r *AwardRepository) UploadToMinIO(ctx context.Context, fileName string, reader io.Reader, size int64) (string, error) {
	uniqueName := uuid.New().String() + "_" + fileName

	// Check if the file already exists in MinIO
	_, err := r.minio.Client.StatObject(ctx, r.minio.Bucket, uniqueName, minio.StatObjectOptions{})
	if err == nil {
		// File already exists
		return "", fmt.Errorf("file already exists in MinIO")
	}
	// If the file does not exist, proceed with uploading
	_, err = r.minio.Client.PutObject(ctx, r.minio.Bucket, uniqueName, reader, size, minio.PutObjectOptions{})
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

func (r *AwardRepository) GetAllAwardTypes(ctx context.Context) ([]storage.AwardType, error) {
	return r.queries.GetAllAwardTypes(ctx)
}

func (r *AwardRepository) GetAwardTypeByID(ctx context.Context, id uuid.UUID) (storage.AwardType, error) {
	return r.queries.GetAwardTypeByID(ctx, id)
}

func (r *AwardRepository) UpdateAwardType(ctx context.Context, params storage.UpdateAwardTypeParams) (storage.AwardType, error) {
	err := r.queries.UpdateAwardType(ctx, params)
	if err != nil {
		return storage.AwardType{}, err
	}
	return r.queries.GetAwardTypeByID(ctx, params.ID)
}

func (r *AwardRepository) UpdateAwardStatus(ctx context.Context, params storage.UpdateAwardStatusParams) (storage.Award, error) {
	err := r.queries.UpdateAwardStatus(ctx, params)
	if err != nil {
		return storage.Award{}, err
	}
	return r.queries.GetAwardByID(ctx, params.ID)
}

func (r *AwardRepository) UpdateAward(ctx context.Context, params storage.UpdateAwardParams) (storage.Award, error) {
	award, err := r.queries.UpdateAward(ctx, params)
	if err != nil {
		return storage.Award{}, err
	}
	return award, nil
}

func (r *AwardRepository) DeleteAward(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteAward(ctx, id)
}

func (r *AwardRepository) CreateAwardType(ctx context.Context, params *storage.CreateAwardTypeParams) (storage.AwardType, error) {
	return r.queries.CreateAwardType(ctx, *params)
}

func (r *AwardRepository) DeleteType(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteAwardType(ctx, id)
}

func (r *AwardRepository) CreateAwardTypeVariant(ctx context.Context, params *storage.CreateAwardTypesVariantParams) (storage.AwardTypeVariant, error) {
	return r.queries.CreateAwardTypesVariant(ctx, *params)
}

func (r *AwardRepository) CreateAwardTypeCriteria(ctx context.Context, params *storage.CreateAwardTypeCriteriaParams) (storage.AwardTypeCriterium, error) {
	return r.queries.CreateAwardTypeCriteria(ctx, *params)
}

func (r *AwardRepository) GetUserByID(ctx context.Context, id uuid.UUID) (storage.User, error) {
	return r.queries.GetUserByKeycloakID(ctx, id)
}
func (r *AwardRepository) CountAwards(ctx context.Context) (int64, error) {
	return r.queries.CountAwards(ctx)
}

func (r *AwardRepository) GetAwardsPaginated(ctx context.Context, limit int32, offset int32, teacher pgtype.UUID, methodist pgtype.UUID, status []string) ([]storage.Award, error) {
	return r.queries.GetAwardsPaginated(ctx, storage.GetAwardsPaginatedParams{
		Limit:     limit,
		Offset:    offset,
		Teacher:   teacher,
		Methodist: methodist,
		Status:    status,
	})
}

func (r *AwardRepository) CountAwardsFiltered(ctx context.Context, teacher pgtype.UUID, methodist pgtype.UUID, status []string) (int64, error) {
	return r.queries.CountAwardsFiltered(ctx, storage.CountAwardsFilteredParams{
		Status:    status,
		Teacher:   teacher,
		Methodist: methodist,
	})
}
