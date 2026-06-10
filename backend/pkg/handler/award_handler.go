package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type AwardHandler struct {
	// Renamed to 'srv' or 'service' to match your initialization in main.go
	service service.AwardServiceInterface
}

// NewAwardHandler creates a new instance of AwardHandler
// This is the function you need to call in main.go
func NewAwardHandler(service service.AwardServiceInterface) *AwardHandler {
	return &AwardHandler{
		service: service,
	}
}

func (h *AwardHandler) resolveAwardFieldValues(ctx context.Context, award service.AwardResponse) service.AwardResponse {
	resolvedValues, err := h.service.ResolveFieldValueFileURLs(ctx, award.CategoryID, award.FieldValues)
	if err == nil {
		award.FieldValues = resolvedValues
	}
	return award
}

func buildAwardFieldsPayload(award service.AwardResponse) []service.AwardFieldValueResponse {
	if award.Category == nil || len(award.Category.FieldsExpanded) == 0 {
		return nil
	}

	fields := make([]service.AwardFieldValueResponse, 0, len(award.Category.FieldsExpanded))
	for _, field := range award.Category.FieldsExpanded {
		fields = append(fields, service.AwardFieldValueResponse{
			Field: field,
			Data:  award.FieldValues[field.Key],
		})
	}

	return fields
}

// parseUUIDPgtype is a helper to convert form strings to pgtype.UUID
func parseUUIDPgtype(s string) pgtype.UUID {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{Valid: false}
	}
	return pgtype.UUID{
		Bytes: parsed,
		Valid: true,
	}
}

// parseUUID is a helper to convert form strings to pgtype.UUID
func parseUUID(s string) uuid.UUID {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return uuid.Nil
	}
	return parsed
}

func (h *AwardHandler) GetAllAwards(c *gin.Context) {
	awards, err := h.service.GetAllAwards(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	for i := range awards {
		awards[i] = h.resolveAwardFieldValues(c.Request.Context(), awards[i])
	}

	c.JSON(http.StatusOK, awards)
}

func (h *AwardHandler) GetAwardDepartments(c *gin.Context) {
	departments, err := h.service.GetAwardDepartmentsStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, departments)
}

func (h *AwardHandler) GetAwardByID(c *gin.Context) {
	idParam := c.Param("id")

	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid award ID")})
		return
	}

	award, err := h.service.GetAwardByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	award = h.resolveAwardFieldValues(c.Request.Context(), award)
	award.Fields = buildAwardFieldsPayload(award)

	c.JSON(http.StatusOK, award)
}

