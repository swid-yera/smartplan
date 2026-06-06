package service

import (
	"bytes"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"context"

	"github.com/google/uuid"
)

// DocumentRenderClient — тонкая обёртка для HTTP-запросов к сервису рендеринга документов.
// Инкапсулирует логику ручного следования редиректам и подстановки API-ключа.
type DocumentRenderClient struct {
	httpClient *http.Client
	apiKey     string
}

func NewDocumentRenderClient(httpClient *http.Client, apiKey string) *DocumentRenderClient {
	return &DocumentRenderClient{httpClient: httpClient, apiKey: apiKey}
}

// PostJSON отправляет POST-запрос с JSON-телом на endpoint, вручную следует редиректам.
func (c *DocumentRenderClient) PostJSON(ctx context.Context, endpoint string, body []byte) (*http.Response, error) {
	const maxRedirects = 5
	currentURL := endpoint

	for i := 0; i <= maxRedirects; i++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, currentURL, bytes.NewReader(body))
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Request-ID", uuid.NewString())
		if c.apiKey != "" {
			req.Header.Set("X-API-Key", c.apiKey)
		}

		resp, err := c.doWithoutAutoRedirect(req)
		if err != nil {
			return nil, err
		}

		if !isRedirectStatus(resp.StatusCode) {
			return resp, nil
		}

		nextLocation := strings.TrimSpace(resp.Header.Get("Location"))
		if nextLocation == "" {
			return resp, nil
		}

		nextURL, err := resolveRedirectURL(currentURL, nextLocation)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}
		currentURL = nextURL
	}

	return nil, fmt.Errorf("document rendering redirect limit exceeded for %s", endpoint)
}

func (c *DocumentRenderClient) doWithoutAutoRedirect(req *http.Request) (*http.Response, error) {
	if c.httpClient == nil {
		return nil, fmt.Errorf("http client is not configured")
	}

	clientCopy := *c.httpClient
	clientCopy.CheckRedirect = func(_ *http.Request, _ []*http.Request) error {
		return http.ErrUseLastResponse
	}

	return clientCopy.Do(req)
}

func isRedirectStatus(statusCode int) bool {
	switch statusCode {
	case http.StatusMovedPermanently,
		http.StatusFound,
		http.StatusSeeOther,
		http.StatusTemporaryRedirect,
		http.StatusPermanentRedirect:
		return true
	default:
		return false
	}
}

func resolveRedirectURL(currentURL string, location string) (string, error) {
	locURL, err := url.Parse(location)
	if err != nil {
		return "", fmt.Errorf("invalid redirect location %q: %w", location, err)
	}
	if locURL.IsAbs() {
		return locURL.String(), nil
	}

	baseURL, err := url.Parse(currentURL)
	if err != nil {
		return "", fmt.Errorf("invalid base URL %q: %w", currentURL, err)
	}

	return baseURL.ResolveReference(locURL).String(), nil
}
