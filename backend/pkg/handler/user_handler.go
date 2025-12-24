package handler

import (
	"net/http"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

func (h *UserHandler) GetMe(c *gin.Context) {
	user, ok := c.Get(middleware.ContextUserKey)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "user not found in context",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) GetAllUsers(c *gin.Context) {
	users, err := h.userService.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to get users",
		})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *UserHandler) GetUserByKeycloakID(c *gin.Context) {
	keycloakIDStr := c.Param("keycloak_id")
	if keycloakIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "keycloak_id is required",
		})
		return
	}

	keycloakID, err := uuid.Parse(keycloakIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid keycloak_id",
		})
		return
	}

	user, err := h.userService.GetUserByKeycloakID(
		c.Request.Context(),
		keycloakID,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "user not found",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}
