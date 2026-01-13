package service

import (
	"context"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"
	"io"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// CreateAwardWithTypesParams представляет параметры для создания award с типами, вариантами и критериями
type CreateAwardWithTypesParams struct {
	Status    storage.AwardsStatus `json:"status"`
	Methodist pgtype.UUID          `json:"methodist"`
	Teacher   uuid.UUID            `json:"teacher"`
	Text      pgtype.Text          `json:"text"`
	Document  pgtype.Text          `json:"document"`
	AwardType struct {
		Name     string             `json:"name"`
		Variants []AwardTypeVariant `json:"variants"`
	} `json:"award_type"`
}

// AwardTypeVariant представляет вариант типа награды
type AwardTypeVariant struct {
	Name          string              `json:"name"`
	Description   pgtype.Text         `json:"description"`
	Criteria      []AwardTypeCriteria `json:"criteria"`
	BonusCriteria []AwardTypeCriteria `json:"bonus_criteria"`
}

// AwardTypeCriteria представляет критерий типа награды
type AwardTypeCriteria struct {
	Name   string                         `json:"name"`
	Points []int32                        `json:"points"`
	Method storage.NullEnumCriteriaMethod `json:"method"`
}

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

func (s *AwardService) GetAwardByID(ctx context.Context, id uuid.UUID) (storage.Award, error) {
	return s.repo.GetAwardByID(ctx, id)
}

func (s *AwardService) GetAllAwards(ctx context.Context) ([]storage.Award, error) {
	return s.repo.GetAllAwards(ctx)
}
func (s *AwardService) UpdateAwardStatus(ctx context.Context, params storage.UpdateAwardStatusParams) (storage.Award, error) {
	return s.repo.UpdateAwardStatus(ctx, params)
}

func (s *AwardService) DeleteAward(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteAward(ctx, id)
}

func (s *AwardService) GetAwardsByMethodist(ctx context.Context, methodist pgtype.UUID) ([]storage.Award, error) {
	return s.repo.GetAwardsByMethodist(ctx, methodist)
}

func (s *AwardService) createAwardType(ctx context.Context, params *storage.CreateAwardTypeParams) (storage.AwardType, error) {
	return s.repo.CreateAwardType(ctx, params)
}

func (s *AwardService) CreateAwardTypesVariant(ctx context.Context, params *storage.CreateAwardTypesVariantParams) (storage.AwardTypeVariant, error) {
	return s.repo.CreateAwardTypeVariant(ctx, params)
}

func (s *AwardService) CreateAwardTypeCriteria(ctx context.Context, params *storage.CreateAwardTypeCriteriaParams) (storage.AwardTypeCriterium, error) {
	return s.repo.CreateAwardTypeCriteria(ctx, params)
}
