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
	usersRepo repository.UsersRepository
}

func NewWebhooksService(
	usersRepo repository.UsersRepository,
) WebhooksService {
	return &webhooksService{
		usersRepo: usersRepo,
	}
}

func (s *webhooksService) ProcessEvent(
	ctx context.Context,
	event *keycloak.KeycloakEvent,
) error {
	if event == nil {
		return fmt.Errorf("event is nil")
	}

	if event.UserID == "" {
		return fmt.Errorf("event.UserID is empty")
	}

	keycloakID, err := uuid.Parse(event.UserID)
	if err != nil {
		return fmt.Errorf("invalid keycloak_id: %w", err)
	}

	switch event.Type {

	case keycloak.EventUserCreated:
		return s.handleUserUpsert(ctx, keycloakID, event)

	case keycloak.EventUserUpdated:
		return s.handleUserUpsert(ctx, keycloakID, event)

	case keycloak.EventUserDeleted:
		return s.usersRepo.DeleteByKeycloakID(ctx, keycloakID)

	case keycloak.EventLogin:
		return s.usersRepo.UpdateLastSeenAt(ctx, keycloakID, time.Now())

	case keycloak.EventUpdatePassword:
		return s.usersRepo.UpdatePasswordChangedAt(ctx, keycloakID, time.Now())

	case keycloak.EventRoleUpdated:
		roles := extractRoles(event)
		return s.usersRepo.UpdateRoles(ctx, keycloakID, roles)

	default:
		log.Warn().
			Str("type", string(event.Type)).
			Msg("Unhandled Keycloak webhook event")
		return nil
	}
}

func (s *webhooksService) handleUserUpsert(
	ctx context.Context,
	keycloakID uuid.UUID,
	event *keycloak.KeycloakEvent,
) error {
	email, err := getString(event.Details, "mail")
	if err != nil {
		return err
	}

	user := repository.UserFromKeycloak{
		KeycloakID: keycloakID,
		Email:      email,
		Roles:      extractRoles(event),
	}

	return s.usersRepo.UpsertFromKeycloak(ctx, user)
}
