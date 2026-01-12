package service

import (
	"sync"
	"time"
)

// SyncGuard не даёт запускать sync слишком часто.
// Если sync уже идёт или был недавно — считаем "уже актуально".
type SyncGuard struct {
	mu       sync.Mutex
	lastRun  time.Time
	cooldown time.Duration
	running  bool
}

func NewSyncGuard(cooldown time.Duration) *SyncGuard {
	return &SyncGuard{cooldown: cooldown}
}

// StartIfAllowed возвращает true если можно стартовать sync.
// Возвращает false если:
// - sync уже выполняется
// - или последний запуск был менее cooldown назад
func (g *SyncGuard) StartIfAllowed() bool {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.running {
		return false
	}
	if !g.lastRun.IsZero() && time.Since(g.lastRun) < g.cooldown {
		return false
	}

	g.running = true
	g.lastRun = time.Now()
	return true
}

func (g *SyncGuard) Finish() {
	g.mu.Lock()
	g.running = false
	g.mu.Unlock()
}
