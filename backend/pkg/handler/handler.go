package handler

import (
	"net/http"

	"eduplan/backend/pkg/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Router struct {
	auth                  *AuthHandler
	user                  *UserHandler
	rup                   *RupHandler
	award                 *AwardHandler
	category              *CategoryHandler
	groups                *GroupsHandler
	lesson                *LessonHandler
	ai                    *AIHandler
	webhooks              *WebhooksHandler
	sessionAuthMiddleware gin.HandlerFunc
	corsAllowedOrigins    []string
}

func NewRouter(
	auth *AuthHandler,
	user *UserHandler,
	rup *RupHandler,
	award *AwardHandler,
	category *CategoryHandler,
	groups *GroupsHandler,
	lesson *LessonHandler,
	ai *AIHandler,
	webhooks *WebhooksHandler,
	sessionAuthMiddleware gin.HandlerFunc,
	corsAllowedOrigins []string,
) *Router {
	return &Router{
		auth:                  auth,
		user:                  user,
		rup:                   rup,
		award:                 award,
		category:              category,
		webhooks:              webhooks,
		groups:                groups,
		lesson:                lesson,
		ai:                    ai,
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
		protected.GET("/users", r.user.GetUsers)
		protected.GET("/users/:keycloak_id", r.user.GetUserByKeycloakID)
		protected.GET("/users/rating", r.user.GetUsersRating)

		// --- RUPS ---
		rups := protected.Group("/rups")
		{
			rups.GET("", r.rup.GetRupsPaginated)
			rups.GET("/:id", r.rup.GetRupByID)
			rups.POST("", r.rup.CreateRup)
			rups.POST("/:id/approve-challenge", r.rup.CreateApproveChallenge)
			rups.PUT("/:id/status", r.rup.UpdateRupStatus)
			rups.PUT("/:id", r.rup.UpdateRup)
			rups.DELETE("/:id", r.rup.DeleteRup)
			rups.GET("/:id/download", r.rup.DownloadRup)
		}

		// --- AWARDS ---
		awards := protected.Group("/awards")
		{
			awards.GET("", r.award.GetAwardsPaginated)
			awards.GET("/:id", r.award.GetAwardByID)

			awards.POST("", r.award.CreateAward)

			awards.PUT("/:id", r.award.UpdateAward)
			awards.PUT("/:id/status", r.award.UpdateAwardStatus)

			awards.DELETE("/:id", r.award.DeleteAward)

			awardTypes := awards.Group("/types")
			{
				awardTypes.GET("", r.award.GetAllAwardTypes)
				awardTypes.POST("", r.award.CreateAwardType)
				awardTypes.GET("/:id", r.award.GetAwardTypeByID)
				awardTypes.PUT("/:id", r.award.UpdateAwardType)
				awardTypes.DELETE("/:id", r.award.DeleteType)
			}
		}

		// --- KPI CATEGORIES ---
		categories := protected.Group("/categories")
		{
			categories.GET("", r.category.GetCategories)
			categories.POST("", r.category.CreateCategory)
			categories.GET("/:id", r.category.GetCategoryByID)
			categories.PUT("/:id", r.category.UpdateCategory)
			categories.DELETE("/:id", r.category.DeleteCategory)
		}

		// --- GROUPS ---
		groups := protected.Group("/groups")
		{
			groups.GET("", r.groups.GetAllGroups)
			groups.POST("/sync", r.groups.SyncGroups)
		}

		// --- LESSONS ---
		lessons := protected.Group("/lessons")
		{
			lessons.GET("", r.lesson.GetLessons)
			lessons.GET("/:id", r.lesson.GetLessonByID)
			lessons.POST("", r.lesson.CreateLesson)
			lessons.POST("/generate-lesson", r.lesson.GenerateLesson)
			lessons.PUT("/:id", r.lesson.UpdateLesson)
			lessons.DELETE("/:id", r.lesson.DeleteLesson)

			lessons.GET("/:id/progress", r.lesson.GetLessonProgress)
			lessons.POST("/:id/progress", r.lesson.RecordLessonProgress)
		}

		// --- AI ---
		if r.ai != nil {
			ai := protected.Group("/ai")
			{
				ai.POST("/rups/meta", r.ai.GenerateRupMeta)
				ai.POST("/rups/resources", r.ai.GenerateResources)
				ai.POST("/rups/disciplines", r.ai.GenerateDisciplines)
				ai.POST("/rups/topics", r.ai.GenerateTopicsForDiscipline)
			}
		}
	}

	return engine
}
