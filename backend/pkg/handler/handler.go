package handler

import (
	"net/http"
	"strings"

	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Router struct {
	auth                  *AuthHandler
	user                  *UserHandler
	rup                   *RupHandler
	award                 *AwardHandler
	category              *CategoryHandler
	statistics            *StatisticsHandler
	groups                *GroupsHandler
	lesson                *LessonHandler
	ai                    *AIHandler
	webhooks              *WebhooksHandler
	permissions           *PermissionHandler
	sessionAuthMiddleware gin.HandlerFunc
	corsAllowedOrigins    []string
}

func NewRouter(
	auth *AuthHandler,
	user *UserHandler,
	rup *RupHandler,
	award *AwardHandler,
	category *CategoryHandler,
	statistics *StatisticsHandler,
	groups *GroupsHandler,
	lesson *LessonHandler,
	ai *AIHandler,
	webhooks *WebhooksHandler,
	permissions *PermissionHandler,
	sessionAuthMiddleware gin.HandlerFunc,
	corsAllowedOrigins []string,
) *Router {
	return &Router{
		auth:                  auth,
		user:                  user,
		rup:                   rup,
		award:                 award,
		category:              category,
		statistics:            statistics,
		webhooks:              webhooks,
		groups:                groups,
		lesson:                lesson,
		ai:                    ai,
		permissions:           permissions,
		sessionAuthMiddleware: sessionAuthMiddleware,
		corsAllowedOrigins:    corsAllowedOrigins,
	}
}

func (r *Router) Init() *gin.Engine {
	engine := gin.New()

	engine.Use(gin.Logger())
	engine.Use(gin.Recovery())

	_ = engine.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	engine.GET("/healthz", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	corsOrigins := r.corsAllowedOrigins
	if len(corsOrigins) == 0 {
		corsOrigins = []string{"http://localhost:3000"}
	}

	engine.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	engine.Use(middleware.ValidateRequestHeaders())

	// --- AUTH ---
	engine.GET("/login", r.auth.Login)
	engine.GET("/callback", middleware.ValidateQueryParams("code"), r.auth.Callback)
	engine.GET("/logout", r.auth.Logout)

	if r.webhooks != nil {
		webhooks := engine.Group("/webhooks")
		{
			webhooks.POST("/keycloak", r.webhooks.KeycloakWebhook)
		}
	}

	// --- API ---
	protected := engine.Group("/")
	protected.Use(r.sessionAuthMiddleware)
	{
		// --- USER ---
		protected.GET("/me", r.user.GetMe)
		// список пользователей — методист и админ
		protected.GET("/users", middleware.RequireRole("METHODIST", "ADMIN"), r.user.GetUsers)
		protected.GET("/users/:keycloak_id", r.user.GetUserByKeycloakID)
		protected.GET("/users/rating", r.user.GetUsersRating)
		// нарушения — только методист и админ (роль уже проверяется внутри, но дублируем на уровне роутера)
		protected.POST("/users/:id/violation", middleware.RequireRole("METHODIST", "ADMIN"), r.user.CreateViolation)
		protected.PUT("/users/:id/violation/:violation_id", middleware.RequireRole("METHODIST", "ADMIN"), r.user.UpdateViolation)
		protected.DELETE("/users/:id/violation/:violation_id", middleware.RequireRole("METHODIST", "ADMIN"), r.user.DeleteViolation)
		// штрафы — только методист и админ
		protected.POST("/user/:teacher_id/penalty", middleware.RequireRole("METHODIST", "ADMIN"), r.user.CreatePenalty)
		protected.GET("/user/:teacher_id/penalty", middleware.RequireRole("METHODIST", "ADMIN"), r.user.GetPenaltiesByTeacherID)
		protected.GET("/user/:teacher_id/penalty/:penalty_id", middleware.RequireRole("METHODIST", "ADMIN"), r.user.GetPenaltyByIDAndTeacherID)
		protected.DELETE("/user/:teacher_id/penalty/:penalty_id", middleware.RequireRole("METHODIST", "ADMIN"), r.user.DeletePenaltyByIDAndTeacherID)

		// --- RUPS ---
		rups := protected.Group("/rups")
		{
			// GET /rups — все роли, но TEACHER видит только свои (фильтр по teacher=me)
			rups.GET("", func(c *gin.Context) {
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
				if strings.EqualFold(currentUser.Role, "TEACHER") {
					q := c.Request.URL.Query()
					q.Set("teacher", currentUser.KeycloakID.String())
					c.Request.URL.RawQuery = q.Encode()
				}
				r.rup.GetRupsPaginated(c)
			})
			rups.GET("/:id", r.rup.GetRupByID)
			rups.GET("/:id/language-generation", r.rup.GetLanguageGenerationStatus)

			// создание РУП — только teacher и admin
			rups.POST("" /*middleware.RequireRole("TEACHER", "ADMIN"),*/, r.rup.CreateRup)

			// регенерация языка — только teacher (своего) и admin; доп. проверка внутри хендлера
			rups.POST("/:id/language-generation/regenerate", middleware.RequireRole("TEACHER", "ADMIN"), r.rup.RegenerateLanguageGeneration)

			// редактирование РУП — только teacher (своего/контакт) и admin; доп. проверка внутри хендлера
			rups.PUT("/:id", middleware.RequireRole("TEACHER", "ADMIN"), r.rup.UpdateRup)

			// смена статуса: IN_REVIEW — teacher/admin; APPROVED/REJECTED — methodist/admin
			// хендлер сам разбирает какой статус и кто может его выставить
			rups.PUT("/:id/status", r.rup.UpdateRupStatus)

			// удаление — только teacher (создатель) и admin; доп. проверка внутри хендлера
			rups.DELETE("/:id", middleware.RequireRole("TEACHER", "ADMIN"), r.rup.DeleteRup)

			// скачивание — все роли (хендлер проверяет статус APPROVED)
			rups.GET("/:id/download", r.rup.DownloadRup)
		}

		// --- AWARDS ---
		awards := protected.Group("/awards")
		{
			// список наград — все роли, но TEACHER видит только свои
			awards.GET("", func(c *gin.Context) {
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
				if strings.EqualFold(currentUser.Role, "TEACHER") {
					q := c.Request.URL.Query()
					q.Set("teacher", currentUser.KeycloakID.String())
					c.Request.URL.RawQuery = q.Encode()
				}
				r.award.GetAwardsPaginated(c)
			})
			awards.GET("/departments", r.award.GetAwardDepartments)
			awards.GET("/:id", r.award.GetAwardByID)

			// создание/редактирование награды — teacher и admin
			awards.POST("", middleware.RequireRole("TEACHER", "ADMIN"), r.award.CreateAward)
			awards.PUT("/:id", middleware.RequireRole("TEACHER", "ADMIN"), r.award.UpdateAward)

			// смена статуса награды — методист и admin
			awards.PUT("/:id/status", middleware.RequireRole("METHODIST", "TEACHER", "ADMIN"), r.award.UpdateAwardStatus)

			// удаление — teacher и admin
			awards.DELETE("/:id", middleware.RequireRole("TEACHER", "ADMIN"), r.award.DeleteAward)

			// типы наград — только admin
			awardTypes := awards.Group("/types")
			{
				awardTypes.GET("", r.award.GetAllAwardTypes)
				awardTypes.GET("/:id", r.award.GetAwardTypeByID)
				awardTypes.POST("", middleware.RequireRole("ADMIN"), r.award.CreateAwardType)
				awardTypes.PUT("/:id", middleware.RequireRole("ADMIN"), r.award.UpdateAwardType)
				awardTypes.DELETE("/:id", middleware.RequireRole("ADMIN"), r.award.DeleteType)
			}
		}

		// --- KPI CATEGORIES ---
		categories := protected.Group("/categories")
		{
			// чтение — все роли
			categories.GET("", r.category.GetCategories)
			categories.GET("/:id", r.category.GetCategoryByID)
			// изменение структуры категорий — только admin
			categories.POST("", middleware.RequireRole("ADMIN"), r.category.CreateCategory)
			categories.PUT("/:id", middleware.RequireRole("ADMIN"), r.category.UpdateCategory)
			categories.DELETE("/:id", middleware.RequireRole("ADMIN"), r.category.DeleteCategory)
		}

		// --- STATISTICS ---
		if r.statistics != nil {
			statistics := protected.Group("/statistics")
			{
				statistics.GET("/teachers/rating", r.statistics.GetTeachersRating)
				statistics.GET("/departments/top", r.statistics.GetTopDepartments)
				statistics.GET("/departments/top-teachers", r.statistics.GetTopTeachersByDepartment)
				statistics.GET("/departments/:id/teachers", r.statistics.GetTeachersByDepartment)
			}
		}

		// --- GROUPS ---
		groups := protected.Group("/groups")
		{
			// чтение групп — все роли
			groups.GET("", r.groups.GetAllGroups)
			// синхронизация с Keycloak — только admin
			groups.POST("/sync", middleware.RequireRole("ADMIN"), r.groups.SyncGroups)
		}

		// --- LESSONS ---
		lessons := protected.Group("/lessons")
		{
			// список уроков — все роли, TEACHER видит только свои
			lessons.GET("", func(c *gin.Context) {
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
				if strings.EqualFold(currentUser.Role, "TEACHER") {
					q := c.Request.URL.Query()
					q.Set("teacher", currentUser.KeycloakID.String())
					c.Request.URL.RawQuery = q.Encode()
				}
				r.lesson.GetLessons(c)
			})
			lessons.GET("/:id", r.lesson.GetLessonByID)
			lessons.GET("/:id/download", r.lesson.DownloadLesson)
			lessons.GET("/:id/progress", r.lesson.GetLessonProgress)

			// создание/редактирование/удаление уроков — только teacher и admin
			lessons.POST("", middleware.RequireRole("TEACHER", "ADMIN"), r.lesson.CreateLesson)
			lessons.POST("/generate-lesson", middleware.RequireRole("TEACHER", "ADMIN"), r.lesson.GenerateLesson)
			lessons.PUT("/:id", middleware.RequireRole("TEACHER", "ADMIN"), r.lesson.UpdateLesson)
			lessons.DELETE("/:id", middleware.RequireRole("TEACHER", "ADMIN"), r.lesson.DeleteLesson)
			lessons.POST("/:id/progress", middleware.RequireRole("TEACHER", "ADMIN"), r.lesson.RecordLessonProgress)
		}

		// --- AI (создание РУП через AI) — только teacher и admin ---
		if r.ai != nil {
			ai := protected.Group("/ai", middleware.RequireRole("TEACHER", "ADMIN"))
			{
				ai.POST("/rups/meta", r.ai.GenerateRupMeta)
				ai.POST("/rups/resources", r.ai.GenerateResources)
				ai.POST("/rups/disciplines", r.ai.GenerateDisciplines)
				ai.POST("/rups/topics", r.ai.GenerateTopicsForDiscipline)
			}
		}

		// --- PERMISSIONS ---
		if r.permissions != nil {
			perms := protected.Group("/permissions")
			{
				// список SPECIAL-пользователей с правами — только admin
				perms.GET("/specials", middleware.RequireRole("ADMIN"), r.permissions.ListSpecialUsers)
				// выдача/обновление прав — только admin
				perms.PUT("/:user_id", middleware.RequireRole("ADMIN"), r.permissions.SetPermissions)
				// просмотр прав — admin или сам пользователь (доп. проверка внутри хендлера)
				perms.GET("/:user_id", r.permissions.GetPermissions)
				// отзыв прав — только admin
				perms.DELETE("/:user_id", middleware.RequireRole("ADMIN"), r.permissions.RevokePermissions)
			}
		}
	}

	return engine
}
