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

	cryptoCfg := config.LoadCryptoConfig()

	aiCfg := config.LoadAIConfig()

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
		Timeout: 300 * time.Second, // 5 minutes for AI generation requests
	}

	// ---------- REDIS ----------
	rdb := redis.NewClient(&redis.Options{
		Addr:     redisCfg.RedisAddr,
		Password: redisCfg.RedisPassword,
		DB:       redisCfg.RedisDB,
	})

	cryptoClient := service.NewCryptoClient(httpClient, cryptoCfg)

	// ---------- REPOSITORIES ----------
	authRepo := repository.NewAuthPostgres(queries)
	usersRepo := repository.NewUsersPostgres(queries)
	// Passing our wrapped minioRepo to the AwardRepository
	awardRepo := repository.NewAwardRepository(queries, minioRepo)
	rupRepo := repository.NewRupPostgres(queries, db)
	lessonRepo := repository.NewLessonRepository(queries)

	kcSyncClient := kcservice.NewClient(
		kcCfg,
	)

	permissionsRepo := repository.NewPermissionsPostgres(queries)

	// ---------- SERVICES ----------
	authService := service.NewAuthService(rdb, authRepo, kcSyncClient, kcCfg, log)
	userService := service.NewUserService(usersRepo, permissionsRepo, rdb)

	// ---------- AI SERVICE ----------
	var aiService service.AIService
	if aiCfg.Provider == "openai" {
		log.Infof("Using OpenAI-compatible API provider at %s with model %s", aiCfg.OpenAI.BaseURL, aiCfg.OpenAI.Model)
		aiService = service.NewOpenAIService(httpClient, aiCfg.OpenAI, log)
	} else {
		log.Infof("Using Gemini API provider with model %s", aiCfg.Gemini.PrimaryModel)
		aiService = service.NewAIService(httpClient, aiCfg.Gemini, log)
	}
	rupService := service.NewRupService(rupRepo, docCfg, httpClient, aiService, minioRepo, cryptoClient, rdb, log)
	lessonService := service.NewLessonService(lessonRepo, rupRepo, aiService, docCfg, httpClient, minioRepo, log)

	awardService := service.NewAwardService(awardRepo, usersRepo, minioRepo, log)
	groupsSyncService := kcservice.NewGroupsSyncService(kcSyncClient, groupsRepo)
	departmentsSyncService := kcservice.NewDepartmentsSyncService(kcSyncClient, db, kcCfg)
	groupsSyncGuard := service.NewSyncGuard(1 * time.Minute)
	departmentsSyncGuard := service.NewSyncGuard(1 * time.Minute)

	permissionService := service.NewPermissionService(permissionsRepo, usersRepo)

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
	categoryHandler := handler.NewCategoryHandler(awardService)
	statisticsHandler := handler.NewStatisticsHandler(userService)
	groupsHandler := handler.NewGroupsHandler(groupsSyncService, groupsSyncGuard)
	departmentsHandler := handler.NewDepartmentsHandler(awardService, departmentsSyncService, departmentsSyncGuard)
	lessonHandler := handler.NewLessonHandler(lessonService, log)
	aiHandler := handler.NewAIHandler(aiService, log)
	permissionHandler := handler.NewPermissionHandler(permissionService)

	// ---------- ROUTER ----------
	sessionAuthMiddleware := middleware.SessionAuth(userService)

	// Ensure your NewRouter signature matches: (auth, user, rup, award, middleware)
	router := handler.NewRouter(
		authHandler,
		userHandler,
		rupHandler,
		awardHandler,
		categoryHandler,
		statisticsHandler,
		groupsHandler,
		departmentsHandler,
		lessonHandler,
		aiHandler,
		nil,
		permissionHandler,
		sessionAuthMiddleware,
		serverCfg.CORSAllowedOrigins,
	)
	engine := router.Init()

	log.Infof("Server starting on port %s", serverCfg.Port)
	if err := engine.Run(":" + serverCfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
