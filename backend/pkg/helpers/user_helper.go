package helpers

import (
	"eduplan/backend/config"
	storage "eduplan/backend/pkg/sqlc/generated"
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
		roleSet[r] = struct{}{}
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

func hasAny(set map[string]struct{}, roles []string) bool {
	for _, r := range roles {
		if _, ok := set[r]; ok {
			return true
		}
	}
	return false
}
