package handler

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
)

func parseSortQuery(c *gin.Context, key string, defaultValue string) (string, error) {
	sort := strings.ToLower(strings.TrimSpace(c.Query(key)))
	if sort == "" {
		return defaultValue, nil
	}
	if sort != "asc" && sort != "desc" {
		return "", fmt.Errorf("invalid %s", key)
	}
	return sort, nil
}
