package service

import (
	"context"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"
	"fmt"
	"io"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// CreateAwardWithTypesParams представляет параметры для создания award с типами, вариантами и критериями
type CreateAwardWithTypesParams struct {
	Status    storage.AwardsStatus `json:"status"`
	Methodist pgtype.UUID          `json:"methodist"`
	Text      pgtype.Text          `json:"text"`
	Document  pgtype.Text          `json:"document"`
	AwardType struct {
		Name     string             `json:"name"`
		Variants []AwardTypeVariant `json:"variants"`
	} `json:"type"`
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
	params.Document = pgtype.Text{
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

func (s *AwardService) CreateAwardWithTypes(ctx context.Context, teacherID uuid.UUID, params *CreateAwardWithTypesParams) (storage.Award, error) {
	// Validation
	if err := s.validateCreateAwardWithTypesParams(ctx, params); err != nil {
		return storage.Award{}, fmt.Errorf("validation failed: %w", err)
	}

	// Validate teacher exists
	if _, err := s.repo.GetUserByID(ctx, teacherID); err != nil {
		return storage.Award{}, fmt.Errorf("teacher with ID %s does not exist: %w", teacherID, err)
	}

	// Create variants with their criteria
	variantIDs, err := s.createAwardTypeVariantsWithCriteria(ctx, params.AwardType.Variants)
	if err != nil {
		return storage.Award{}, fmt.Errorf("create variants failed: %w", err)
	}

	// Create type
	typeParams := storage.CreateAwardTypeParams{
		Name:     params.AwardType.Name,
		Variants: variantIDs,
	}
	awardType, err := s.createAwardType(ctx, &typeParams)
	if err != nil {
		return storage.Award{}, fmt.Errorf("create type failed: %w", err)
	}

	// Create award
	awardParams := storage.CreateAwardParams{
		Status:    params.Status,
		Methodist: params.Methodist,
		Teacher:   teacherID,
		Type:      pgtype.UUID{Bytes: awardType.ID, Valid: true},
		Text:      params.Text,
		Document:  params.Document,
		Variants:  variantIDs,
	}

	return s.repo.CreateAward(ctx, &awardParams)
}

func (s *AwardService) validateCreateAwardWithTypesParams(ctx context.Context, params *CreateAwardWithTypesParams) error {
	if params.AwardType.Name == "" {
		return fmt.Errorf("award type name is required")
	}
	if len(params.AwardType.Variants) == 0 {
		return fmt.Errorf("at least one variant is required")
	}
	for _, variant := range params.AwardType.Variants {
		if variant.Name == "" {
			return fmt.Errorf("variant name is required")
		}
		if len(variant.Criteria) == 0 {
			return fmt.Errorf("at least one criteria is required for variant")
		}
		for _, crit := range variant.Criteria {
			if crit.Name == "" {
				return fmt.Errorf("criteria name is required")
			}
			if len(crit.Points) == 0 {
				return fmt.Errorf("criteria points are required")
			}
		}
		for _, crit := range variant.BonusCriteria {
			if crit.Name == "" {
				return fmt.Errorf("bonus criteria name is required")
			}
			if len(crit.Points) == 0 {
				return fmt.Errorf("bonus criteria points are required")
			}
		}
	}
	// Methodist validation if present
	if params.Methodist.Valid {
		_, err := s.repo.GetUserByID(ctx, params.Methodist.Bytes)
		if err != nil {
			return fmt.Errorf("methodist with ID %s does not exist", params.Methodist.Bytes)
		}
	}
	return nil
}

func (s *AwardService) createAwardTypeVariantsWithCriteria(ctx context.Context, variants []AwardTypeVariant) ([]uuid.UUID, error) {
	var variantIDs []uuid.UUID

	for _, variant := range variants {
		// Create criteria
		var criteriaIDs []uuid.UUID
		for _, crit := range variant.Criteria {
			params := storage.CreateAwardTypeCriteriaParams{
				Name:   crit.Name,
				Points: crit.Points,
				Method: crit.Method,
			}
			criterion, err := s.repo.CreateAwardTypeCriteria(ctx, &params)
			if err != nil {
				return nil, err
			}
			criteriaIDs = append(criteriaIDs, criterion.ID)
		}

		// Create bonus criteria
		var bonusCriteriaIDs []uuid.UUID
		for _, crit := range variant.BonusCriteria {
			params := storage.CreateAwardTypeCriteriaParams{
				Name:   crit.Name,
				Points: crit.Points,
				Method: crit.Method,
			}
			criterion, err := s.repo.CreateAwardTypeCriteria(ctx, &params)
			if err != nil {
				return nil, err
			}
			bonusCriteriaIDs = append(bonusCriteriaIDs, criterion.ID)
		}

		// Create variant
		variantParams := storage.CreateAwardTypesVariantParams{
			Name:          variant.Name,
			Description:   variant.Description,
			Criteria:      criteriaIDs,
			Bonuscriteria: bonusCriteriaIDs,
		}
		variantEntity, err := s.repo.CreateAwardTypeVariant(ctx, &variantParams)
		if err != nil {
			return nil, err
		}
		variantIDs = append(variantIDs, variantEntity.ID)
	}

	return variantIDs, nil
}

func (s *AwardService) UploadFile(ctx context.Context, fileName string, reader io.Reader, size int64) (string, error) {
	return s.repo.UploadToMinIO(ctx, fileName, reader, size)
}
