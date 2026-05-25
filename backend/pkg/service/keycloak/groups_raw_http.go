package keycloak

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

func (c *Client) adminURL(path string) (string, error) {
	u, err := url.Parse(c.cfg.KeycloakURL)
	if err != nil {
		return "", fmt.Errorf("parse base url: %w", err)
	}
	u.Path = strings.TrimRight(u.Path, "/") + path
	return u.String(), nil
}

func (c *Client) doAdminGET(ctx context.Context, accessToken string, fullURL string) ([]byte, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return nil, 0, fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	hc := &http.Client{Timeout: 20 * time.Second}
	resp, err := hc.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return body, resp.StatusCode, nil
}

// 1) Топ-левел группы (может НЕ содержать subGroups)
func (c *Client) GetGroupsRawHTTP(ctx context.Context, accessToken string, first, max int) ([]GroupRepresentation, error) {
	base, err := c.adminURL("/admin/realms/" + c.cfg.KeycloakRealm + "/groups/" + c.cfg.GroupID + "/children")
	if err != nil {
		return nil, err
	}

	u, _ := url.Parse(base)
	q := u.Query()
	q.Set("first", strconv.Itoa(first))
	q.Set("max", strconv.Itoa(max))
	q.Set("briefRepresentation", "false")
	u.RawQuery = q.Encode()

	body, code, err := c.doAdminGET(ctx, accessToken, u.String())
	if err != nil {
		return nil, err
	}
	if code < 200 || code >= 300 {
		return nil, fmt.Errorf("admin groups http %d: %s", code, string(body))
	}

	var out []GroupRepresentation
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("unmarshal groups: %w", err)
	}
	return out, nil
}

// 2) Получить группу по ID (вот тут обычно subGroups уже есть)
func (c *Client) GetGroupByIDRawHTTP(ctx context.Context, accessToken, groupID string) (*GroupRepresentation, error) {
	base, err := c.adminURL("/admin/realms/" + c.cfg.KeycloakRealm + "/groups/" + groupID)
	if err != nil {
		return nil, err
	}

	u, _ := url.Parse(base)
	q := u.Query()
	q.Set("briefRepresentation", "false")
	u.RawQuery = q.Encode()

	body, code, err := c.doAdminGET(ctx, accessToken, u.String())
	if err != nil {
		return nil, err
	}
	if code < 200 || code >= 300 {
		return nil, fmt.Errorf("admin group by id http %d: %s", code, string(body))
	}

	var out GroupRepresentation
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("unmarshal group by id: %w", err)
	}
	return &out, nil
}

// 3) Получить детей группы (если вдруг subGroups не заполняется в GetGroupByID)
func (c *Client) GetGroupChildrenRawHTTP(ctx context.Context, accessToken, groupID string, first, max int) ([]GroupRepresentation, error) {
	base, err := c.adminURL("/admin/realms/" + c.cfg.KeycloakRealm + "/groups/" + groupID + "/children")
	if err != nil {
		return nil, err
	}

	u, _ := url.Parse(base)
	q := u.Query()
	q.Set("first", strconv.Itoa(first))
	q.Set("max", strconv.Itoa(max))
	q.Set("briefRepresentation", "false")
	u.RawQuery = q.Encode()

	body, code, err := c.doAdminGET(ctx, accessToken, u.String())
	if err != nil {
		return nil, err
	}
	if code < 200 || code >= 300 {
		return nil, fmt.Errorf("admin group children http %d: %s", code, string(body))
	}

	var out []GroupRepresentation
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("unmarshal group children: %w", err)
	}
	return out, nil
}

func (c *Client) GetUserGroupsRawHTTP(ctx context.Context, accessToken, userID string, first, max int) ([]GroupRepresentation, error) {
	base, err := c.adminURL("/admin/realms/" + c.cfg.KeycloakRealm + "/users/" + userID + "/groups")
	if err != nil {
		return nil, err
	}

	u, _ := url.Parse(base)
	q := u.Query()
	q.Set("first", strconv.Itoa(first))
	q.Set("max", strconv.Itoa(max))
	q.Set("briefRepresentation", "false")
	u.RawQuery = q.Encode()

	body, code, err := c.doAdminGET(ctx, accessToken, u.String())
	if err != nil {
		return nil, err
	}
	if code < 200 || code >= 300 {
		return nil, fmt.Errorf("admin user groups http %d: %s", code, string(body))
	}

	var out []GroupRepresentation
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("unmarshal user groups: %w", err)
	}

	return out, nil
}
