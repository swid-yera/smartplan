package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
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

// generateFileURL generates a public URL for a file stored in MinIO
func (h *AwardHandler) generateFileURL(objectKey string) string {
	// Extract only the unique identifier from objectKey
	// For example, if objectKey is "aa1a8f6f-1a6c-4008-9b0d-985b35e76332_Без названия — копия (2).jpg",
	// we can split it to get only the UUID part
	parts := strings.Split(objectKey, "_")
	if len(parts) > 0 {
		return fmt.Sprintf("https://s3.aspc.kz/eduplan/awards/%s", parts[0])
	}
	return fmt.Sprintf("https://s3.aspc.kz/eduplan/awards/%s", objectKey)
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
		var fileURLs []string
		for _, fileKey := range awards[i].Files {
			fileURLs = append(fileURLs, h.generateFileURL(fileKey))
		}
		awards[i].Files = fileURLs
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
	var fileURLs []string
	for _, fileKey := range award.Files {
		fileURLs = append(fileURLs, h.generateFileURL(fileKey))
	}
	award.Files = fileURLs

	c.JSON(http.StatusOK, award)
}

func (h *AwardHandler) UpdateAwardStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid award ID"})
		return
	}

	var req struct {
		Status    storage.AwardsStatus `json:"status"`
		Reason    pgtype.Text          `json:"reason"`
		Methodist pgtype.UUID          `json:"methodist"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	params := storage.UpdateAwardStatusParams{
		ID:        id,
		Status:    req.Status,
		Reason:    req.Reason,
		Methodist: req.Methodist,
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
		var fileURLs []string
		for _, fileKey := range awards[i].Files {
			fileURLs = append(fileURLs, h.generateFileURL(fileKey))
		}
		awards[i].Files = fileURLs
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

	// type check db exist
	_, err = h.service.GetAwardTypeByID(c.Request.Context(), typeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check AwardType existence", "details": err.Error()})
		return
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

			// saving
			objectKey, err := h.service.UploadFile(c.Request.Context(), fileHeader.Filename, f, fileHeader.Size)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				continue // TODO: handle error properly
			}

			// Convert file key to URL
			fileURL := h.generateFileURL(objectKey)
			fileKeys = append(fileKeys, fileURL)
		}
	}

	// Check if at least one of files or links is provided
	if len(files) == 0 && len(params.Links) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "either files or links must be provided"})
		return
	}

	award, err := h.service.CreateAward(c.Request.Context(), &storage.CreateAwardParams{
		Status:      storage.AwardsStatusDRAFT,
		Teacher:     parseUUIDPgtype(currentUser.KeycloakID.String()),
		Type:        parseUUIDPgtype(typeID.String()),
		Text:        params.Text,
		Files:       fileKeys,
		Links:       params.Links,
		TotalPoints: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create award", "details": err.Error()})
		return
	}

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
	awardTypes, err := h.service.GetAllFullAwardTypes(c.Request.Context())
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
	awardType, err := h.service.GetFullAwardTypeByID(c.Request.Context(), id)
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

	awardType, err := h.service.UpdateAwardType(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to update AwardType",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, awardType)
}

func (h *AwardHandler) DeleteAwardType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid AwardType ID"})
		return
	}

	err = h.service.DeleteAward(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "AwardType deleted successfully"})
}
