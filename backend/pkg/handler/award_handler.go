package handler

import (
	"net/http"

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

// // --- awards
// func (h *AwardHandler) CreateAward(c *gin.Context) {
// 	// Получаем пользователя из контекста, установленного middleware
// 	userInterface, exists := c.Get(middleware.ContextUserKey)
// 	if !exists {
// 		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
// 		return
// 	}

// 	// Преобразуем в *storage.User
// 	currentUser, ok := userInterface.(*storage.User)
// 	if !ok {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
// 		return
// 	}

// 	// 1. Parse File from multipart form
// 	file, header, err := c.Request.FormFile("file")
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
// 		return
// 	}
// 	defer file.Close()

// 	// 2. Parse Other Fields and map to SQLC params
// 	params := storage.CreateAwardParams{
// 		Status:  storage.AwardsStatus(c.PostForm("status")),
// 		Teacher: currentUser.KeycloakID, // Используем ID текущего пользователя (преподавателя)
// 		Type:    parseUUIDPgtype(c.PostForm("type")),
// 	}

// 	// 3. Call Service layer
// 	// It handles MinIO upload + DB record creation
// 	award, err := h.service.CreateAwardWithFile(c.Request.Context(), &params, file, header.Size, header.Filename)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	c.JSON(http.StatusCreated, award)
// }

func (h *AwardHandler) GetAllAwards(c *gin.Context) {
	awards, err := h.service.GetAllAwards(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
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
	c.JSON(http.StatusOK, awards)
}

func (h *AwardHandler) UploadAwardFile(c *gin.Context) {
	// Parse file from multipart form
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	// Upload to MinIO
	objectKey, err := h.service.UploadFile(c.Request.Context(), header.Filename, file, header.Size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"fileKey": objectKey})
}

func (h *AwardHandler) CreateAwardWithTypes(c *gin.Context) {
	// Получаем пользователя из контекста, установленного middleware
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Преобразуем в *storage.User
	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	var params service.CreateAwardWithTypesParams
	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	award, err := h.service.CreateAwardWithTypes(c.Request.Context(), currentUser.KeycloakID, &params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, award)
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

// func (h *AwardHandler) CreateAwardWithFileAndData(c *gin.Context) {
// 	// Получаем пользователя из контекста, установленного middleware
// 	userInterface, exists := c.Get(middleware.ContextUserKey)
// 	if !exists {
// 		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
// 		return
// 	}

// 	// Преобразуем в *storage.User
// 	currentUser, ok := userInterface.(*storage.User)
// 	if !ok {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
// 		return
// 	}

// 	// Получаем файл из multipart-запроса
// 	file, header, err := c.Request.FormFile("file")
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
// 		return
// 	}
// 	defer file.Close()

// 	// Загружаем файл в MinIO
// 	objectKey, err := h.service.UploadFile(c.Request.Context(), header.Filename, file, header.Size)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	// Получаем JSON-данные из multipart-запроса
// 	dataStr := c.PostForm("data")
// 	if dataStr == "" {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "data field is required"})
// 		return
// 	}

// 	var params service.CreateAwardWithTypesParams
// 	if err := json.Unmarshal([]byte(dataStr), &params); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON in data field"})
// 		return
// 	}

// 	// Устанавливаем ссылку на файл в JSON-данные
// 	params.Document = pgtype.Text{String: objectKey, Valid: true}

// 	// Создаем награду с типами
// 	award, err := h.service.CreateAwardWithTypes(c.Request.Context(), currentUser.KeycloakID, &params)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	log.Printf("Received data: %s", dataStr)

// 	c.JSON(http.StatusCreated, award)
// }

// --- award type
func (h *AwardHandler) CreateAwardType(c *gin.Context) {
	var req service.CreateFullAwardTypeParams
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	awardType, err := h.service.CreateFullAwardType(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, awardType)
}

func (h *AwardHandler) GetAllAwardTypes(c *gin.Context) {
	awardTypes, err := h.service.GetAllAwardTypes(c.Request.Context())
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
	awardType, err := h.service.GetAwardTypeByID(c.Request.Context(), id)
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
