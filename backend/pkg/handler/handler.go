package handler

import (
	"net/http"

	"eduplan/backend/pkg/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Router struct {
	auth     *AuthHandler
	user     *UserHandler
	webhooks *WebhooksHandler
}

func NewRouter(
	auth *AuthHandler,
	user *UserHandler,
	webhooks *WebhooksHandler,
) *Router {
	return &Router{
		auth:     auth,
		user:     user,
		webhooks: webhooks,
	}
}

func (r *Router) Init() *gin.Engine {
	engine := gin.New()

	// стандартные middleware (без gin.Default(), чтобы не было дублей)
	engine.Use(gin.Logger())
	engine.Use(gin.Recovery())

	// чтобы убрать warning "trusted all proxies"
	_ = engine.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// healthcheck (удобно)
	engine.GET("/healthz", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// CORS (обычно нужен только фронт)
	engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	// ваш middleware
	engine.Use(middleware.ValidateRequestHeaders())

	// --- AUTH ---
	// Оставляем и /login (чтобы как сейчас в браузере не было 404),
	// и /auth/login (более “чистый” вариант)
	engine.GET("/login", r.auth.Login)
	engine.GET("/callback", middleware.ValidateQueryParams("code"), r.auth.Callback)
	engine.GET("/logout", r.auth.Logout)

	auth := engine.Group("/auth")
	{
		auth.GET("/login", r.auth.Login)
		auth.GET("/callback", middleware.ValidateQueryParams("code"), r.auth.Callback)
		auth.GET("/logout", r.auth.Logout)
	}

	// --- API ---
	api := engine.Group("/api")
	{
		api.GET("/me", r.user.GetMe)
	}

	// --- WEBHOOKS ---
	webhooks := engine.Group("/webhooks")
	{
		webhooks.POST("/keycloak", r.webhooks.KeycloakWebhook)
	}

	return engine
}
