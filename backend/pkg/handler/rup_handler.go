package handler

import (
	"net/http"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RupHandler struct {
	rupService service.RupService
}

func NewRupHandler(rupService service.RupService) *RupHandler {
	return &RupHandler{
		rupService: rupService,
	}
}

// CreateRup создает новый RUP
func (h *RupHandler) CreateRup(c *gin.Context) {
	var req service.CreateRupRequest

	// Парсим JSON из запроса
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid JSON format",
			"details": err.Error(),
		})
		return
	}

	// Вызываем service для создания RUP
	rup, err := h.rupService.CreateRup(c.Request.Context(), req)
	if err != nil {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid RUP ID"})
		return
	}

	rup, err := h.rupService.GetRupByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "RUP not found"})
		return
	}

	c.JSON(http.StatusOK, rup)
}

// GetAllRups получает все RUP
func (h *RupHandler) GetAllRups(c *gin.Context) {
	rups, err := h.rupService.GetAllRups(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to get RUPs",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, rups)
}

// UpdateRupStatus обновляет статус RUP
func (h *RupHandler) UpdateRupStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid RUP ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
		Reason string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid JSON format",
			"details": err.Error(),
		})
		return
	}

	err = h.rupService.UpdateRupStatus(c.Request.Context(), id, req.Status, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to update RUP status",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "RUP status updated successfully"})
}

// GetRupsByMethodist получает RUP по методисту
func (h *RupHandler) GetRupsByMethodist(c *gin.Context) {
	methodistIDStr := c.Query("methodist_id")
	if methodistIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "methodist_id query parameter is required"})
		return
	}

	methodistID, err := uuid.Parse(methodistIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid methodist ID"})
		return
	}

	rups, err := h.rupService.GetRupsByMethodist(c.Request.Context(), methodistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to get RUPs by methodist",
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid RUP ID"})
		return
	}

	err = h.rupService.DeleteRup(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to delete RUP",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "RUP deleted successfully"})
}
