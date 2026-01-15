package service

import (
	"eduplan/backend/pkg/service/keycloak"
	storage "eduplan/backend/pkg/sqlc/generated"
)

func extractRoles(event *keycloak.KeycloakEvent) storage.UserRole {
	raw, ok := event.Details["roles"].([]interface{})
	if !ok {
		return storage.UserRoleTEACHER
	}

	for _, r := range raw {
		s, ok := r.(string)
		if !ok {
			continue
		}

		switch s {
		case "admin":
			return storage.UserRoleADMIN
		case "methodist":
			return storage.UserRoleMETHODIST
		case "teacher":
			return storage.UserRoleTEACHER
		}
	}

	return storage.UserRoleTEACHER
}
