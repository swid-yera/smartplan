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
	Status      storage.AwardsStatus `json:"status"`
	AwardType   uuid.UUID            `json:"type"`
	TotalPoints int32                `json:"totalPoints"`
	Text        pgtype.Text          `json:"text"`
	Images      []string             `json:"images"`
	Document    pgtype.Text          `json:"document"`
	Links       []string             `json:"links"`
}

// AwardTypeVariant представляет вариант типа награды
type AwardTypeVariant struct {
	Name          string              `json:"name"`
	Description   pgtype.Text         `json:"description"`
	Criteria      []AwardTypeCriteria `json:"criteria"`
	BonusCriteria []AwardTypeCriteria `json:"bonus_criteria"`
}

type CreateAwardTypeRequest struct {
	ID       uuid.UUID          `json:"id"`
	Name     string             `json:"name"`
	Variants []AwardTypeVariant `json:"variants"`
}

// AwardTypeCriteria представляет критерий типа награды
type AwardTypeCriteria struct {
	Name   string                     `json:"name"`
	Points []int32                    `json:"points"`
	Method storage.EnumCriteriaMethod `json:"method"`
}

// CreateFullAwardTypeParams represents the parameters for creating a full award type structure.
type CreateFullAwardTypeParams struct {
	Name     string             `json:"name"`
	Variants []AwardTypeVariant `json:"variants"`
}

// FullAwardTypeResponse represents the full award type structure for response.
type FullAwardTypeResponse struct {
	ID       uuid.UUID              `json:"id"`
	Name     string                 `json:"name"`
	Variants []FullAwardTypeVariant `json:"variants"`
}

// FullAwardTypeVariant represents the full variant structure for response.
type FullAwardTypeVariant struct {
	ID            uuid.UUID           `json:"id"`
	Name          string              `json:"name"`
	Description   string              `json:"description"`
	Criteria      []AwardTypeCriteria `json:"criteria"`
	BonusCriteria []AwardTypeCriteria `json:"bonus_criteria"`
}

