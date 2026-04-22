package main

import (
	"net/http"
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

func main() {
	// ---------- LOGGER ----------
	log := helpers.NewLogger()

	// ---------- CONFIG ----------
	serverCfg := config.LoadServerConfig()
	kcCfg := config.LoadKeycloakConfig()
	dbCfg := config.LoadDBConfig()
	redisCfg := config.LoadRedisConfig()
	minioCfg := config.LoadMinioConfig()
	docCfg := config.LoadDocumentRenderConfig()
	geminiCfg := config.LoadGeminiConfig()

	// ---------- DB ----------
	// Note: Ensure repository.NewPostgresDB exists and accepts *config.DBConfig
	db, err := helpers.NewPostgresDB(dbCfg)
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
		Addr:     redisCfg.RedisAddr,
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
	aiService := service.NewAIService(httpClient, geminiCfg, log)
	lessonService := service.NewLessonService(lessonRepo, rupRepo, aiService, docCfg, httpClient, minioRepo, log)

	awardService := service.NewAwardService(awardRepo, usersRepo, minioRepo, log)
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
	aiHandler := handler.NewAIHandler(aiService, log)

	// ---------- ROUTER ----------
	sessionAuthMiddleware := middleware.SessionAuth(userService)

	// Ensure your NewRouter signature matches: (auth, user, rup, award, middleware)
	router := handler.NewRouter(
		authHandler,
		userHandler,
		rupHandler,
		awardHandler,
		groupsHandler,
		lessonHandler,
		aiHandler,
		nil,
		sessionAuthMiddleware,
		serverCfg.CORSAllowedOrigins,
	)
	engine := router.Init()

	log.Infof("Server starting on port %s", serverCfg.Port)
	if err := engine.Run(":" + serverCfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
