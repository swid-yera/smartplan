package keycloak

import (
	"context"
	"fmt"

	"github.com/Nerzal/gocloak/v13"
)

type Client struct {
	client   *gocloak.GoCloak
	realm    string
	clientID string
	secret   string
}

func NewClient(url, realm, clientID, secret string) *Client {
	return &Client{
		client:   gocloak.NewClient(url),
		realm:    realm,
		clientID: clientID,
		secret:   secret,
	}
}

func (c *Client) IntrospectToken(ctx context.Context, token string) (*gocloak.IntroSpectTokenResult, error) {
	result, err := c.client.RetrospectToken(ctx, token, c.clientID, c.secret, c.realm)
	if err != nil {
		return nil, fmt.Errorf("failed to introspect token: %w", err)
	}
	return result, nil
}
