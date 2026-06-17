package service

import (
	"context"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"
	"errors"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
	Fields        []AwardFieldValueResponse `json:"fields,omitempty"`
	Reason        string                    `json:"reason"`
	Methodist     *helpers.UserResponse     `json:"methodist"`
	Teacher       *helpers.UserResponse     `json:"teacher"`
	TotalPoints   int32                     `json:"totalPoints"`
	UpdatedAt     time.Time                 `json:"updatedAt"`
	CreatedAt     time.Time                 `json:"createdAt"`
}

type AwardFieldValueResponse struct {
	Field AwardCategoryFieldResponse `json:"field"`
	Data  any                        `json:"data"`
}

type SelectedTypeResponse struct {
	ID   uuid.UUID               `json:"id"`
	Name localization.LocaleText `json:"name"`
}

type PaginatedAwardsResponse struct {
	Data []AwardResponse `json:"data"`
	Meta PaginationMeta  `json:"meta"`
}

type AwardUserAwardsSummaryCategoryResponse struct {
	CategoryID    string                 `json:"categoryId"`
	Category      *AwardCategoryResponse `json:"category,omitempty"`
	CurrentPoints int32                  `json:"currentPoints"`
	PendingPoints int32                  `json:"pendingPoints"`
	Awards        []AwardResponse        `json:"awards"`
}

type AwardUserAwardsSummaryResponse struct {
	CurrentPoints int32                                    `json:"currentPoints"`
	Categories    []AwardUserAwardsSummaryCategoryResponse `json:"categories"`
}

type AwardDepartmentResponse struct {
	KeycloakID  uuid.UUID               `json:"keycloakId"`
	Name        localization.LocaleText `json:"name"`
	TotalPoints int32                   `json:"totalPoints"`
	UserCount   int32                   `json:"userCount"`
}

