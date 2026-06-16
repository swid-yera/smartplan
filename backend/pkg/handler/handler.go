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
	departments           *DepartmentsHandler
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
	departments *DepartmentsHandler,
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
		departments:           departments,
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

	engine.GET("/health", func(c *gin.Context) {
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
		// список пользователей — full permission holders
		protected.GET("/users", middleware.RequirePermission(service.PermRUPView, service.PermKPIView), r.user.GetUsers)
		protected.GET("/users/:keycloak_id", middleware.RequirePermission(service.PermKPIManage, service.PermRUPManage), r.user.GetUserByKeycloakID)
		protected.GET("/users/rating", middleware.RequirePermission(service.PermKPIManage), r.user.GetUsersRating)
		// нарушения — KPI manage
		protected.POST("/users/:id/violation", middleware.RequirePermission(service.PermKPIManage), r.user.CreateViolation)
		protected.PUT("/users/:id/violation/:violation_id", middleware.RequirePermission(service.PermKPIManage), r.user.UpdateViolation)
		protected.DELETE("/users/:id/violation/:violation_id", middleware.RequirePermission(service.PermKPIManage), r.user.DeleteViolation)
		// штрафы — KPI manage
		protected.POST("/user/:teacher_id/penalty", middleware.RequirePermission(service.PermKPIManage), r.user.CreatePenalty)
		protected.GET("/user/:teacher_id/penalty", middleware.RequirePermission(service.PermKPIManage), r.user.GetPenaltiesByTeacherID)
		protected.GET("/user/:teacher_id/penalty/:penalty_id", middleware.RequirePermission(service.PermKPIManage), r.user.GetPenaltyByIDAndTeacherID)
		protected.DELETE("/user/:teacher_id/penalty/:penalty_id", middleware.RequirePermission(service.PermKPIManage), r.user.DeletePenaltyByIDAndTeacherID)

		// --- RUPS ---
		rups := protected.Group("/rups")
		{
			// GET /rups — право просмотра РУП, TEACHER видит только свои (фильтр по teacher=me)
			rups.GET("", middleware.RequirePermission(service.PermRUPView), func(c *gin.Context) {
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
				if strings.EqualFold(currentUser.Role, "TEACHER") {
					q := c.Request.URL.Query()
					q.Set("teacher", currentUser.KeycloakID.String())
					c.Request.URL.RawQuery = q.Encode()
				}
				r.rup.GetRupsPaginated(c)
			})
			rups.GET("/:id", middleware.RequirePermission(service.PermRUPView), r.rup.GetRupByID)
			rups.GET("/:id/language-generation", middleware.RequirePermission(service.PermRUPView), r.rup.GetLanguageGenerationStatus)

			// создание РУП — право управления РУП
			rups.POST("", middleware.RequirePermission(service.PermRUPView), r.rup.CreateRup)
			rups.POST("/import/parse", middleware.RequirePermission(service.PermRUPView), r.rup.ParseRupImport)
			rups.POST("/import/confirm", middleware.RequirePermission(service.PermRUPView), r.rup.ConfirmRupImport)

			// регенерация языка — право управления РУП
			rups.POST("/:id/language-generation/regenerate", middleware.RequirePermission(service.PermRUPView), r.rup.RegenerateLanguageGeneration)

			// редактирование РУП — право управления РУП
			rups.PUT("/:id", middleware.RequirePermission(service.PermRUPView), r.rup.UpdateRup)

			// смена статуса РУП — право управления РУП
			rups.PUT("/:id/status", middleware.RequirePermission(service.PermRUPView), r.rup.UpdateRupStatus)

			// артефакт подписи Kripto — право просмотра РУП
			rups.GET("/:id/signature-artifact", middleware.RequirePermission(service.PermRUPView), r.rup.GetRupSignatureArtifact)

			// удаление — право управления РУП
			rups.DELETE("/:id", middleware.RequirePermission(service.PermRUPView), r.rup.DeleteRup)

			// скачивание — право просмотра РУП
			rups.GET("/:id/download", middleware.RequirePermission(service.PermRUPView), r.rup.DownloadRup)
		}

		// --- AWARDS ---
		awards := protected.Group("/awards")
		{
			// список наград — право просмотра KPI, TEACHER видит только свои
			awards.GET("", middleware.RequirePermission(service.PermKPIView), func(c *gin.Context) {
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
				statusOrder := "view"
				if service.HasPermissionLevel(currentUser.Permissions, service.PermKPIManage) {
					statusOrder = "manage"
				}
				q := c.Request.URL.Query()
				if strings.EqualFold(currentUser.Role, "TEACHER") {
					q.Set("teacher", currentUser.KeycloakID.String())
				}
				q.Set("statusOrder", statusOrder)
				c.Request.URL.RawQuery = q.Encode()
				r.award.GetAwardsPaginated(c)
			})
			awards.GET("/departments", middleware.RequirePermission(service.PermKPIView), r.award.GetAwardDepartments)
			awards.GET("/review-teachers", middleware.RequirePermission(service.PermKPIManage), r.award.GetReviewTeachers)
			awards.GET("/users/:user_id/summary", middleware.RequirePermission(service.PermKPIView), r.award.GetUserAwardsSummary)
			awards.GET("/:id", middleware.RequirePermission(service.PermKPIView), r.award.GetAwardByID)

			// создание/редактирование награды — право управления KPI
			awards.POST("", middleware.RequirePermission(service.PermKPIView), r.award.CreateAward)
			awards.PUT("/:id", middleware.RequirePermission(service.PermKPIView), r.award.UpdateAward)

			// смена статуса награды — право управления KPI
			awards.PUT("/:id/status", middleware.RequirePermission(service.PermKPIView), r.award.UpdateAwardStatus)
			awards.PUT("/:id/points", middleware.RequirePermission(service.PermKPIFull), r.award.UpdateAwardPoints)

			// удаление — право управления KPI
			awards.DELETE("/:id", middleware.RequirePermission(service.PermKPIView), r.award.DeleteAward)

			// типы наград — KPI full
			awardTypes := awards.Group("/types")
			{
				awardTypes.GET("", middleware.RequirePermission(service.PermKPIView), r.award.GetAllAwardTypes)
				awardTypes.GET("/:id", middleware.RequirePermission(service.PermKPIView), r.award.GetAwardTypeByID)
				awardTypes.POST("", middleware.RequirePermission(service.PermKPIFull), r.award.CreateAwardType)
				awardTypes.PUT("/:id", middleware.RequirePermission(service.PermKPIFull), r.award.UpdateAwardType)
				awardTypes.DELETE("/:id", middleware.RequirePermission(service.PermKPIFull), r.award.DeleteType)
			}
		}

		// --- KPI CATEGORIES ---
		categories := protected.Group("/categories")
		{
			// чтение — право просмотра KPI
			categories.GET("", middleware.RequirePermission(service.PermKPIView), r.category.GetCategories)
			categories.GET("/:id", middleware.RequirePermission(service.PermKPIView), r.category.GetCategoryByID)
			// изменение структуры категорий — KPI full
			categories.POST("", middleware.RequirePermission(service.PermKPIFull), r.category.CreateCategory)
			categories.PUT("/:id", middleware.RequirePermission(service.PermKPIFull), r.category.UpdateCategory)
			categories.DELETE("/:id", middleware.RequirePermission(service.PermKPIFull), r.category.DeleteCategory)
		}

		// --- STATISTICS ---
		if r.statistics != nil {
			statistics := protected.Group("/statistics")
			{
				statistics.GET("/teachers/rating", middleware.RequirePermission(service.PermKPIManage, service.PermKPIFull), r.statistics.GetTeachersRating)
				statistics.GET("/departments/top", middleware.RequirePermission(service.PermKPIManage), r.statistics.GetTopDepartments)
				statistics.GET("/departments/top-teachers", middleware.RequirePermission(service.PermKPIManage), r.statistics.GetTopTeachersByDepartment)
				statistics.GET("/departments/:id/teachers", middleware.RequirePermission(service.PermKPIManage), r.statistics.GetTeachersByDepartment)
			}
		}

		// --- GROUPS ---
		groups := protected.Group("/groups")
		{
			// чтение групп — все роли
			groups.GET("", r.groups.GetAllGroups)
			// синхронизация с Keycloak — full permission holders
			groups.POST("/sync", middleware.RequirePermission(service.PermRUPFull), r.groups.SyncGroups)
		}

		// --- DEPARTMENTS ---
		if r.departments != nil {
			departments := protected.Group("/departments")
			{
				departments.GET("", middleware.RequirePermission(service.PermKPIFull, service.PermRUPFull), r.departments.GetAllDepartments)
				departments.POST("/sync", middleware.RequirePermission(service.PermKPIFull, service.PermRUPFull), r.departments.SyncDepartments)
			}
		}

		// --- LESSONS ---
		lessons := protected.Group("/lessons")
		{
			// список уроков: RUP_VIEW видит свои/contact, RUP_MANAGE/FULL видят все
			lessons.GET("", middleware.RequirePermission(service.PermRUPView), func(c *gin.Context) {
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
				if !service.HasPermissionLevel(currentUser.Permissions, service.PermRUPManage) {
					q := c.Request.URL.Query()
					q.Set("teacher", currentUser.KeycloakID.String())
					c.Request.URL.RawQuery = q.Encode()
				}
				r.lesson.GetLessons(c)
			})
			lessons.GET("/user-filter-data", middleware.RequirePermission(service.PermRUPView), r.lesson.GetLessonUserFilterData)
			lessons.GET("/:id", middleware.RequirePermission(service.PermRUPView), r.lesson.GetLessonByID)
			lessons.GET("/:id/download", middleware.RequirePermission(service.PermRUPView), r.lesson.DownloadLesson)
			lessons.GET("/:id/progress", middleware.RequirePermission(service.PermRUPView), r.lesson.GetLessonProgress)

			// создание/редактирование/удаление уроков — RUP view/manage
			lessons.POST("", middleware.RequirePermission(service.PermRUPView), r.lesson.CreateLesson)
			lessons.POST("/generate-lesson", middleware.RequirePermission(service.PermRUPView), r.lesson.GenerateLesson)
			lessons.PUT("/:id", middleware.RequirePermission(service.PermRUPView), r.lesson.UpdateLesson)
			lessons.DELETE("/:id", middleware.RequirePermission(service.PermRUPView), r.lesson.DeleteLesson)
			lessons.POST("/:id/progress", middleware.RequirePermission(service.PermRUPView), r.lesson.RecordLessonProgress)
		}

		// --- AI (создание РУП через AI) — RUP manage ---
		if r.ai != nil {
			ai := protected.Group("/ai", middleware.RequirePermission(service.PermRUPView))
			{
				ai.POST("/rups/meta", middleware.RequirePermission(service.PermRUPView), r.ai.GenerateRupMeta)
				ai.POST("/rups/resources", middleware.RequirePermission(service.PermRUPView), r.ai.GenerateResources)
				ai.POST("/rups/disciplines", middleware.RequirePermission(service.PermRUPView), r.ai.GenerateDisciplines)
				ai.POST("/rups/topics", middleware.RequirePermission(service.PermRUPView), r.ai.GenerateTopicsForDiscipline)
			}
		}

		// --- PERMISSIONS ---
		if r.permissions != nil {
			perms := protected.Group("/permissions")
			{
				// список пользователей с правами — full permission holders
				perms.GET("/specials", middleware.RequirePermission(service.PermKPIFull, service.PermRUPFull), r.permissions.ListSpecialUsers)
				// выдача/обновление прав — full permission holders
				perms.PUT("/:user_id", middleware.RequirePermission(service.PermKPIFull, service.PermRUPFull), r.permissions.SetPermissions)
				// просмотр прав — full permission holders
				perms.GET("/:user_id", middleware.RequirePermission(service.PermKPIFull, service.PermRUPFull), r.permissions.GetPermissions)
				// отзыв прав — full permission holders
				perms.DELETE("/:user_id", middleware.RequirePermission(service.PermKPIFull, service.PermRUPFull), r.permissions.RevokePermissions)
			}
		}
	}

	return engine
}
