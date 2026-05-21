package tests

import (
	"testing"
	// "github.com/stretchr/testify/assert"
	// "eduplan/backend/pkg/handler"
	"github.com/google/uuid"
)

func TestCreateRup(t *testing.T) {
	type User struct {
		KeycloakID  uuid.UUID `json:"keycloakId"`
		Email       string    `json:"email"`
		Username    string    `json:"username"`
		FirstName   string    `json:"firstName"`
		LastName    string    `json:"lastName"`
		Role        string    `json:"role"`
		Phone       string    `json:"phone"`
		TotalPoints int32     `json:"totalPoints"`
	}
}
