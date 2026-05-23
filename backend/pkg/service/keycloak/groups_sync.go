package keycloak

import (
	"context"
	"fmt"
	"strings"

	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

type SyncResult struct {
	Added   int `json:"added"`
	Updated int `json:"updated"`
	Deleted int `json:"deleted"`
}

type GroupsSyncService struct {
	kc   *Client
	repo repository.GroupsRepository
}

type GetAllGroupsResponse struct {
	KeycloakID    uuid.UUID               `json:"keycloakId"`
	Name          string                  `json:"name"`
	Qualification localization.LocaleText `json:"qualification"`
	Specialty     localization.LocaleText `json:"specialty"`
}

func NewGroupsSyncService(kc *Client, repo repository.GroupsRepository) *GroupsSyncService {
	return &GroupsSyncService{kc: kc, repo: repo}
}

func (s *GroupsSyncService) GetAllGroups(ctx context.Context) ([]*GetAllGroupsResponse, error) {
	dbGroups, err := s.repo.GetAllGroups(ctx)
	if err != nil {
		return nil, err
	}

	// if empty, len will be 0, json return [] not null
	responses := make([]*GetAllGroupsResponse, 0, len(dbGroups))

	for _, group := range dbGroups {
		response := &GetAllGroupsResponse{
			KeycloakID:    group.KeycloakID,
			Name:          group.Name,
			Qualification: localization.LocaleTextFromJSONB(group.Qualification),
			Specialty:     localization.LocaleTextFromJSONB(group.Specialty),
		}

		responses = append(responses, response)
	}

	return responses, nil
}

// SyncGroups:
// 1) service account token (client_credentials)
// 2) raw admin rest -> groups tree
// 3) берём ТОЛЬКО /students и все подгруппы
// 4) upsert в БД
func (s *GroupsSyncService) SyncGroups(ctx context.Context) (*SyncResult, error) {
	jwt, err := s.kc.LoginServiceAccount(ctx)
	if err != nil {
		return nil, fmt.Errorf("keycloak login service account: %w", err)
	}

	raw, err := s.kc.GetGroupsRawHTTP(ctx, jwt.AccessToken, 0, 5000)
	if err != nil {
		return nil, fmt.Errorf("keycloak get groups raw http: %w", err)
	}

	existingGroups, err := s.repo.GetAllGroups(ctx)
	if err != nil {
		return nil, fmt.Errorf("get existing groups: %w", err)
	}
	existingIDs := make(map[uuid.UUID]struct{}, len(existingGroups))
	for _, g := range existingGroups {
		existingIDs[g.KeycloakID] = struct{}{}
	}

	params := make([]storage.UpsertGroupParams, 0, len(raw))
	actualIDs := make([]uuid.UUID, 0, len(raw))
	addedCount := 0
	updatedCount := 0

	for _, g := range raw {
		if strings.TrimSpace(g.ID) == "" || strings.TrimSpace(g.Name) == "" {
			continue
		}

		id, err := uuid.Parse(g.ID)
		if err != nil {
			return nil, fmt.Errorf("parse keycloak group id %q: %w", g.ID, err)
		}

		if _, exists := existingIDs[id]; exists {
			updatedCount++
		} else {
			addedCount++
		}

		qual := firstAttrRaw(g.Attributes, "mail")
		spec := firstAttrRaw(g.Attributes, "description")

		params = append(params, storage.UpsertGroupParams{
			KeycloakID:    id,
			Name:          g.Name,
			Qualification: toLocaleJSONB(qual),
			Specialty:     toLocaleJSONB(spec),
		})

		actualIDs = append(actualIDs, id)
	}

	if err := s.repo.CreateGroups(ctx, params); err != nil {
		return nil, fmt.Errorf("save groups to db: %w", err)
	}

	// NOTE: This assumes `DeleteGroupsNotInKeycloak` is changed to return (int64, error)
	err = s.repo.DeleteGroupsNotInKeycloak(ctx, actualIDs)
	if err != nil {
		return nil, fmt.Errorf("delete removed groups: %w", err)
	}

	return &SyncResult{
		Added:   addedCount,
		Updated: updatedCount,
		Deleted: 0, // TODO: realize it
	}, nil
}

func flattenRawGroups(groups []GroupRepresentation) []GroupRepresentation {
	out := make([]GroupRepresentation, 0, len(groups))

	var walk func(g GroupRepresentation)
	walk = func(g GroupRepresentation) {
		out = append(out, g)
		for _, sg := range g.SubGroups {
			walk(sg)
		}
	}

	for _, g := range groups {
		walk(g)
	}
	return out
}

// findGroupTree ищет группу сначала по path, потом по name (в глубину)
func findGroupTree(groups []GroupRepresentation, wantPath string, wantName string) *GroupRepresentation {
	if wantPath != "" {
		if g := findByPath(groups, wantPath); g != nil {
			return g
		}
	}
	if wantName != "" {
		if g := findByNameDeep(groups, wantName); g != nil {
			return g
		}
	}
	return nil
}

func findByPath(groups []GroupRepresentation, want string) *GroupRepresentation {
	for i := range groups {
		if groups[i].Path == want {
			return &groups[i]
		}
		if g := findByPath(groups[i].SubGroups, want); g != nil {
			return g
		}
	}
	return nil
}

func findByNameDeep(groups []GroupRepresentation, wantName string) *GroupRepresentation {
	for i := range groups {
		if strings.EqualFold(groups[i].Name, wantName) {
			return &groups[i]
		}
		if g := findByNameDeep(groups[i].SubGroups, wantName); g != nil {
			return g
		}
	}
	return nil
}

func firstAttrRaw(attrs map[string][]string, key string) *string {
	v, ok := attrs[key]
	if !ok || len(v) == 0 {
		return nil
	}
	s := v[0]
	return &s
}

func toLocaleJSONB(p *string) []byte {
	if p == nil {
		return nil
	}
	locale := localization.NewLocaleText(*p, "")
	return locale.ToJSONB()
}

func (s *GroupsSyncService) DebugFetchStudentsTree(ctx context.Context) (*GroupRepresentation, error) {
	jwt, err := s.kc.LoginServiceAccount(ctx)
	if err != nil {
		return nil, fmt.Errorf("keycloak login service account: %w", err)
	}

	// 1) найдём Students в топ-левеле (там есть id)
	top, err := s.kc.GetGroupsRawHTTP(ctx, jwt.AccessToken, 0, 5000)
	if err != nil {
		return nil, fmt.Errorf("keycloak get groups: %w", err)
	}

	root := findByNameDeep(top, "Students")
	if root == nil {
		root = findByNameDeep(top, "students")
	}
	if root == nil || strings.TrimSpace(root.ID) == "" {
		return nil, fmt.Errorf("Students group not found in keycloak")
	}

	// 2) берём полную группу по id (там должны быть subGroups)
	full, err := s.kc.GetGroupByIDRawHTTP(ctx, jwt.AccessToken, root.ID)
	if err != nil {
		return nil, err
	}

	// 3) если subGroups всё равно пусто — fallback: получаем детей отдельным endpoint и приклеиваем
	if len(full.SubGroups) == 0 {
		children, err := s.kc.GetGroupChildrenRawHTTP(ctx, jwt.AccessToken, root.ID, 0, 5000)
		if err != nil {
			return nil, err
		}
		full.SubGroups = children
	}

	return full, nil
}