type UpdateAwardRequest struct {
	Status      storage.AwardsStatus `json:"status"`
	AwardType   uuid.UUID            `json:"type"`
	TotalPoints int32                `json:"totalPoints"`
	Text        pgtype.Text          `json:"text"`
	Images      []string             `json:"images"`
	Document    pgtype.Text          `json:"document"`
	Links       []string             `json:"links"`
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

func (s *AwardService) GetAllAwardTypes(ctx context.Context) ([]storage.AwardType, error) {
	dbAwardTypes, err := s.repo.GetAllAwardTypes(ctx)
	if err != nil {
		return nil, err
	}

	if len(dbAwardTypes) == 0 {
		return []storage.AwardType{}, nil
	}

	return dbAwardTypes, nil
}

func (s *AwardService) GetAllFullAwardTypes(ctx context.Context) ([]FullAwardTypeResponse, error) {
	awardTypes, err := s.repo.GetAllAwardTypes(ctx)
	if err != nil {
		return nil, err
	}

	var result []FullAwardTypeResponse
	for _, at := range awardTypes {
		var variants []FullAwardTypeVariant
		for _, variantID := range at.Variants {
			// The GetAwardTypeVariantByID method returns `storage.AwardTypeVariant`.
			variant, err := s.repo.GetAwardTypeVariantByID(ctx, variantID)
			if err != nil {
				return nil, fmt.Errorf("failed to get variant %s: %w", variantID, err)
			}

			var criteria []AwardTypeCriteria
			for _, cID := range variant.Criteria {
				crit, err := s.repo.GetAwardTypeCriteriaByID(ctx, cID)
				if err != nil {
					return nil, fmt.Errorf("failed to get criteria %s: %w", cID, err)
				}
				criteria = append(criteria, AwardTypeCriteria{
					Name:   crit.Name,
					Points: crit.Points,
					Method: crit.Method,
				})
			}

			var bonusCriteria []AwardTypeCriteria
			for _, cID := range variant.BonusCriteria {
				crit, err := s.repo.GetAwardTypeCriteriaByID(ctx, cID)
				if err != nil {
					return nil, fmt.Errorf("failed to get bonus criteria %s: %w", cID, err)
				}
				bonusCriteria = append(bonusCriteria, AwardTypeCriteria{
					Name:   crit.Name,
					Points: crit.Points,
					Method: crit.Method,
				})
			}

			variants = append(variants, FullAwardTypeVariant{
				ID:            variant.ID,
				Name:          variant.Name,
				Description:   variant.Description.String,
				Criteria:      criteria,
				BonusCriteria: bonusCriteria,
			})
		}

		result = append(result, FullAwardTypeResponse{
			ID:       at.ID,
			Name:     at.Name,
			Variants: variants,
		})
	}

	return result, nil
}

func (s *AwardService) GetAwardTypeByID(ctx context.Context, id uuid.UUID) (storage.AwardType, error) {
	return s.repo.GetAwardTypeByID(ctx, id)
}

func (s *AwardService) UpdateAwardType(ctx context.Context, id uuid.UUID, req CreateAwardTypeRequest) (storage.AwardType, error) {
	// Create variants with their criteria
	variantIDs, err := s.createAwardTypeVariantsWithCriteria(ctx, req.Variants)
	if err != nil {
		return storage.AwardType{}, fmt.Errorf("create variants failed: %w", err)
	}

	params := storage.UpdateAwardTypeParams{
		ID:       id,
		Name:     req.Name,
		Variants: variantIDs,
	}
	return s.repo.UpdateAwardType(ctx, params)
}

func (s *AwardService) GetAllAwards(ctx context.Context) ([]storage.Award, error) {
	dbAwards, err := s.repo.GetAllAwards(ctx)
	if err != nil {
		return nil, err
	}

	if len(dbAwards) == 0 {
		return []storage.Award{}, nil
	}

	return dbAwards, nil
}

func (s *AwardService) UpdateAwardStatus(ctx context.Context, params storage.UpdateAwardStatusParams) (storage.Award, error) {
	return s.repo.UpdateAwardStatus(ctx, params)
}

func (s *AwardService) DeleteAward(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteAward(ctx, id)
}

func (s *AwardService) GetAwardsByMethodist(ctx context.Context, methodist pgtype.UUID) ([]storage.Award, error) {
	dbAwards, err := s.repo.GetAwardsByMethodist(ctx, methodist)
	if err != nil {
		return nil, err
	}

	if len(dbAwards) == 0 {
		return []storage.Award{}, nil
	}

	return dbAwards, nil
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

func (s *AwardService) CreateFullAwardType(ctx context.Context, params *CreateFullAwardTypeParams) (storage.AwardType, error) {
	// Validation
	if err := s.validateCreateFullAwardTypeParams(ctx, params); err != nil {
		return storage.AwardType{}, fmt.Errorf("validation failed: %w", err)
	}

	// Create variants with their criteria
	variantIDs, err := s.createAwardTypeVariantsWithCriteria(ctx, params.Variants)
	if err != nil {
		return storage.AwardType{}, fmt.Errorf("create variants failed: %w", err)
	}

	// Create type
	typeParams := storage.CreateAwardTypeParams{
		Name:     params.Name,
		Variants: variantIDs,
	}
	awardType, err := s.createAwardType(ctx, &typeParams)
	if err != nil {
		return storage.AwardType{}, fmt.Errorf("create type failed: %w", err)
	}

	return awardType, nil
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

	// Create award
	awardParams := storage.CreateAwardParams{
		Status:      params.Status,
		Teacher:     teacherID,
		Type:        pgtype.UUID{Bytes: params.AwardType, Valid: true},
		Text:        params.Text,
		Document:    params.Document,
		Images:      params.Images,
		Links:       params.Links,
		TotalPoints: params.TotalPoints,
	}

	return s.repo.CreateAward(ctx, &awardParams)
}

func (s *AwardService) UpdateAward(ctx context.Context, id uuid.UUID, req UpdateAwardRequest) (storage.Award, error) {
	// 1. Проверка существования
	_, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		return storage.Award{}, fmt.Errorf("award not found: %w", err)
	}

	// 2. Обновление основных полей Award
	params := storage.UpdateAwardParams{
		ID:          id,
		Status:      req.Status,
		Type:        pgtype.UUID{Bytes: req.AwardType, Valid: req.AwardType != uuid.Nil},
		TotalPoints: req.TotalPoints,
		Text:        req.Text,
		Images:      req.Images,
		Document:    req.Document,
		Links:       req.Links,
	}

	updatedAward, err := s.repo.UpdateAward(ctx, params)
	if err != nil {
		return storage.Award{}, fmt.Errorf("update award failed: %w", err)
	}
	return *updatedAward, nil
}

func (s *AwardService) validateCreateFullAwardTypeParams(ctx context.Context, params *CreateFullAwardTypeParams) error {
	if params.Name == "" {
		return fmt.Errorf("award type name is required")
	}
	if len(params.Variants) == 0 {
		return fmt.Errorf("at least one variant is required")
	}

	return nil
}

func (s *AwardService) validateCreateAwardWithTypesParams(ctx context.Context, params *CreateAwardWithTypesParams) error {
	if params.AwardType == uuid.Nil {
		return fmt.Errorf("award type ID is required")
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
			BonusCriteria: bonusCriteriaIDs,
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
