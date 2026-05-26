package service

import (
	"context"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"
	"fmt"
	"io"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sirupsen/logrus"
)

type CreateAwardParams struct {
	AwardType          pgtype.UUID `json:"type"`
	AwardVariant       pgtype.UUID `json:"variant"`
	AwardCriteria      pgtype.UUID `json:"criteria"`
	AwardBonusCriteria pgtype.UUID `json:"bonusCriteria"`
	CategoryID         pgtype.UUID `json:"categoryId"`
	FieldValues        any         `json:"fieldValues"`
}

type CreateTypeParams struct {
	Name      localization.LocaleText `json:"name"`
	Variants  []VariantRequest        `json:"variants"`
	AwardType uuid.UUID               `json:"type"`
}

type AwardResponse struct {
	ID            uuid.UUID                 `json:"id"`
	Status        storage.AwardsStatus      `json:"status"`
	Type          SelectedTypeResponse      `json:"type"`
	Variant       SelectedVariantResponse   `json:"variant"`
	Criteria      SelectedCriteriaResponse  `json:"criteria"`
	BonusCriteria *SelectedCriteriaResponse `json:"bonus_criteria"`
	CategoryID    *uuid.UUID                `json:"categoryId,omitempty"`
	Category      *AwardCategoryResponse    `json:"category,omitempty"`
	FieldValues   map[string]any            `json:"fieldValues"`
	Reason        pgtype.Text               `json:"reason"`
	Methodist     *helpers.UserResponse     `json:"methodist"`
	Teacher       *helpers.UserResponse     `json:"teacher"`
	TotalPoints   int32                     `json:"totalPoints"`
	UpdatedAt     time.Time                 `json:"updatedAt"`
	CreatedAt     time.Time                 `json:"createdAt"`
}

type SelectedTypeResponse struct {
	ID   uuid.UUID               `json:"id"`
	Name localization.LocaleText `json:"name"`
}

type PaginatedAwardsResponse struct {
	Data []AwardResponse `json:"data"`
	Meta PaginationMeta  `json:"meta"`
}

type AwardDepartmentResponse struct {
	KeycloakID  uuid.UUID               `json:"keycloakId"`
	Name        localization.LocaleText `json:"name"`
	TotalPoints int32                   `json:"totalPoints"`
	UserCount   int32                   `json:"userCount"`
}

type SelectedVariantResponse struct {
	ID          uuid.UUID                `json:"id"`
	Name        localization.LocaleText  `json:"name"`
	Description *localization.LocaleText `json:"description"`
}

type SelectedCriteriaResponse struct {
	ID     uuid.UUID                  `json:"id"`
	Name   localization.LocaleText    `json:"name"`
	Points []int32                    `json:"points"`
	Method storage.EnumCriteriaMethod `json:"method"`
}

type TypeResponse struct {
	ID       uuid.UUID               `json:"id"`
	Name     localization.LocaleText `json:"name"`
	Variants []VariantResponse       `json:"variants"`
}

type VariantResponse struct {
	ID            uuid.UUID                `json:"id"`
	Name          localization.LocaleText  `json:"name"`
	Description   *localization.LocaleText `json:"description"`
	Criteria      []CriteriaResponse       `json:"criteria"`
	BonusCriteria []CriteriaResponse       `json:"bonus_criteria"`
}

type CriteriaResponse struct {
	ID     uuid.UUID                  `json:"id"`
	Name   localization.LocaleText    `json:"name"`
	Points []int32                    `json:"points"`
	Method storage.EnumCriteriaMethod `json:"method"`
}

type VariantRequest struct {
	Name          localization.LocaleText  `json:"name"`
	Description   *localization.LocaleText `json:"description"`
	Criteria      []Criteria               `json:"criteria"`
	BonusCriteria []Criteria               `json:"bonus_criteria"`
}

type CreateAwardTypeRequest struct {
	ID       uuid.UUID               `json:"id"`
	Name     localization.LocaleText `json:"name"`
	Variants []VariantRequest        `json:"variants"`
}

