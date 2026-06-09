package handler

import (
	"net/http"

	"eduplan/backend/pkg/service"
	kc "eduplan/backend/pkg/service/keycloak"

	"github.com/gin-gonic/gin"
)

type DepartmentsHandler struct {
	awardService service.AwardServiceInterface
	syncSvc      *kc.DepartmentsSyncService
	syncGuard    *service.SyncGuard
}

func NewDepartmentsHandler(awardService service.AwardServiceInterface, syncSvc *kc.DepartmentsSyncService, guard *service.SyncGuard) *DepartmentsHandler {
	return &DepartmentsHandler{
		awardService: awardService,
		syncSvc:      syncSvc,
		syncGuard:    guard,
	}
}

func (h *DepartmentsHandler) GetAllDepartments(c *gin.Context) {
	departments, err := h.awardService.GetAwardDepartmentsStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": service.TranslateAPIErrorMessage(err.Error())})
		return
	}

	c.JSON(http.StatusOK, departments)
}

func (h *DepartmentsHandler) SyncDepartments(c *gin.Context) {
	if !h.syncGuard.StartIfAllowed() {
		c.JSON(http.StatusOK, gin.H{"status": "up_to_date", "message": "уже актуально"})
		return
	}
	defer h.syncGuard.Finish()

	result, err := h.syncSvc.SyncDepartments(c.Request.Context())
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

