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
	return &GroupsHandler{syncSvc: syncSvc, syncGuard: guard}
}

// GET /api/groups/debug/students
func (h *GroupsHandler) DebugStudents(c *gin.Context) {
	tree, err := h.syncSvc.DebugFetchStudentsTree(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tree)
}

// POST /api/groups/sync
func (h *GroupsHandler) SyncGroups(c *gin.Context) {
	if !h.syncGuard.StartIfAllowed() {
		c.JSON(http.StatusOK, gin.H{"status": "up_to_date", "message": "уже актуально"})
		return
	}
	defer h.syncGuard.Finish()

	if err := h.syncSvc.SyncGroups(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "synced", "message": "обновлено"})
}
