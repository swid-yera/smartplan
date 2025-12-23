package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("Error: .env not found")
	}
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

type KeycloakConfig struct {
	KeycloakURL      string
	KeycloakRealm    string
	KeycloakClientID string
	KeycloakSecret   string
	FrontendURL      string
	CookieDomain     string
	BaseURL          string
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

func LoadKeycloakConfig() *KeycloakConfig {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Fatalf("Error: .env not found")
	}

	return &KeycloakConfig{
		KeycloakURL:      getEnv("KEYCLOAK_URL", "https://example.com"),
		KeycloakRealm:    getEnv("KEYCLOAK_REALM", "realm"),
		KeycloakClientID: getEnv("KEYCLOAK_CLIENT_ID", "client_id"),
		KeycloakSecret:   getEnv("KEYCLOAK_CLIENT_SECRET", "secret"),
		FrontendURL:      getEnv("FRONTEND_URL", "http://example:3000"),
		CookieDomain:     getEnv("COOKIE_DOMAIN", "localhost"),
		BaseURL:          getEnv("BASE_URL", "http://exaple:8080"),
	}
}

func LoadDBConfig() *DBConfig {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Fatalf("Error: .env not found")
	}

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
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Fatalf("Error: .env not found")
	}

	return &RedisConfig{
		RedisAddr:     getEnv("REDIS_HOST", "localhost"),
		RedisPassword: getEnv("REDIS_PASSWORD", "password"),
		RedisDB:       getEnvAsInt("REDIS_PORT", 0),
	}
}
