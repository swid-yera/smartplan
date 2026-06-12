package helpers

import (
	"eduplan/backend/config"
	storage "eduplan/backend/pkg/sqlc/generated"
	"strings"
)

type UserHelper struct {
}

// this function for verification roles
func ResolveHighestRole(
	kcRoles []string,
	cfg config.KeycloakConfig,
) (storage.UserRole, bool) {

	roleSet := make(map[string]struct{}, len(kcRoles))
	for _, r := range kcRoles {
		roleSet[strings.ToLower(strings.TrimSpace(r))] = struct{}{}
	}

	// приоритет ВАЖЕН
	if hasAny(roleSet, cfg.AdminRoles) {
		return storage.UserRoleADMIN, true
	}
	if hasAny(roleSet, cfg.SpecialRoles) {
		return storage.UserRoleSPECIAL, true
	}
	if hasAny(roleSet, cfg.MethodistRoles) {
		return storage.UserRoleMETHODIST, true
	}
	if hasAny(roleSet, cfg.TeacherRoles) {
		return storage.UserRoleTEACHER, true
	}

	return "", false
}

func ResolveHighestRoleFromGroups(groups []string, cfg config.KeycloakConfig) (storage.UserRole, bool) {
	return ResolveHighestRole(groups, cfg)
}

func ResolveHighestRoleFromClaims(groups []string, realmRoles []string, cfg config.KeycloakConfig) (storage.UserRole, bool) {
	if role, ok := ResolveHighestRole(groups, cfg); ok {
		return role, true
	}

	return ResolveHighestRole(realmRoles, cfg)
}

func hasAny(set map[string]struct{}, roles []string) bool {
	for _, r := range roles {
		if _, ok := set[strings.ToLower(strings.TrimSpace(r))]; ok {
			return true
		}
	}
	return false
}

func ResolveUserType(rawGroup string) storage.UserType {
	switch strings.ToUpper(strings.TrimSpace(rawGroup)) {
	case "GENERAL":
		return storage.UserTypeGENERAL
	case "HEAD":
		return storage.UserTypeHEAD
	case "MASTER":
		return storage.UserTypeMASTER
	case "SPECIALIST":
		return storage.UserTypeSPECIALIST
	default:
		return storage.UserTypeNULL
	}
}

func ResolveUserTypeFromGroups(groups []string) storage.UserType {
	for _, group := range groups {
		userType := ResolveUserType(group)
		if userType != storage.UserTypeNULL {
			return userType
		}
	}

	return storage.UserTypeNULL
}
