package main

import (
	"net/http"
	"os" // Added for getEnv
	"strings"
	"time"

	"eduplan/backend/config"
	"eduplan/backend/pkg/handler"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/middleware"
	"eduplan/backend/pkg/repository"
	"eduplan/backend/pkg/service"
	kcservice "eduplan/backend/pkg/service/keycloak"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/Nerzal/gocloak/v13"
	"github.com/redis/go-redis/v9"
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
	// ---------- LOGGER ----------
	log := helpers.NewLogger()

	// ---------- CONFIG ----------
	kcCfg := config.LoadKeycloakConfig()
	dbCfg := config.LoadDBConfig()
	redisCfg := config.LoadRedisConfig()
	minioCfg := config.LoadMinioConfig()
	docCfg := config.LoadDocumentRenderConfig()

	// ---------- DB ----------
	// Note: Ensure repository.NewPostgresDB exists and accepts *config.DBConfig
	db, err := repository.NewPostgresDB(dbCfg)
	if err != nil {
		log.Fatalf("Failed to initialize DB: %v", err)
	}
	defer db.Close()

	queries := storage.New(db)

	groupsRepo := repository.NewGroupsPostgres(db)

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

	httpClient := &http.Client{
		Timeout: 60 * time.Second,
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
	rupRepo := repository.NewRupPostgres(queries)
	lessonRepo := repository.NewLessonRepository(queries)

	kcSyncClient := kcservice.NewClient(
		kcCfg,
	)

	// ---------- SERVICES ----------
	authService := service.NewAuthService(rdb, authRepo, kcCfg, log)
	userService := service.NewUserService(usersRepo, rdb)
	rupService := service.NewRupService(rupRepo, docCfg, httpClient, minioRepo)
<<<<<<< HEAD
	awardService := service.NewAwardService(awardRepo, log)
	lessonService := service.NewLessonService(lessonRepo, log)
=======
	awardService := service.NewAwardService(awardRepo, minioRepo, log)
>>>>>>> 999298b59f2fa7ce4186e419c58b7594d0c992a7
	groupsSyncService := kcservice.NewGroupsSyncService(kcSyncClient, groupsRepo)
	syncGuard := service.NewSyncGuard(1 * time.Minute)

	// ---------- MIDDLEWARE ----------
	authMiddleware, err := middleware.NewAuthMiddleware(
		kcCfg.KeycloakURL,
		kcCfg.KeycloakRealm,
		rdb,
		kcCfg,
		log,
	)
	if err != nil {
		log.Fatalf("Failed to init auth middleware: %v", err)
	}

	// ---------- HANDLERS ----------
	kc := gocloak.NewClient(kcCfg.KeycloakURL)

	authHandler := handler.NewAuthHandler(kc, rdb, kcCfg, authService, authMiddleware.GetKeyFunc(), log)
	userHandler := handler.NewUserHandler(userService)
	rupHandler := handler.NewRupHandler(rupService, log)
	awardHandler := handler.NewAwardHandler(awardService)
	groupsHandler := handler.NewGroupsHandler(groupsSyncService, syncGuard)
	lessonHandler := handler.NewLessonHandler(lessonService, log)

	// ---------- ROUTER ----------
	sessionAuthMiddleware := middleware.SessionAuth(userService)

	// Ensure your NewRouter signature matches: (auth, user, rup, award, middleware)
	router := handler.NewRouter(authHandler, userHandler, rupHandler, awardHandler, groupsHandler, lessonHandler, nil, sessionAuthMiddleware)
	engine := router.Init()

	port := getEnv("SERVER_PORT", "8080")
	log.Infof("Server starting on port %s", port)
	if err := engine.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
