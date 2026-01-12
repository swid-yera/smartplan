package keycloak

import (
	"context"
	"fmt"

	"github.com/Nerzal/gocloak/v13"
)

type Config struct {
	Realm    string
	ClientID string
	Secret   string
}

type Client struct {
	client *gocloak.GoCloak
	cfg    Config
}

func NewClient(url, realm, clientID, secret string) *Client {
	return &Client{
		client: gocloak.NewClient(url), // ✅ ок
		cfg: Config{
			Realm:    realm,
			ClientID: clientID,
			Secret:   secret,
		},
	}
}

func (c *Client) IntrospectToken(ctx context.Context, token string) (*gocloak.IntroSpectTokenResult, error) {
	result, err := c.client.RetrospectToken(ctx, token, c.cfg.ClientID, c.cfg.Secret, c.cfg.Realm)
	if err != nil {
		return nil, fmt.Errorf("failed to introspect token: %w", err)
	}
	return result, nil
}

func (c *Client) LoginServiceAccount(ctx context.Context) (*gocloak.JWT, error) {
	jwt, err := c.client.LoginClient(ctx, c.cfg.ClientID, c.cfg.Secret, c.cfg.Realm)
	if err != nil {
		return nil, fmt.Errorf("login service account: %w", err)
	}
	return jwt, nil
}

func (c *Client) GetGroups(ctx context.Context, accessToken string) ([]*gocloak.Group, error) {
	params := gocloak.GetGroupsParams{
		BriefRepresentation: gocloak.BoolP(false),
		First:               gocloak.IntP(0),
		Max:                 gocloak.IntP(5000),
		// Search: gocloak.StringP(""), // если в твоей версии есть поле Search — можно раскомментить
	}

	groups, err := c.client.GetGroups(ctx, accessToken, c.cfg.Realm, params)
	if err != nil {
		return nil, fmt.Errorf("get groups: %w", err)
	}
	return groups, nil
}
