package handler

import (
	"errors"
	"net/http"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CategoryHandler struct {
	service service.AwardServiceInterface
}

func NewCategoryHandler(service service.AwardServiceInterface) *CategoryHandler {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid category ID")})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body"), "details": service.TranslateAPIErrorMessage(err.Error())})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid category ID")})
		return
	}

	var req service.AwardCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body"), "details": service.TranslateAPIErrorMessage(err.Error())})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid category ID")})
		return
	}

	if err = h.service.DeleteCategory(c.Request.Context(), id); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func writeServiceError(c *gin.Context, err error) {
	var httpErr *service.HTTPStatusError
	if errors.As(err, &httpErr) {
		c.JSON(httpErr.StatusCode, gin.H{"error": service.TranslateAPIErrorMessage(httpErr.Message)})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
}
