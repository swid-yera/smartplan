package middleware

import (
	"net/http"
	"strings"

	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
)

// RequirePermission aborts the request with 403 if the current user does not
// have at least one of the requested effective permissions. ADMIN passes automatically.
func RequirePermission(codes ...service.PermissionCode) gin.HandlerFunc {
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

		if user.Role == "ADMIN" {
			c.Next()
			return
		}

		for _, code := range codes {
			if service.HasPermissionLevel(user.Permissions, code) {
				c.Next()
				return
			}
		}

		if len(codes) == 0 {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden: missing permission"})
			return
		}

		if len(codes) == 1 {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden: missing permission " + string(codes[0])})
			return
		}

		missing := make([]string, 0, len(codes))
		for _, code := range codes {
			missing = append(missing, string(code))
		}

		if len(missing) == 2 {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "forbidden: missing permission " + missing[0] + " or " + missing[1],
			})
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error": "forbidden: missing one of permissions " + strings.Join(missing, ", "),
		})
	}
}
