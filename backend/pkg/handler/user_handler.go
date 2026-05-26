package handler

import (
	"net/http"
	"strconv"
	"strings"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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

func (h *UserHandler) GetUsers(c *gin.Context) {
	currentPage := 1
	pageSize := 10

	if v := c.Query("currentPage"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			currentPage = p
		}
	}

	if v := c.Query("pageSize"); v != "" {
		if ps, err := strconv.Atoi(v); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	search := strings.TrimSpace(c.Query("search"))
	sort, err := parseSortQuery(c, "sort", "desc")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "sort must be 'asc' or 'desc'",
		})
		return
	}

	departmentID := pgtype.UUID{}
	if raw := strings.TrimSpace(c.Query("departmentId")); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid departmentId",
			})
			return
		}
		departmentID = pgtype.UUID{Bytes: parsed, Valid: true}
	}

	result, err := h.userService.GetUsersPaginated(
		c.Request.Context(),
		currentPage,
		pageSize,
		search,
		sort,
		departmentID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *UserHandler) GetUsersRating(c *gin.Context) {
	currentPage := 1
	pageSize := 10

	if v := c.Query("currentPage"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			currentPage = p
		}
	}

	if v := c.Query("pageSize"); v != "" {
		if ps, err := strconv.Atoi(v); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	search := strings.TrimSpace(c.Query("search"))
	sort, err := parseSortQuery(c, "sort", "desc")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "sort must be 'asc' or 'desc'",
		})
		return
	}

	result, err := h.userService.GetUsersRatingPaginated(
		c.Request.Context(),
		currentPage,
		pageSize,
		search,
		sort,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
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
