package handler

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

// GetAllRups получает все RUP
func (h *RupHandler) GetAllRups(c *gin.Context) {
	page := 1
	pageSize := 10

	if v := c.Query("currentPage"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			page = p
		}
	}

	if v := c.Query("pageSize"); v != "" {
		if ps, err := strconv.Atoi(v); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	search := strings.TrimSpace(c.Query("search"))

	result, err := h.rupService.GetRupPaginated(
		c.Request.Context(),
		page,
		pageSize,
		search,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
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
		Status string `json:"status" binding:"required"`
		Reason string `json:"reason"`
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

	err = h.rupService.UpdateRupStatus(c.Request.Context(), id, req.Status, req.Reason, currentUser.KeycloakID)
	if err != nil {
		h.log.WithError(err).Error("failed to update RUP status")
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

	rup, err := h.rupService.UpdateRup(c.Request.Context(), id, req)
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

// GetRupsByMethodist получает RUP по методисту
func (h *RupHandler) GetRupsByMethodist(c *gin.Context) {
	methodistIDStr := c.Param("id")
	log.Println(methodistIDStr)
	if methodistIDStr == "" {
		h.log.Error("methodist ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "methodist ID is required"})
		return
	}

	methodistID, err := uuid.Parse(methodistIDStr)
	if err != nil {
		h.log.WithError(err).Error("invalid methodist ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid methodist ID"})
		return
	}

	rups, err := h.rupService.GetRupsByMethodist(c.Request.Context(), methodistID)
	if err != nil {
		h.log.WithError(err).Error("failed to get RUPs by methodist")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to get RUPs by methodist",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, rups)
}

// GetRupsByTeacher получает RUP по преподавателю
func (h *RupHandler) GetRupsByTeacher(c *gin.Context) {
	teacherIDStr := c.Param("id")
	if teacherIDStr == "" {
		h.log.Error("teacher ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "teacher ID is required"})
		return
	}

	teacherID, err := uuid.Parse(teacherIDStr)
	if err != nil {
		h.log.WithError(err).Error("invalid teacher ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid teacher ID"})
		return
	}

	rups, err := h.rupService.GetRupsByTeacher(c.Request.Context(), teacherID)
	if err != nil {
		h.log.WithError(err).Error("failed to get RUPs by teacher")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to get RUPs by teacher",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, rups)
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
	pageStr := c.DefaultQuery("page", "")
	pageSizeStr := c.DefaultQuery("pageSize", "10")
	search := c.DefaultQuery("search", "")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	log.Println("PAGE:", page, "PAGE_SIZE:", pageSize) // 🔥 ОБЯЗАТЕЛЬНО

	resp, err := h.rupService.GetRupPaginated(
		c.Request.Context(),
		page,
		pageSize,
		search,
	)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, resp)
}
