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
	translationCfg := config.LoadTranslationConfig()

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
	kpiSettingsRepo := repository.NewKPIUploadSettingsPostgres(db)

	// ---------- SERVICES ----------
	authService := service.NewAuthService(rdb, authRepo, permissionsRepo, kcSyncClient, kcCfg, log)
	userService := service.NewUserService(usersRepo, permissionsRepo, rdb)

	// ---------- AI SERVICE ----------
	log.Infof("Using Gemini API provider with model %s", aiCfg.Gemini.PrimaryModel)
	translationService := service.NewTranslationService(httpClient, translationCfg, log)
	if translationService == nil {
		log.Warn("Translation service is not configured; ru/kz translation jobs will be unavailable")
	}
	aiService := service.NewAIService(httpClient, aiCfg.Gemini, translationService, log)
	rupService := service.NewRupService(rupRepo, docCfg, httpClient, aiService, translationService, minioRepo, cryptoClient, rdb, log)
	lessonService := service.NewLessonService(lessonRepo, rupRepo, aiService, translationService, docCfg, httpClient, minioRepo, log)

	awardService := service.NewAwardService(awardRepo, usersRepo, kpiSettingsRepo, minioRepo, log)
	groupsSyncService := kcservice.NewGroupsSyncService(kcSyncClient, groupsRepo)
	departmentsSyncService := kcservice.NewDepartmentsSyncService(kcSyncClient, db, kcCfg)
	groupsSyncGuard := service.NewSyncGuard(1 * time.Minute)
	departmentsSyncGuard := service.NewSyncGuard(1 * time.Minute)

	permissionService := service.NewPermissionService(permissionsRepo, usersRepo)
	kpiSettingsService := service.NewKpiUploadSettingsService(kpiSettingsRepo, usersRepo)

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
	statisticsHandler := handler.NewStatisticsHandler(userService, awardService)
	groupsHandler := handler.NewGroupsHandler(groupsSyncService, groupsSyncGuard)
	departmentsHandler := handler.NewDepartmentsHandler(awardService, departmentsSyncService, departmentsSyncGuard)
	lessonHandler := handler.NewLessonHandler(lessonService, log)
	aiHandler := handler.NewAIHandler(aiService, log)
	permissionHandler := handler.NewPermissionHandler(permissionService)
	kpiSettingsHandler := handler.NewKpiUploadSettingsHandler(kpiSettingsService)

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
		kpiSettingsHandler,
		sessionAuthMiddleware,
		serverCfg.CORSAllowedOrigins,
	)
	engine := router.Init()

	log.Infof("Server starting on port %s", serverCfg.Port)
	if err := engine.Run(":" + serverCfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
