package service

import "eduplan/backend/pkg/service/keycloak"

func extractRoles(event *keycloak.KeycloakEvent) []string {
	raw, ok := event.Details["roles"].([]interface{})
	if !ok {
		return nil
	}

	roles := make([]string, 0, len(raw))
	for _, r := range raw {
		if s, ok := r.(string); ok {
			roles = append(roles, s)
		}
	}
	return roles
}
