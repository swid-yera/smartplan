package handler

import (
	"errors"
	"net/http"

	"eduplan/backend/pkg/service"
	"eduplan/backend/pkg/service/keycloak"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type WebhooksHandler struct {
	webhooksService service.WebhooksService
	logger          *zap.Logger
}

func NewWebhooksHandler(
	webhooksService service.WebhooksService,
	logger *zap.Logger,
) *WebhooksHandler {
	return &WebhooksHandler{
		webhooksService: webhooksService,
		logger:          logger,
	}
}

func (h *WebhooksHandler) KeycloakWebhook(c *gin.Context) {
	var event keycloak.KeycloakEvent

	if err := c.ShouldBindJSON(&event); err != nil {
		h.logger.Warn("invalid webhook payload", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid payload",
		})
		return
	}

	err := h.webhooksService.ProcessEvent(
		c.Request.Context(),
		&event,
	)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *WebhooksHandler) handleServiceError(
	c *gin.Context,
	err error,
) {
	switch {
	case errors.Is(err, service.ErrInvalidEvent),
		errors.Is(err, service.ErrUnsupported):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

	case errors.Is(err, service.ErrAlreadyHandled):
		c.Status(http.StatusNoContent)

	default:
		h.logger.Error("failed to process webhook", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal server error",
		})
	}
}
