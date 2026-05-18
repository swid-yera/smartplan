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
	service *service.AwardService
}

// NewAwardHandler creates a new instance of AwardHandler
// This is the function you need to call in main.go
func NewAwardHandler(service *service.AwardService) *AwardHandler {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for i := range awards {
		awards[i] = h.resolveAwardFieldValues(c.Request.Context(), awards[i])
	}

	c.JSON(http.StatusOK, awards)
}

func (h *AwardHandler) GetAwardByID(c *gin.Context) {
	idParam := c.Param("id")

	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid award ID"})
		return
	}

	award, err := h.service.GetAwardByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	award = h.resolveAwardFieldValues(c.Request.Context(), award)

	c.JSON(http.StatusOK, award)
}

func (h *AwardHandler) UpdateAwardStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid award ID"})
		return
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	var req struct {
		Status      storage.AwardsStatus `json:"status"`
		Reason      pgtype.Text          `json:"reason"`
		TotalPoints int32                `json:"totalPoints"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	params := storage.UpdateAwardStatusParams{
		ID:          id,
		Status:      req.Status,
		Reason:      req.Reason,
		Methodist:   parseUUIDPgtype(currentUser.KeycloakID.String()),
		TotalPoints: req.TotalPoints,
	}

	award, err := h.service.UpdateAwardStatus(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, award)
}

func (h *AwardHandler) DeleteAward(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid award ID"})
		return
	}

	err = h.service.DeleteAward(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *AwardHandler) CreateAward(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	// parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse form"})
		return
	}

	// parse json data from form field
	jsonData := c.PostForm("data")
	if jsonData == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "data field is required"})
		return
	}

	// unmarshal json data to struct
	var params service.CreateAwardParams
	if err := json.Unmarshal([]byte(jsonData), &params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON format inside data field", "details": err.Error()})
		return
	}

	// type to uuid
	typeID, err := uuid.Parse(params.AwardType.String())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid TypeID UUID format"})
		return
	}

	variantID, err := uuid.Parse(params.AwardVariant.String())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid VariantID UUID format"})
		return
	}

	criteriaID, err := uuid.Parse(params.AwardCriteria.String())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid CriteriaID UUID format"})
		return
	}

	var bonusCriteriaPg pgtype.UUID
	if params.AwardBonusCriteria.Valid {
		parsed, err := uuid.Parse(params.AwardBonusCriteria.String())
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid BonusCriteriaID UUID format"})
			return
		}
		bonusCriteriaPg = pgtype.UUID{Bytes: parsed, Valid: true}
	}

	mergedFieldValues, err := h.service.MergeUploadedFilesIntoFieldValues(
		c.Request.Context(),
		currentUser.KeycloakID,
		params.CategoryID,
		params.FieldValues,
		form.File,
	)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	award, err := h.service.CreateAward(c.Request.Context(), &storage.CreateAwardParams{
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
			c.JSON(httpErr.StatusCode, gin.H{"error": "failed to create award", "details": httpErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create award", "details": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid award ID"})
		return
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	var req service.UpdateAwardRequest
	contentType := strings.ToLower(c.GetHeader("Content-Type"))
	if strings.HasPrefix(contentType, "application/json") {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid JSON format",
				"details": err.Error(),
			})
			return
		}
	} else {
		// parse multipart form
		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse form"})
			return
		}

		// parse json data from form field
		jsonData := c.PostForm("data")
		if jsonData == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "data field is required"})
			return
		}

		if err := json.Unmarshal([]byte(jsonData), &req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid JSON format inside data field",
				"details": err.Error(),
			})
			return
		}

		uploadCategoryID := req.CategoryID
		if !uploadCategoryID.Valid {
			existingAward, getErr := h.service.GetAwardByID(c.Request.Context(), id)
			if getErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve current award category", "details": getErr.Error()})
				return
			}
			if existingAward.CategoryID != nil {
				uploadCategoryID = parseUUIDPgtype(existingAward.CategoryID.String())
			}
		}

		mergedFieldValues, mergeErr := h.service.MergeUploadedFilesIntoFieldValues(
			c.Request.Context(),
			currentUser.KeycloakID,
			uploadCategoryID,
			req.FieldValues,
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
				"error":   "failed to update award",
				"details": httpErr.Message,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to update award",
			"details": err.Error(),
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

// --- award type
func (h *AwardHandler) CreateAwardType(c *gin.Context) {
	var req service.CreateTypeParams
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	awardType, err := h.service.CreateType(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, awardType)
}

func (h *AwardHandler) GetAllAwardTypes(c *gin.Context) {
	awardTypes, err := h.service.GetAllFullTypes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, awardTypes)
}

func (h *AwardHandler) GetAwardTypeByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid award type ID"})
		return
	}
	awardType, err := h.service.GetTypeByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, awardType)
}

func (h *AwardHandler) UpdateAwardType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid AwardType ID"})
		return
	}

	var req service.CreateAwardTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid JSON format",
			"details": err.Error(),
		})
		return
	}

	awardType, err := h.service.UpdateType(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to update AwardType",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, awardType)
}

func (h *AwardHandler) DeleteType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid AwardType ID"})
		return
	}

	err = h.service.DeleteType(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

	var teacherID pgtype.UUID
	if v := c.Query("teacher"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			c.JSON(400, gin.H{"error": "invalid teacher id"})
			return
		}
		teacherID = pgtype.UUID{Bytes: id, Valid: true}
	}

	var methodistID pgtype.UUID
	if v := c.Query("methodist"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			c.JSON(400, gin.H{"error": "invalid methodist id"})
			return
		}
		methodistID = pgtype.UUID{Bytes: id, Valid: true}
	}

	result, err := h.service.GetAwardPaginated(
		c.Request.Context(),
		currentPage,
		pageSize,
		teacherID,
		methodistID,
		status,
	)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	for i := range result.Data {
		result.Data[i] = h.resolveAwardFieldValues(c.Request.Context(), result.Data[i])
	}

	c.JSON(200, result)
}
