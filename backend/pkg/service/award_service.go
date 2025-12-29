package service

import (
	"context"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"
	"io"

	"github.com/jackc/pgx/v5/pgtype"
)

type AwardService struct {
	repo *repository.AwardRepository
}

func NewAwardService(repo *repository.AwardRepository) *AwardService {
	return &AwardService{repo: repo}
}

func (s *AwardService) CreateAwardWithFile(ctx context.Context, params *storage.CreateAwardParams, file io.Reader, size int64, fileName string) (storage.Award, error) {
	// 1. Upload to MinIO
	objectKey, err := s.repo.UploadToMinIO(ctx, fileName, file, size)
	if err != nil {
		return storage.Award{}, err
	}

	// 2. Set the text or a specific field to the object key/URL
	params.Text = pgtype.Text{
		String: objectKey,
		Valid:  true,
	}

	// 3. Save to Database
	return s.repo.CreateAward(ctx, params)
}
