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
