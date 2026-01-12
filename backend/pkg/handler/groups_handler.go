package handler

import (
	"net/http"

	"eduplan/backend/pkg/service"
	kc "eduplan/backend/pkg/service/keycloak"

	"github.com/gin-gonic/gin"
)

type GroupsHandler struct {
	syncSvc   *kc.GroupsSyncService
	syncGuard *service.SyncGuard
}

func NewGroupsHandler(syncSvc *kc.GroupsSyncService, guard *service.SyncGuard) *GroupsHandler {
	return &GroupsHandler{
		syncSvc:   syncSvc,
		syncGuard: guard,
	}
}

// POST /api/groups/sync
// Любой залогиненный пользователь может вызвать.
// Если sync был недавно/идёт сейчас → 200 "уже актуально"
func (h *GroupsHandler) SyncGroups(c *gin.Context) {
	if !h.syncGuard.StartIfAllowed() {
		c.JSON(http.StatusOK, gin.H{
			"status":  "up_to_date",
			"message": "уже актуально",
		})
		return
	}
	defer h.syncGuard.Finish()

	if err := h.syncSvc.SyncGroups(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "synced",
		"message": "обновлено",
	})
}
