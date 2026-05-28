package handler

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type UserHandler struct {
	userService service.UserService
}

type CreatePenaltyRequest struct {
	Points int32  `json:"points"`
	Note   string `json:"note"`
}

type IssueViolationRequest struct {
	Note string `json:"note"`
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

func (h *UserHandler) CreatePenalty(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	if currentUser.Role != "METHODIST" && currentUser.Role != "ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	teacherID, err := uuid.Parse(c.Param("teacher_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid teacher_id"})
		return
	}

	var req CreatePenaltyRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	penalty, err := h.userService.CreatePenalty(
		c.Request.Context(),
		currentUser.KeycloakID,
		teacherID,
		req.Points,
		req.Note,
	)
	if err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, penalty)
}

func (h *UserHandler) GetPenaltiesByTeacherID(c *gin.Context) {
	teacherID, err := uuid.Parse(c.Param("teacher_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid teacher_id"})
		return
	}

	penalties, err := h.userService.GetPenaltiesByTeacherID(c.Request.Context(), teacherID)
	if err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, penalties)
}

func (h *UserHandler) GetPenaltyByIDAndTeacherID(c *gin.Context) {
	teacherID, err := uuid.Parse(c.Param("teacher_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid teacher_id"})
		return
	}

	penaltyID, err := uuid.Parse(c.Param("penalty_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid penalty_id"})
		return
	}

	penalty, err := h.userService.GetPenaltyByIDAndTeacherID(c.Request.Context(), penaltyID, teacherID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "penalty not found"})
			return
		}
		writeUserServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, penalty)
}

func (h *UserHandler) DeletePenaltyByIDAndTeacherID(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	if currentUser.Role != "METHODIST" && currentUser.Role != "ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	teacherID, err := uuid.Parse(c.Param("teacher_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid teacher_id"})
		return
	}

	penaltyID, err := uuid.Parse(c.Param("penalty_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid penalty_id"})
		return
	}

	err = h.userService.DeletePenaltyByIDAndTeacherID(c.Request.Context(), penaltyID, teacherID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "penalty not found"})
			return
		}
		writeUserServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *UserHandler) CreateViolation(c *gin.Context) {
	h.issueViolation(c, http.StatusCreated)
}

func (h *UserHandler) UpdateViolation(c *gin.Context) {
	h.issueViolation(c, http.StatusOK)
}

func (h *UserHandler) issueViolation(c *gin.Context, successStatus int) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	if currentUser.Role != "METHODIST" && currentUser.Role != "ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req IssueViolationRequest
	if err = c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	result, err := h.userService.IssueViolation(
		c.Request.Context(),
		currentUser.KeycloakID,
		targetUserID,
		req.Note,
	)
	if err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.JSON(successStatus, result)
}

func writeUserServiceError(c *gin.Context, err error) {
	var httpErr *service.HTTPStatusError
	if errors.As(err, &httpErr) {
		c.JSON(httpErr.StatusCode, gin.H{"error": httpErr.Message})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}
