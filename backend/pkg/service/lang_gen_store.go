package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	langGenKeyPrefix = "rup:langgen:"
	langGenTTL       = 2 * time.Hour // статус хранится 2 часа после последнего обновления
)

// langGenStore — интерфейс хранилища статусов генерации перевода.
// Абстракция позволяет при тестах подменить Redis на in-memory реализацию.
type langGenStore interface {
	Set(ctx context.Context, state RupLanguageGenerationStatus) error
	Get(ctx context.Context, rupID uuid.UUID) (RupLanguageGenerationStatus, bool, error)
	Delete(ctx context.Context, rupID uuid.UUID) error
}

// redisLangGenStore — Redis-реализация langGenStore.
type redisLangGenStore struct {
	rdb *redis.Client
}

func newRedisLangGenStore(rdb *redis.Client) langGenStore {
	return &redisLangGenStore{rdb: rdb}
}

func (s *redisLangGenStore) key(rupID uuid.UUID) string {
	return langGenKeyPrefix + rupID.String()
}

func (s *redisLangGenStore) Set(ctx context.Context, state RupLanguageGenerationStatus) error {
	data, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("lang gen store marshal: %w", err)
	}
	return s.rdb.Set(ctx, s.key(state.RupID), data, langGenTTL).Err()
}

func (s *redisLangGenStore) Get(ctx context.Context, rupID uuid.UUID) (RupLanguageGenerationStatus, bool, error) {
	data, err := s.rdb.Get(ctx, s.key(rupID)).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return RupLanguageGenerationStatus{}, false, nil
		}
		return RupLanguageGenerationStatus{}, false, fmt.Errorf("lang gen store get: %w", err)
	}

	var state RupLanguageGenerationStatus
	if err = json.Unmarshal(data, &state); err != nil {
		return RupLanguageGenerationStatus{}, false, fmt.Errorf("lang gen store unmarshal: %w", err)
	}
	return state, true, nil
}

func (s *redisLangGenStore) Delete(ctx context.Context, rupID uuid.UUID) error {
	return s.rdb.Del(ctx, s.key(rupID)).Err()
}
