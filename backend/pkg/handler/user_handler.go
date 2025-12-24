package handler

import (
	"net/http"

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
	// 1. читаем cookie
	sid, err := c.Cookie("sid")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no session"})
		return
	}

	// 2. парсим UUID
	sessionID, err := uuid.Parse(sid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session"})
		return
	}

	// 3. получаем пользователя
	user, err := h.userService.GetUserBySessionID(
		c.Request.Context(),
		sessionID,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// 4. ответ
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) GetAllUsers(c *gin.Context) {
	// 1. читаем cookie
	sid, err := c.Cookie("sid")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no session"})
		return
	}

	// 2. парсим UUID
	sessionID, err := uuid.Parse(sid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session"})
		return
	}

	_, err = h.userService.GetUserBySessionID(
		c.Request.Context(),
		sessionID,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "error"})
		return
	}

	// 3. получаем пользователя
	user, err := h.userService.GetAllUsers(
		c.Request.Context(),
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// 4. ответ
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) GetUserByKeycloakID(c *gin.Context) {
	// 1. читаем cookie
	sid, err := c.Cookie("sid")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no session"})
		return
	}

	// 2. парсим UUID
	sessionID, err := uuid.Parse(sid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session"})
		return
	}

	_, err = h.userService.GetUserBySessionID(
		c.Request.Context(),
		sessionID,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "error"})
		return
	}

	keycloakIDStr := c.Param("keycloak_id")
	if keycloakIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "keycloak_id is required"})
		return
	}

	keycloakID, err := uuid.Parse(keycloakIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid keycloak_id"})
		return
	}

	// 3. получаем пользователя
	user, err := h.userService.GetUserByKeycloakID(
		c.Request.Context(),
		keycloakID,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// 4. ответ
	c.JSON(http.StatusOK, user)
}
