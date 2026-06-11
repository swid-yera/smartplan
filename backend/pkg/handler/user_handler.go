package handler

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"
	storage "eduplan/backend/pkg/sqlc/generated"

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
			"error": service.TranslateAPIErrorMessage("user not found in context"),
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
			"error": service.TranslateAPIErrorMessage("sort must be 'asc' or 'desc'"),
		})
		return
	}
	userType, err := parseUserTypeQuery(c.Query("userType"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": service.TranslateAPIErrorMessage("invalid userType"),
		})
		return
	}

	departmentID := pgtype.UUID{}
	if raw := strings.TrimSpace(c.Query("departmentId")); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": service.TranslateAPIErrorMessage("invalid departmentId"),
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
		userType,
		departmentID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": service.TranslateAPIErrorMessage(err.Error()),
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
			"error": service.TranslateAPIErrorMessage("sort must be 'asc' or 'desc'"),
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
			"error": service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *UserHandler) GetUserByKeycloakID(c *gin.Context) {
	keycloakIDStr := c.Param("keycloak_id")
	if keycloakIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": service.TranslateAPIErrorMessage("keycloak_id is required"),
		})
		return
	}

	keycloakID, err := uuid.Parse(keycloakIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": service.TranslateAPIErrorMessage("invalid keycloak_id"),
		})
		return
	}

	user, err := h.userService.GetUserByKeycloakID(
		c.Request.Context(),
		keycloakID,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": service.TranslateAPIErrorMessage("user not found"),
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) CreatePenalty(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	teacherID, err := uuid.Parse(c.Param("teacher_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid teacher_id")})
		return
	}

	var req CreatePenaltyRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid teacher_id")})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid teacher_id")})
		return
	}

	penaltyID, err := uuid.Parse(c.Param("penalty_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid penalty_id")})
		return
	}

	penalty, err := h.userService.GetPenaltyByIDAndTeacherID(c.Request.Context(), penaltyID, teacherID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("penalty not found")})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	if _, ok := userInterface.(*service.User); !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	teacherID, err := uuid.Parse(c.Param("teacher_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid teacher_id")})
		return
	}

	penaltyID, err := uuid.Parse(c.Param("penalty_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid penalty_id")})
		return
	}

	err = h.userService.DeletePenaltyByIDAndTeacherID(c.Request.Context(), penaltyID, teacherID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("penalty not found")})
			return
		}
		writeUserServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *UserHandler) CreateViolation(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid id")})
		return
	}

	var req IssueViolationRequest
	if err = c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
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

	c.JSON(http.StatusCreated, result)
}

func (h *UserHandler) UpdateViolation(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid id")})
		return
	}

	var req IssueViolationRequest
	if err = c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
		return
	}

	violationID, err := uuid.Parse(c.Param("violation_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid violation_id")})
		return
	}

	result, err := h.userService.UpdateViolation(
		c.Request.Context(),
		currentUser.KeycloakID,
		targetUserID,
		violationID,
		req.Note,
	)
	if err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *UserHandler) DeleteViolation(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid id")})
		return
	}

	violationID, err := uuid.Parse(c.Param("violation_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid violation_id")})
		return
	}

	if err = h.userService.DeleteViolation(
		c.Request.Context(),
		currentUser.KeycloakID,
		targetUserID,
		violationID,
	); err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func parseUserTypeQuery(raw string) (string, error) {
	value := strings.ToUpper(strings.TrimSpace(raw))
	if value == "" {
		return "", nil
	}

	switch storage.UserType(value) {
	case storage.UserTypeGENERAL,
		storage.UserTypeHEAD,
		storage.UserTypeMASTER,
		storage.UserTypeSPECIALIST,
		storage.UserTypeNULL:
		return value, nil
	default:
		return "", errors.New("invalid user type")
	}
}

func writeUserServiceError(c *gin.Context, err error) {
	var httpErr *service.HTTPStatusError
	if errors.As(err, &httpErr) {
		c.JSON(httpErr.StatusCode, gin.H{"error": service.TranslateAPIErrorMessage(httpErr.Message)})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
}

