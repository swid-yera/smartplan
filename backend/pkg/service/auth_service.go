package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"eduplan/backend/config"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	kcservice "eduplan/backend/pkg/service/keycloak"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

type AuthService interface {
	HandleCallback(ctx context.Context, keycloakID uuid.UUID, accessToken string, idToken string, claims jwt.MapClaims) (uuid.UUID, error)
	Logout(ctx context.Context, sessionID string) error
	InvalidateAllSessions(ctx context.Context, keycloakID uuid.UUID) error
}

type authService struct {
	redis *redis.Client
	users repository.AuthRepository
	kc    *kcservice.Client
	cfg   *config.KeycloakConfig
	log   *logrus.Entry
}

func NewAuthService(redis *redis.Client, users repository.AuthRepository, kc *kcservice.Client, cfg *config.KeycloakConfig, log *logrus.Logger) AuthService {
	return &authService{
		redis: redis,
		users: users,
		kc:    kc,
		cfg:   cfg,
		log:   log.WithField("service", "AuthService"),
	}
}

// HandleCallback создает пользователя (если нужно), синхронизирует department membership и создает сессию в Redis.
func (s *authService) HandleCallback(ctx context.Context, keycloakID uuid.UUID, accessToken string, idToken string, claims jwt.MapClaims) (uuid.UUID, error) {
	email, _ := claims["email"].(string)
	username, _ := claims["preferred_username"].(string)
	firstName, _ := claims["given_name"].(string)
	lastName, _ := claims["family_name"].(string)
	phone, _ := claims["phone"].(string)

	realmAccess, ok := claims["realm_access"].(map[string]interface{})
	if !ok {
		return uuid.Nil, fmt.Errorf("realm_access missing in token claims")
	}

	rolesRaw, ok := realmAccess["roles"].([]interface{})
	if !ok {
		return uuid.Nil, fmt.Errorf("roles missing in token claims")
	}

	kcRoles := make([]string, 0, len(rolesRaw))
	for _, r := range rolesRaw {
		if role, ok := r.(string); ok {
			kcRoles = append(kcRoles, role)
		}
	}

	role, ok := helpers.ResolveHighestRole(kcRoles, *s.cfg)
	if !ok {
		return uuid.Nil, fmt.Errorf("user has no allowed roles from list: %v", kcRoles)
	}

	s.log.WithFields(logrus.Fields{
		"keycloak_id": keycloakID,
		"role":        role,
	}).Info("Resolved user role")

	user, err := s.users.CreateUser(ctx, keycloakID, role, email, username, firstName, lastName, phone)
	if err != nil {
		if isUniqueViolation(err) {
			err = s.users.UpdateUser(ctx, keycloakID, role, email, username, firstName, lastName, phone)
			if err != nil {
				s.log.WithError(err).Error("Failed to update existing user profile")
				return uuid.Nil, err
			}

			user, err = s.users.GetUserByKeycloakID(ctx, keycloakID)
			if err != nil {
				s.log.WithError(err).Error("Failed to get existing user after update")
				return uuid.Nil, err
			}
		} else {
			s.log.WithError(err).Error("Failed to create user")
			return uuid.Nil, err
		}
	}

	_ = user

	departments, err := s.resolveUserDepartments(ctx, keycloakID, claims)
	if err != nil {
		s.log.WithError(err).WithField("keycloak_id", keycloakID).Error("Failed to resolve user departments")
		return uuid.Nil, err
	}

	if err := s.users.SyncUserDepartments(ctx, keycloakID, departments); err != nil {
		s.log.WithError(err).WithField("keycloak_id", keycloakID).Error("Failed to sync user departments")
		return uuid.Nil, err
	}

	sessionID := uuid.New()
	sessionKey := "session:" + sessionID.String()
	userSessionsKey := "user_sessions:" + keycloakID.String()

	pipe := s.redis.TxPipeline()
	pipe.HSet(ctx, sessionKey,
		"keycloak_id", keycloakID.String(),
		"access_token", accessToken,
		"id_token", idToken,
	)
	pipe.Expire(ctx, sessionKey, 24*time.Hour)
	pipe.SAdd(ctx, userSessionsKey, sessionID.String())
	pipe.Expire(ctx, userSessionsKey, 24*time.Hour)

	if _, err := pipe.Exec(ctx); err != nil {
		s.log.WithError(err).Error("Redis transaction failed during session creation")
		return uuid.Nil, err
	}

	return sessionID, nil
}

func (s *authService) resolveUserDepartments(ctx context.Context, keycloakID uuid.UUID, claims jwt.MapClaims) ([]repository.DepartmentMembershipInput, error) {
	if departments, ok := s.extractDepartmentsFromClaims(claims); ok {
		return departments, nil
	}

	return s.extractDepartmentsFromKeycloak(ctx, keycloakID)
}

