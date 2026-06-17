package handler

import (
	"net/http"

	"eduplan/backend/pkg/middleware"
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
	currentUser, err := getCurrentUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	result, err := h.service.GetKpiUploadSettings(c.Request.Context(), currentUser)
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

	currentUser, err := getCurrentUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	result, err := h.service.SetKpiUploadSettings(c.Request.Context(), currentUser, req)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func getCurrentUserFromContext(c *gin.Context) (*service.User, error) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		return nil, &service.HTTPStatusError{StatusCode: http.StatusUnauthorized, Message: "User not authenticated"}
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		return nil, &service.HTTPStatusError{StatusCode: http.StatusInternalServerError, Message: "Invalid user context"}
	}

	return currentUser, nil
}