type Criteria struct {
	Name   localization.LocaleText    `json:"name"`
	Points []int32                    `json:"points"`
	Method storage.EnumCriteriaMethod `json:"method"`
}

type UpdateAwardRequest struct {
	Type          pgtype.UUID `json:"type"`
	Variant       pgtype.UUID `json:"variant"`
	Criteria      pgtype.UUID `json:"criteria"`
	BonusCriteria pgtype.UUID `json:"bonusCriteria"`
	CategoryID    pgtype.UUID `json:"categoryId"`
	FieldValues   any         `json:"fieldValues"`
	TotalPoints   int32       `json:"totalPoints"`
}

type AwardService struct {
	repo        *repository.AwardRepository
	userRepo    repository.UsersRepository
	log         *logrus.Logger
	fileStorage FileStorage
}

func NewAwardService(repo *repository.AwardRepository, userRepo repository.UsersRepository, fileStorage FileStorage, log *logrus.Logger) *AwardService {
	return &AwardService{repo: repo, userRepo: userRepo, fileStorage: fileStorage, log: log}
}

// awards
func (s *AwardService) CreateAward(ctx context.Context, params *storage.CreateAwardParams) (AwardResponse, error) {
	// check is exist
	_, err := s.repo.GetAwardTypeByID(ctx, params.Type.Bytes)
	if err != nil {
		s.log.Error("create award error: get award type by id error: ", err)
		return AwardResponse{}, err
	}

	// check is exist
	_, err = s.repo.GetAwardTypeVariantByID(ctx, params.Variant.Bytes)
	if err != nil {
		s.log.Error("create award error: get award variant by id error: ", err)
		return AwardResponse{}, err
	}

	// check is exist
	_, err = s.repo.GetAwardTypeCriteriaByID(ctx, params.Criteria.Bytes)
	if err != nil {
		s.log.Error("create award error: get award criteria by id error: ", err)
		return AwardResponse{}, err
	}

	// check is exist
	if params.BonusCriteria.Valid {
		_, err = s.repo.GetAwardTypeCriteriaByID(ctx, params.BonusCriteria.Bytes)
		if err != nil {
			s.log.Error("create award error: get award bonus criteria by id error: ", err)
			return AwardResponse{}, err
		}
	}

	fieldValuesMap, err := s.normalizeFieldValuesInput(params.FieldValues)
	if err != nil {
		return AwardResponse{}, err
	}

	params.FieldValues, err = s.validateAndMarshalFieldValues(ctx, params.CategoryID, fieldValuesMap)
	if err != nil {
		return AwardResponse{}, err
	}

	dbAward, err := s.repo.CreateAward(ctx, params)
	if err != nil {
		s.log.Error("create award error: failed to create award: ", err)
		return AwardResponse{}, err
	}

	award, err := s.BuildSelected(ctx, dbAward)
	if err != nil {
		s.log.Error(logrus.Fields{
			"message": "build award error",
			"error":   err,
		})
		return AwardResponse{}, err
	}

	return award, nil
}

