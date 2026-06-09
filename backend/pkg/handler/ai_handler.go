package handler

import (
	"context"
	"net/http"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type AIHandler struct {
	aiService service.AIService
	log       *logrus.Logger
}

func NewAIHandler(aiService service.AIService, log *logrus.Logger) *AIHandler {
	return &AIHandler{
		aiService: aiService,
		log:       log,
	}
}

func (h *AIHandler) GenerateRupMeta(c *gin.Context) {
	var req service.GenerateRupMetaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": service.TranslateAPIErrorMessage("invalid JSON format"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	result, err := h.aiService.GenerateRupMeta(context.WithoutCancel(c.Request.Context()), req)
	if err != nil {
		h.log.WithError(err).Error("failed to generate rup meta")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": service.TranslateAPIErrorMessage("failed to generate rup meta"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *AIHandler) GenerateResources(c *gin.Context) {
	var req service.GenerateResourcesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": service.TranslateAPIErrorMessage("invalid JSON format"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	result, err := h.aiService.GenerateResources(context.WithoutCancel(c.Request.Context()), req)
	if err != nil {
		h.log.WithError(err).Error("failed to generate resources")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": service.TranslateAPIErrorMessage("failed to generate resources"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *AIHandler) GenerateDisciplines(c *gin.Context) {
	var req service.GenerateDisciplinesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": service.TranslateAPIErrorMessage("invalid JSON format"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	result, err := h.aiService.GenerateDisciplines(context.WithoutCancel(c.Request.Context()), req)
	if err != nil {
		h.log.WithError(err).Error("failed to generate disciplines")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": service.TranslateAPIErrorMessage("failed to generate disciplines"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *AIHandler) GenerateTopicsForDiscipline(c *gin.Context) {
	var req service.GenerateTopicsForDisciplineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": service.TranslateAPIErrorMessage("invalid JSON format"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	result, err := h.aiService.GenerateTopicsForDiscipline(context.WithoutCancel(c.Request.Context()), req)
	if err != nil {
		h.log.WithError(err).Error("failed to generate topics for discipline")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": service.TranslateAPIErrorMessage("failed to generate topics for discipline"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

