package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"eduplan/backend/config"
)

type CryptoClient interface {
	ValidateKeyOwnership(ctx context.Context, payload ValidateKeyOwnershipRequest, correlationID string) (*ValidateKeyOwnershipResponse, error)
	VerifySignature(ctx context.Context, payload VerifySignatureRequest, correlationID string) (*VerifySignatureResponse, error)
}

type cryptoClient struct {
	httpClient *http.Client
	baseURL    string
	authToken  string
	maxRetries int
}

type ValidateKeyOwnershipRequest struct {
	KeyID  string `json:"key_id"`
	UserID string `json:"user_id"`
}

type ValidateKeyOwnershipResponse struct {
	KeyID            string `json:"key_id"`
	UserID           string `json:"user_id"`
	IsValid          bool   `json:"is_valid"`
	BelongsToUser    bool   `json:"belongs_to_user"`
	KeyStatus        string `json:"key_status"`
	ValidationStatus string `json:"validation_status"`
}

type VerifySignatureRequest struct {
	PublicKeyID  string `json:"public_key_id"`
	DocumentHash string `json:"document_hash"`
	Signature    string `json:"signature"`
}

type VerifySignatureResponse struct {
	IsValid bool   `json:"is_valid"`
	Status  string `json:"status"`
}

type CryptoHTTPError struct {
	StatusCode int
	Body       string
}

func (e *CryptoHTTPError) Error() string {
	return fmt.Sprintf("kripto request failed (%d): %s", e.StatusCode, e.Body)
}

func NewCryptoClient(httpClient *http.Client, cfg *config.CryptoConfig) CryptoClient {
	if cfg == nil || strings.TrimSpace(cfg.BaseURL) == "" {
		return nil
	}

	client := httpClient
	if client == nil {
		timeout := time.Duration(cfg.TimeoutSeconds) * time.Second
		if timeout <= 0 {
			timeout = 10 * time.Second
		}
		client = &http.Client{Timeout: timeout}
	}

	retries := cfg.MaxRetries
	if retries < 0 {
		retries = 0
	}

	return &cryptoClient{
		httpClient: client,
		baseURL:    strings.TrimRight(cfg.BaseURL, "/"),
		authToken:  strings.TrimSpace(cfg.AuthToken),
		maxRetries: retries,
	}
}

func (c *cryptoClient) ValidateKeyOwnership(
	ctx context.Context,
	payload ValidateKeyOwnershipRequest,
	correlationID string,
) (*ValidateKeyOwnershipResponse, error) {
	if strings.TrimSpace(payload.KeyID) == "" {
		return nil, fmt.Errorf("key_id is required")
	}
	if strings.TrimSpace(payload.UserID) == "" {
		return nil, fmt.Errorf("user_id is required")
	}

	var out ValidateKeyOwnershipResponse
	if err := c.doJSON(
		ctx,
		http.MethodPost,
		"/integration/keys/validate",
		payload,
		true,
		correlationID,
		&out,
	); err != nil {
		return nil, err
	}

	return &out, nil
}

func (c *cryptoClient) VerifySignature(
	ctx context.Context,
	payload VerifySignatureRequest,
	correlationID string,
) (*VerifySignatureResponse, error) {
	if strings.TrimSpace(payload.PublicKeyID) == "" {
		return nil, fmt.Errorf("public_key_id is required")
	}
	if strings.TrimSpace(payload.DocumentHash) == "" {
		return nil, fmt.Errorf("document_hash is required")
	}
	if strings.TrimSpace(payload.Signature) == "" {
		return nil, fmt.Errorf("signature is required")
	}

	var out VerifySignatureResponse
	if err := c.doJSON(
		ctx,
		http.MethodPost,
		"/verify",
		payload,
		true,
		correlationID,
		&out,
	); err != nil {
		return nil, err
	}

	return &out, nil
}

func (c *cryptoClient) doJSON(
	ctx context.Context,
	method string,
	path string,
	payload any,
	requiresAuth bool,
	correlationID string,
	out any,
) error {
	fullURL := c.baseURL + path

	var body []byte
	var err error
	if payload != nil {
		body, err = json.Marshal(payload)
		if err != nil {
			return fmt.Errorf("marshal request body: %w", err)
		}
	}

	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		var requestBody io.Reader
		if body != nil {
			requestBody = bytes.NewReader(body)
		}

		req, err := http.NewRequestWithContext(ctx, method, fullURL, requestBody)
		if err != nil {
			return fmt.Errorf("create request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")
		if strings.TrimSpace(correlationID) != "" {
			req.Header.Set("X-Correlation-ID", correlationID)
		}

		if requiresAuth {
			if c.authToken != "" {
				req.Header.Set("Authorization", "Bearer "+c.authToken)
			}
		}

		resp, err := c.httpClient.Do(req)
		if err != nil {
			if shouldRetryNetworkError(err) && attempt < c.maxRetries {
				time.Sleep(time.Duration(attempt+1) * 200 * time.Millisecond)
				continue
			}
			return fmt.Errorf("request failed: %w", err)
		}

		respBody, readErr := io.ReadAll(resp.Body)
		resp.Body.Close()
		if readErr != nil {
			return fmt.Errorf("read response body: %w", readErr)
		}

		if resp.StatusCode >= 500 && attempt < c.maxRetries {
			time.Sleep(time.Duration(attempt+1) * 200 * time.Millisecond)
			continue
		}

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			msg := strings.TrimSpace(string(respBody))
			if msg == "" {
				msg = http.StatusText(resp.StatusCode)
			}
			return &CryptoHTTPError{
				StatusCode: resp.StatusCode,
				Body:       msg,
			}
		}

		if out == nil || len(respBody) == 0 {
			return nil
		}
		if err := json.Unmarshal(respBody, out); err != nil {
			return fmt.Errorf("unmarshal response body: %w", err)
		}
		return nil
	}

	return fmt.Errorf("kripto request failed after retries")
}

func shouldRetryNetworkError(err error) bool {
	var netErr net.Error
	return errors.As(err, &netErr) && netErr.Timeout()
}
