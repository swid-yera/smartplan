package main

import (
	"log"
	"os" // Added for getEnv
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

// Helper function to get environment variables with a default value
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func normalizeRedisAddr(addr string) string {
	addr = strings.TrimSpace(addr)
	if addr == "" {
		return "localhost:6379"
	}
	if !strings.Contains(addr, ":") {
		return addr + ":6379"
	}
	return addr
}

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// ---------- CONFIG ----------
	kcCfg := config.LoadKeycloakConfig()
	dbCfg := config.LoadDBConfig()
	redisCfg := config.LoadRedisConfig()
	minioCfg := config.LoadMinioConfig()

	// ---------- DB ----------
	// Note: Ensure repository.NewPostgresDB exists and accepts *config.DBConfig
	db, err := repository.NewPostgresDB(dbCfg)
	if err != nil {
		log.Fatalf("Failed to initialize DB: %s", err)
	}
	defer db.Close()

	queries := storage.New(db)

	// ---------- MINIO ----------
	minioRepo, err := repository.NewMinioRepository(
		minioCfg.MinioEndpoint,
		minioCfg.MinioRootUser,
		minioCfg.MinioRootPassword,
		minioCfg.BucketName,
		minioCfg.MinioUseSSL,
	)
	if err != nil {
		log.Fatalf("Failed to connect to MinIO: %v", err)
	}

	// ---------- REDIS ----------
	rdb := redis.NewClient(&redis.Options{
		Addr:     normalizeRedisAddr(redisCfg.RedisAddr),
		Password: redisCfg.RedisPassword,
		DB:       redisCfg.RedisDB,
	})

	// ---------- REPOSITORIES ----------
	authRepo := repository.NewAuthPostgres(queries)
	usersRepo := repository.NewUsersPostgres(queries)
	// Passing our wrapped minioRepo to the AwardRepository
	awardRepo := repository.NewAwardRepository(queries, minioRepo)

	// ---------- SERVICES ----------
	authService := service.NewAuthService(rdb, authRepo)
	userService := service.NewUserService(usersRepo, rdb)
	rupService := service.NewRupService(repository.NewRupPostgres(queries))
	awardService := service.NewAwardService(awardRepo)

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
	kc := gocloak.NewClient(kcCfg.KeycloakURL)

	authHandler := handler.NewAuthHandler(kc, rdb, kcCfg, authService, authMiddleware.GetKeyFunc())
	userHandler := handler.NewUserHandler(userService)
	rupHandler := handler.NewRupHandler(rupService)
	awardHandler := handler.NewAwardHandler(awardService)

	// ---------- ROUTER ----------
	sessionAuthMiddleware := middleware.SessionAuth(userService)

	// Ensure your NewRouter signature matches: (auth, user, rup, award, middleware)
	router := handler.NewRouter(authHandler, userHandler, rupHandler, awardHandler, nil, sessionAuthMiddleware)
	engine := router.Init()

	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	if err := engine.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
