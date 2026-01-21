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

type CreateAwardParams struct {
	AwardType uuid.UUID   `json:"type"`
	Text      pgtype.Text `json:"text"`
	Links     []string    `json:"links"`
}

type CreateTypeParams struct {
	Name      string           `json:"name"`
	Variants  []VariantRequest `json:"variants"`
	AwardType uuid.UUID        `json:"type"`
	Text      pgtype.Text      `json:"text"`
	Links     []string         `json:"links"`
}

type AwardResponse struct {
	ID          uuid.UUID            `json:"id"`
	Status      storage.AwardsStatus `json:"status"`
	Type        TypeResponse         `json:"type"`
	Reason      pgtype.Text          `json:"reason"`
	Methodist   *UserResponse        `json:"methodist"`
	Teacher     *UserResponse        `json:"teacher"`
	TotalPoints int32                `json:"totalPoints"`
	Text        pgtype.Text          `json:"text"`
	Files       []string             `json:"files"`
	Links       []string             `json:"links"`
}

type TypeResponse struct {
	ID       uuid.UUID         `json:"id"`
	Name     string            `json:"name"`
	Variants []VariantResponse `json:"variants"`
}

type VariantResponse struct {
	ID            uuid.UUID          `json:"id"`
	Name          string             `json:"name"`
	Description   string             `json:"description"`
	Criteria      []CriteriaResponse `json:"criteria"`
	BonusCriteria []CriteriaResponse `json:"bonusCriteria"`
}

type CriteriaResponse struct {
	ID     uuid.UUID                  `json:"id"`
	Name   string                     `json:"name"`
	Points []int32                    `json:"points"`
	Method storage.EnumCriteriaMethod `json:"method"`
}

type VariantRequest struct {
	Name          string      `json:"name"`
	Description   pgtype.Text `json:"description"`
	Criteria      []Criteria  `json:"criteria"`
	BonusCriteria []Criteria  `json:"bonus_criteria"`
}

type CreateAwardTypeRequest struct {
	ID       uuid.UUID        `json:"id"`
	Name     string           `json:"name"`
	Variants []VariantRequest `json:"variants"`
}

