package webhook

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strings"

	"eduplan/backend/pkg/service"
	"eduplan/backend/pkg/service/keycloak"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

type Config struct {
	SecretKey string
}

type Handler struct {
	webhooksService service.WebhooksService
	config          *Config
}

func NewHandler(webhooksService service.WebhooksService, config *Config) *Handler {
	return &Handler{
		webhooksService: webhooksService,
		config:          config,
	}
}

func (h *Handler) HandleWebhook(c *gin.Context) {
	if h.config != nil && h.config.SecretKey != "" {
		if err := h.validateSignature(c); err != nil {
			log.Error().Err(err).Msg("Webhook signature validation failed")
			c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("Invalid signature")})
			return
		}
	}

	var event keycloak.KeycloakEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		log.Error().Err(err).Msg("Failed to parse Keycloak event")
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("Invalid JSON payload")})
		return
	}

	if err := h.webhooksService.ProcessEvent(c.Request.Context(), &event); err != nil {
		log.Error().Err(err).
			Str("eventType", string(event.Type)).
			Str("keycloakID", event.UserID).
			Msg("Failed to process Keycloak event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Failed to process event")})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) validateSignature(c *gin.Context) error {
	signature := strings.TrimSpace(c.GetHeader("X-Keycloak-Signature"))
	if signature == "" {
		return fmt.Errorf("missing signature header")
	}

	signature = strings.TrimPrefix(signature, "sha256=")
	signature = strings.ToLower(signature)

	body, err := c.GetRawData()
	if err != nil {
		return fmt.Errorf("failed to read request body: %w", err)
	}

	c.Request.Body = io.NopCloser(strings.NewReader(string(body)))

	mac := hmac.New(sha256.New, []byte(h.config.SecretKey))
	_, _ = mac.Write(body)
	expected := mac.Sum(nil)

	provided, err := hex.DecodeString(signature)
	if err != nil {
		return fmt.Errorf("invalid signature format: %w", err)
	}

	if !hmac.Equal(provided, expected) {
		return fmt.Errorf("signature mismatch")
	}
	return nil
}

