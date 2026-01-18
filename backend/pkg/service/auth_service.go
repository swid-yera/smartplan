package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"eduplan/backend/config"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/repository"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

type AuthService interface {
	HandleCallback(ctx context.Context, keycloakID uuid.UUID, accessToken string, idToken string, claims jwt.MapClaims) (uuid.UUID, error)
	Logout(ctx context.Context, sessionID string) error
	InvalidateAllSessions(ctx context.Context, keycloakID uuid.UUID) error
}

type authService struct {
	redis *redis.Client
	users repository.AuthRepository
	cfg   *config.KeycloakConfig
	log   *logrus.Entry
}

func NewAuthService(redis *redis.Client, users repository.AuthRepository, cfg *config.KeycloakConfig, log *logrus.Logger) AuthService {
	return &authService{
		redis: redis,
		users: users,
		cfg:   cfg,
		log:   log.WithField("service", "AuthService"),
	}
}

// HandleCallback создаёт пользователя (если нужно) и сессию в Redis
func (s *authService) HandleCallback(ctx context.Context, keycloakID uuid.UUID, accessToken string, idToken string, claims jwt.MapClaims) (uuid.UUID, error) {

	email, _ := claims["email"].(string)
	username, _ := claims["preferred_username"].(string)
	firstName, _ := claims["given_name"].(string)
	lastName, _ := claims["family_name"].(string)
	phone, _ := claims["phone"].(string)

	// new
	realmAccess, ok := claims["realm_access"].(map[string]interface{})
	if !ok {
		return uuid.Nil, fmt.Errorf("realm_access missing in token claims")
	}

	rolesRaw, ok := realmAccess["roles"].([]interface{})
	if !ok {
		return uuid.Nil, fmt.Errorf("roles missing in token claims")
	}

	kcRoles := make([]string, 0, len(rolesRaw))
	for _, r := range rolesRaw {
		if role, ok := r.(string); ok {
			kcRoles = append(kcRoles, role)
		}
	}

	role, ok := helpers.ResolveHighestRole(kcRoles, *s.cfg)
	if !ok {
		return uuid.Nil, fmt.Errorf("user has no allowed roles from list: %v", kcRoles)
	}

	s.log.WithFields(logrus.Fields{
		"keycloak_id": keycloakID,
		"role":        role,
	}).Info("Resolved user role")

	// 1. Попытка создать пользователя
	user, err := s.users.CreateUser(ctx, keycloakID, role, email, username, firstName, lastName, phone)

	if err != nil {
		// Если пользователь уже существует (Unique Violation)
		if isUniqueViolation(err) {
			// 2. Обновляем профиль существующего пользователя
			err = s.users.UpdateUser(ctx, keycloakID, role, email, username, firstName, lastName, phone)

			if err != nil {
				s.log.WithError(err).Error("Failed to update existing user profile")
				return uuid.Nil, err
			}

			// 3. Получаем актуальные данные пользователя после обновления
			user, err = s.users.GetUserByKeycloakID(ctx, keycloakID)
			if err != nil {
				s.log.WithError(err).Error("Failed to get existing user after update")
				return uuid.Nil, err
			}
		} else {
			// Если ошибка не связана с уникальностью, прерываем выполнение
			s.log.WithError(err).Error("Failed to create user")
			return uuid.Nil, err
		}
	}

	// Чтобы Go не ругался на неиспользуемую переменную
	_ = user

	// 2. Создаём сессию в Redis
	sessionID := uuid.New()
	sessionKey := "session:" + sessionID.String()
	userSessionsKey := "user_sessions:" + keycloakID.String()

	pipe := s.redis.TxPipeline()
	pipe.HSet(ctx, sessionKey,
		"keycloak_id", keycloakID.String(),
		"access_token", accessToken,
		"id_token", idToken,
	)
	pipe.Expire(ctx, sessionKey, 24*time.Hour)
	pipe.SAdd(ctx, userSessionsKey, sessionID.String())
	pipe.Expire(ctx, userSessionsKey, 24*time.Hour)

	if _, err := pipe.Exec(ctx); err != nil {
		s.log.WithError(err).Error("Redis transaction failed during session creation")
		return uuid.Nil, err
	}

	return sessionID, nil
}

// Logout удаляет одну сессию по sessionID
func (s *authService) Logout(ctx context.Context, sessionID string) error {
	sessionKey := "session:" + sessionID

	keycloakID, err := s.redis.HGet(ctx, sessionKey, "keycloak_id").Result()
	if err != nil {
		if !errors.Is(err, redis.Nil) {
			s.log.WithError(err).WithField("session_id", sessionID).Error("Failed to get keycloak_id from session in Redis")
		}
		// if redis.Nil, session is already gone, which is fine for logout.
		return err
	}

	pipe := s.redis.TxPipeline()
	pipe.Del(ctx, sessionKey)
	pipe.SRem(ctx, "user_sessions:"+keycloakID, sessionID)

	_, err = pipe.Exec(ctx)
	if err != nil {
		s.log.WithError(err).WithField("session_id", sessionID).Error("Redis transaction failed during logout")
	}
	return err // return original error if any
}

// InvalidateAllSessions удаляет все сессии пользователя
func (s *authService) InvalidateAllSessions(ctx context.Context, keycloakID uuid.UUID) error {
	userSessionsKey := "user_sessions:" + keycloakID.String()

	sessionIDs, err := s.redis.SMembers(ctx, userSessionsKey).Result()
	if err != nil {
		s.log.WithError(err).WithField("keycloak_id", keycloakID).Error("Failed to get session IDs for user from Redis")
		return err
	}

	if len(sessionIDs) == 0 {
		return nil
	}

	pipe := s.redis.TxPipeline()
	for _, sid := range sessionIDs {
		pipe.Del(ctx, "session:"+sid)
	}
	pipe.Del(ctx, userSessionsKey)

	_, err = pipe.Exec(ctx)
	if err != nil {
		s.log.WithError(err).WithField("keycloak_id", keycloakID).Error("Redis transaction failed during InvalidateAllSessions")
	}
	return err // return original error if any
}

// isUniqueViolation проверяет ошибку Postgres на уникальное ограничение
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
