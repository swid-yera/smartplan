package keycloak

import (
	"context"
	"fmt"
	"strings"

	"eduplan/backend/config"
	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DepartmentsSyncService struct {
	kc  *Client
	db  *pgxpool.Pool
	cfg *config.KeycloakConfig
}

func NewDepartmentsSyncService(kc *Client, db *pgxpool.Pool, cfg *config.KeycloakConfig) *DepartmentsSyncService {
	return &DepartmentsSyncService{kc: kc, db: db, cfg: cfg}
}

func (s *DepartmentsSyncService) SyncDepartments(ctx context.Context) (*SyncResult, error) {
	teacherGroupID := strings.TrimSpace(s.cfg.TeacherGroupID)
	if teacherGroupID == "" {
		return nil, fmt.Errorf("teacher group id is not configured")
	}

	jwt, err := s.kc.LoginServiceAccount(ctx)
	if err != nil {
		return nil, fmt.Errorf("keycloak login service account: %w", err)
	}

	teacherRoot, err := s.kc.GetGroupByIDRawHTTP(ctx, jwt.AccessToken, teacherGroupID)
	if err != nil {
		return nil, fmt.Errorf("keycloak get teacher root group: %w", err)
	}

	if len(teacherRoot.SubGroups) == 0 {
		subGroups, childrenErr := s.kc.GetGroupChildrenRawHTTP(ctx, jwt.AccessToken, teacherGroupID, 0, 5000)
		if childrenErr != nil {
			return nil, fmt.Errorf("keycloak get teacher root children: %w", childrenErr)
		}
		teacherRoot.SubGroups = subGroups
	}

	if len(teacherRoot.SubGroups) == 0 {
		return nil, fmt.Errorf("teacher departments tree is empty")
	}

	queries := storage.New(s.db)
	actualIDs := make([]uuid.UUID, 0, len(teacherRoot.SubGroups))
	existingIDs := make(map[uuid.UUID]struct{})
	existingRows, err := s.db.Query(ctx, `SELECT keycloak_id FROM departments`)
	if err != nil {
		return nil, fmt.Errorf("load existing departments: %w", err)
	}
	defer existingRows.Close()

	for existingRows.Next() {
		var existingID uuid.UUID
		if err := existingRows.Scan(&existingID); err != nil {
			return nil, fmt.Errorf("scan existing department id: %w", err)
		}
		existingIDs[existingID] = struct{}{}
	}
	if err := existingRows.Err(); err != nil {
		return nil, fmt.Errorf("iterate existing departments: %w", err)
	}

	addedCount := 0
	updatedCount := 0

	for _, group := range teacherRoot.SubGroups {
		department, ok := mapDepartment(group)
		if !ok {
			continue
		}

		if _, err := queries.UpsertDepartment(ctx, storage.UpsertDepartmentParams{
			KeycloakID: department.KeycloakID,
			Name:       department.Name,
		}); err != nil {
			return nil, fmt.Errorf("upsert department %s: %w", department.KeycloakID, err)
		}

		actualIDs = append(actualIDs, department.KeycloakID)
		if _, exists := existingIDs[department.KeycloakID]; exists {
			updatedCount++
		} else {
			addedCount++
		}
	}

	if len(actualIDs) == 0 {
		return nil, fmt.Errorf("no departments were synchronized")
	}

	if _, err := s.db.Exec(ctx, `DELETE FROM departments WHERE NOT (keycloak_id = ANY($1::uuid[]))`, actualIDs); err != nil {
		return nil, fmt.Errorf("delete removed departments: %w", err)
	}

	return &SyncResult{
		Added:   addedCount,
		Updated: updatedCount,
		Deleted: 0,
	}, nil
}

func mapDepartment(group GroupRepresentation) (repository.DepartmentMembershipInput, bool) {
	id := strings.TrimSpace(group.ID)
	if id == "" {
		return repository.DepartmentMembershipInput{}, false
	}

	parsedID, err := uuid.Parse(id)
	if err != nil {
		return repository.DepartmentMembershipInput{}, false
	}

	name := strings.TrimSpace(group.Name)
	ru := ""
	if attr := firstAttrRaw(group.Attributes, "description"); attr != nil {
		ru = strings.TrimSpace(*attr)
	}
	kz := ""
	if attr := firstAttrRaw(group.Attributes, "mail"); attr != nil {
		kz = strings.TrimSpace(*attr)
	}
	if ru == "" {
		ru = name
	}
	if kz == "" {
		kz = name
	}

	return repository.DepartmentMembershipInput{
		KeycloakID: parsedID,
		Name:       localization.NewLocaleText(ru, kz).ToJSONB(),
	}, true
}
