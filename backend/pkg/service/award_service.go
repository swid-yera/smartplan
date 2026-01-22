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
	Files       []string             `json:"files"`
	Links       []string             `json:"links"`
}

type AwardService struct {
	repo *repository.AwardRepository
}

func NewAwardService(repo *repository.AwardRepository) *AwardService {
	return &AwardService{repo: repo}
}

// awards
func (s *AwardService) CreateAward(ctx context.Context, params *storage.CreateAwardParams) (AwardResponse, error) {
	dbAward, err := s.repo.CreateAward(ctx, params)
	if err != nil {
		return AwardResponse{}, err
	}

	res, err := s.buildAwardResponse(ctx, dbAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) GetAllAwards(ctx context.Context) ([]AwardResponse, error) {
	dbAwards, err := s.repo.GetAllAwards(ctx)
	if err != nil {
		return nil, err
	}

	var result []AwardResponse
	for _, dbAward := range dbAwards {
		award, err := s.buildAwardResponse(ctx, dbAward)
		if err != nil {
			return nil, err
		}

		result = append(result, award)
	}

	return result, nil
}

func (s *AwardService) GetAwardByID(ctx context.Context, id uuid.UUID) (AwardResponse, error) {
	dbAward, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		return AwardResponse{}, err
	}

	res, err := s.buildAwardResponse(ctx, dbAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) GetAwardsByMethodist(ctx context.Context, methodist pgtype.UUID) ([]AwardResponse, error) {
	dbAwards, err := s.repo.GetAwardsByMethodist(ctx, methodist)
	if err != nil {
		return nil, err
	}

	var result []AwardResponse
	for _, dbAward := range dbAwards {
		award, err := s.buildAwardResponse(ctx, dbAward)
		if err != nil {
			return nil, err
		}

		result = append(result, award)
	}

	return result, nil
}

func (s *AwardService) GetAwardsByTeacher(ctx context.Context, teacher pgtype.UUID) ([]AwardResponse, error) {
	dbAwards, err := s.repo.GetAwardsByTeacher(ctx, teacher)
	if err != nil {
		return nil, err
	}

	var result []AwardResponse
	for _, dbAward := range dbAwards {
		award, err := s.buildAwardResponse(ctx, dbAward)
		if err != nil {
			return nil, err
		}

		result = append(result, award)
	}

	return result, nil
}

func (s *AwardService) UpdateAward(ctx context.Context, id uuid.UUID, req UpdateAwardRequest) (AwardResponse, error) {
	// 1. Проверка существования
	_, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		return AwardResponse{}, fmt.Errorf("award not found: %w", err)
	}

	// 2. Обновление основных полей Award
	params := storage.UpdateAwardParams{
		ID:          id,
		Status:      req.Status,
		Type:        pgtype.UUID{Bytes: req.AwardType, Valid: req.AwardType != uuid.Nil},
		TotalPoints: req.TotalPoints,
		Text:        req.Text,
		Files:       req.Files,
		Links:       req.Links,
	}

	updatedAward, err := s.repo.UpdateAward(ctx, params)
	if err != nil {
		return AwardResponse{}, fmt.Errorf("update award failed: %w", err)
	}

	res, err := s.buildAwardResponse(ctx, updatedAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) UpdateAwardStatus(ctx context.Context, params storage.UpdateAwardStatusParams) (AwardResponse, error) {
	updatedAward, err := s.repo.UpdateAwardStatus(ctx, params)
	if err != nil {
		return AwardResponse{}, fmt.Errorf("update award failed: %w", err)
	}

	res, err := s.buildAwardResponse(ctx, updatedAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) DeleteAward(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteAward(ctx, id)
}

// types
func (s *AwardService) CreateType(ctx context.Context, params *CreateTypeParams) (TypeResponse, error) {
	// validation
	if err := s.validateCreateFullTypeParams(ctx, params); err != nil {
		return TypeResponse{}, fmt.Errorf("validation failed: %w", err)
	}

	// create variants with their criteria
	variantIDs, err := s.createVariantsWithCriteria(ctx, params.Variants)
	if err != nil {
		return TypeResponse{}, fmt.Errorf("create variants failed: %w", err)
	}

	// Create type
	typeParams := storage.CreateAwardTypeParams{
		Name:     params.Name,
		Variants: variantIDs,
	}
	awardType, err := s.repo.CreateAwardType(ctx, &typeParams)
	if err != nil {
		return TypeResponse{}, fmt.Errorf("create type failed: %w", err)
	}

	// Get full award type data
	return s.GetTypeByID(ctx, awardType.ID)
}

func (s *AwardService) GetAllFullTypes(ctx context.Context) ([]TypeResponse, error) {
	dbAwardTypes, err := s.repo.GetAllAwardTypes(ctx)
	if err != nil {
		return nil, err
	}

	var result []TypeResponse
	for _, at := range dbAwardTypes {
		payload, err := s.BuildType(ctx, at)
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

func (s *AwardService) BuildType(ctx context.Context, awardType storage.AwardType) (TypeResponse, error) {
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
				ID:     crit.ID,
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

func (s *AwardService) GetTypeByID(ctx context.Context, id uuid.UUID) (TypeResponse, error) {
	awardType, err := s.repo.GetAwardTypeByID(ctx, id)
	if err != nil {
		return TypeResponse{}, err
	}

	payload, err := s.BuildType(ctx, awardType)
	if err != nil {
		return TypeResponse{}, err
	}

	return payload, nil
}

func (s *AwardService) UpdateType(ctx context.Context, id uuid.UUID, req CreateAwardTypeRequest) (TypeResponse, error) {
	// Create variants with their criteria
	variantIDs, err := s.createVariantsWithCriteria(ctx, req.Variants)
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

	payload, err := s.BuildType(ctx, dbType)
	if err != nil {
		return TypeResponse{}, err
	}

	return payload, nil
}

func (s *AwardService) DeleteType(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteType(ctx, id)
}

// variants
func (s *AwardService) CreateVariant(ctx context.Context, params *storage.CreateAwardTypesVariantParams) (storage.AwardTypeVariant, error) {
	return s.repo.CreateAwardTypeVariant(ctx, params)
}

// criteria
func (s *AwardService) CreateCriteria(ctx context.Context, params *storage.CreateAwardTypeCriteriaParams) (storage.AwardTypeCriterium, error) {
	return s.repo.CreateAwardTypeCriteria(ctx, params)
}

func (s *AwardService) validateCreateFullTypeParams(ctx context.Context, params *CreateTypeParams) error {
	if params.Name == "" {
		return fmt.Errorf("award type name is required")
	}
	if len(params.Variants) == 0 {
		return fmt.Errorf("at least one variant is required")
	}

	return nil
}

func (s *AwardService) createVariantsWithCriteria(ctx context.Context, variants []VariantRequest) ([]uuid.UUID, error) {
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

func (s *AwardService) buildAwardResponse(ctx context.Context, award storage.Award) (AwardResponse, error) {
	// Get methodist
	var methodist *UserResponse
	if award.Methodist.Valid {
		user, err := s.repo.GetUserByID(ctx, award.Methodist.Bytes)
		if err == nil {
			methodist = convertToUserResponse(user)
		}
	}

	// Get teacher
	var teacher *UserResponse
	if award.Teacher.Valid {
		user, err := s.repo.GetUserByID(ctx, award.Teacher.Bytes)
		if err == nil {
			teacher = convertToUserResponse(user)
		}
	}

	// payload
	// type
	dbType, err := s.repo.GetAwardTypeByID(ctx, award.Type.Bytes)
	if err != nil {
		return AwardResponse{}, err
	}

	// Get type
	typePayload, err := s.BuildType(ctx, dbType)
	if err != nil {
		return AwardResponse{}, err
	}

	return AwardResponse{
		ID:          award.ID,
		Status:      award.Status,
		Type:        typePayload,
		Reason:      award.Reason,
		Methodist:   methodist,
		Teacher:     teacher,
		TotalPoints: award.TotalPoints,
		Text:        award.Text,
		Files:       award.Files,
		Links:       award.Links,
	}, nil
}
