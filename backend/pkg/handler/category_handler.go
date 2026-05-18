package handler

import (
	"errors"
	"net/http"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CategoryHandler struct {
	service *service.AwardService
}

func NewCategoryHandler(service *service.AwardService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	items, err := h.service.GetAllCategories(c.Request.Context())
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *CategoryHandler) GetCategoryByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	item, err := h.service.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req service.AwardCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "details": err.Error()})
		return
	}

	item, err := h.service.CreateCategory(c.Request.Context(), req)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	var req service.AwardCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "details": err.Error()})
		return
	}

	item, err := h.service.UpdateCategory(c.Request.Context(), id, req)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	if err = h.service.DeleteCategory(c.Request.Context(), id); err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

func (h *CategoryHandler) GetCategoryFields(c *gin.Context) {
	items, err := h.service.GetAllCategoryFields(c.Request.Context())
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *CategoryHandler) GetCategoryFieldByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category field ID"})
		return
	}

	item, err := h.service.GetCategoryFieldByID(c.Request.Context(), id)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *CategoryHandler) CreateCategoryField(c *gin.Context) {
	var req service.AwardCategoryFieldRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "details": err.Error()})
		return
	}

	item, err := h.service.CreateCategoryField(c.Request.Context(), req)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *CategoryHandler) UpdateCategoryField(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category field ID"})
		return
	}

	var req service.AwardCategoryFieldRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "details": err.Error()})
		return
	}

	item, err := h.service.UpdateCategoryField(c.Request.Context(), id, req)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *CategoryHandler) DeleteCategoryField(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category field ID"})
		return
	}

	if err = h.service.DeleteCategoryField(c.Request.Context(), id); err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Category field deleted successfully"})
}

func writeServiceError(c *gin.Context, err error) {
	var httpErr *service.HTTPStatusError
	if errors.As(err, &httpErr) {
		c.JSON(httpErr.StatusCode, gin.H{"error": httpErr.Message})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}
