package handler

import (
	"net/http"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
)

type KpiUploadSettingsHandler struct {
	service service.KpiUploadSettingsService
}

func NewKpiUploadSettingsHandler(service service.KpiUploadSettingsService) *KpiUploadSettingsHandler {
	return &KpiUploadSettingsHandler{service: service}
}

func (h *KpiUploadSettingsHandler) GetKpiUploadBlockDate(c *gin.Context) {
	result, err := h.service.GetKpiUploadBlockDate(c.Request.Context())
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *KpiUploadSettingsHandler) SetKpiUploadBlockDate(c *gin.Context) {
	var req service.KpiUploadSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
		return
	}

	result, err := h.service.SetKpiUploadBlockDate(c.Request.Context(), req.BlockedAfterDate)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}
