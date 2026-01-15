package keycloak

import (
	"context"
	"eduplan/backend/config"
	"fmt"

	"github.com/Nerzal/gocloak/v13"
)

type Client struct {
	client *gocloak.GoCloak
	cfg    *config.KeycloakConfig
}

func NewClient(cfg *config.KeycloakConfig) *Client {
	return &Client{
		client: gocloak.NewClient(cfg.KeycloakURL),
		cfg:    cfg,
	}
}

// IntrospectToken используется твоим AuthRequired middleware.
// Проверяет Bearer token через introspection endpoint (ретроспект).
func (c *Client) IntrospectToken(ctx context.Context, token string) (*gocloak.IntroSpectTokenResult, error) {
	res, err := c.client.RetrospectToken(ctx, token, c.cfg.KeycloakClientID, c.cfg.KeycloakSecret, c.cfg.KeycloakRealm)
	if err != nil {
		return nil, fmt.Errorf("failed to introspect token: %w", err)
	}
	return res, nil
}

// LoginServiceAccount — токен service-account (client_credentials) для админских запросов (группы).
func (c *Client) LoginServiceAccount(ctx context.Context) (*gocloak.JWT, error) {
	jwt, err := c.client.LoginClient(ctx, c.cfg.KeycloakClientID, c.cfg.KeycloakSecret, c.cfg.KeycloakRealm)
	if err != nil {
		return nil, fmt.Errorf("login service account: %w", err)
	}
	return jwt, nil
}
