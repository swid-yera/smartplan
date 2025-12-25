package main

import (
	"log"
	"strings"

	"eduplan/backend/config"
	"eduplan/backend/pkg/handler"
	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/repository"
	"eduplan/backend/pkg/service"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/Nerzal/gocloak/v13"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
)

func normalizeRedisAddr(addr string) string {
	addr = strings.TrimSpace(addr)
	if addr == "" {
		return "localhost:6379"
	}
	// если дали "localhost" без порта — добавляем 6379
	if !strings.Contains(addr, ":") {
		return addr + ":6379"
	}
	return addr
}

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// ---------- CONFIG ----------
	kcCfg := config.LoadKeycloakConfig()
	if kcCfg == nil {
		log.Fatal("LoadKeycloakConfig returned nil")
	}
	dbCfg := config.LoadDBConfig()
	redisCfg := config.LoadRedisConfig()

	log.Printf(
		"cfg: keycloak=%s realm=%s client=%s frontend=%s base=%s redis=%s",
		kcCfg.KeycloakURL,
		kcCfg.KeycloakRealm,
		kcCfg.KeycloakClientID,
		kcCfg.FrontendURL,
		kcCfg.BaseURL,
		normalizeRedisAddr(redisCfg.RedisAddr),
	)

	// ---------- DB ----------
	db, err := repository.NewPostgresDB(dbCfg)
	if err != nil {
		log.Fatalf("Failed to initialize DB: %s", err)
	}
	defer db.Close()

	queries := storage.New(db)

	// ---------- REPOSITORIES ----------
	authRepo := repository.NewAuthPostgres(queries)
	usersRepo := repository.NewUsersPostgres(queries)

	// ---------- REDIS ----------
	rdb := redis.NewClient(&redis.Options{
		Addr:     normalizeRedisAddr(redisCfg.RedisAddr),
		Password: redisCfg.RedisPassword,
		DB:       redisCfg.RedisDB,
	})

	kc := gocloak.NewClient(kcCfg.KeycloakURL)

	// ---------- SERVICES ----------

	authService := service.NewAuthService(rdb, authRepo) // работает только с AuthRepository
	userService := service.NewUserService(usersRepo, rdb)
	rupService := service.NewRupService(repository.NewRupPostgres(queries))

	// ---------- MIDDLEWARE ----------
	authMiddleware, err := middleware.NewAuthMiddleware(
		kcCfg.KeycloakURL,
		kcCfg.KeycloakRealm,
		rdb,
		kcCfg,
	)
	if err != nil {
		log.Fatalf("Failed to init auth middleware: %v", err)
	}

	// ---------- HANDLERS ----------
	authHandler := handler.NewAuthHandler(
		kc,
		rdb,
		kcCfg,
		authService,
		authMiddleware.GetKeyFunc(),
	)
	userHandler := handler.NewUserHandler(userService)
	rupHandler := handler.NewRupHandler(rupService)

	// ---------- ROUTER ----------
	sessionAuthMiddleware := middleware.SessionAuth(userService)
	router := handler.NewRouter(authHandler, userHandler, rupHandler, nil, sessionAuthMiddleware)
	engine := router.Init()

	port := "8080"
	log.Printf("Server starting on port %s", port)
	if err := engine.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
