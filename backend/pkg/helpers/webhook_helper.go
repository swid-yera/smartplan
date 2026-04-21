package helpers

import (
	"eduplan/backend/pkg/service/keycloak"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

type UserResponse struct {
	KeycloakID uuid.UUID `json:"keycloakId"`
	Email      string    `json:"email"`
	Username   string    `json:"username"`
	FirstName  string    `json:"firstName"`
	LastName   string    `json:"lastName"`
	Phone      string    `json:"phone"`
	Roles      string    `json:"roles"`
}

func ExtractRoles(event *keycloak.KeycloakEvent) storage.UserRole {
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

func ConvertToUserResponse(user storage.User) *UserResponse {
	return &UserResponse{
		KeycloakID: user.KeycloakID,
		Email:      user.Email,
		Username:   user.Username,
		FirstName:  user.FirstName.String,
		LastName:   user.LastName.String,
		Phone:      user.Phone.String,
		Roles:      string(user.Role),
	}
}
