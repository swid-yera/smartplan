package keycloak

import (
	"context"
	"fmt"
	"strings"

	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type GroupsSyncService struct {
	kc   *Client
	repo repository.GroupsRepository
}

func NewGroupsSyncService(kc *Client, repo repository.GroupsRepository) *GroupsSyncService {
	return &GroupsSyncService{kc: kc, repo: repo}
}

// SyncGroups:
// 1) service account token (client_credentials)
// 2) raw admin rest -> groups tree
// 3) берём ТОЛЬКО /students и все подгруппы
// 4) upsert в БД
func (s *GroupsSyncService) SyncGroups(ctx context.Context) error {
	jwt, err := s.kc.LoginServiceAccount(ctx)
	if err != nil {
		return fmt.Errorf("keycloak login service account: %w", err)
	}

	raw, err := s.kc.GetGroupsRawHTTP(ctx, jwt.AccessToken, 0, 5000)
	if err != nil {
		return fmt.Errorf("keycloak get groups raw http: %w", err)
	}

	// Ищем именно /students (надежнее, чем по имени)
	root := findGroupTree(raw, "/Students", "Students")
	if root == nil {
		return fmt.Errorf("students group not found in keycloak")
	}

	flat := flattenRawGroups([]GroupRepresentation{*root})

	params := make([]storage.UpsertGroupParams, 0, len(flat))
	actualIDs := make([]uuid.UUID, 0, len(flat))

	for _, g := range flat {
		if strings.TrimSpace(g.ID) == "" || strings.TrimSpace(g.Name) == "" {
			continue
		}

		id, err := uuid.Parse(g.ID)
		if err != nil {
			return fmt.Errorf("parse keycloak group id %q: %w", g.ID, err)
		}

		qual := firstAttrRaw(g.Attributes, "qualification")
		spec := firstAttrRaw(g.Attributes, "specialty")

		params = append(params, storage.UpsertGroupParams{
			KeycloakID:    id,
			Name:          g.Name,
			Qualification: toPgText(qual),
			Specialty:     toPgText(spec),
		})

		actualIDs = append(actualIDs, id)
	}

	if err := s.repo.CreateGroups(ctx, params); err != nil {
		return fmt.Errorf("save groups to db: %w", err)
	}

	if err := s.repo.DeleteGroupsNotInKeycloak(ctx, actualIDs); err != nil {
		return fmt.Errorf("delete removed groups: %w", err)
	}

	return nil
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

func toPgText(p *string) pgtype.Text {
	if p == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *p, Valid: true}
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