func (s *AwardService) GetAllAwards(ctx context.Context) ([]AwardResponse, error) {
	dbAwards, err := s.repo.GetAllAwards(ctx)
	if err != nil {
		s.log.Error(logrus.Fields{
			"message": "get all awards error",
			"error":   err,
		})
		return []AwardResponse{}, err
	}

	var result []AwardResponse
	for _, dbAward := range dbAwards {
		award, err := s.BuildSelected(ctx, dbAward)
		if err != nil {
			s.log.Error(logrus.Fields{
				"message": "build all awards error",
				"error":   err,
			})
			return []AwardResponse{}, err
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

	res, err := s.BuildSelected(ctx, dbAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) UpdateAward(ctx context.Context, id uuid.UUID, req UpdateAwardRequest) (AwardResponse, error) {
	// check is exist
	_, err := s.repo.GetAwardTypeByID(ctx, req.Type.Bytes)
	if err != nil {
		s.log.Error("update award error: get award type by id error: ", err)
		return AwardResponse{}, err
	}

	// check is exist
	_, err = s.repo.GetAwardTypeVariantByID(ctx, req.Variant.Bytes)
	if err != nil {
		s.log.Error("update award error: get award variant by id error: ", err)
		return AwardResponse{}, err
	}

	// check is exist
	_, err = s.repo.GetAwardTypeCriteriaByID(ctx, req.Criteria.Bytes)
	if err != nil {
		s.log.Error("update award error: get award criteria by id error: ", err)
		return AwardResponse{}, err
	}

	// check is exist
	if req.BonusCriteria.Valid {
		_, err = s.repo.GetAwardTypeCriteriaByID(ctx, req.BonusCriteria.Bytes)
		if err != nil {
			s.log.Error("update award error: get award bonus criteria by id error: ", err)
			return AwardResponse{}, err
		}
	}

	existingAward, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		return AwardResponse{}, err
	}

	categoryID := existingAward.CategoryID
	if req.CategoryID.Valid {
		categoryID = req.CategoryID
	}

	fieldValuesMap, err := s.normalizeFieldValuesInput(existingAward.FieldValues)
	if err != nil {
		return AwardResponse{}, err
	}
	if req.FieldValues != nil {
		fieldValuesMap, err = s.normalizeFieldValuesInput(req.FieldValues)
		if err != nil {
			return AwardResponse{}, err
		}
	}

	fieldValuesJSON, err := s.validateAndMarshalFieldValues(ctx, categoryID, fieldValuesMap)
	if err != nil {
		return AwardResponse{}, err
	}

	// 2. Обновление основных полей Award
	params := storage.UpdateAwardParams{
		ID:            id,
		Type:          req.Type,
		Variant:       req.Variant,
		Criteria:      req.Criteria,
		BonusCriteria: req.BonusCriteria,
		CategoryID:    categoryID,
		FieldValues:   fieldValuesJSON,
		TotalPoints:   req.TotalPoints,
	}

	updatedAward, err := s.repo.UpdateAward(ctx, params)
	if err != nil {
		return AwardResponse{}, fmt.Errorf("update award failed: %w", err)
	}

	res, err := s.BuildSelected(ctx, updatedAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) UpdateAwardStatus(ctx context.Context, params storage.UpdateAwardStatusParams) (AwardResponse, error) {

	// 1. Получаем текущее состояние award
	award, err := s.repo.GetAwardByID(ctx, params.ID)
	if err != nil {
		return AwardResponse{}, err
	}

	// 2. Обновляем статус
	updatedAward, err := s.repo.UpdateAwardStatus(ctx, storage.UpdateAwardStatusParams{
		ID:          params.ID,
		Status:      params.Status,
		Reason:      params.Reason,
		Methodist:   params.Methodist,
		TotalPoints: params.TotalPoints,
	})
	if err != nil {
		return AwardResponse{}, fmt.Errorf("update award failed: %w", err)
	}

	// 3. Обрабатываем points ТОЛЬКО при смене APPROVED
	switch {
	case award.Status != storage.AwardsStatusAPPROVED &&
		params.Status == storage.AwardsStatusAPPROVED:

		err = s.userRepo.UpdateUserTotalPoints(
			ctx,
			award.Teacher.Bytes,      // или updatedAward.Teacher
			updatedAward.TotalPoints, // <- вот тут новое значение
		)
		if err != nil {
			return AwardResponse{}, err
		}

	case award.Status == storage.AwardsStatusAPPROVED &&
		params.Status != storage.AwardsStatusAPPROVED:

		err = s.userRepo.UpdateUserTotalPoints(
			ctx,
			award.Teacher.Bytes,
			-award.TotalPoints, // <- минус новое значение
		)
		if err != nil {
			return AwardResponse{}, err
		}
	}

	// 4. Формируем response
	res, err := s.BuildSelected(ctx, updatedAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) DeleteAward(ctx context.Context, id uuid.UUID) error {

	award, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		return err
	}

	// если award был APPROVED — списываем points
	if award.Status == storage.AwardsStatusAPPROVED {
		err = s.userRepo.UpdateUserTotalPoints(
			ctx,
			award.Teacher.Bytes,
			award.TotalPoints,
		)
		if err != nil {
			return err
		}
	}

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
		Name:     params.Name.ToJSONB(),
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
			Name:     localization.LocaleTextFromJSONB(at.Name),
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
				Name:   localization.LocaleTextFromJSONB(crit.Name),
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
				Name:   localization.LocaleTextFromJSONB(crit.Name),
				Points: crit.Points,
				Method: crit.Method,
			})
		}

		variants = append(variants, VariantResponse{
			ID:            variant.ID,
			Name:          localization.LocaleTextFromJSONB(variant.Name),
			Description:   localization.LocaleTextPtrFromJSONB(variant.Description),
			Criteria:      criteria,
			BonusCriteria: bonusCriteria,
		})
	}

	return TypeResponse{
		ID:       awardType.ID,
		Name:     localization.LocaleTextFromJSONB(awardType.Name),
		Variants: variants,
	}, nil
}

