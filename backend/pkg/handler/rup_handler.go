package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sirupsen/logrus"
)

type RupHandler struct {
	rupService service.RupService
	log        *logrus.Logger
}

func NewRupHandler(rupService service.RupService, log *logrus.Logger) *RupHandler {
	return &RupHandler{
		rupService: rupService,
		log:        log,
	}
}

// CreateRup создает новый RUP
func (h *RupHandler) CreateRup(c *gin.Context) {
	var req service.CreateRupRequest

	// Парсим JSON из запроса
	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.WithError(err).Error("invalid JSON format")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid JSON format",
			"details": err.Error(),
		})
		return
	}

	// Получить пользователя из контекста (должен быть установлен middleware)
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		h.log.Error("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Преобразовать в *service.User
	currentUser, ok := userInterface.(*service.User)
	if !ok {
		h.log.Error("Invalid user context", currentUser)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	// Установить teacher из текущего пользователя
	req.Teacher = currentUser.KeycloakID.String()

	// Вызываем service для создания RUP
	rup, err := h.rupService.CreateRup(c.Request.Context(), req)
	if err != nil {
		h.log.WithError(err).Error("failed to create RUP")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to create RUP",
			"details": err.Error(),
		})
		return
	}

	// Возвращаем успешный ответ
	c.JSON(http.StatusCreated, rup)
}

// GetRupByID получает RUP по ID
func (h *RupHandler) GetRupByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid RUP ID"})
		return
	}

	rup, err := h.rupService.GetRupByID(c.Request.Context(), id)
	if err != nil {
		h.log.WithError(err).Error("RUP not found")
		c.JSON(http.StatusNotFound, gin.H{"error": "RUP not found"})
		return
	}

	c.JSON(http.StatusOK, rup)
}

