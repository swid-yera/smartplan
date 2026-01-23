package handler

import (
	"context"
	"encoding/json"
	"fmt"
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

// resolveFileURLs generates presigned URLs for files stored in MinIO
func (h *AwardHandler) resolveFileURLs(ctx context.Context, fileKeys []string) []string {
	fileURLs := make([]string, 0, len(fileKeys))
	for _, key := range fileKeys {
		url, err := h.service.GetFileDownloadURL(ctx, key)
		if err == nil {
			fileURLs = append(fileURLs, url)
		}
	}
	return fileURLs
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

	// Convert file keys to URLs for each award
	for i := range awards {
		awards[i].Files = h.resolveFileURLs(c.Request.Context(), awards[i].Files)
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

	// Convert file keys to URLs
	award.Files = h.resolveFileURLs(c.Request.Context(), award.Files)

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
		TotalPoints int                  `json:"total_points"`
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
		TotalPoints: int32(req.TotalPoints),
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

func (h *AwardHandler) GetAwardsByMethodist(c *gin.Context) {
	idParam := c.Param("id")
	methodistUUID := parseUUIDPgtype(idParam)

	awards, err := h.service.GetAwardsByMethodist(c.Request.Context(), methodistUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert file keys to URLs for each award
	for i := range awards {
		awards[i].Files = h.resolveFileURLs(c.Request.Context(), awards[i].Files)
	}

	c.JSON(http.StatusOK, awards)
}

func (h *AwardHandler) GetAwardsByTeacher(c *gin.Context) {
	idParam := c.Param("id")
	teacherUUID := parseUUIDPgtype(idParam)

	awards, err := h.service.GetAwardsByTeacher(c.Request.Context(), teacherUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert file keys to URLs for each award
	for i := range awards {
		awards[i].Files = h.resolveFileURLs(c.Request.Context(), awards[i].Files)
	}

	c.JSON(http.StatusOK, awards)
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

	// files
	var fileKeys []string

	// parse files from multipart form
	files := form.File["files"]
	if len(files) > 0 {
		for _, fileHeader := range files {
			f, err := fileHeader.Open()
			if err != nil {
				continue // TODO: handle error properly
			}
			f.Close()

			// Generate object key with awards/ prefix and UUID
			objectName := fmt.Sprintf("awards/%s/%s", currentUser.KeycloakID, fileHeader.Filename)

			// saving
			fileKey, err := h.service.UploadFile(c.Request.Context(), objectName, f, fileHeader.Size)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				continue // TODO: handle error properly
			}

			fileKeys = append(fileKeys, fileKey)
		}
	}

	// Check if at least one of files or links is provided
	if len(files) == 0 && len(params.Links) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "either files or links must be provided"})
		return
	}

	award, err := h.service.CreateAward(c.Request.Context(), &storage.CreateAwardParams{
		Status:        storage.AwardsStatusDRAFT,
		Teacher:       parseUUIDPgtype(currentUser.KeycloakID.String()),
		Type:          parseUUIDPgtype(typeID.String()),
		Variant:       parseUUIDPgtype(variantID.String()),
		Criteria:      parseUUIDPgtype(criteriaID.String()),
		BonusCriteria: bonusCriteriaPg,
		Text:          params.Text,
		Files:         fileKeys,
		Links:         params.Links,
		TotalPoints:   0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create award", "details": err.Error()})
		return
	}

	// Convert file keys to URLs
	award.Files = h.resolveFileURLs(c.Request.Context(), award.Files)

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

	var req service.UpdateAwardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid JSON format",
			"details": err.Error(),
		})
		return
	}

	award, err := h.service.UpdateAward(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to update award",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, award)
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

	// status=APPROVED,REJECTED
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
		status, // 👈 ВСЕГДА []string
	)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, result)
}
