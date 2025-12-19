package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type AuthService interface {
	HandleCallback(ctx context.Context, keycloakUserID uuid.UUID, accessToken string) (uuid.UUID, error)
}

type authService struct {
	redis *redis.Client
}

func NewAuthService(redis *redis.Client) AuthService {
	return &authService{redis: redis}
}

func (s *authService) HandleCallback(
	ctx context.Context,
	keycloakID uuid.UUID,
	accessToken string,
) (uuid.UUID, error) {

	if accessToken == "" {
		return uuid.Nil, fmt.Errorf("access token is empty")
	}

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
