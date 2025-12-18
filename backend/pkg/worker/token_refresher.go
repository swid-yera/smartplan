package worker

import (
	"context"
	"time"

	"eduplan/backend/pkg/keycloak"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

type TokenRefresher struct {
	kc    *keycloak.Client
	redis *redis.Client
}

func NewTokenRefresher(kc *keycloak.Client, redis *redis.Client) *TokenRefresher {
	return &TokenRefresher{
		kc:    kc,
		redis: redis,
	}
}

func (tr *TokenRefresher) Start(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			tr.checkTokens(ctx)
		}
	}
}

func (tr *TokenRefresher) checkTokens(ctx context.Context) {
	log.Info().Msg("Token refresh check completed (placeholder)")
}
