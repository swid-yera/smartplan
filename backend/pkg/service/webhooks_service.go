package service

import (
	"context"
	"fmt"
	"time"

	"eduplan/backend/pkg/keycloak"
	"eduplan/backend/pkg/repository"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

type WebhooksService interface {
	ProcessEvent(ctx context.Context, event *keycloak.KeycloakEvent) error
}

type webhooksService struct {
	webhookRepo repository.WebhookRepository
	usersRepo   repository.UsersRepository
}

func NewWebhooksService(
	webhookRepo repository.WebhookRepository,
	usersRepo repository.UsersRepository,
) WebhooksService {
	return &webhooksService{
		webhookRepo: webhookRepo,
		usersRepo:   usersRepo,
	}
}

func (s *webhooksService) ProcessEvent(
	ctx context.Context,
	event *keycloak.KeycloakEvent,
) error {
	if event.UserID == "" {
		return fmt.Errorf("event.UserID is empty")
	}

	keycloakID, err := uuid.Parse(event.UserID)
	if err != nil {
		return fmt.Errorf("invalid keycloak_id: %w", err)
	}

	switch event.Type {
	case keycloak.EventUserCreated:
		return s.handleUserCreated(ctx, keycloakID, event)

	case keycloak.EventUserUpdated:
		return s.handleUserUpdated(ctx, keycloakID, event)

	case keycloak.EventUserDeleted:
		return s.webhookRepo.DeleteUser(ctx, keycloakID)

	case keycloak.EventLogin:
		return s.webhookRepo.UpdateUserLastSeenAt(ctx, keycloakID, time.Now())

	case keycloak.EventUpdatePassword:
		return s.webhookRepo.UpdateUserPasswordChangedAt(ctx, keycloakID, time.Now())

	case keycloak.EventRoleUpdated:
		roles := extractRoles(event)
		return s.webhookRepo.UpdateUserRoles(ctx, keycloakID, roles)

	default:
		log.Warn().
			Str("type", string(event.Type)).
			Msg("Unhandled Keycloak webhook event")
		return nil
	}
}

// Заглушки оставил, чтобы проект собирался.
// Потом заполни CreateUserParams из event.
func (s *webhooksService) handleUserCreated(
	ctx context.Context,
	keycloakID uuid.UUID,
	event *keycloak.KeycloakEvent,
) error {
	return nil
}

func (s *webhooksService) handleUserUpdated(
	ctx context.Context,
	keycloakID uuid.UUID,
	event *keycloak.KeycloakEvent,
) error {
	return nil
}

func extractRoles(event *keycloak.KeycloakEvent) []string {
	if realmAccess, ok := event.Details["realm_access"].(map[string]interface{}); ok {
		if rolesRaw, ok := realmAccess["roles"].([]interface{}); ok {
			roles := make([]string, 0, len(rolesRaw))
			for _, r := range rolesRaw {
				if s, ok := r.(string); ok {
					roles = append(roles, s)
				}
			}
			return roles
		}
	}
	return []string{}
}
