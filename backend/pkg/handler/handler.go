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
	groups                *GroupsHandler
	webhooks              *WebhooksHandler
	sessionAuthMiddleware gin.HandlerFunc
}

func NewRouter(
	auth *AuthHandler,
	user *UserHandler,
	rup *RupHandler,
	award *AwardHandler,
	groups *GroupsHandler,
	webhooks *WebhooksHandler,
	sessionAuthMiddleware gin.HandlerFunc,
) *Router {
	return &Router{
		auth:                  auth,
		user:                  user,
		rup:                   rup,
		award:                 award,
		webhooks:              webhooks,
		groups:                groups,
		sessionAuthMiddleware: sessionAuthMiddleware,
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

	engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
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

	webhooks := engine.Group("/webhooks")
	{
		webhooks.POST("/keycloak", r.webhooks.KeycloakWebhook)
	}

	// --- API ---
	protected := engine.Group("/")
	protected.Use(r.sessionAuthMiddleware)
	{
		// --- USER ---
		protected.GET("/me", r.user.GetMe)
		protected.GET("/users", r.user.GetUsers)
		protected.GET("/users/:keycloak_id", r.user.GetUserByKeycloakID)

		// --- RUPS ---
		rups := protected.Group("/rups")
		{
			rups.GET("", r.rup.GetRupsPaginated)
			rups.GET("/:id", r.rup.GetRupByID)
			rups.POST("", r.rup.CreateRup)
			rups.PUT("/:id/status", r.rup.UpdateRupStatus)
			rups.PUT("/:id", r.rup.UpdateRup)
			rups.DELETE("/:id", r.rup.DeleteRup)
			rups.GET("/:id/download", r.rup.DownloadRup)
		}

		// --- AWARDS ---
		awards := protected.Group("/awards")
		{
			awards.GET("", r.award.GetAllAwards)
			awards.GET("/:id", r.award.GetAwardByID)
			awards.GET("/methodist/:id", r.award.GetAwardsByMethodist)
			awards.GET("/teacher/:id", r.award.GetAwardsByTeacher)

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

		// --- GROUPS ---
		groups := protected.Group("/groups")
		{
			groups.GET("", r.groups.GetAllGroups)
			groups.POST("/sync", r.groups.SyncGroups)
		}
	}

	return engine
}
