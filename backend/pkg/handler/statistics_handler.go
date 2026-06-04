package handler

import (
	"net/http"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StatisticsHandler struct {
	userService service.UserService
}

func NewStatisticsHandler(userService service.UserService) *StatisticsHandler {
	return &StatisticsHandler{userService: userService}
}

func (h *StatisticsHandler) GetTeachersRating(c *gin.Context) {
	result, err := h.userService.GetTeachersRatingWithDepartments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *StatisticsHandler) GetTopDepartments(c *gin.Context) {
	result, err := h.userService.GetTopAwardDepartmentsStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *StatisticsHandler) GetTopTeachersByDepartment(c *gin.Context) {
	result, err := h.userService.GetTopTeachersByDepartment(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *StatisticsHandler) GetTeachersByDepartment(c *gin.Context) {
	departmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department id"})
		return
	}

	result, err := h.userService.GetTeachersByDepartment(c.Request.Context(), departmentID)
	if err != nil {
		if statusErr, ok := err.(*service.HTTPStatusError); ok {
			c.JSON(statusErr.StatusCode, gin.H{"error": statusErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
