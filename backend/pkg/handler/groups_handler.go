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

// GET /api/groups/
func (h *GroupsHandler) GetAllGroups(c *gin.Context) {

	// get all groups
	groups, err := h.syncSvc.GetAllGroups(c.Request.Context())
	if err != nil {
		return
	}

	c.JSON(http.StatusOK, groups)
}

// POST /api/groups/sync
func (h *GroupsHandler) SyncGroups(c *gin.Context) {
	if !h.syncGuard.StartIfAllowed() {
		c.JSON(http.StatusOK, gin.H{"status": "up_to_date", "message": "уже актуально"})
		return
	}
	defer h.syncGuard.Finish()

	result, err := h.syncSvc.SyncGroups(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "synced",
		"message": "обновлено",
		"result":  result,
	})
}