func (h *RupHandler) CreateApproveChallenge(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid RUP ID"})
		return
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		h.log.Error("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		h.log.Error("Invalid user context", currentUser)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	var req struct {
		KeyID  string `json:"key_id" binding:"required"`
		UserID string `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.WithError(err).Error("invalid approve challenge JSON format")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid JSON format",
			"details": err.Error(),
		})
		return
	}
	if req.UserID != currentUser.KeycloakID.String() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "failed to create approve challenge",
			"details": "user_id does not match current user",
		})
		return
	}

	resp, err := h.rupService.CreateApproveChallenge(c.Request.Context(), service.CreateApproveChallengeRequest{
		RupID:  id,
		UserID: currentUser.KeycloakID,
		KeyID:  req.KeyID,
	})
	if err != nil {
		h.log.WithError(err).Error("failed to create approve challenge")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to create approve challenge",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// UpdateRupStatus обновляет статус RUP
func (h *RupHandler) UpdateRupStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid RUP ID"})
		return
	}

	var req struct {
		Status    string `json:"status" binding:"required"`
		Reason    string `json:"reason"`
		KeyID     string `json:"key_id"`
		UserID    string `json:"user_id"`
		PublicKey string `json:"public_key"`
		Challenge string `json:"challenge"`
		Signature string `json:"signature"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.WithError(err).Error("invalid JSON format")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid JSON format",
			"details": err.Error(),
		})
		return
	}

	// Получить пользователя из контекста (должен быть установлен middleware)
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		h.log.Error("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Преобразовать в *service.User
	currentUser, ok := userInterface.(*service.User)
	if !ok {
		h.log.Error("Invalid user context", currentUser)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}
	if strings.TrimSpace(req.UserID) != "" && req.UserID != currentUser.KeycloakID.String() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "failed to update RUP status",
			"details": "user_id does not match current user",
		})
		return
	}

	// Для отправки на проверку разрешаем creator + developers из contacts (+ admin)
	if strings.EqualFold(req.Status, "IN_REVIEW") {
		rup, getErr := h.rupService.GetRupByID(c.Request.Context(), id)
		if getErr != nil {
			h.log.WithError(getErr).Error("RUP not found")
			c.JSON(http.StatusNotFound, gin.H{"error": "RUP not found"})
			return
		}

		canSendToReview := strings.EqualFold(currentUser.Role, "ADMIN")
		if !canSendToReview && rup.Teacher != nil {
			canSendToReview = rup.Teacher.KeycloakID == currentUser.KeycloakID
		}
		if !canSendToReview {
			for _, contact := range rup.Contacts {
				if contact != nil && contact.KeycloakID == currentUser.KeycloakID {
					canSendToReview = true
					break
				}
			}
		}
		if !canSendToReview {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	}

	correlationID := strings.TrimSpace(c.GetHeader("X-Correlation-ID"))
	if correlationID == "" {
		correlationID = uuid.NewString()
	}
	c.Header("X-Correlation-ID", correlationID)

	err = h.rupService.UpdateRupStatus(c.Request.Context(), service.UpdateRupStatusRequest{
		ID:            id,
		Status:        req.Status,
		Reason:        req.Reason,
		MethodistID:   currentUser.KeycloakID,
		CorrelationID: correlationID,
		KeyID:         req.KeyID,
		PublicKey:     req.PublicKey,
		Challenge:     req.Challenge,
		Signature:     req.Signature,
		UserID:        currentUser.KeycloakID.String(),
	})
	if err != nil {
		h.log.WithError(err).Error("failed to update RUP status")
		var httpErr *service.HTTPStatusError
		if errors.As(err, &httpErr) {
			c.JSON(httpErr.StatusCode, gin.H{
				"error":   "failed to update RUP status",
				"details": httpErr.Message,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to update RUP status",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "RUP status updated successfully"})
}

// UpdateRup обновляет данные RUP
func (h *RupHandler) UpdateRup(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid RUP ID"})
		return
	}

	var req service.CreateRupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.WithError(err).Error("invalid JSON format")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid JSON format",
			"details": err.Error(),
		})
		return
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		h.log.Error("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		h.log.Error("Invalid user context", currentUser)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	rup, err := h.rupService.GetRupByID(c.Request.Context(), id)
	if err != nil {
		h.log.WithError(err).Error("RUP not found")
		c.JSON(http.StatusNotFound, gin.H{"error": "RUP not found"})
		return
	}

	canEdit := strings.EqualFold(currentUser.Role, "ADMIN")
	if !canEdit && rup.Teacher != nil {
		canEdit = rup.Teacher.KeycloakID == currentUser.KeycloakID
	}
	if !canEdit {
		for _, contact := range rup.Contacts {
			if contact != nil && contact.KeycloakID == currentUser.KeycloakID {
				canEdit = true
				break
			}
		}
	}
	if !canEdit {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	rup, err = h.rupService.UpdateRup(c.Request.Context(), id, req)
	if err != nil {
		h.log.WithError(err).Error("failed to update RUP")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to update RUP",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, rup)
}

func (h *RupHandler) DownloadRup(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.log.WithError(err).Error("invalid rup id")
		c.JSON(400, gin.H{"error": "invalid rup id"})
		return
	}

	url, err := h.rupService.GetRupDownloadURL(
		c.Request.Context(),
		id,
	)
	if err != nil {
		c.JSON(404, gin.H{"error": "file not found"})
		return
	}

	// вариант А — вернуть ссылку
	c.JSON(200, gin.H{"url": url})

	// вариант Б — редирект (лучше UX)
	// c.Redirect(http.StatusTemporaryRedirect, url)
}

// DeleteRup удаляет RUP по ID
func (h *RupHandler) DeleteRup(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid RUP ID"})
		return
	}

	err = h.rupService.DeleteRup(c.Request.Context(), id)
	if err != nil {
		h.log.WithError(err).Error("failed to delete RUP")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to delete RUP",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "RUP deleted successfully"})
}

func (h *RupHandler) GetRupsPaginated(c *gin.Context) {
	currentPage := 1
	pageSize := 10

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
		if ps, err := strconv.Atoi(v); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	search := strings.TrimSpace(c.Query("search"))

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

	result, err := h.rupService.GetRupPaginated(
		c.Request.Context(),
		currentPage,
		pageSize,
		search,
		teacherID,
		methodistID,
		status,
	)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, result)
}