func (s *authService) extractDepartmentsFromClaims(claims jwt.MapClaims) ([]repository.DepartmentMembershipInput, bool) {
	teacherGroupID := strings.TrimSpace(s.cfg.TeacherGroupID)
	if teacherGroupID == "" {
		return nil, false
	}

	raw, exists := claims["groups"]
	if !exists || raw == nil {
		return nil, false
	}

	groups, ok := parseClaimGroups(raw)
	if !ok || len(groups) == 0 {
		return nil, false
	}

	root := findGroupByID(groups, teacherGroupID)
	if root == nil || len(root.SubGroups) == 0 {
		return nil, false
	}

	departments := mapGroupsToDepartments(root.SubGroups)
	if len(departments) == 0 {
		return nil, false
	}

	return departments, true
}

func (s *authService) extractDepartmentsFromKeycloak(ctx context.Context, keycloakID uuid.UUID) ([]repository.DepartmentMembershipInput, error) {
	teacherGroupID := strings.TrimSpace(s.cfg.TeacherGroupID)
	if teacherGroupID == "" {
		return nil, nil
	}

	jwtToken, err := s.kc.LoginServiceAccount(ctx)
	if err != nil {
		return nil, fmt.Errorf("keycloak login service account: %w", err)
	}

	teacherRoot, err := s.kc.GetGroupByIDRawHTTP(ctx, jwtToken.AccessToken, teacherGroupID)
	if err != nil {
		return nil, fmt.Errorf("keycloak get teacher root group: %w", err)
	}

	if len(teacherRoot.SubGroups) == 0 {
		subGroups, childrenErr := s.kc.GetGroupChildrenRawHTTP(ctx, jwtToken.AccessToken, teacherGroupID, 0, 5000)
		if childrenErr != nil {
			return nil, fmt.Errorf("keycloak get teacher root children: %w", childrenErr)
		}
		teacherRoot.SubGroups = subGroups
	}

	if len(teacherRoot.SubGroups) == 0 {
		return nil, nil
	}

	userGroups, err := s.kc.GetUserGroupsRawHTTP(ctx, jwtToken.AccessToken, keycloakID.String(), 0, 5000)
	if err != nil {
		return nil, fmt.Errorf("keycloak get user groups: %w", err)
	}

	memberIDs := make(map[string]struct{}, len(userGroups))
	memberPaths := make([]string, 0, len(userGroups))
	for _, group := range userGroups {
		id := strings.TrimSpace(group.ID)
		if id != "" {
			memberIDs[id] = struct{}{}
		}
		path := strings.TrimSpace(group.Path)
		if path != "" {
			memberPaths = append(memberPaths, path)
		}
	}

	departments := make([]repository.DepartmentMembershipInput, 0, len(teacherRoot.SubGroups))
	for _, group := range teacherRoot.SubGroups {
		if !isDepartmentMember(group, memberIDs, memberPaths) {
			continue
		}

		department, ok := mapGroupToDepartment(group)
		if !ok {
			continue
		}

		departments = append(departments, department)
	}

	return departments, nil
}

func mapGroupsToDepartments(groups []kcservice.GroupRepresentation) []repository.DepartmentMembershipInput {
	departments := make([]repository.DepartmentMembershipInput, 0, len(groups))
	for _, group := range groups {
		department, ok := mapGroupToDepartment(group)
		if !ok {
			continue
		}
		departments = append(departments, department)
	}
	return departments
}