type AwardReviewTeacherResponse struct {
	KeycloakID        uuid.UUID `json:"keycloakId"`
	FirstName         string    `json:"firstName"`
	LastName          string    `json:"lastName"`
	Username          string    `json:"username"`
	TotalPoints       int32     `json:"totalPoints"`
	ReviewAwardsCount int32     `json:"reviewAwardsCount"`
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

type UpdateAwardStatusRequest struct {
	Status               storage.AwardsStatus `json:"status"`
	Reason               pgtype.Text          `json:"reason"`
	Methodist            pgtype.UUID          `json:"methodist"`
	Variant              pgtype.UUID          `json:"variant"`
	Criteria             pgtype.UUID          `json:"criteria"`
	BonusCriteria        pgtype.UUID          `json:"bonusCriteria"`
	BonusCriteriaTouched bool                 `json:"-"`
	TotalPoints          int32                `json:"totalPoints"`
}

// AwardServiceInterface — интерфейс для бизнес-логики наград.
// Позволяет подменять реализацию в тестах и сохраняет единообразие с другими сервисами.
type AwardServiceInterface interface {
	// Awards
	CreateAward(ctx context.Context, currentUser *User, params *storage.CreateAwardParams) (AwardResponse, error)
	GetAllAwards(ctx context.Context) ([]AwardResponse, error)
	GetAwardByID(ctx context.Context, id uuid.UUID) (AwardResponse, error)
	UpdateAward(ctx context.Context, currentUser *User, id uuid.UUID, req UpdateAwardRequest) (AwardResponse, error)
	UpdateAwardPoints(ctx context.Context, id uuid.UUID, totalPoints int32) (AwardResponse, error)
	UpdateAwardStatus(ctx context.Context, id uuid.UUID, params UpdateAwardStatusRequest) (AwardResponse, error)
	DeleteAward(ctx context.Context, id uuid.UUID) error
	BuildSelected(ctx context.Context, award storage.Award) (AwardResponse, error)
	GetAwardPaginated(ctx context.Context, currentPage int, pageSize int, search string, sort string, statusOrder string, teacher pgtype.UUID, methodist pgtype.UUID, categoryIDs []uuid.UUID, status []string) (*PaginatedAwardsResponse, error)
	GetUserAwardsSummary(ctx context.Context, userID uuid.UUID) (AwardUserAwardsSummaryResponse, error)
	CountAwards(ctx context.Context) (int64, error)
	GetAwardDepartmentsStats(ctx context.Context) ([]AwardDepartmentResponse, error)
	GetReviewTeachers(ctx context.Context) ([]AwardReviewTeacherResponse, error)
	MergeUploadedFilesIntoFieldValues(ctx context.Context, userID uuid.UUID, awardID uuid.UUID, categoryID pgtype.UUID, rawFieldValues any, formFiles map[string][]*multipart.FileHeader) (map[string]any, error)
	ResolveFieldValueFileURLs(ctx context.Context, categoryID *uuid.UUID, values map[string]any) (map[string]any, error)

	// Types
	CreateType(ctx context.Context, params *CreateTypeParams) (TypeResponse, error)
	GetAllFullTypes(ctx context.Context) ([]TypeResponse, error)
	BuildType(ctx context.Context, awardType storage.AwardType) (TypeResponse, error)
	GetTypeByID(ctx context.Context, id uuid.UUID) (TypeResponse, error)
	UpdateType(ctx context.Context, id uuid.UUID, req CreateAwardTypeRequest) (TypeResponse, error)
	DeleteType(ctx context.Context, id uuid.UUID) error
	CreateVariant(ctx context.Context, params *storage.CreateAwardTypesVariantParams) (storage.AwardTypeVariant, error)
	CreateCriteria(ctx context.Context, params *storage.CreateAwardTypeCriteriaParams) (storage.AwardTypeCriterium, error)

	// Categories
	CreateCategory(ctx context.Context, req AwardCategoryRequest) (AwardCategoryResponse, error)
	GetAllCategories(ctx context.Context) ([]AwardCategoryListItemResponse, error)
	GetCategoryByID(ctx context.Context, id uuid.UUID) (AwardCategoryResponse, error)
	UpdateCategory(ctx context.Context, id uuid.UUID, req AwardCategoryRequest) (AwardCategoryResponse, error)
	DeleteCategory(ctx context.Context, id uuid.UUID) error
}

type AwardService struct {
	repo        *repository.AwardRepository
	userRepo    repository.UsersRepository
	kpiSettings repository.KPIUploadSettings
	log         *logrus.Logger
	fileStorage FileStorage
}

func NewAwardService(repo *repository.AwardRepository, userRepo repository.UsersRepository, kpiSettings repository.KPIUploadSettings, fileStorage FileStorage, log *logrus.Logger) *AwardService {
	return &AwardService{repo: repo, userRepo: userRepo, kpiSettings: kpiSettings, fileStorage: fileStorage, log: log}
}

// awards
func (s *AwardService) CreateAward(ctx context.Context, currentUser *User, params *storage.CreateAwardParams) (AwardResponse, error) {
	if err := s.ensureKpiUploadAllowed(ctx, currentUser); err != nil {
		return AwardResponse{}, err
	}

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

	if _, err = s.resolveAwardSelectionPoints(ctx, params.Variant, params.Criteria, params.BonusCriteria, nil); err != nil {
		return AwardResponse{}, err
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

func (s *AwardService) UpdateAward(ctx context.Context, currentUser *User, id uuid.UUID, req UpdateAwardRequest) (AwardResponse, error) {
	existingAward, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		return AwardResponse{}, err
	}

	if err := s.ensureKpiUploadAllowed(ctx, currentUser); err != nil {
		return AwardResponse{}, err
	}

	// check is exist
	_, err = s.repo.GetAwardTypeByID(ctx, req.Type.Bytes)
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

	if _, err = s.resolveAwardSelectionPoints(ctx, req.Variant, req.Criteria, req.BonusCriteria, nil); err != nil {
		return AwardResponse{}, err
	}

	totalPoints := req.TotalPoints
	if existingAward.Status == storage.AwardsStatusAPPROVED {
		resolvedPoints, pointsErr := s.resolveAwardSelectionPoints(
			ctx,
			req.Variant,
			req.Criteria,
			req.BonusCriteria,
			nil,
		)
		if pointsErr != nil {
			return AwardResponse{}, pointsErr
		}
		totalPoints = resolvedPoints
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
		TotalPoints:   totalPoints,
	}

	updatedAward, err := s.repo.UpdateAward(ctx, params)
	if err != nil {
		return AwardResponse{}, fmt.Errorf("update award failed: %w", err)
	}

	if err = s.syncApprovedAwardPoints(ctx, existingAward, updatedAward); err != nil {
		return AwardResponse{}, err
	}

	res, err := s.BuildSelected(ctx, updatedAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) ensureKpiUploadAllowed(ctx context.Context, currentUser *User) error {
	if s.kpiSettings == nil {
		return nil
	}

	if currentUser == nil {
		return &HTTPStatusError{StatusCode: http.StatusUnauthorized, Message: "User not authenticated"}
	}

	if !HasPermissionExact(currentUser.Permissions, PermKPIView) || HasPermissionLevel(currentUser.Permissions, PermKPIManage) {
		return nil
	}

	settings, err := s.kpiSettings.GetKpiUploadSettings(ctx)
	if err != nil {
		return err
	}

	if settings == nil {
		return nil
	}

	if hasKpiUploadException(currentUser.KeycloakID, settings.ExceptionUserIDs) {
		return nil
	}

	blockedAfterDate := settings.BlockedAfterDate
	if blockedAfterDate == nil {
		return nil
	}

	today := time.Now().Format("2006-01-02")
	cutoff := blockedAfterDate.Format("2006-01-02")
	if today > cutoff {
		return &HTTPStatusError{StatusCode: http.StatusForbidden, Message: "kpi uploads are disabled after configured date"}
	}

	return nil
}

func (s *AwardService) UpdateAwardPoints(ctx context.Context, id uuid.UUID, totalPoints int32) (AwardResponse, error) {
	existingAward, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AwardResponse{}, &HTTPStatusError{StatusCode: 404, Message: "award not found"}
		}
		return AwardResponse{}, err
	}

	if existingAward.Status != storage.AwardsStatusAPPROVED {
		return AwardResponse{}, &HTTPStatusError{
			StatusCode: 400,
			Message:    "award points can only be changed for approved awards",
		}
	}

	updatedAward, err := s.repo.UpdateAwardPoints(ctx, storage.UpdateAwardPointsParams{
		ID:          id,
		TotalPoints: totalPoints,
	})
	if err != nil {
		return AwardResponse{}, fmt.Errorf("update award points failed: %w", err)
	}

	if err = s.syncApprovedAwardPoints(ctx, existingAward, updatedAward); err != nil {
		return AwardResponse{}, err
	}

	res, err := s.BuildSelected(ctx, updatedAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) UpdateAwardStatus(ctx context.Context, id uuid.UUID, params UpdateAwardStatusRequest) (AwardResponse, error) {

	// 1. Получаем текущее состояние award
	award, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		return AwardResponse{}, err
	}

	resolvedVariant, resolvedCriteria, resolvedBonusCriteria, resolvedTotalPoints, err := s.resolveAwardStatusPoints(
		ctx,
		award,
		params,
	)
	if err != nil {
		return AwardResponse{}, err
	}

	params.Variant = resolvedVariant
	params.Criteria = resolvedCriteria
	params.BonusCriteria = resolvedBonusCriteria
	params.TotalPoints = resolvedTotalPoints

	// 2. Обновляем статус
	updatedAward, err := s.repo.UpdateAwardStatus(ctx, storage.UpdateAwardStatusParams{
		ID:            id,
		Status:        params.Status,
		Reason:        params.Reason,
		Methodist:     params.Methodist,
		Variant:       params.Variant,
		Criteria:      params.Criteria,
		BonusCriteria: params.BonusCriteria,
		TotalPoints:   params.TotalPoints,
	})
	if err != nil {
		return AwardResponse{}, fmt.Errorf("update award failed: %w", err)
	}

	if err = s.syncApprovedAwardPoints(ctx, award, updatedAward); err != nil {
		return AwardResponse{}, err
	}

	// 4. Формируем response
	res, err := s.BuildSelected(ctx, updatedAward)
	if err != nil {
		return AwardResponse{}, err
	}

	return res, nil
}

func (s *AwardService) resolveAwardStatusPoints(
	ctx context.Context,
	award storage.Award,
	params UpdateAwardStatusRequest,
) (pgtype.UUID, pgtype.UUID, pgtype.UUID, int32, error) {
	resolvedVariant := award.Variant
	if params.Variant.Valid {
		resolvedVariant = params.Variant
	}

	resolvedCriteria := award.Criteria
	if params.Criteria.Valid {
		resolvedCriteria = params.Criteria
	}

	resolvedBonusCriteria := award.BonusCriteria
	if params.BonusCriteriaTouched {
		resolvedBonusCriteria = params.BonusCriteria
	}

	if params.Status != storage.AwardsStatusAPPROVED {
		return resolvedVariant, resolvedCriteria, resolvedBonusCriteria, 0, nil
	}

	dbType, err := s.repo.GetAwardTypeByID(ctx, award.Type.Bytes)
	if err != nil {
		return pgtype.UUID{}, pgtype.UUID{}, pgtype.UUID{}, 0, fmt.Errorf("failed to get award type: %w", err)
	}

	variantAllowed := false
	for _, variantID := range dbType.Variants {
		if variantID == resolvedVariant.Bytes {
			variantAllowed = true
			break
		}
	}
	if !variantAllowed {
		return pgtype.UUID{}, pgtype.UUID{}, pgtype.UUID{}, 0, fmt.Errorf("selected variant does not belong to award type")
	}

	if !resolvedCriteria.Valid {
		dbVariant, variantErr := s.repo.GetAwardTypeVariantByID(ctx, resolvedVariant.Bytes)
		if variantErr != nil {
			return pgtype.UUID{}, pgtype.UUID{}, pgtype.UUID{}, 0, fmt.Errorf("failed to get award variant: %w", variantErr)
		}
		if len(dbVariant.Criteria) == 0 {
			return pgtype.UUID{}, pgtype.UUID{}, pgtype.UUID{}, 0, fmt.Errorf("criteria is required for approved award")
		}
		resolvedCriteria = pgtype.UUID{Bytes: dbVariant.Criteria[0], Valid: true}
	}

	resolvedTotalPoints, err := s.resolveAwardSelectionPoints(
		ctx,
		resolvedVariant,
		resolvedCriteria,
		resolvedBonusCriteria,
		&params.TotalPoints,
	)
	if err != nil {
		return pgtype.UUID{}, pgtype.UUID{}, pgtype.UUID{}, 0, err
	}

	return resolvedVariant, resolvedCriteria, resolvedBonusCriteria, resolvedTotalPoints, nil
}

func containsAwardUUID(list []uuid.UUID, target uuid.UUID) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}

	return false
}

