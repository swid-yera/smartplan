package keycloak

import (
	"context"
	"fmt"

	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/Nerzal/gocloak/v13"
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
// 1) получает service account token (client_credentials)
// 2) тянет все группы из Admin API (с attributes)
// 3) расплющивает дерево subGroups
// 4) сохраняет в БД через upsert в транзакции
func (s *GroupsSyncService) SyncGroups(ctx context.Context) error {
	fmt.Printf("[groups-sync] starting...\n")

	jwt, err := s.kc.LoginServiceAccount(ctx)
	if err != nil {
		return fmt.Errorf("keycloak login service account: %w", err)
	}
	// Не печатаем сам токен целиком (секрет), только первые символы
	at := jwt.AccessToken
	if len(at) > 16 {
		at = at[:16] + "..."
	}
	fmt.Printf("[groups-sync] service account token ok, access_token=%s\n", at)

	groups, err := s.kc.GetGroups(ctx, jwt.AccessToken)
	if err != nil {
		return fmt.Errorf("keycloak get groups: %w", err)
	}
	fmt.Printf("[groups-sync] keycloak groups top-level: %d\n", len(groups))

	flat := flattenGocloakGroups(groups)
	fmt.Printf("[groups-sync] keycloak groups flattened: %d\n", len(flat))

	// Покажем первые 5 групп “как есть”
	for i, g := range flat {
		if i >= 5 {
			break
		}
		var id, name any
		if g != nil {
			id = g.ID
			name = g.Name
		}
		fmt.Printf("[groups-sync] sample[%d] id=%v name=%v hasAttrs=%v hasSubGroups=%v\n",
			i,
			id,
			name,
			g != nil && g.Attributes != nil,
			g != nil && g.SubGroups != nil,
		)
		if g != nil && g.Attributes != nil {
			qual := firstAttr(g.Attributes, "qualification")
			spec := firstAttr(g.Attributes, "specialty")
			fmt.Printf("[groups-sync] sample[%d] qualification=%v specialty=%v\n", i, qual, spec)
		}
	}

	params := make([]storage.UpsertGroupParams, 0, len(flat))
	skippedNil := 0
	skippedNoID := 0
	skippedNoName := 0
	skippedBadUUID := 0

	for _, g := range flat {
		if g == nil {
			skippedNil++
			continue
		}
		if g.ID == nil {
			skippedNoID++
			continue
		}
		if g.Name == nil {
			skippedNoName++
			continue
		}

		id, err := uuid.Parse(*g.ID)
		if err != nil {
			skippedBadUUID++
			fmt.Printf("[groups-sync] WARN: bad group uuid %q: %v\n", *g.ID, err)
			continue
		}

		qual := firstAttr(g.Attributes, "qualification")
		spec := firstAttr(g.Attributes, "specialty")

		params = append(params, storage.UpsertGroupParams{
			KeycloakID:    id,
			Name:          *g.Name,
			Qualification: toPgText(qual),
			Specialty:     toPgText(spec),
		})
		cnt, err := s.kc.client.GetGroupsCount(ctx, jwt.AccessToken, s.kc.cfg.Realm, gocloak.GetGroupsParams{})
		fmt.Printf("[groups-sync] groups count from KC: %v err=%v\n", cnt, err)

	}

	fmt.Printf("[groups-sync] mapped for db: %d (skipped: nil=%d noID=%d noName=%d badUUID=%d)\n",
		len(params), skippedNil, skippedNoID, skippedNoName, skippedBadUUID)

	if len(params) == 0 {
		fmt.Printf("[groups-sync] WARN: nothing to save to db (params is empty)\n")
		// Это НЕ ошибка, но полезно знать
	}

	if err := s.repo.CreateGroups(ctx, params); err != nil {
		return fmt.Errorf("save groups to db: %w", err)
	}

	fmt.Printf("[groups-sync] done: saved %d groups\n", len(params))
	return nil
}

// flattenGocloakGroups расплющивает дерево групп (subGroups) в плоский список.
func flattenGocloakGroups(groups []*gocloak.Group) []*gocloak.Group {
	out := make([]*gocloak.Group, 0, len(groups))

	var walk func(g *gocloak.Group)
	walk = func(g *gocloak.Group) {
		if g == nil {
			return
		}
		out = append(out, g)

		if g.SubGroups != nil {
			for i := range *g.SubGroups {
				sg := &(*g.SubGroups)[i]
				walk(sg)
			}
		}
	}

	for _, g := range groups {
		walk(g)
	}
	return out
}

// firstAttr берёт первый элемент attributes[key], если он есть.
func firstAttr(attrs *map[string][]string, key string) *string {
	if attrs == nil {
		return nil
	}
	v, ok := (*attrs)[key]
	if !ok || len(v) == 0 {
		return nil
	}
	s := v[0]
	return &s
}

// toPgText конвертит *string в pgtype.Text (nullable)
func toPgText(p *string) pgtype.Text {
	if p == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *p, Valid: true}
}
