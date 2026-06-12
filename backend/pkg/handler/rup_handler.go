package handler

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
			"error":   service.TranslateAPIErrorMessage("invalid JSON format"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	// Получить пользователя из контекста (должен быть установлен middleware)
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		h.log.Error("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	// Преобразовать в *service.User
	currentUser, ok := userInterface.(*service.User)
	if !ok {
		h.log.Error("Invalid user context", currentUser)
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	// Установить teacher из текущего пользователя
	req.Teacher = currentUser.KeycloakID.String()

	// Вызываем service для создания RUP
	rup, err := h.rupService.CreateRup(c.Request.Context(), req)
	if err != nil {
		h.log.WithError(err).Error("failed to create RUP")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to create RUP"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
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
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid RUP ID")})
		return
	}

	rup, err := h.rupService.GetRupByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			h.log.WithError(err).Error("RUP not found")
			c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("RUP not found")})
			return
		}

		h.log.WithError(err).Error("failed to load RUP before delete")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to delete RUP"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, rup)
}

func (h *RupHandler) GetLanguageGenerationStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid RUP ID")})
		return
	}

	status, err := h.rupService.GetLanguageGenerationStatus(c.Request.Context(), id)
	if err != nil {
		h.log.WithError(err).Error("failed to get language generation status")
		c.JSON(http.StatusNotFound, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to get language generation status"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, status)
}

func (h *RupHandler) RegenerateLanguageGeneration(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid RUP ID")})
		return
	}

	var req struct {
		SourceLanguage string `json:"sourceLanguage"`
	}

	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
			h.log.WithError(err).Error("invalid JSON format")
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   service.TranslateAPIErrorMessage("invalid JSON format"),
				"details": service.TranslateAPIErrorMessage(err.Error()),
			})
			return
		}
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		h.log.Error("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		h.log.Error("Invalid user context", currentUser)
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	rup, err := h.rupService.GetRupByID(c.Request.Context(), id)
	if err != nil {
		h.log.WithError(err).Error("RUP not found")
		c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("RUP not found")})
		return
	}

	canEdit := service.HasPermissionExact(currentUser.Permissions, service.PermRUPFull)
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
		c.JSON(http.StatusForbidden, gin.H{"error": service.TranslateAPIErrorMessage("forbidden")})
		return
	}

	status, err := h.rupService.RegenerateLanguageGeneration(c.Request.Context(), id, req.SourceLanguage)
	if err != nil {
		h.log.WithError(err).Error("failed to regenerate language generation")
		var httpErr *service.HTTPStatusError
		if errors.As(err, &httpErr) {
			c.JSON(httpErr.StatusCode, gin.H{
				"error":   service.TranslateAPIErrorMessage("failed to regenerate language generation"),
				"details": service.TranslateAPIErrorMessage(httpErr.Message),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to regenerate language generation"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusAccepted, status)
}

// UpdateRupStatus обновляет статус RUP
func (h *RupHandler) UpdateRupStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid RUP ID")})
		return
	}

	var req struct {
		Status    string                   `json:"status" binding:"required"`
		Reason    string                   `json:"reason"`
		KeyID     string                   `json:"key_id"`
		UserID    string                   `json:"user_id"`
		Password  string                   `json:"password"`
		Confirmed bool                     `json:"confirmed"`
		Signature string                   `json:"signature"`
		Kripto    service.KriptoKeyPayload `json:"kripto"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.WithError(err).Error("invalid JSON format")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   service.TranslateAPIErrorMessage("invalid JSON format"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	// Если статус утверждается, требуется пароль и подтверждение
	if strings.EqualFold(req.Status, "APPROVED") {
		if req.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   service.TranslateAPIErrorMessage("failed to update RUP status"),
				"details": service.TranslateAPIErrorMessage("password is required for approved status"),
			})
			return
		}
		if !req.Confirmed {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   service.TranslateAPIErrorMessage("failed to update RUP status"),
				"details": service.TranslateAPIErrorMessage("confirmation is required for approved status"),
			})
			return
		}
	}

	// Получить пользователя из контекста (должен быть установлен middleware)
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		h.log.Error("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	// Преобразовать в *service.User
	currentUser, ok := userInterface.(*service.User)
	if !ok {
		h.log.Error("Invalid user context", currentUser)
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}
	if strings.TrimSpace(req.UserID) != "" && req.UserID != currentUser.KeycloakID.String() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to update RUP status"),
			"details": service.TranslateAPIErrorMessage("user_id does not match current user"),
		})
		return
	}

	signerName := strings.TrimSpace(currentUser.FirstName + " " + currentUser.LastName)
	if signerName == "" {
		signerName = strings.TrimSpace(currentUser.Username)
	}
	if signerName == "" {
		signerName = currentUser.KeycloakID.String()
	}

	// Проверка прав по статусу:
	// IN_REVIEW  — teacher (свой РУП / контакт) или admin
	// APPROVED / REJECTED — только methodist или admin
	// DRAFT (возврат) — methodist или admin
	switch strings.ToUpper(req.Status) {
	case "IN_REVIEW":
		rup, getErr := h.rupService.GetRupByID(c.Request.Context(), id)
		if getErr != nil {
			h.log.WithError(getErr).Error("RUP not found")
			c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("RUP not found")})
			return
		}
		canSendToReview := service.HasPermissionExact(currentUser.Permissions, service.PermRUPFull)
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
			c.JSON(http.StatusForbidden, gin.H{"error": service.TranslateAPIErrorMessage("forbidden")})
			return
		}
	case "APPROVED", "REJECTED", "DRAFT":
		if !service.HasPermissionExact(currentUser.Permissions, service.PermRUPManage) {
			c.JSON(http.StatusForbidden, gin.H{"error": service.TranslateAPIErrorMessage("forbidden")})
			return
		}
	}

	correlationID := strings.TrimSpace(c.GetHeader("X-Correlation-ID"))
	if correlationID == "" {
		correlationID = uuid.NewString()
	}
	c.Header("X-Correlation-ID", correlationID)

	response, err := h.rupService.UpdateRupStatus(c.Request.Context(), service.UpdateRupStatusRequest{
		ID:            id,
		Status:        req.Status,
		Reason:        req.Reason,
		MethodistID:   currentUser.KeycloakID,
		CorrelationID: correlationID,
		KeyID:         req.KeyID,
		UserID:        req.UserID,
		Password:      req.Password,
		Confirmed:     req.Confirmed,
		Signature:     req.Signature,
		SignerName:    signerName,
		SignerRole:    currentUser.Role,
		Kripto:        &req.Kripto,
	})
	if err != nil {
		h.log.WithError(err).Error("failed to update RUP status")
		var httpErr *service.HTTPStatusError
		if errors.As(err, &httpErr) {
			c.JSON(httpErr.StatusCode, gin.H{
				"error":   service.TranslateAPIErrorMessage("failed to update RUP status"),
				"details": service.TranslateAPIErrorMessage(httpErr.Message),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to update RUP status"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	if response == nil {
		response = &service.UpdateRupStatusResponse{Message: "RUP status updated successfully"}
	}

	c.JSON(http.StatusOK, response)
}

func (h *RupHandler) GetRupSignatureArtifact(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid RUP ID")})
		return
	}

	artifact, err := h.rupService.GetRupSignatureArtifact(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("signature artifact not found")})
			return
		}

		h.log.WithError(err).Error("failed to get RUP signature artifact")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to get RUP signature artifact"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, artifact)
}

// UpdateRup обновляет данные RUP
func (h *RupHandler) UpdateRup(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.log.WithError(err).Error("invalid RUP ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid RUP ID")})
		return
	}

	var req service.CreateRupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.WithError(err).Error("invalid JSON format")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   service.TranslateAPIErrorMessage("invalid JSON format"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		h.log.Error("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		h.log.Error("Invalid user context", currentUser)
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	rup, err := h.rupService.GetRupByID(c.Request.Context(), id)
	if err != nil {
		h.log.WithError(err).Error("RUP not found")
		c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("RUP not found")})
		return
	}

	canEdit := service.HasPermissionExact(currentUser.Permissions, service.PermRUPFull)
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
		c.JSON(http.StatusForbidden, gin.H{"error": service.TranslateAPIErrorMessage("forbidden")})
		return
	}

	rup, err = h.rupService.UpdateRup(c.Request.Context(), id, req)
	if err != nil {
		h.log.WithError(err).Error("failed to update RUP")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to update RUP"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}
	c.JSON(http.StatusOK, rup)
}

func (h *RupHandler) DownloadRup(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.log.WithError(err).Error("invalid rup id")
		c.JSON(400, gin.H{"error": service.TranslateAPIErrorMessage("invalid rup id")})
		return
	}

	language := strings.TrimSpace(c.Query("locale"))
	if language == "" {
		language = strings.TrimSpace(c.Query("language"))
	}

	url, err := h.rupService.GetRupDownloadURL(
		c.Request.Context(),
		id,
		language,
	)
	if err != nil {
		c.JSON(404, gin.H{"error": service.TranslateAPIErrorMessage("file not found")})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid RUP ID")})
		return
	}

	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}
	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	rup, err := h.rupService.GetRupByID(c.Request.Context(), id)
	if err != nil {
		h.log.WithError(err).Error("RUP not found")
		c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("RUP not found")})
		return
	}

	// Только создатель (teacher) или admin могут удалять
	isAdmin := service.HasPermissionExact(currentUser.Permissions, service.PermRUPFull)
	isCreator := rup.Teacher != nil && rup.Teacher.KeycloakID == currentUser.KeycloakID
	if !isAdmin && !isCreator {
		c.JSON(http.StatusForbidden, gin.H{"error": service.TranslateAPIErrorMessage("forbidden")})
		return
	}

	err = h.rupService.DeleteRup(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			h.log.WithError(err).Error("RUP not found")
			c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("RUP not found")})
			return
		}

		h.log.WithError(err).Error("failed to delete RUP")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   service.TranslateAPIErrorMessage("failed to delete RUP"),
			"details": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.Status(http.StatusNoContent)
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
	sort, err := parseSortQuery(c, "sort", "desc")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("sort must be 'asc' or 'desc'")})
		return
	}

	var teacherID pgtype.UUID
	if v := c.Query("teacher"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			c.JSON(400, gin.H{"error": service.TranslateAPIErrorMessage("invalid teacher id")})
			return
		}
		teacherID = pgtype.UUID{Bytes: id, Valid: true}
	}

	var methodistID pgtype.UUID
	if v := c.Query("methodist"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			c.JSON(400, gin.H{"error": service.TranslateAPIErrorMessage("invalid methodist id")})
			return
		}
		methodistID = pgtype.UUID{Bytes: id, Valid: true}
	}

	result, err := h.rupService.GetRupPaginated(
		c.Request.Context(),
		currentPage,
		pageSize,
		search,
		sort,
		teacherID,
		methodistID,
		status,
	)
	if err != nil {
		c.JSON(400, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(200, result)
}
