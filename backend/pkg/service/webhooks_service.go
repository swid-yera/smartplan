package service

import (
	"context"
	"fmt"
	"time"

	"eduplan/backend/pkg/keycloak"
	"eduplan/backend/pkg/repository"

	"github.com/google/uuid"
)

type WebhooksService interface {
	ProcessEvent(ctx context.Context, event *keycloak.KeycloakEvent) error
}

type webhooksService struct {
	users repository.UsersRepository
}

func NewWebhooksService(repo *repository.Repository) WebhooksService {
	return &webhooksService{
		users: repo.Users,
	}
}

func (s *webhooksService) ProcessEvent(
	ctx context.Context,
	event *keycloak.KeycloakEvent,
) error {
	if event == nil {
		return fmt.Errorf("event is nil")
	}

	keycloakID, err := uuid.Parse(event.UserID)
	if err != nil {
		return fmt.Errorf("invalid keycloak id: %w", err)
	}

	switch event.Type {

	case keycloak.EventUserCreated, keycloak.EventUserUpdated:
		email, _ := event.Details["mail"].(string)
		roles := extractRoles(event)
		return s.users.UpsertFromKeycloak(ctx, keycloakID, email, roles)

	case keycloak.EventUserDeleted:
		return s.users.DeleteByKeycloakID(ctx, keycloakID)

	case keycloak.EventLogin:
		return s.users.UpdateLastSeenAt(ctx, keycloakID, time.Now())

	case keycloak.EventUpdatePassword:
		return s.users.UpdatePasswordChangedAt(ctx, keycloakID, time.Now())

	case keycloak.EventRoleUpdated:
		return s.users.UpdateRoles(ctx, keycloakID, extractRoles(event))
	}

	return nil
}
