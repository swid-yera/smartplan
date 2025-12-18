package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// ValidateRequestHeaders validates common request headers
func ValidateRequestHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check Content-Type for POST/PUT requests
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			contentType := c.GetHeader("Content-Type")
			if contentType == "" {
				contentType = "application/json" // default
			}
			if !strings.Contains(contentType, "application/json") &&
				!strings.Contains(contentType, "application/x-www-form-urlencoded") {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
					"error": "Invalid Content-Type. Expected application/json or application/x-www-form-urlencoded",
				})
				return
			}
		}

		// Check Accept header
		accept := c.GetHeader("Accept")
		if accept != "" && !strings.Contains(accept, "application/json") &&
			!strings.Contains(accept, "*/*") {
			c.AbortWithStatusJSON(http.StatusNotAcceptable, gin.H{
				"error": "Invalid Accept header. Expected application/json",
			})
			return
		}

		c.Next()
	}
}

// ValidateQueryParams validates required query parameters
func ValidateQueryParams(requiredParams ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		for _, param := range requiredParams {
			if c.Query(param) == "" {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
					"error": "Missing required query parameter: " + param,
				})
				return
			}
		}
		c.Next()
	}
}

// ValidateJSONBody validates JSON body structure
func ValidateJSONBody() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			if c.Request.ContentLength == 0 {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
					"error": "Request body is required",
				})
				return
			}
		}
		c.Next()
	}
}
