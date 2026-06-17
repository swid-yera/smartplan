package service

import "testing"

func TestNewRedisRupImportDraftStoreReturnsNilWithoutRedisClient(t *testing.T) {
	store := newRedisRupImportDraftStore(nil)
	if store != nil {
		t.Fatalf("expected nil import draft store when redis client is nil")
	}
}

func TestNewRedisLangGenStoreReturnsNilWithoutRedisClient(t *testing.T) {
	store := newRedisLangGenStore(nil)
	if store != nil {
		t.Fatalf("expected nil lang gen store when redis client is nil")
	}
}