func mapGroupToDepartment(group kcservice.GroupRepresentation) (repository.DepartmentMembershipInput, bool) {
	id := strings.TrimSpace(group.ID)
	if id == "" {
		return repository.DepartmentMembershipInput{}, false
	}

	parsedID, err := uuid.Parse(id)
	if err != nil {
		return repository.DepartmentMembershipInput{}, false
	}

	name := strings.TrimSpace(group.Name)
	ru := strings.TrimSpace(firstAttr(group.Attributes, "description"))
	kz := strings.TrimSpace(firstAttr(group.Attributes, "mail"))
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

func isDepartmentMember(department kcservice.GroupRepresentation, memberIDs map[string]struct{}, memberPaths []string) bool {
	if id := strings.TrimSpace(department.ID); id != "" {
		if _, ok := memberIDs[id]; ok {
			return true
		}
	}

	departmentPath := strings.TrimSpace(department.Path)
	if departmentPath == "" {
		return false
	}

	prefix := departmentPath + "/"
	for _, memberPath := range memberPaths {
		if memberPath == departmentPath || strings.HasPrefix(memberPath, prefix) {
			return true
		}
	}

	return false
}

func findGroupByID(groups []kcservice.GroupRepresentation, id string) *kcservice.GroupRepresentation {
	for i := range groups {
		if groups[i].ID == id {
			return &groups[i]
		}
		if child := findGroupByID(groups[i].SubGroups, id); child != nil {
			return child
		}
	}
	return nil
}

func parseClaimGroups(raw interface{}) ([]kcservice.GroupRepresentation, bool) {
	items, ok := raw.([]interface{})
	if !ok {
		return nil, false
	}

	groups := make([]kcservice.GroupRepresentation, 0, len(items))
	for _, item := range items {
		group, parsed := parseClaimGroup(item)
		if parsed {
			groups = append(groups, group)
		}
	}

	return groups, len(groups) > 0
}

func parseClaimGroup(raw interface{}) (kcservice.GroupRepresentation, bool) {
	payload, ok := raw.(map[string]interface{})
	if !ok {
		return kcservice.GroupRepresentation{}, false
	}

	group := kcservice.GroupRepresentation{}
	if v, ok := payload["id"].(string); ok {
		group.ID = v
	}
	if v, ok := payload["name"].(string); ok {
		group.Name = v
	}
	if v, ok := payload["path"].(string); ok {
		group.Path = v
	}

	group.Attributes = parseClaimGroupAttributes(payload["attributes"])
	group.SubGroups = parseClaimSubGroups(payload)

	if strings.TrimSpace(group.ID) == "" && strings.TrimSpace(group.Name) == "" && len(group.SubGroups) == 0 {
		return kcservice.GroupRepresentation{}, false
	}

	return group, true
}

func parseClaimSubGroups(payload map[string]interface{}) []kcservice.GroupRepresentation {
	candidates := []string{"subGroups", "subgroups", "children"}
	for _, key := range candidates {
		raw, ok := payload[key]
		if !ok || raw == nil {
			continue
		}

		items, ok := raw.([]interface{})
		if !ok {
			continue
		}

		subGroups := make([]kcservice.GroupRepresentation, 0, len(items))
		for _, item := range items {
			group, parsed := parseClaimGroup(item)
			if parsed {
				subGroups = append(subGroups, group)
			}
		}
		return subGroups
	}

	return nil
}

func parseClaimGroupAttributes(raw interface{}) map[string][]string {
	attrs := map[string][]string{}
	payload, ok := raw.(map[string]interface{})
	if !ok {
		return attrs
	}

	for key, value := range payload {
		switch v := value.(type) {
		case string:
			attrs[key] = []string{v}
		case []string:
			attrs[key] = append([]string(nil), v...)
		case []interface{}:
			items := make([]string, 0, len(v))
			for _, item := range v {
				if s, ok := item.(string); ok {
					items = append(items, s)
				}
			}
			if len(items) > 0 {
				attrs[key] = items
			}
		}
	}

	return attrs
}

func firstAttr(attrs map[string][]string, key string) string {
	values, ok := attrs[key]
	if !ok || len(values) == 0 {
		return ""
	}
	return values[0]
}

// Logout удаляет одну сессию по sessionID
func (s *authService) Logout(ctx context.Context, sessionID string) error {
	sessionKey := "session:" + sessionID

	keycloakID, err := s.redis.HGet(ctx, sessionKey, "keycloak_id").Result()
	if err != nil {
		if !errors.Is(err, redis.Nil) {
			s.log.WithError(err).WithField("session_id", sessionID).Error("Failed to get keycloak_id from session in Redis")
		}
		return err
	}

	pipe := s.redis.TxPipeline()
	pipe.Del(ctx, sessionKey)
	pipe.SRem(ctx, "user_sessions:"+keycloakID, sessionID)

	_, err = pipe.Exec(ctx)
	if err != nil {
		s.log.WithError(err).WithField("session_id", sessionID).Error("Redis transaction failed during logout")
	}
	return err
}

// InvalidateAllSessions удаляет все сессии пользователя
func (s *authService) InvalidateAllSessions(ctx context.Context, keycloakID uuid.UUID) error {
	userSessionsKey := "user_sessions:" + keycloakID.String()

	sessionIDs, err := s.redis.SMembers(ctx, userSessionsKey).Result()
	if err != nil {
		s.log.WithError(err).WithField("keycloak_id", keycloakID).Error("Failed to get session IDs for user from Redis")
		return err
	}

	if len(sessionIDs) == 0 {
		return nil
	}

	pipe := s.redis.TxPipeline()
	for _, sid := range sessionIDs {
		pipe.Del(ctx, "session:"+sid)
	}
	pipe.Del(ctx, userSessionsKey)

	_, err = pipe.Exec(ctx)
	if err != nil {
		s.log.WithError(err).WithField("keycloak_id", keycloakID).Error("Redis transaction failed during InvalidateAllSessions")
	}
	return err
}

// isUniqueViolation проверяет ошибку Postgres на уникальное ограничение
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
