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
<<<<<<< HEAD
	users repository.UsersRepository
}

func NewWebhooksService(repo *repository.Repository) WebhooksService {
	return &webhooksService{
		users: repo.Users,
=======
	usersRepo repository.UsersRepository
}

func NewWebhooksService(
	usersRepo repository.UsersRepository,
) WebhooksService {
	return &webhooksService{
		usersRepo: usersRepo,
>>>>>>> 953f052287c4302977d5710763577a23a3139cfa
	}
}

func (s *webhooksService) ProcessEvent(
	ctx context.Context,
	event *keycloak.KeycloakEvent,
) error {
	if event == nil {
		return fmt.Errorf("event is nil")
<<<<<<< HEAD
=======
	}

	if event.UserID == "" {
		return fmt.Errorf("event.UserID is empty")
>>>>>>> 953f052287c4302977d5710763577a23a3139cfa
	}

	keycloakID, err := uuid.Parse(event.UserID)
	if err != nil {
		return fmt.Errorf("invalid keycloak id: %w", err)
	}

	switch event.Type {
<<<<<<< HEAD

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
=======

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
>>>>>>> 953f052287c4302977d5710763577a23a3139cfa
	}

<<<<<<< HEAD
	return nil
=======
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
>>>>>>> 953f052287c4302977d5710763577a23a3139cfa
}
