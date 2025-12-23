package service

import (
	"context"
	"errors"
	"time"

	"eduplan/backend/pkg/repository"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/redis/go-redis/v9"
)

type AuthService interface {
	HandleCallback(ctx context.Context, keycloakID uuid.UUID, accessToken string, claims jwt.MapClaims) (uuid.UUID, error)
	Logout(ctx context.Context, sessionID string) error
	InvalidateAllSessions(ctx context.Context, keycloakID uuid.UUID) error
}

type authService struct {
	redis *redis.Client
	users repository.AuthRepository
}

func NewAuthService(redis *redis.Client, users repository.AuthRepository) AuthService {
	return &authService{
		redis: redis,
		users: users,
	}
}

// HandleCallback создаёт пользователя (если нужно) и сессию в Redis
func (s *authService) HandleCallback(
	ctx context.Context,
	keycloakID uuid.UUID,
	accessToken string,
	claims jwt.MapClaims,
) (uuid.UUID, error) {

	email, _ := claims["email"].(string)
	username, _ := claims["preferred_username"].(string)
	firstName, _ := claims["given_name"].(string)
	lastName, _ := claims["family_name"].(string)

	// 1. Попытка создать пользователя через репозиторий
	user, err := s.users.CreateUser(ctx, keycloakID, email, username, firstName, lastName)
	if err != nil {
		// Игнорируем уникальное ограничение (пользователь уже есть)
		if !isUniqueViolation(err) {
			return uuid.Nil, err
		}
		// Получаем существующего пользователя
		user, err = s.users.GetUserByKeycloakID(ctx, keycloakID)
		if err != nil {
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
	)
	pipe.Expire(ctx, sessionKey, 24*time.Hour)
	pipe.SAdd(ctx, userSessionsKey, sessionID.String())
	pipe.Expire(ctx, userSessionsKey, 24*time.Hour)

	if _, err := pipe.Exec(ctx); err != nil {
		return uuid.Nil, err
	}

	return sessionID, nil
}

// Logout удаляет одну сессию по sessionID
func (s *authService) Logout(ctx context.Context, sessionID string) error {
	sessionKey := "session:" + sessionID

	keycloakID, err := s.redis.HGet(ctx, sessionKey, "keycloak_id").Result()
	if err != nil {
		return err
	}

	pipe := s.redis.TxPipeline()
	pipe.Del(ctx, sessionKey)
	pipe.SRem(ctx, "user_sessions:"+keycloakID, sessionID)

	_, err = pipe.Exec(ctx)
	return err
}

// InvalidateAllSessions удаляет все сессии пользователя
func (s *authService) InvalidateAllSessions(ctx context.Context, keycloakID uuid.UUID) error {
	userSessionsKey := "user_sessions:" + keycloakID.String()

	sessionIDs, err := s.redis.SMembers(ctx, userSessionsKey).Result()
	if err != nil {
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
	return err
}

// isUniqueViolation проверяет ошибку Postgres на уникальное ограничение
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
