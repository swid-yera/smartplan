package keycloak

import (
	"context"
	"fmt"
	"strings"

	"github.com/Nerzal/gocloak/v13"
)

type Config struct {
	Realm    string
	ClientID string
	Secret   string
}

type Client struct {
	client  *gocloak.GoCloak
	cfg     Config
	baseURL string
}

func NewClient(url, realm, clientID, secret string) *Client {
	return &Client{
		client:  gocloak.NewClient(url),
		baseURL: strings.TrimRight(url, "/"),
		cfg: Config{
			Realm:    realm,
			ClientID: clientID,
			Secret:   secret,
		},
	}
}

// IntrospectToken используется твоим AuthRequired middleware.
// Проверяет Bearer token через introspection endpoint (ретроспект).
func (c *Client) IntrospectToken(ctx context.Context, token string) (*gocloak.IntroSpectTokenResult, error) {
	res, err := c.client.RetrospectToken(ctx, token, c.cfg.ClientID, c.cfg.Secret, c.cfg.Realm)
	if err != nil {
		return nil, fmt.Errorf("failed to introspect token: %w", err)
	}
	return res, nil
}

// LoginServiceAccount — токен service-account (client_credentials) для админских запросов (группы).
func (c *Client) LoginServiceAccount(ctx context.Context) (*gocloak.JWT, error) {
	jwt, err := c.client.LoginClient(ctx, c.cfg.ClientID, c.cfg.Secret, c.cfg.Realm)
	if err != nil {
		return nil, fmt.Errorf("login service account: %w", err)
	}
	return jwt, nil
}
