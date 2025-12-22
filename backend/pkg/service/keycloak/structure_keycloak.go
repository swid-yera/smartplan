package keycloak

import (
	"time"

	"github.com/google/uuid"
)

// KeycloakEventType represents the type of Keycloak event
type KeycloakEventType string

const (
	EventUserCreated    KeycloakEventType = "USER_CREATED"
	EventUserUpdated    KeycloakEventType = "USER_UPDATED"
	EventUserDeleted    KeycloakEventType = "USER_DELETED"
	EventLogin          KeycloakEventType = "LOGIN"
	EventLogout         KeycloakEventType = "LOGOUT"
	EventUpdatePassword KeycloakEventType = "UPDATE_PASSWORD"
	EventRoleUpdated    KeycloakEventType = "ROLE_UPDATED"
)

// KeycloakEvent represents a Keycloak admin/user event
type KeycloakEvent struct {
	Time      int64                  `json:"time"`
	Type      KeycloakEventType      `json:"type"`
	RealmID   string                 `json:"realmId"`
	ClientID  string                 `json:"clientId,omitempty"`
	UserID    string                 `json:"userId,omitempty"`
	SessionID string                 `json:"sessionId,omitempty"`
	IPAddress string                 `json:"ipAddress,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
}

// User represents a Keycloak user
type User struct {
	ID            string   `json:"id"`
	Username      string   `json:"username"`
	Email         string   `json:"email"`
	FirstName     string   `json:"firstName"`
	LastName      string   `json:"lastName"`
	Roles         []string `json:"roles"`
	Enabled       bool     `json:"enabled"`
	EmailVerified bool     `json:"emailVerified"`
}

// RealmAccess represents the realm access roles
type RealmAccess struct {
	Roles []string `json:"roles"`
}

// UserRepresentation represents the full Keycloak user representation
type UserRepresentation struct {
	ID            string              `json:"id"`
	Username      string              `json:"username"`
	Email         string              `json:"email"`
	FirstName     string              `json:"firstName"`
	LastName      string              `json:"lastName"`
	Enabled       bool                `json:"enabled"`
	EmailVerified bool                `json:"emailVerified"`
	RealmAccess   *RealmAccess        `json:"realm_access,omitempty"`
	Attributes    map[string][]string `json:"attributes,omitempty"`
}

// WebhookPayload represents the payload sent to webhook endpoints
type WebhookPayload struct {
	Type    string                 `json:"type"`
	RealmID string                 `json:"realmId"`
	UserID  string                 `json:"userId,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// UserData represents the user data extracted from Keycloak events
type UserData struct {
	KeycloakID        uuid.UUID
	Username          *string
	Email             string
	FirstName         *string
	LastName          *string
	Roles             []string
	PasswordChangedAt *time.Time
	LastSeenAt        *time.Time
}
