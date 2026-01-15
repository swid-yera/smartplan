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
	award                 *AwardHandler // Added
	groups                *GroupsHandler
	webhooks              *WebhooksHandler
	sessionAuthMiddleware gin.HandlerFunc
}

func NewRouter(
	auth *AuthHandler,
	user *UserHandler,
	rup *RupHandler,
	award *AwardHandler, // Added
	groups *GroupsHandler,
	webhooks *WebhooksHandler,
	sessionAuthMiddleware gin.HandlerFunc,
) *Router {
	return &Router{
		auth:                  auth,
		user:                  user,
		rup:                   rup,
		award:                 award, // Added
		groups:                groups,
		webhooks:              webhooks,
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

	// --- API ---
	api := engine.Group("/api")
	api.Use(r.sessionAuthMiddleware) // Use the field from struct
	{
		api.GET("/me", r.user.GetMe)
		api.GET("/users", r.user.GetAllUsers)
		api.GET("/users/:keycloak_id", r.user.GetUserByKeycloakID)

		// RUP routes
		rups := api.Group("/rups")
		{
			rups.POST("/", r.rup.CreateRup)
			rups.GET("/", r.rup.GetAllRups)
			rups.GET("/:id", r.rup.GetRupByID)
			rups.PUT("/:id/status", r.rup.UpdateRupStatus)
			rups.DELETE("/:id", r.rup.DeleteRup)
			rups.GET("/methodist/:id", r.rup.GetRupsByMethodist)
		}

		// --- AWARD ROUTES ---
		awards := api.Group("/awards")
		{
			// POST /api/awards/
			awards.POST("/", r.award.CreateAward)
			awards.GET("/", r.award.GetAllAwards)
			awards.GET("/:id", r.award.GetAwardByID)
			awards.PUT("/:id/status", r.award.UpdateAwardStatus)
			awards.DELETE("/:id", r.award.DeleteAward)
			awards.GET("/methodist/:id", r.award.GetAwardsByMethodist)
		}

		groups := api.Group("/groups")
		{
			groups.GET("", r.groups.GetAll)
			groups.POST("/sync", r.groups.Sync) // ⚠ protected
		}
	}

	// --- WEBHOOKS ---
	webhooksGroup := engine.Group("/webhooks")
	{
		webhooksGroup.POST("/keycloak", r.webhooks.KeycloakWebhook)
	}

	return engine
}
