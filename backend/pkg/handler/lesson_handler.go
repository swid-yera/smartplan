package handler

import (
	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

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

func (h *LessonHandler) UpdateLesson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	var req struct {
		service.LessonParams
		Progress []service.LessonProgressParams `json:"progress"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := h.lessonService.UpdateLesson(c.Request.Context(), id, req.LessonParams, req.Progress); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *LessonHandler) DeleteLesson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	if err := h.lessonService.DeleteLesson(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *LessonHandler) GetAllLessons(c *gin.Context) {
	from := c.Query("from")
	to := c.Query("to")
	if from == "" || to == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from and to are required"})
		return
	}

	page := 1
	pageSize := 10
	if v := c.Query("currentPage"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			page = p
		}
	}
	if v := c.Query("pageSize"); v != "" {
		if ps, err := strconv.Atoi(v); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	limit := int32(pageSize)
	offset := int32((page - 1) * pageSize)

	lessons, err := h.lessonService.GetAllLessons(c.Request.Context(), from, to, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, lessons)
}

func (h *LessonHandler) GetLessonsByTeacher(c *gin.Context) {
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

	from := c.Query("from")
	to := c.Query("to")
	if from == "" || to == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from and to are required"})
		return
	}

	page := 1
	pageSize := 10
	if v := c.Query("currentPage"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			page = p
		}
	}
	if v := c.Query("pageSize"); v != "" {
		if ps, err := strconv.Atoi(v); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	limit := int32(pageSize)
	offset := int32((page - 1) * pageSize)

	lessons, err := h.lessonService.GetLessonsTeacher(c.Request.Context(), currentUser.KeycloakID, from, to, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

func (h *LessonHandler) GetLessonByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	lesson, err := h.lessonService.GetLessonByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lesson)
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
