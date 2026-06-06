package handler

import (
	"net/http"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PermissionHandler struct {
	permService service.PermissionService
}

func NewPermissionHandler(permService service.PermissionService) *PermissionHandler {
	return &PermissionHandler{permService: permService}
}

// SetPermissions — PUT /permissions/:user_id
// Выдаёт или обновляет права SPECIAL-пользователя. Только ADMIN.
func (h *PermissionHandler) SetPermissions(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	var req service.SetPermissionsRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	result, err := h.permService.SetPermissions(c.Request.Context(), userID, req.Permissions)
	if err != nil {
		writePermissionServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetPermissions — GET /permissions/:user_id
// Возвращает права конкретного пользователя. ADMIN или сам пользователь.
func (h *PermissionHandler) GetPermissions(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	// Разрешаем смотреть свои права или быть ADMIN
	currentUser, ok := currentUserFromCtx(c)
	if !ok {
		return
	}
	if currentUser.Role != "ADMIN" && currentUser.KeycloakID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	result, err := h.permService.GetPermissions(c.Request.Context(), userID)
	if err != nil {
		writePermissionServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// RevokePermissions — DELETE /permissions/:user_id
// Удаляет все права пользователя. Только ADMIN.
func (h *PermissionHandler) RevokePermissions(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	if err = h.permService.RevokePermissions(c.Request.Context(), userID); err != nil {
		writePermissionServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// ListSpecialUsers — GET /permissions/specials
// Возвращает всех SPECIAL-пользователей со своими правами. Только ADMIN.
func (h *PermissionHandler) ListSpecialUsers(c *gin.Context) {
	users, err := h.permService.ListSpecialUsers(c.Request.Context())
	if err != nil {
		writePermissionServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, users)
}

// currentUserFromCtx — вспомогательная функция, достаёт *service.User из gin.Context
// и сразу пишет ответ при ошибке. Возвращает false если нужно прервать хендлер.
func currentUserFromCtx(c *gin.Context) (*service.User, bool) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return nil, false
	}
	user, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user context"})
		return nil, false
	}
	return user, true
}

func writePermissionServiceError(c *gin.Context, err error) {
	writeUserServiceError(c, err) // переиспользуем ту же логику из user_handler.go
}