type Criteria struct {
	Name   string                     `json:"name"`
	Points []int32                    `json:"points"`
	Method storage.EnumCriteriaMethod `json:"method"`
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

func (s *AwardService) CreateAward(ctx context.Context, params *storage.CreateAwardParams) (AwardResponse, error) {
	dbAward, err := s.repo.CreateAward(ctx, params)
	if err != nil {
		return AwardResponse{}, err
	}

	// payload
	// type
	dbType, err := s.repo.GetAwardTypeByID(ctx, dbAward.Type.Bytes)
	if err != nil {
		return AwardResponse{}, err
	}

	typePayload, err := s.BuildAwardType(ctx, dbType)
	if err != nil {
		return AwardResponse{}, err
	}

	// teacher
	var teacher *UserResponse
	if dbAward.Teacher.Valid {
		user, err := s.repo.GetUserByID(ctx, dbAward.Teacher.Bytes)
		if err == nil {
			teacher = convertToUserResponse(user)
		}
	}

	return AwardResponse{
		ID:          dbAward.ID,
		Status:      dbAward.Status,
		Type:        typePayload,
		Teacher:     teacher,
		Reason:      dbAward.Reason,
		TotalPoints: dbAward.TotalPoints,
		Text:        dbAward.Text,
		Files:       dbAward.Files,
		Links:       dbAward.Files,
	}, nil
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

func (s *AwardService) GetAllFullAwardTypes(ctx context.Context) ([]TypeResponse, error) {
	dbAwardTypes, err := s.repo.GetAllAwardTypes(ctx)
	if err != nil {
		return nil, err
	}

	var result []TypeResponse
	for _, at := range dbAwardTypes {
		payload, err := s.BuildAwardType(ctx, at)
		if err != nil {
			return nil, err
		}

		result = append(result, TypeResponse{
			ID:       at.ID,
			Name:     at.Name,
			Variants: payload.Variants,
		})
	}

	return result, nil
}

func (s *AwardService) BuildAwardType(ctx context.Context, awardType storage.AwardType) (TypeResponse, error) {
	var variants []VariantResponse
	for _, variantID := range awardType.Variants {
		// The GetAwardTypeVariantByID method returns `storage.AwardTypeVariant`.
		variant, err := s.repo.GetAwardTypeVariantByID(ctx, variantID)
		if err != nil {
			return TypeResponse{}, fmt.Errorf("failed to get variant %s: %w", variantID, err)
		}

		var criteria []CriteriaResponse
		for _, cID := range variant.Criteria {
			crit, err := s.repo.GetAwardTypeCriteriaByID(ctx, cID)
			if err != nil {
				return TypeResponse{}, fmt.Errorf("failed to get criteria %s: %w", cID, err)
			}
			criteria = append(criteria, CriteriaResponse{
				ID:     crit.ID,
				Name:   crit.Name,
				Points: crit.Points,
				Method: crit.Method,
			})
		}

		var bonusCriteria []CriteriaResponse
		for _, cID := range variant.BonusCriteria {
			crit, err := s.repo.GetAwardTypeCriteriaByID(ctx, cID)
			if err != nil {
				return TypeResponse{}, fmt.Errorf("failed to get bonus criteria %s: %w", cID, err)
			}
			bonusCriteria = append(bonusCriteria, CriteriaResponse{
				Name:   crit.Name,
				Points: crit.Points,
				Method: crit.Method,
			})
		}

		variants = append(variants, VariantResponse{
			ID:            variant.ID,
			Name:          variant.Name,
			Description:   variant.Description.String,
			Criteria:      criteria,
			BonusCriteria: bonusCriteria,
		})
	}

	return TypeResponse{
		ID:       awardType.ID,
		Name:     awardType.Name,
		Variants: variants,
	}, nil

}

func (s *AwardService) GetAwardTypeByID(ctx context.Context, id uuid.UUID) (storage.AwardType, error) {
	return s.repo.GetAwardTypeByID(ctx, id)
}

func (s *AwardService) GetFullAwardTypeByID(ctx context.Context, id uuid.UUID) (TypeResponse, error) {
	awardType, err := s.repo.GetAwardTypeByID(ctx, id)
	if err != nil {
		return TypeResponse{}, err
	}

	payload, err := s.BuildAwardType(ctx, awardType)
	if err != nil {
		return TypeResponse{}, err
	}

	return payload, nil
}

func (s *AwardService) UpdateAwardType(ctx context.Context, id uuid.UUID, req CreateAwardTypeRequest) (TypeResponse, error) {
	// Create variants with their criteria
	variantIDs, err := s.createAwardTypeVariantsWithCriteria(ctx, req.Variants)
	if err != nil {
		return TypeResponse{}, fmt.Errorf("create variants failed: %w", err)
	}

	params := storage.UpdateAwardTypeParams{
		ID:       id,
		Name:     req.Name,
		Variants: variantIDs,
	}
	updatedType, err := s.repo.UpdateAwardType(ctx, params)
	if err != nil {
		return TypeResponse{}, err
	}

	// payload
	dbType, err := s.repo.GetAwardTypeByID(ctx, updatedType.ID)
	if err != nil {
		return TypeResponse{}, err
	}

	payload, err := s.BuildAwardType(ctx, dbType)
	if err != nil {
		return TypeResponse{}, err
	}

	return payload, nil
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

func (s *AwardService) CreateType(ctx context.Context, params *CreateTypeParams) (TypeResponse, error) {
	// validation
	if err := s.validateCreateFullAwardTypeParams(ctx, params); err != nil {
		return TypeResponse{}, fmt.Errorf("validation failed: %w", err)
	}

	// create variants with their criteria
	variantIDs, err := s.createAwardTypeVariantsWithCriteria(ctx, params.Variants)
	if err != nil {
		return TypeResponse{}, fmt.Errorf("create variants failed: %w", err)
	}

	// Create type
	typeParams := storage.CreateAwardTypeParams{
		Name:     params.Name,
		Variants: variantIDs,
	}
	awardType, err := s.createAwardType(ctx, &typeParams)
	if err != nil {
		return TypeResponse{}, fmt.Errorf("create type failed: %w", err)
	}

	// Get full award type data
	return s.GetFullAwardTypeByID(ctx, awardType.ID)
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
		Links:       req.Links,
	}

	updatedAward, err := s.repo.UpdateAward(ctx, params)
	if err != nil {
		return storage.Award{}, fmt.Errorf("update award failed: %w", err)
	}
	return *updatedAward, nil
}

func (s *AwardService) validateCreateFullAwardTypeParams(ctx context.Context, params *CreateTypeParams) error {
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

func (s *AwardService) createAwardTypeVariantsWithCriteria(ctx context.Context, variants []VariantRequest) ([]uuid.UUID, error) {
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
