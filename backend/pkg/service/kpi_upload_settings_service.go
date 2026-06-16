package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"eduplan/backend/pkg/repository"
)

type KpiUploadSettingsResponse struct {
	BlockedAfterDate *string `json:"blockedAfterDate"`
}

type KpiUploadSettingsRequest struct {
	BlockedAfterDate *string `json:"blockedAfterDate"`
}

type KpiUploadSettingsService interface {
	GetKpiUploadBlockDate(ctx context.Context) (*KpiUploadSettingsResponse, error)
	SetKpiUploadBlockDate(ctx context.Context, blockedAfterDate *string) (*KpiUploadSettingsResponse, error)
}

type kpiUploadSettingsService struct {
	repo repository.KPIUploadSettings
}

func NewKpiUploadSettingsService(repo repository.KPIUploadSettings) KpiUploadSettingsService {
	return &kpiUploadSettingsService{repo: repo}
}

func (s *kpiUploadSettingsService) GetKpiUploadBlockDate(ctx context.Context) (*KpiUploadSettingsResponse, error) {
	blockedAfterDate, err := s.repo.GetKpiUploadBlockDate(ctx)
	if err != nil {
		return nil, err
	}

	return &KpiUploadSettingsResponse{BlockedAfterDate: formatSettingDate(blockedAfterDate)}, nil
}

func (s *kpiUploadSettingsService) SetKpiUploadBlockDate(ctx context.Context, blockedAfterDate *string) (*KpiUploadSettingsResponse, error) {
	parsedDate, err := parseSettingDate(blockedAfterDate)
	if err != nil {
		return nil, err
	}

	if err := s.repo.SetKpiUploadBlockDate(ctx, parsedDate); err != nil {
		return nil, err
	}

	return &KpiUploadSettingsResponse{BlockedAfterDate: formatSettingDate(parsedDate)}, nil
}

func parseSettingDate(value *string) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, nil
	}

	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return nil, fmt.Errorf("invalid blockedAfterDate")
	}

	date := time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 0, 0, 0, 0, time.UTC)
	return &date, nil
}

func formatSettingDate(value *time.Time) *string {
	if value == nil {
		return nil
	}

	formatted := value.Format("2006-01-02")
	return &formatted
}