func resolveCriteriaPoints(criteria storage.AwardTypeCriterium, requestedPoints *int32) (int32, error) {
	if len(criteria.Points) == 0 {
		return 0, fmt.Errorf("award criteria points are required")
	}

	switch criteria.Method {
	case storage.EnumCriteriaMethodNORMAL:
		return criteria.Points[0], nil
	case storage.EnumCriteriaMethodMEASURING:
		minPoints := criteria.Points[0]
		maxPoints := criteria.Points[len(criteria.Points)-1]

		if requestedPoints == nil {
			return minPoints, nil
		}

		resolvedPoints := *requestedPoints
		if resolvedPoints < minPoints {
			resolvedPoints = minPoints
		}
		if resolvedPoints > maxPoints {
			resolvedPoints = maxPoints
		}

		return resolvedPoints, nil
	default:
		return 0, fmt.Errorf("unsupported criteria method")
	}
}

func resolveBonusCriteriaPoints(criteria storage.AwardTypeCriterium) (int32, error) {
	if len(criteria.Points) == 0 {
		return 0, fmt.Errorf("award bonus criteria points are required")
	}

	return criteria.Points[0], nil
}

func (s *AwardService) resolveAwardSelectionPoints(
	ctx context.Context,
	variantID pgtype.UUID,
	criteriaID pgtype.UUID,
	bonusCriteriaID pgtype.UUID,
	requestedPoints *int32,
) (int32, error) {
	if !variantID.Valid {
		return 0, fmt.Errorf("award variant is required")
	}
	if !criteriaID.Valid {
		return 0, fmt.Errorf("criteria is required")
	}

	dbVariant, err := s.repo.GetAwardTypeVariantByID(ctx, variantID.Bytes)
	if err != nil {
		return 0, fmt.Errorf("failed to get award variant: %w", err)
	}

	if !containsAwardUUID(dbVariant.Criteria, criteriaID.Bytes) {
		return 0, fmt.Errorf("selected criteria does not belong to award variant")
	}

	dbCriteria, err := s.repo.GetAwardTypeCriteriaByID(ctx, criteriaID.Bytes)
	if err != nil {
		return 0, fmt.Errorf("failed to get award criteria: %w", err)
	}

	totalPoints, err := resolveCriteriaPoints(dbCriteria, requestedPoints)
	if err != nil {
		return 0, err
	}

	if !bonusCriteriaID.Valid {
		return totalPoints, nil
	}

	if !containsAwardUUID(dbVariant.BonusCriteria, bonusCriteriaID.Bytes) {
		return 0, fmt.Errorf("selected bonus criteria does not belong to award variant")
	}

	dbBonusCriteria, err := s.repo.GetAwardTypeCriteriaByID(ctx, bonusCriteriaID.Bytes)
	if err != nil {
		return 0, fmt.Errorf("failed to get award bonus criteria: %w", err)
	}

	bonusPoints, err := resolveBonusCriteriaPoints(dbBonusCriteria)
	if err != nil {
		return 0, err
	}

	return totalPoints + bonusPoints, nil
}

