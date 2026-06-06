package middleware

import (
	"net/http"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
)

// RequirePermission абортирует запрос с 403, если у текущего пользователя
// нет указанного кода доступа. Должен использоваться после SessionAuth.
// Применяется только к пользователям с ролью SPECIAL; ADMIN всегда пропускается.
func RequirePermission(permService service.PermissionService, code service.PermissionCode) gin.HandlerFunc {
	return func(c *gin.Context) {
		userInterface, exists := c.Get(ContextUserKey)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
			return
		}

		user, ok := userInterface.(*service.User)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "invalid user context"})
			return
		}

		// ADMIN имеет полный доступ ко всему
		if user.Role == "ADMIN" {
			c.Next()
			return
		}

		// Для не-SPECIAL ролей этот middleware не применим — запрещаем
		if user.Role != "SPECIAL" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		// Проверяем конкретное право из БД
		ok, err := permService.HasPermission(c.Request.Context(), user.KeycloakID, code)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "permission check failed"})
			return
		}
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden: missing permission " + string(code)})
			return
		}

		c.Next()
	}
}
