package handler

import (
	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"
	"errors"
	"net/http"
	"strconv"

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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}
	var lessonParams service.LessonParams
	if err := c.ShouldBindJSON(&lessonParams); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	lessonParams.TeacherID = currentUser.KeycloakID

	if err := h.lessonService.CreateLesson(c.Request.Context(), lessonParams); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusCreated)
}

func (h *LessonHandler) GetLessons(c *gin.Context) {
	// Парсим query-параметры
	currentPage, err := parseQueryInt(c, "currentPage", 1)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid page"})
		return
	}
	pageSize, err := parseQueryInt(c, "pageSize", 10)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid page_size"})
		return
	}

	// Опциональные фильтры: teacher и lesson_id
	var teacher pgtype.UUID
	if teacherIDStr := c.Query("teacher"); teacherIDStr != "" {
		id, err := uuid.Parse(teacherIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid teacher ID"})
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
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
			return
		}
		lessonID = pgtype.UUID{
			Bytes: id,
			Valid: true,
		}
	}

	// Вызов сервиса
	resp, err := h.lessonService.GetAllLessons(c.Request.Context(), currentPage, pageSize, teacher, lessonID)
	if err != nil {
		h.log.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *LessonHandler) GetLessonByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	lesson, err := h.lessonService.GetLessonByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "lesson not found"})
			return
		}
		h.log.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lesson)
}

func (h *LessonHandler) UpdateLesson(c *gin.Context) {
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

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	var req service.RegenerateLessonByIDInput

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	lessonID, err := h.lessonService.RegenerateLessonByID(c.Request.Context(), id, currentUser.KeycloakID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   true,
		"lessonId": lessonID.String(),
	})
}

func (h *LessonHandler) DeleteLesson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "invalid lesson ID",
		})
		return
	}

	if err := h.lessonService.DeleteLesson(c.Request.Context(), id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"status": "error",
				"error":  "lesson not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "true"})
}

func (h *LessonHandler) RecordLessonProgress(c *gin.Context) {
	lessonID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	var params service.LessonProgressParams
	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := h.lessonService.CreateLessonProgress(c.Request.Context(), params, lessonID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusCreated)
}

func (h *LessonHandler) GetLessonProgress(c *gin.Context) {
	lessonID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	progress, err := h.lessonService.GetLessonProgressByLessonID(c.Request.Context(), lessonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, progress)
}

func (h *LessonHandler) GenerateLesson(c *gin.Context) {
	userInterface, exists := c.Get(middleware.ContextUserKey)
	if !exists {
		c.JSON(http.StatusOK, gin.H{
			"status": false,
			"error":  "user not authenticated",
		})
		return
	}

	currentUser, ok := userInterface.(*service.User)
	if !ok {
		c.JSON(http.StatusOK, gin.H{
			"status": false,
			"error":  "invalid user context",
		})
		return
	}

	var req service.GenerateLessonInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status": false,
			"error":  "invalid request body",
		})
		return
	}

	lesson_id, err := h.lessonService.GenerateLesson(c.Request.Context(), currentUser.KeycloakID, req)
	if err != nil {
		h.log.WithError(err).Error("generate lesson failed")
		c.JSON(http.StatusOK, gin.H{
			"status": false,
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   true,
		"lessonId": lesson_id.String(),
	})
}
