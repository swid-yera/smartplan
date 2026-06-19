package handler

import (
	"context"
	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sirupsen/logrus"
)

func parseQueryInt(c *gin.Context, key string, defaultValue int) (int, error) {
	valStr := c.Query(key)
	if valStr == "" {
		return defaultValue, nil
	}
	val, err := strconv.Atoi(valStr)
	if err != nil {
		return 0, err
	}
	return val, nil
}

func parseCommaSeparatedQuery(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}

	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if _, exists := seen[part]; exists {
			continue
		}
		seen[part] = struct{}{}
		result = append(result, part)
	}

	return result
}

func parseUUIDListQuery(value string) ([]uuid.UUID, error) {
	items := parseCommaSeparatedQuery(value)
	if len(items) == 0 {
		return nil, nil
	}

	ids := make([]uuid.UUID, 0, len(items))
	for _, item := range items {
		id, err := uuid.Parse(item)
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	return ids, nil
}

func parseLessonTypeFilter(value string) ([]string, error) {
	values := parseCommaSeparatedQuery(value)
	for index, item := range values {
		item = strings.ToUpper(strings.TrimSpace(item))
		if item != "PRACTICE" && item != "THEORY" {
			return nil, errors.New("invalid lesson type")
		}
		values[index] = item
	}

	return values, nil
}

type LessonHandler struct {
	lessonService *service.LessonService
	log           *logrus.Logger
}

func NewLessonHandler(lessonService *service.LessonService, log *logrus.Logger) *LessonHandler {
	return &LessonHandler{
		lessonService: lessonService,
		log:           log,
	}
}

func (h *LessonHandler) CreateLesson(c *gin.Context) {
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
	var lessonParams service.LessonParams
	if err := c.ShouldBindJSON(&lessonParams); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
		return
	}
	lessonParams.TeacherID = currentUser.KeycloakID

	if err := h.lessonService.CreateLesson(c.Request.Context(), lessonParams); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}
	c.Status(http.StatusCreated)
}

func (h *LessonHandler) GetLessons(c *gin.Context) {
	// Парсим query-параметры
	currentPage, err := parseQueryInt(c, "currentPage", 1)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid page")})
		return
	}
	pageSize, err := parseQueryInt(c, "pageSize", 10)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid page_size")})
		return
	}

	search := strings.TrimSpace(c.Query("search"))
	lessonTypes, err := parseLessonTypeFilter(c.Query("type"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid lesson type")})
		return
	}
	disciplines := parseCommaSeparatedQuery(c.Query("discipline"))
	groupNames := parseCommaSeparatedQuery(c.Query("group"))
	sort := strings.ToLower(strings.TrimSpace(c.Query("sort")))
	if sort != "asc" && sort != "desc" {
		sort = "desc"
	}

	// Опциональные фильтры: teacher и lesson_id
	var teacher pgtype.UUID
	if teacherIDStr := c.Query("teacher"); teacherIDStr != "" {
		id, err := uuid.Parse(teacherIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid teacher ID")})
			return
		}
		teacher = pgtype.UUID{
			Bytes: id,
			Valid: true,
		}
	}

	var lessonID pgtype.UUID
	if lessonIDStr := c.Query("lesson_id"); lessonIDStr != "" {
		id, err := uuid.Parse(lessonIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid lesson ID")})
			return
		}
		lessonID = pgtype.UUID{
			Bytes: id,
			Valid: true,
		}
	}

	// Вызов сервиса
	resp, err := h.lessonService.GetAllLessons(c.Request.Context(), currentPage, pageSize, teacher, lessonID, search, lessonTypes, disciplines, groupNames, sort)
	if err != nil {
		h.log.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *LessonHandler) GetLessonUserFilterData(c *gin.Context) {
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

	var teacher pgtype.UUID
	if !service.HasPermissionLevel(currentUser.Permissions, service.PermRUPManage) {
		teacher = pgtype.UUID{Bytes: currentUser.KeycloakID, Valid: true}
	}

	resp, err := h.lessonService.GetLessonUserFilterData(c.Request.Context(), teacher, c.Query("locale"))
	if err != nil {
		h.log.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *LessonHandler) GetLessonByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid lesson ID")})
		return
	}

	lesson, err := h.lessonService.GetLessonByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("lesson not found")})
			return
		}
		h.log.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, lesson)
}

func (h *LessonHandler) DownloadLesson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid lesson ID")})
		return
	}

	language := strings.TrimSpace(c.Query("locale"))
	if language == "" {
		language = strings.TrimSpace(c.Query("language"))
	}

	url, err := h.lessonService.GetLessonDownloadURL(c.Request.Context(), id, language)
	if err != nil {
		h.log.WithError(err).Error("failed to build lesson download url")
		c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("file not found")})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

func (h *LessonHandler) UpdateLesson(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": service.TranslateAPIErrorMessage("User not authenticated")})
		return
	}

	if _, ok := userInterface.(*service.User); !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage("Invalid user context")})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid lesson ID")})
		return
	}

	var req service.UpdateLessonRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
		return
	}

	if err := h.lessonService.UpdateLesson(c.Request.Context(), id, req); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": service.TranslateAPIErrorMessage("lesson not found")})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   true,
		"lessonId": id.String(),
	})
}

func (h *LessonHandler) DeleteLesson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  service.TranslateAPIErrorMessage("invalid lesson ID"),
		})
		return
	}

	if err := h.lessonService.DeleteLesson(c.Request.Context(), id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"status": "error",
				"error":  service.TranslateAPIErrorMessage("lesson not found"),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "true"})
}

func (h *LessonHandler) RecordLessonProgress(c *gin.Context) {
	lessonID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid lesson ID")})
		return
	}

	var params service.LessonProgressParams
	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid request body")})
		return
	}

	if err := h.lessonService.CreateLessonProgress(c.Request.Context(), params, lessonID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.Status(http.StatusCreated)
}

func (h *LessonHandler) GetLessonProgress(c *gin.Context) {
	lessonID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": service.TranslateAPIErrorMessage("invalid lesson ID")})
		return
	}

	progress, err := h.lessonService.GetLessonProgressByLessonID(c.Request.Context(), lessonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, progress)
}

func (h *LessonHandler) GenerateLesson(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusOK, gin.H{
			"status": false,
			"error":  service.TranslateAPIErrorMessage("user not authenticated"),
		})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusOK, gin.H{
			"status": false,
			"error":  service.TranslateAPIErrorMessage("invalid user context"),
		})
		return
	}

	var req service.GenerateLessonInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status": false,
			"error":  service.TranslateAPIErrorMessage("invalid request body"),
		})
		return
	}

	lesson_id, err := h.lessonService.GenerateLesson(context.WithoutCancel(c.Request.Context()), currentUser.KeycloakID, req)
	if err != nil {
		h.log.WithError(err).Error("generate lesson failed")
		c.JSON(http.StatusOK, gin.H{
			"status": false,
			"error":  service.TranslateAPIErrorMessage(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   true,
		"lessonId": lesson_id.String(),
	})
}
