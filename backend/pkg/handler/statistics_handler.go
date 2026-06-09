package handler

import (
	"net/http"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StatisticsHandler struct {
	userService  service.UserService
	awardService service.AwardServiceInterface
}

func NewStatisticsHandler(userService service.UserService, awardService service.AwardServiceInterface) *StatisticsHandler {
	return &StatisticsHandler{userService: userService, awardService: awardService}
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
			if statusErr.StatusCode == http.StatusNotFound && h.awardService != nil {
				departments, departmentsErr := h.awardService.GetAwardDepartmentsStats(c.Request.Context())
				if departmentsErr != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": departmentsErr.Error()})
					return
				}

				for _, department := range departments {
					if department.KeycloakID != departmentID {
						continue
					}

					c.JSON(http.StatusOK, &service.DepartmentTopTeachersResponse{
						KeycloakID:    department.KeycloakID,
						Name:          department.Name,
						TeachersCount: 0,
						Teachers:      []*service.User{},
					})
					return
				}
			}

			c.JSON(statusErr.StatusCode, gin.H{"error": statusErr.Message})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
