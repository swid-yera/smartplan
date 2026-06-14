package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"eduplan/backend/config"

	"github.com/sirupsen/logrus"
)

type TranslationService interface {
	TranslateText(ctx context.Context, req TranslateTextRequest) (string, error)
	TranslateBatch(ctx context.Context, req TranslateBatchRequest) ([]string, error)
}

type TranslateTextRequest struct {
	Text           string
	SourceLanguage string
	TargetLanguage string
	Domain         string
}

type TranslateBatchRequest struct {
	Texts          []string
	SourceLanguage string
	TargetLanguage string
	Domain         string
}

type translationHTTPClient struct {
	httpClient *http.Client
	baseURL    string
	log        *logrus.Logger
}

type translationBatchRequest struct {
	Source string   `json:"source"`
	Target string   `json:"target"`
	Texts  []string `json:"texts"`
	Domain string   `json:"domain"`
}

type translationBatchResponse struct {
	Texts     []string `json:"texts"`
	Model     string   `json:"model"`
	CacheHits int      `json:"cacheHits"`
}

type translationErrorResponse struct {
	Error  string `json:"error"`
	Detail any    `json:"detail"`
}

func NewTranslationService(httpClient *http.Client, cfg *config.TranslationConfig, log *logrus.Logger) TranslationService {
	if cfg == nil || strings.TrimSpace(cfg.BaseURL) == "" {
		return nil
	}

	client := httpClient
	if client == nil {
		timeout := time.Duration(cfg.TimeoutSeconds) * time.Second
		if timeout <= 0 {
			timeout = 120 * time.Second
		}
		client = &http.Client{Timeout: timeout}
	}

	return &translationHTTPClient{
		httpClient: client,
		baseURL:    strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/"),
		log:        log,
	}
}

func (c *translationHTTPClient) TranslateText(ctx context.Context, req TranslateTextRequest) (string, error) {
	texts, err := c.TranslateBatch(ctx, TranslateBatchRequest{
		Texts:          []string{req.Text},
		SourceLanguage: req.SourceLanguage,
		TargetLanguage: req.TargetLanguage,
		Domain:         req.Domain,
	})
	if err != nil {
		return "", err
	}
	if len(texts) == 0 {
		return "", nil
	}
	return texts[0], nil
}

func (c *translationHTTPClient) TranslateBatch(ctx context.Context, req TranslateBatchRequest) ([]string, error) {
	sourceLanguage := normalizeBackendLanguage(req.SourceLanguage)
	targetLanguage := normalizeBackendLanguage(req.TargetLanguage)
	if sourceLanguage == "" || targetLanguage == "" {
		return nil, fmt.Errorf("sourceLanguage and targetLanguage are required")
	}
	if sourceLanguage == targetLanguage {
		return append([]string(nil), req.Texts...), nil
	}

	domain := strings.TrimSpace(req.Domain)
	if domain == "" {
		domain = "rup"
	}

	payload := translationBatchRequest{
		Source: sourceLanguage,
		Target: targetLanguage,
		Texts:  append([]string(nil), req.Texts...),
		Domain: domain,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("encode translation request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/translate/batch", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build translation request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("call translation service: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read translation response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("translation service returned status %d: %s", resp.StatusCode, translationErrorMessage(respBody))
	}

	var out translationBatchResponse
	if err := json.Unmarshal(respBody, &out); err != nil {
		return nil, fmt.Errorf("decode translation response: %w", err)
	}
	if len(out.Texts) != len(req.Texts) {
		return nil, fmt.Errorf("translation response count mismatch: got %d, want %d", len(out.Texts), len(req.Texts))
	}

	return out.Texts, nil
}

func translationErrorMessage(body []byte) string {
	trimmed := strings.TrimSpace(string(body))
	if trimmed == "" {
		return "empty response body"
	}

	var wrapped translationErrorResponse
	if err := json.Unmarshal(body, &wrapped); err == nil {
		if wrapped.Error != "" {
			return wrapped.Error
		}
		if wrapped.Detail != nil {
			if detail, ok := wrapped.Detail.(map[string]any); ok {
				code, _ := detail["code"].(string)
				message, _ := detail["message"].(string)
				message = strings.TrimSpace(message)
				code = strings.TrimSpace(code)
				if code != "" && message != "" {
					return fmt.Sprintf("%s: %s", code, message)
				}
				if message != "" {
					return message
				}
			}
			if encoded, err := json.Marshal(wrapped.Detail); err == nil {
				return string(encoded)
			}
		}
	}
	return trimmed
}
