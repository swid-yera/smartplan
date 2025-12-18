package webhook

import (
	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, webhooksService service.WebhooksService, cfg *Config) {
	h := NewHandler(webhooksService, cfg)
	r.POST("/webhooks/keycloak", h.HandleWebhook)
}
