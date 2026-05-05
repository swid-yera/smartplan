package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/joho/godotenv"
)

var envLoadOnce sync.Once

func ensureEnvLoaded() {
	envLoadOnce.Do(func() {
		if err := godotenv.Load(); err != nil {
			log.Println("Warning: .env not found, using OS environment only")
		}
	})
}

func getEnv(key string, def string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return def
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if valueStr := getEnv(key, ""); valueStr != "" {
		if value, err := strconv.ParseBool(valueStr); err == nil {
			return value
		}
	}
	return defaultValue
}

func splitEnv(key string) []string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return nil
	}
	parts := strings.Split(v, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}

func normalizeHostPort(addr string, defaultPort string) string {
	trimmed := strings.TrimSpace(addr)
	if trimmed == "" {
		return fmt.Sprintf("localhost:%s", defaultPort)
	}
	if strings.Contains(trimmed, ":") {
		return trimmed
	}
	return fmt.Sprintf("%s:%s", trimmed, defaultPort)
}

func buildRedisAddr() string {
	if addr := strings.TrimSpace(getEnv("REDIS_ADDR", "")); addr != "" {
		return normalizeHostPort(addr, "6379")
	}

	host := strings.TrimSpace(getEnv("REDIS_HOST", "localhost"))
	port := strings.TrimSpace(getEnv("REDIS_PORT", "6379"))
	if port == "" {
		port = "6379"
	}

	if strings.Contains(host, ":") {
		return normalizeHostPort(host, "6379")
	}
	return fmt.Sprintf("%s:%s", host, port)
}

type KeycloakConfig struct {
	KeycloakURL      string
	KeycloakRealm    string
	KeycloakClientID string
	KeycloakSecret   string
	FrontendURL      string
	CookieDomain     string
	BaseURL          string
	GroupID          string
	TeacherRoles     []string
	AdminRoles       []string
	MethodistRoles   []string
}

type DBConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
}

type ServerConfig struct {
	Port               string
	CORSAllowedOrigins []string
}

type MinioConfig struct {
	MinioEndpoint     string
	BucketName        string
	MinioRootUser     string
	MinioRootPassword string
	MinioUseSSL       bool
}

type DocumentRenderConfig struct {
	Url    string
	ApiKey string
}

type CryptoConfig struct {
	BaseURL        string
	AuthToken      string
	TimeoutSeconds int
	MaxRetries     int
}

type GeminiConfig struct {
	APIKey        string
	BaseURL       string
	PrimaryModel  string
	FallbackModel string
}

func LoadServerConfig() *ServerConfig {
	ensureEnvLoaded()

	origins := splitEnv("CORS_ALLOWED_ORIGINS")
	if len(origins) == 0 {
		origins = []string{getEnv("FRONTEND_URL", "http://localhost:3000")}
	}

	return &ServerConfig{
		Port:               getEnv("SERVER_PORT", "8080"),
		CORSAllowedOrigins: origins,
	}
}

func LoadDocumentRenderConfig() *DocumentRenderConfig {
	ensureEnvLoaded()

	return &DocumentRenderConfig{
		Url:    getEnv("DOCUMENT_RENDER_URL", "http://localhost:8000"),
		ApiKey: getEnv("DOCUMENT_RENDER_API_KEY", ""),
	}
}

func LoadCryptoConfig() *CryptoConfig {
	return &CryptoConfig{
		BaseURL:        getEnv("KRIPTO_BASE_URL", ""),
		AuthToken:      getEnv("KRIPTO_AUTH_TOKEN", ""),
		TimeoutSeconds: getEnvAsInt("KRIPTO_TIMEOUT_SECONDS", 10),
		MaxRetries:     getEnvAsInt("KRIPTO_MAX_RETRIES", 2),
	}
}

func LoadGeminiConfig() *GeminiConfig {
	ensureEnvLoaded()

	return &GeminiConfig{
		APIKey:        getEnv("GEMINI_API_KEY", ""),
		BaseURL:       getEnv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),
		PrimaryModel:  getEnv("GEMINI_PRIMARY_MODEL", "gemini-2.5-flash-lite"),
		FallbackModel: getEnv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash"),
	}
}

func LoadMinioConfig() *MinioConfig {
	ensureEnvLoaded()

	return &MinioConfig{
		MinioEndpoint:     getEnv("MINIO_ENDPOINT", "localhost:9000"),
		BucketName:        getEnv("MINIO_BUCKET_NAME", "awards"),
		MinioRootUser:     getEnv("MINIO_ROOT_USER", "minioadmin"),
		MinioRootPassword: getEnv("MINIO_ROOT_PASSWORD", "minioadmin"),
		MinioUseSSL:       getEnvAsBool("MINIO_USE_SSL", false),
	}
}

func LoadKeycloakConfig() *KeycloakConfig {
	ensureEnvLoaded()

	return &KeycloakConfig{
		KeycloakURL:      getEnv("KEYCLOAK_URL", "https://example.com"),
		KeycloakRealm:    getEnv("KEYCLOAK_REALM", "realm"),
		KeycloakClientID: getEnv("KEYCLOAK_CLIENT_ID", "client_id"),
		KeycloakSecret:   getEnv("KEYCLOAK_CLIENT_SECRET", "secret"),
		FrontendURL:      getEnv("FRONTEND_URL", "http://localhost:3000"),
		CookieDomain:     getEnv("COOKIE_DOMAIN", "localhost"),
		BaseURL:          getEnv("BASE_URL", "http://localhost:8080"),
		GroupID:          getEnv("GROUP_ID", ""),
		TeacherRoles:     splitEnv("TEACHER_ROLES"),
		AdminRoles:       splitEnv("ADMIN_ROLES"),
		MethodistRoles:   splitEnv("METHODIST_ROLES"),
	}
}

func LoadDBConfig() *DBConfig {
	ensureEnvLoaded()

	return &DBConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnvAsInt("DB_PORT", 5432),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "password"),
		DBName:   getEnv("DB_NAME", "postgres"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}
}

func LoadRedisConfig() *RedisConfig {
	ensureEnvLoaded()

	return &RedisConfig{
		RedisAddr:     buildRedisAddr(),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),
	}
}
