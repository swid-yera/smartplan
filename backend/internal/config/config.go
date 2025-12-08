package config

import "os"

type Config struct {
	KeycloakRealmURL  string
	KeycloakClientID  string
	KeycloakAudience  string
	Port              string
	DBDSN             string
}

func Load() *Config {
	return &Config{
		KeycloakRealmURL:  getEnv("KEYCLOAK_REALM_URL", "https://auth.college.kz/realms/college"),
		KeycloakClientID:  getEnv("KEYCLOAK_CLIENT_ID", "rup-frontend"),
		KeycloakAudience:  getEnv("KEYCLOAK_AUDIENCE", "rup-api"),
		Port:              getEnv("PORT", "8080"),
		DBDSN:             getEnv("DB_DSN", "host=localhost user=eduplan password=eduplan dbname=eduplan port=5433 sslmode=disable"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
