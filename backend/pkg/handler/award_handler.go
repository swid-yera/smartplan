package handler

import (
	"net/http"

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

// parseUUID is a helper to convert form strings to pgtype.UUID
func parseUUID(s string) pgtype.UUID {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{Valid: false}
	}
	return pgtype.UUID{
		Bytes: parsed,
		Valid: true,
	}
}

func (h *AwardHandler) CreateAward(c *gin.Context) {
	// 1. Parse File from multipart form
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	// 2. Parse Other Fields and map to SQLC params
	params := storage.CreateAwardParams{
		Status:    storage.AwardsStatus(c.PostForm("status")),
		Methodist: parseUUID(c.PostForm("methodist")),
		Violation: storage.ViolationEnum(c.PostForm("violation")),
		Type:      parseUUID(c.PostForm("type")),
	}

	// 3. Call Service layer
	// It handles MinIO upload + DB record creation
	award, err := h.service.CreateAwardWithFile(c.Request.Context(), &params, file, header.Size, header.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, award)
}
