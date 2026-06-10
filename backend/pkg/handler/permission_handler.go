package handler

import (
	"net/http"

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
// Выдаёт или обновляет права любого пользователя. Доступ дают full-permission holders.
func (h *PermissionHandler) SetPermissions(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid user_id")})
		return
	}

	var req service.SetPermissionsRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
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
// Возвращает права конкретного пользователя. Доступ дают full-permission holders.
func (h *PermissionHandler) GetPermissions(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid user_id")})
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
// Удаляет все явные права пользователя. Доступ дают full-permission holders.
func (h *PermissionHandler) RevokePermissions(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid user_id")})
		return
	}

	if err = h.permService.RevokePermissions(c.Request.Context(), userID); err != nil {
		writePermissionServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// ListSpecialUsers — GET /permissions/specials
// Возвращает список пользователей с их правами.
func (h *PermissionHandler) ListSpecialUsers(c *gin.Context) {
	users, err := h.permService.ListSpecialUsers(c.Request.Context())
	if err != nil {
		writePermissionServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, users)
}

func writePermissionServiceError(c *gin.Context, err error) {
	writeUserServiceError(c, err) // переиспользуем ту же логику из user_handler.go
}

