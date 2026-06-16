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
	rupImportDraftKeyPrefix = "rup:import:draft:"
	rupImportDraftTTL       = time.Hour
)

type rupImportDraftStore interface {
	Set(ctx context.Context, draft RupImportDraft) error
	Get(ctx context.Context, id uuid.UUID) (RupImportDraft, bool, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type redisRupImportDraftStore struct {
	rdb *redis.Client
}

func newRedisRupImportDraftStore(rdb *redis.Client) rupImportDraftStore {
	return &redisRupImportDraftStore{rdb: rdb}
}

func (s *redisRupImportDraftStore) key(id uuid.UUID) string {
	return rupImportDraftKeyPrefix + id.String()
}

func (s *redisRupImportDraftStore) Set(ctx context.Context, draft RupImportDraft) error {
	data, err := json.Marshal(draft)
	if err != nil {
		return fmt.Errorf("rup import draft marshal: %w", err)
	}
	return s.rdb.Set(ctx, s.key(draft.ID), data, rupImportDraftTTL).Err()
}

func (s *redisRupImportDraftStore) Get(ctx context.Context, id uuid.UUID) (RupImportDraft, bool, error) {
	data, err := s.rdb.Get(ctx, s.key(id)).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return RupImportDraft{}, false, nil
		}
		return RupImportDraft{}, false, fmt.Errorf("rup import draft get: %w", err)
	}

	var draft RupImportDraft
	if err = json.Unmarshal(data, &draft); err != nil {
		return RupImportDraft{}, false, fmt.Errorf("rup import draft unmarshal: %w", err)
	}

	return draft, true, nil
}

func (s *redisRupImportDraftStore) Delete(ctx context.Context, id uuid.UUID) error {
	return s.rdb.Del(ctx, s.key(id)).Err()
}