func (s *AwardService) DeleteAward(ctx context.Context, id uuid.UUID) error {
	award, err := s.repo.GetAwardByID(ctx, id)
	if err != nil {
		return err
	}

	if award.Status != storage.AwardsStatusDRAFT && award.Status != storage.AwardsStatusREJECTED {
		return &HTTPStatusError{
			StatusCode: 400,
			Message:    "award can only be deleted from draft or rejected status",
		}
	}

	return s.repo.DeleteAward(ctx, id)
}

func awardCategoryKey(award storage.Award) (string, error) {
	if !award.CategoryID.Valid {
		return "", fmt.Errorf("approved award must have category id")
	}

	return uuid.UUID(award.CategoryID.Bytes).String(), nil
}

func (s *AwardService) syncApprovedAwardPoints(ctx context.Context, before storage.Award, after storage.Award) error {
	beforeApproved := before.Status == storage.AwardsStatusAPPROVED
	afterApproved := after.Status == storage.AwardsStatusAPPROVED

	switch {
	case !beforeApproved && !afterApproved:
		return nil
	case !beforeApproved && afterApproved:
		categoryKey, err := awardCategoryKey(after)
		if err != nil {
			return err
		}
		return s.userRepo.AdjustUserCategoryPoints(ctx, after.Teacher.Bytes, categoryKey, after.TotalPoints)
	case beforeApproved && !afterApproved:
		categoryKey, err := awardCategoryKey(before)
		if err != nil {
			return err
		}
		return s.userRepo.AdjustUserCategoryPoints(ctx, before.Teacher.Bytes, categoryKey, -before.TotalPoints)
	default:
		beforeCategoryKey, err := awardCategoryKey(before)
		if err != nil {
			return err
		}
		afterCategoryKey, err := awardCategoryKey(after)
		if err != nil {
			return err
		}

		if before.Teacher.Bytes != after.Teacher.Bytes || beforeCategoryKey != afterCategoryKey {
			if err = s.userRepo.AdjustUserCategoryPoints(ctx, before.Teacher.Bytes, beforeCategoryKey, -before.TotalPoints); err != nil {
				return err
			}
			if err = s.userRepo.AdjustUserCategoryPoints(ctx, after.Teacher.Bytes, afterCategoryKey, after.TotalPoints); err != nil {
				return err
			}
			return nil
		}

		delta := after.TotalPoints - before.TotalPoints
		if delta == 0 {
			return nil
		}

		return s.userRepo.AdjustUserCategoryPoints(ctx, after.Teacher.Bytes, afterCategoryKey, delta)
	}
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
		Reason:        award.Reason.String,
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
	search string,
	sort string,
	statusOrder string,
	teacher pgtype.UUID,
	methodist pgtype.UUID,
	categoryIDs []uuid.UUID,
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
	if len(categoryIDs) == 0 {
		categoryIDs = nil
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountAwardsFiltered(
		ctx,
		search,
		teacher,
		methodist,
		categoryIDs,
		status,
	)
	if err != nil {
		return nil, err
	}

	dbAwards, err := s.repo.GetAwardsPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		search,
		sort,
		statusOrder,
		teacher,
		methodist,
		categoryIDs,
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

func (s *AwardService) GetUserAwardsSummary(ctx context.Context, userID uuid.UUID) (AwardUserAwardsSummaryResponse, error) {
	awardsPage, err := s.GetAwardPaginated(
		ctx,
		1,
		math.MaxInt32,
		"",
		"desc",
		"manage",
		pgtype.UUID{Bytes: userID, Valid: true},
		pgtype.UUID{},
		nil,
		[]string{
			string(storage.AwardsStatusAPPROVED),
			string(storage.AwardsStatusINREVIEW),
		},
	)
	if err != nil {
		return AwardUserAwardsSummaryResponse{}, err
	}

	byCategory := make(map[string]*AwardUserAwardsSummaryCategoryResponse)
	categoryOrder := make([]string, 0)
	currentPoints := int32(0)

	for _, award := range awardsPage.Data {
		categoryKey := awardCategorySummaryKey(award)
		group, exists := byCategory[categoryKey]
		if !exists {
			categoryID := awardCategorySummaryKey(award)
			if award.CategoryID != nil {
				categoryID = award.CategoryID.String()
			} else if award.Category != nil {
				categoryID = award.Category.ID.String()
			}

			var category *AwardCategoryResponse
			if award.Category != nil {
				categoryCopy := *award.Category
				category = &categoryCopy
			}

			group = &AwardUserAwardsSummaryCategoryResponse{
				CategoryID: categoryID,
				Category:   category,
				Awards:     make([]AwardResponse, 0),
			}
			byCategory[categoryKey] = group
			categoryOrder = append(categoryOrder, categoryKey)
		}

		group.Awards = append(group.Awards, award)

		switch award.Status {
		case storage.AwardsStatusAPPROVED:
			currentPoints += award.TotalPoints
			group.CurrentPoints += award.TotalPoints
		case storage.AwardsStatusINREVIEW:
			group.PendingPoints += awardSummaryPoints(award)
		}
	}

	categories := make([]AwardUserAwardsSummaryCategoryResponse, 0, len(byCategory))
	for _, key := range categoryOrder {
		group := byCategory[key]
		sortAwardsForUserSummary(group.Awards)
		categories = append(categories, *group)
	}

	sort.SliceStable(categories, func(i, j int) bool {
		if categories[i].CurrentPoints != categories[j].CurrentPoints {
			return categories[i].CurrentPoints > categories[j].CurrentPoints
		}
		if categories[i].PendingPoints != categories[j].PendingPoints {
			return categories[i].PendingPoints > categories[j].PendingPoints
		}

		left := awardCategorySummaryLabel(categories[i].Category)
		right := awardCategorySummaryLabel(categories[j].Category)
		if left != right {
			return left < right
		}

		return categories[i].CategoryID < categories[j].CategoryID
	})

	return AwardUserAwardsSummaryResponse{
		CurrentPoints: currentPoints,
		Categories:    categories,
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

func (s *AwardService) GetReviewTeachers(ctx context.Context) ([]AwardReviewTeacherResponse, error) {
	rows, err := s.repo.GetAwardReviewTeachersStats(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]AwardReviewTeacherResponse, 0, len(rows))
	for _, row := range rows {
		result = append(result, AwardReviewTeacherResponse{
			KeycloakID:        row.KeycloakID,
			FirstName:         row.FirstName,
			LastName:          row.LastName,
			Username:          row.Username,
			TotalPoints:       row.TotalPoints,
			ReviewAwardsCount: row.ReviewAwardsCount,
		})
	}

	return result, nil
}

func sortAwardsForUserSummary(awards []AwardResponse) {
	sort.SliceStable(awards, func(i, j int) bool {
		leftRank := awardStatusPriority(awards[i].Status)
		rightRank := awardStatusPriority(awards[j].Status)
		if leftRank != rightRank {
			return leftRank < rightRank
		}

		if !awards[i].CreatedAt.Equal(awards[j].CreatedAt) {
			return awards[i].CreatedAt.After(awards[j].CreatedAt)
		}

		return awards[i].ID.String() < awards[j].ID.String()
	})
}

func awardStatusPriority(status storage.AwardsStatus) int {
	switch status {
	case storage.AwardsStatusINREVIEW:
		return 1
	case storage.AwardsStatusREJECTED:
		return 2
	case storage.AwardsStatusAPPROVED:
		return 3
	default:
		return 4
	}
}

func awardSummaryPoints(award AwardResponse) int32 {
	if award.Status == storage.AwardsStatusINREVIEW {
		if points := award.Criteria.Points; len(points) > 0 {
			return points[0]
		}
	}

	return award.TotalPoints
}

func awardCategorySummaryKey(award AwardResponse) string {
	if award.CategoryID != nil {
		return award.CategoryID.String()
	}
	if award.Category != nil {
		return award.Category.ID.String()
	}
	return award.ID.String()
}

func awardCategorySummaryLabel(category *AwardCategoryResponse) string {
	if category == nil {
		return ""
	}

	left := strings.TrimSpace(category.Name.Ru)
	if left != "" {
		return left
	}

	return strings.TrimSpace(category.Name.Kz)
}