func (s *AwardService) BuildSelected(ctx context.Context, award storage.Award) (AwardResponse, error) {
	s.log.Error("award info ", award.Type, award.Variant, award.Criteria, award.BonusCriteria)

	dbType, err := s.repo.GetAwardTypeByID(ctx, award.Type.Bytes)
	if err != nil {
		s.log.Error("build selected error: get award type by id error: ", err)
		return AwardResponse{}, err
	}

	mappedType := SelectedTypeResponse{
		ID:   dbType.ID,
		Name: localization.LocaleTextFromJSONB(dbType.Name),
	}

	// variant
	dbVariant, err := s.repo.GetAwardTypeVariantByID(ctx, award.Variant.Bytes)
	if err != nil {
		s.log.Error("build selected error: get award variant by id error", err)
		return AwardResponse{}, err
	}

	mappedVariant := SelectedVariantResponse{
		ID:          dbVariant.ID,
		Name:        localization.LocaleTextFromJSONB(dbVariant.Name),
		Description: localization.LocaleTextPtrFromJSONB(dbVariant.Description),
	}

	// criteria
	dbCriteria, err := s.repo.GetAwardTypeCriteriaByID(ctx, award.Criteria.Bytes)
	if err != nil {
		s.log.Error("build selected error: get award criteria by id error ", err)
		return AwardResponse{}, err
	}

	mappedCriteria := SelectedCriteriaResponse{
		ID:     dbCriteria.ID,
		Name:   localization.LocaleTextFromJSONB(dbCriteria.Name),
		Points: dbCriteria.Points,
		Method: dbCriteria.Method,
	}

	// bonus criteria
	var mappedBonusCriteria *SelectedCriteriaResponse
	if award.BonusCriteria.Valid {
		dbBonusCriteria, err := s.repo.GetAwardTypeCriteriaByID(ctx, award.BonusCriteria.Bytes)
		if err != nil {
			s.log.Error("build selected error: get award bonus criteria by id error ", err)
			return AwardResponse{}, err
		}

		mappedBonusCriteria = &SelectedCriteriaResponse{
			ID:     dbBonusCriteria.ID,
			Name:   localization.LocaleTextFromJSONB(dbBonusCriteria.Name),
			Points: dbBonusCriteria.Points,
			Method: dbBonusCriteria.Method,
		}
	}

	// Get methodist
	var methodist *helpers.UserResponse
	if award.Methodist.Valid {
		user, err := s.repo.GetUserByID(ctx, award.Methodist.Bytes)
		if err != nil {
			s.log.Error("build selected error: get methodist by id error", err)
			return AwardResponse{}, err
		}

		methodist = helpers.ConvertToUserResponse(user)
	}

	// Get teacher
	var teacher *helpers.UserResponse
	if award.Teacher.Valid {
		user, err := s.repo.GetUserByID(ctx, award.Teacher.Bytes)
		if err != nil {
			s.log.Error("build selected error: get teacher by id error", err)
			return AwardResponse{}, err
		}

		teacher = helpers.ConvertToUserResponse(user)
	}

	var categoryID *uuid.UUID
	var category *AwardCategoryResponse
	if award.CategoryID.Valid {
		id := uuid.UUID(award.CategoryID.Bytes)
		categoryID = &id

		dbCategory, categoryErr := s.repo.GetAwardCategoryByID(ctx, id)
		if categoryErr != nil {
			return AwardResponse{}, categoryErr
		}

		mappedCategory, categoryErr := s.mapCategoryResponse(ctx, dbCategory, true)
		if categoryErr != nil {
			return AwardResponse{}, categoryErr
		}
		category = &mappedCategory
	}

	fieldValues, err := s.decodeFieldValues(award.FieldValues)
	if err != nil {
		return AwardResponse{}, err
	}

	return AwardResponse{
		ID:            award.ID,
		Status:        award.Status,
		Type:          mappedType,
		Variant:       mappedVariant,
		Criteria:      mappedCriteria,
		BonusCriteria: mappedBonusCriteria,
		CategoryID:    categoryID,
		Category:      category,
		FieldValues:   fieldValues,
		Reason:        award.Reason,
		Methodist:     methodist,
		Teacher:       teacher,
		TotalPoints:   award.TotalPoints,
		UpdatedAt:     award.UpdatedAt.Time,
		CreatedAt:     award.CreatedAt.Time,
	}, err
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
		Name:     req.Name.ToJSONB(),
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
	if params.Name.Ru == "" && params.Name.Kz == "" {
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
				Name:   crit.Name.ToJSONB(),
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
				Name:   crit.Name.ToJSONB(),
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
			Name:          variant.Name.ToJSONB(),
			Description:   localePtrToJSONB(variant.Description),
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
	if err := s.fileStorage.UploadFile(ctx, fileName, reader, size); err != nil {
		return "", err
	}
	return fileName, nil
}

func (s *AwardService) GetFileDownloadURL(ctx context.Context, key string) (string, error) {
	return s.fileStorage.GetDownloadFileURL(ctx, key, 10*time.Minute)
}

func (s *AwardService) CountAwards(ctx context.Context) (int64, error) {
	return s.repo.CountAwards(ctx)
}

func (s *AwardService) GetAwardPaginated(
	ctx context.Context,
	currentPage int,
	pageSize int,
	teacher pgtype.UUID,
	methodist pgtype.UUID,
	categoryID pgtype.UUID,
	status []string,
) (*PaginatedAwardsResponse, error) {
	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	if len(status) == 0 {
		status = nil
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountAwardsFiltered(
		ctx,
		teacher,
		methodist,
		categoryID,
		status,
	)
	if err != nil {
		return nil, err
	}

	dbAwards, err := s.repo.GetAwardsPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		teacher,
		methodist,
		categoryID,
		status,
	)
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	// build awards
	var result []AwardResponse
	for _, dbAward := range dbAwards {
		award, err := s.BuildSelected(ctx, dbAward)
		if err != nil {
			s.log.Error(logrus.Fields{
				"message": "build all awards error",
				"error":   err,
			})

			return nil, err
		}

		result = append(result, award)
	}

	return &PaginatedAwardsResponse{
		Data: result,
		Meta: PaginationMeta{
			CurrentPage: currentPage,
			Pages:       pages,
			Total:       int(total),
			PageSize:    pageSize,
		},
	}, nil
}

func (s *AwardService) GetAwardDepartmentsStats(ctx context.Context) ([]AwardDepartmentResponse, error) {
	rows, err := s.repo.GetAwardDepartmentsStats(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]AwardDepartmentResponse, 0, len(rows))
	for _, row := range rows {
		result = append(result, AwardDepartmentResponse{
			KeycloakID:  row.KeycloakID,
			Name:        localization.LocaleTextFromJSONB(row.Name),
			TotalPoints: row.TotalPoints,
			UserCount:   row.UserCount,
		})
	}

	return result, nil
}
