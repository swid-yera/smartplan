package middleware

import (
	"net/http"
	"strings"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
)

// RequireRole абортирует запрос с 403, если роль текущего пользователя
// не входит в список разрешённых. Должен использоваться после SessionAuth.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[strings.ToUpper(r)] = struct{}{}
	}

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

		if _, permitted := allowed[strings.ToUpper(user.Role)]; !permitted {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		c.Next()
	}
}