func (h *AwardHandler) UpdateAwardStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid award ID")})
		return
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	var req struct {
		Status        storage.AwardsStatus `json:"status"`
		Reason        pgtype.Text          `json:"reason"`
		Variant       pgtype.UUID          `json:"variant"`
		Criteria      pgtype.UUID          `json:"criteria"`
		BonusCriteria *string              `json:"bonusCriteria"`
		TotalPoints   int32                `json:"totalPoints"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
		return
	}

	// Только чистый KPI-view может отправить награду на проверку.
	// KPI-manage и KPI-full могут менять статус без этих ограничений.
	if service.HasPermissionExact(currentUser.Permissions, service.PermKPIView) &&
		!service.HasPermissionLevel(currentUser.Permissions, service.PermKPIManage) {
		if req.Status != storage.AwardsStatusINREVIEW {
			c.JSON(http.StatusForbidden, gin.H{"error": service.TranslateAPIErrorMessage("teachers can only submit awards for review")})
			return
		}
		existing, err := h.service.GetAwardByID(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
			return
		}
		if existing.Status != storage.AwardsStatusDRAFT && existing.Status != storage.AwardsStatusREJECTED {
			c.JSON(http.StatusForbidden, gin.H{"error": service.TranslateAPIErrorMessage("award can only be submitted for review from draft or rejected status")})
			return
		}
	}

	methodist := pgtype.UUID{Valid: false}
	if req.Status != storage.AwardsStatusINREVIEW {
		methodist = parseUUIDPgtype(currentUser.KeycloakID.String())
	}

	bonusCriteria := pgtype.UUID{Valid: false}
	bonusCriteriaTouched := false
	if req.BonusCriteria != nil {
		bonusCriteriaTouched = true
		if *req.BonusCriteria != "" {
			bonusCriteria = parseUUIDPgtype(*req.BonusCriteria)
			if !bonusCriteria.Valid {
				c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid BonusCriteriaID UUID format")})
				return
			}
		}
	}

	params := service.UpdateAwardStatusRequest{
		Status:               req.Status,
		Reason:               req.Reason,
		Methodist:            methodist,
		Variant:              req.Variant,
		Criteria:             req.Criteria,
		BonusCriteria:        bonusCriteria,
		BonusCriteriaTouched: bonusCriteriaTouched,
		TotalPoints:          req.TotalPoints,
	}

	award, err := h.service.UpdateAwardStatus(c.Request.Context(), id, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}
	c.JSON(http.StatusOK, award)
}

func (h *AwardHandler) DeleteAward(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid award ID")})
		return
	}

	err = h.service.DeleteAward(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *AwardHandler) CreateAward(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	// parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("failed to parse form")})
		return
	}

	// parse json data from form field
	jsonData := c.PostForm("data")
	if jsonData == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("data field is required")})
		return
	}

	// unmarshal json data to struct
	var params service.CreateAwardParams
	if err := json.Unmarshal([]byte(jsonData), &params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid JSON format inside data field"), "details": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	// type to uuid
	typeID, err := uuid.Parse(params.AwardType.String())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid TypeID UUID format")})
		return
	}

	variantID, err := uuid.Parse(params.AwardVariant.String())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid VariantID UUID format")})
		return
	}

	criteriaID, err := uuid.Parse(params.AwardCriteria.String())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid CriteriaID UUID format")})
		return
	}

	var bonusCriteriaPg pgtype.UUID
	if params.AwardBonusCriteria.Valid {
		parsed, err := uuid.Parse(params.AwardBonusCriteria.String())
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid BonusCriteriaID UUID format")})
			return
		}
		bonusCriteriaPg = pgtype.UUID{Bytes: parsed, Valid: true}
	}

	awardID := uuid.New()

	mergedFieldValues, err := h.service.MergeUploadedFilesIntoFieldValues(
		c.Request.Context(),
		currentUser.KeycloakID,
		awardID,
		params.CategoryID,
		params.FieldValues,
		form.File,
	)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	award, err := h.service.CreateAward(c.Request.Context(), &storage.CreateAwardParams{
		ID:            awardID,
		Status:        storage.AwardsStatusDRAFT,
		Teacher:       parseUUIDPgtype(currentUser.KeycloakID.String()),
		Type:          parseUUIDPgtype(typeID.String()),
		Variant:       parseUUIDPgtype(variantID.String()),
		Criteria:      parseUUIDPgtype(criteriaID.String()),
		BonusCriteria: bonusCriteriaPg,
		CategoryID:    params.CategoryID,
		FieldValues:   mustMarshalFieldValues(mergedFieldValues),
		TotalPoints:   0,
	})
	if err != nil {
		var httpErr *service.HTTPStatusError
		if errors.As(err, &httpErr) {
			c.JSON(httpErr.StatusCode, gin.H{"error": service.TranslateAPIErrorMessage("failed to create award"), "details": service.TranslateAPIErrorMessage(httpErr.Message)})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("failed to create award"), "details": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	award = h.resolveAwardFieldValues(c.Request.Context(), award)

	c.JSON(http.StatusOK, award)
}

// UpdateAward обновляет данные Award
func (h *AwardHandler) UpdateAward(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid award ID")})
		return
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	var req service.UpdateAwardRequest
	contentType := strings.ToLower(c.GetHeader("Content-Type"))
	if strings.HasPrefix(contentType, "application/json") {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   service.TranslateAPIErrorMessage("invalid JSON format"),
				"details": service.TranslateAPIErrorMessage(err.Error()),
			})
			return
		}
	} else {
		// parse multipart form
		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("failed to parse form")})
			return
		}

		// parse json data from form field
		jsonData := c.PostForm("data")
		if jsonData == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("data field is required")})
			return
		}

		if err := json.Unmarshal([]byte(jsonData), &req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   service.TranslateAPIErrorMessage("invalid JSON format inside data field"),
				"details": service.TranslateAPIErrorMessage(err.Error()),
			})
			return
		}

		existingAward, getErr := h.service.GetAwardByID(c.Request.Context(), id)
		if getErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("failed to resolve current award"), "details": getErr.Error()})
			return
		}

		fieldValuesForMerge, mergeValuesErr := mergeFieldValuesPayload(existingAward.FieldValues, req.FieldValues)
		if mergeValuesErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   service.TranslateAPIErrorMessage("invalid fieldValues payload"),
				"details": mergeValuesErr.Error(),
			})
			return
		}

		uploadCategoryID := req.CategoryID
		if !uploadCategoryID.Valid {
			if existingAward.CategoryID != nil {
				uploadCategoryID = parseUUIDPgtype(existingAward.CategoryID.String())
			}
		}

		mergedFieldValues, mergeErr := h.service.MergeUploadedFilesIntoFieldValues(
			c.Request.Context(),
			currentUser.KeycloakID,
			id,
			uploadCategoryID,
			fieldValuesForMerge,
			form.File,
		)
		if mergeErr != nil {
			writeServiceError(c, mergeErr)
			return
		}
		req.FieldValues = mergedFieldValues
	}

	award, err := h.service.UpdateAward(c.Request.Context(), id, req)
	if err != nil {
		var httpErr *service.HTTPStatusError
		if errors.As(err, &httpErr) {
			c.JSON(httpErr.StatusCode, gin.H{
				"error":   service.TranslateAPIErrorMessage("failed to update award"),
				"details": service.TranslateAPIErrorMessage(httpErr.Message),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to update award"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	award = h.resolveAwardFieldValues(c.Request.Context(), award)

	c.JSON(http.StatusOK, award)
}

func mustMarshalFieldValues(v any) []byte {
	if v == nil {
		return []byte("{}")
	}
	b, err := json.Marshal(v)
	if err != nil {
		return []byte("{}")
	}
	if len(b) == 0 || string(b) == "null" {
		return []byte("{}")
	}
	return b
}

func mergeFieldValuesPayload(existing map[string]any, incoming any) (map[string]any, error) {
	base, err := normalizeFieldValuesPayload(existing)
	if err != nil {
		return nil, err
	}

	next, err := normalizeFieldValuesPayload(incoming)
	if err != nil {
		return nil, err
	}

	for key, value := range next {
		base[key] = value
	}

	return base, nil
}

func normalizeFieldValuesPayload(input any) (map[string]any, error) {
	switch v := input.(type) {
	case nil:
		return map[string]any{}, nil
	case map[string]any:
		out := make(map[string]any, len(v))
		for key, value := range v {
			out[key] = value
		}
		return out, nil
	case []byte:
		if len(v) == 0 {
			return map[string]any{}, nil
		}
		var out map[string]any
		if err := json.Unmarshal(v, &out); err != nil {
			return nil, err
		}
		if out == nil {
			out = map[string]any{}
		}
		return out, nil
	default:
		b, err := json.Marshal(v)
		if err != nil {
			return nil, err
		}

		var out map[string]any
		if err = json.Unmarshal(b, &out); err != nil {
			return nil, err
		}
		if out == nil {
			out = map[string]any{}
		}
		return out, nil
	}
}

// --- award type
func (h *AwardHandler) CreateAwardType(c *gin.Context) {
	var req service.CreateTypeParams
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body: ") + err.Error()})
		return
	}

	awardType, err := h.service.CreateType(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusCreated, awardType)
}

func (h *AwardHandler) GetAllAwardTypes(c *gin.Context) {
	awardTypes, err := h.service.GetAllFullTypes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}
	c.JSON(http.StatusOK, awardTypes)
}

func (h *AwardHandler) GetAwardTypeByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid award type ID")})
		return
	}
	awardType, err := h.service.GetTypeByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}
	c.JSON(http.StatusOK, awardType)
}

func (h *AwardHandler) UpdateAwardType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid AwardType ID")})
		return
	}

	var req service.CreateAwardTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   service.TranslateAPIErrorMessage("invalid JSON format"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	awardType, err := h.service.UpdateType(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to update AwardType"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}
	c.JSON(http.StatusOK, awardType)
}

func (h *AwardHandler) DeleteType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid AwardType ID")})
		return
	}

	err = h.service.DeleteType(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "AwardType deleted successfully"})
}

func (h *AwardHandler) GetAwardsPaginated(c *gin.Context) {
	currentPage := 1
	pageSize := 10

	var status []string
	if raw := strings.TrimSpace(c.Query("status")); raw != "" {
		status = strings.Split(raw, ",")
	}

	if v := c.Query("currentPage"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			currentPage = p
		}
	}

	if v := c.Query("pageSize"); v != "" {
		if ps, err := strconv.Atoi(v); err == nil && ps <= 100 {
			pageSize = ps
		}
	}
	search := strings.TrimSpace(c.Query("search"))
	sort, err := parseSortQuery(c, "sort", "desc")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("sort must be 'asc' or 'desc'")})
		return
	}

	var teacherID pgtype.UUID
	if v := c.Query("teacher"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			c.JSON(400, gin.H{"error": service.TranslateAPIErrorMessage("invalid teacher id")})
			return
		}
		teacherID = pgtype.UUID{Bytes: id, Valid: true}
	}

	var methodistID pgtype.UUID
	if v := c.Query("methodist"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			c.JSON(400, gin.H{"error": service.TranslateAPIErrorMessage("invalid methodist id")})
			return
		}
		methodistID = pgtype.UUID{Bytes: id, Valid: true}
	}

	var categoryIDs []uuid.UUID
	if raw := strings.TrimSpace(c.Query("categoryId")); raw != "" {
		parts := strings.Split(raw, ",")
		categoryIDs = make([]uuid.UUID, 0, len(parts))
		for _, part := range parts {
			idStr := strings.TrimSpace(part)
			if idStr == "" {
				continue
			}

			id, err := uuid.Parse(idStr)
			if err != nil {
				c.JSON(400, gin.H{"error": service.TranslateAPIErrorMessage("invalid category id")})
				return
			}
			categoryIDs = append(categoryIDs, id)
		}
	}

	result, err := h.service.GetAwardPaginated(
		c.Request.Context(),
		currentPage,
		pageSize,
		search,
		sort,
		teacherID,
		methodistID,
		categoryIDs,
		status,
	)
	if err != nil {
		c.JSON(400, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	for i := range result.Data {
		result.Data[i] = h.resolveAwardFieldValues(c.Request.Context(), result.Data[i])
	}

	c.JSON(200, result)
}
