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

func (s *authService) HandleCallback(ctx context.Context, keycloakUserID uuid.UUID, accessToken string) (uuid.UUID, error) {
	if accessToken == "" {
		return uuid.Nil, fmt.Errorf("access token is empty")
	}

	sessionID := uuid.New()
	sessionKey := "session:" + sessionID.String()

	// кладём минимум для ValidateSession()
	if err := s.redis.HSet(ctx, sessionKey,
		"user_id", keycloakUserID.String(),
		"access_token", accessToken,
	).Err(); err != nil {
		return uuid.Nil, err
	}

	// TTL на сутки (как cookie MaxAge=86400)
	if err := s.redis.Expire(ctx, sessionKey, 24*time.Hour).Err(); err != nil {
		return uuid.Nil, err
	}

	return sessionID, nil
}
