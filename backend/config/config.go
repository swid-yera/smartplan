package config

import (
	"fmt"
	"log"
	"os"
	"sort"
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
	TeacherGroupID   string
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
	APIKey                 string
	APIKeys                []string
	BaseURL                string
	PrimaryModel           string
	FallbackModel          string
	SecondaryFallbackModel string
	TertiaryFallbackModel  string
}

type OpenAIConfig struct {
	APIKey  string
	BaseURL string
	Model   string
}

type AIConfig struct {
	Provider string
	Gemini   *GeminiConfig
	OpenAI   *OpenAIConfig
}

func loadGeminiAPIKeys() []string {
	type keyedValue struct {
		index int
		value string
	}

	result := make([]string, 0, 4)
	seen := make(map[string]struct{}, 4)
	appendUnique := func(value string) {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			return
		}
		if _, exists := seen[trimmed]; exists {
			return
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}

	// Backward compatibility: keep support for a single key env var.
	appendUnique(os.Getenv("GEMINI_API_KEY"))

	indexed := make([]keyedValue, 0, 8)
	for _, item := range os.Environ() {
		parts := strings.SplitN(item, "=", 2)
		if len(parts) == 0 {
			continue
		}

		envName := parts[0]
		if !strings.HasPrefix(envName, "GEMINI_API_KEY_") {
			continue
		}

		suffix := strings.TrimPrefix(envName, "GEMINI_API_KEY_")
		index, err := strconv.Atoi(suffix)
		if err != nil || index <= 0 {
			continue
		}

		value := strings.TrimSpace(os.Getenv(envName))
		if value == "" {
			continue
		}

		indexed = append(indexed, keyedValue{
			index: index,
			value: value,
		})
	}

	sort.Slice(indexed, func(i, j int) bool {
		return indexed[i].index < indexed[j].index
	})

	for _, item := range indexed {
		appendUnique(item.value)
	}

	return result
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

	apiKeys := loadGeminiAPIKeys()
	defaultAPIKey := ""
	if len(apiKeys) > 0 {
		defaultAPIKey = apiKeys[0]
	}

	return &GeminiConfig{
		APIKey:                 defaultAPIKey,
		APIKeys:                apiKeys,
		BaseURL:                getEnv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),
		PrimaryModel:           getEnv("GEMINI_PRIMARY_MODEL", "gemini-2.5-flash-lite"),
		FallbackModel:          getEnv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash"),
		SecondaryFallbackModel: getEnv("GEMINI_SECONDARY_FALLBACK_MODEL", "gemini-2.0-flash"),
		TertiaryFallbackModel:  getEnv("GEMINI_TERTIARY_FALLBACK_MODEL", "gemini-2.0-flash-lite"),
	}
}

func LoadOpenAIConfig() *OpenAIConfig {
	ensureEnvLoaded()

	return &OpenAIConfig{
		APIKey:  getEnv("OPENAI_API_KEY", ""),
		BaseURL: getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
		Model:   getEnv("OPENAI_MODEL", "gpt-4"),
	}
}

func LoadAIConfig() *AIConfig {
	ensureEnvLoaded()

	provider := strings.ToLower(strings.TrimSpace(getEnv("AI_PROVIDER", "gemini")))

	return &AIConfig{
		Provider: provider,
		Gemini:   LoadGeminiConfig(),
		OpenAI:   LoadOpenAIConfig(),
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
		TeacherGroupID:   getEnv("TEACHER_GROUP_ID", ""),
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
