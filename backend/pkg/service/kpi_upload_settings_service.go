package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"eduplan/backend/pkg/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type KpiUploadSettingsUserResponse struct {
	KeycloakID uuid.UUID `json:"keycloakId"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	FirstName  string    `json:"firstName"`
	LastName   string    `json:"lastName"`
}

type KpiUploadSettingsResponse struct {
	BlockedAfterDate    *string                         `json:"blockedAfterDate"`
	ExceptionUserIDs    []string                        `json:"exceptionUserIds"`
	ExceptionUsers      []KpiUploadSettingsUserResponse `json:"exceptionUsers,omitempty"`
	CanBypassUploadLock bool                            `json:"canBypassUploadLock"`
}

type KpiUploadSettingsRequest struct {
	BlockedAfterDate *string  `json:"blockedAfterDate"`
	ExceptionUserIDs []string `json:"exceptionUserIds"`
}

type KpiUploadSettingsService interface {
	GetKpiUploadSettings(ctx context.Context, currentUser *User) (*KpiUploadSettingsResponse, error)
	SetKpiUploadSettings(ctx context.Context, currentUser *User, req KpiUploadSettingsRequest) (*KpiUploadSettingsResponse, error)
}

type kpiUploadSettingsService struct {
	repo     repository.KPIUploadSettings
	userRepo repository.UsersRepository
}

func NewKpiUploadSettingsService(repo repository.KPIUploadSettings, userRepo repository.UsersRepository) KpiUploadSettingsService {
	return &kpiUploadSettingsService{repo: repo, userRepo: userRepo}
}

func (s *kpiUploadSettingsService) GetKpiUploadSettings(ctx context.Context, currentUser *User) (*KpiUploadSettingsResponse, error) {
	settings, err := s.repo.GetKpiUploadSettings(ctx)
	if err != nil {
		return nil, err
	}

	return s.buildResponse(ctx, settings, currentUser)
}

func (s *kpiUploadSettingsService) SetKpiUploadSettings(ctx context.Context, currentUser *User, req KpiUploadSettingsRequest) (*KpiUploadSettingsResponse, error) {
	parsedDate, err := parseSettingDate(req.BlockedAfterDate)
	if err != nil {
		return nil, err
	}

	exceptionUserIDs, err := parseSettingUserIDs(req.ExceptionUserIDs)
	if err != nil {
		return nil, err
	}

	exceptionUsers, err := s.resolveExceptionUsers(ctx, exceptionUserIDs)
	if err != nil {
		return nil, err
	}

	settings := repository.KPIUploadSettingsData{
		BlockedAfterDate: parsedDate,
		ExceptionUserIDs: exceptionUserIDs,
	}
	if err := s.repo.SetKpiUploadSettings(ctx, settings); err != nil {
		return nil, err
	}

	return &KpiUploadSettingsResponse{
		BlockedAfterDate:    formatSettingDate(parsedDate),
		ExceptionUserIDs:    formatSettingUserIDs(exceptionUserIDs),
		ExceptionUsers:      exceptionUsers,
		CanBypassUploadLock: currentUser != nil && hasKpiUploadException(currentUser.KeycloakID, exceptionUserIDs),
	}, nil
}

func (s *kpiUploadSettingsService) buildResponse(
	ctx context.Context,
	settings *repository.KPIUploadSettingsData,
	currentUser *User,
) (*KpiUploadSettingsResponse, error) {
	if settings == nil {
		settings = &repository.KPIUploadSettingsData{}
	}

	response := &KpiUploadSettingsResponse{
		BlockedAfterDate:    formatSettingDate(settings.BlockedAfterDate),
		ExceptionUserIDs:    formatSettingUserIDs(settings.ExceptionUserIDs),
		CanBypassUploadLock: currentUser != nil && hasKpiUploadException(currentUser.KeycloakID, settings.ExceptionUserIDs),
	}

	if currentUser != nil && HasPermissionLevel(currentUser.Permissions, PermKPIManage) {
		exceptionUsers, err := s.resolveExceptionUsers(ctx, settings.ExceptionUserIDs)
		if err != nil {
			return nil, err
		}
		response.ExceptionUsers = exceptionUsers
	}

	return response, nil
}

func (s *kpiUploadSettingsService) resolveExceptionUsers(
	ctx context.Context,
	userIDs []uuid.UUID,
) ([]KpiUploadSettingsUserResponse, error) {
	if len(userIDs) == 0 || s.userRepo == nil {
		return []KpiUploadSettingsUserResponse{}, nil
	}

	users := make([]KpiUploadSettingsUserResponse, 0, len(userIDs))
	for _, userID := range userIDs {
		dbUser, err := s.userRepo.GetUserByKeycloakID(ctx, userID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, &HTTPStatusError{StatusCode: 400, Message: "kpi exception user not found"}
			}
			return nil, err
		}

		users = append(users, KpiUploadSettingsUserResponse{
			KeycloakID: dbUser.KeycloakID,
			Username:   dbUser.Username,
			Email:      dbUser.Email,
			FirstName:  textValue(dbUser.FirstName),
			LastName:   textValue(dbUser.LastName),
		})
	}

	return users, nil
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

func parseSettingUserIDs(values []string) ([]uuid.UUID, error) {
	if len(values) == 0 {
		return []uuid.UUID{}, nil
	}

	seen := make(map[uuid.UUID]struct{}, len(values))
	result := make([]uuid.UUID, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}

		id, err := uuid.Parse(trimmed)
		if err != nil {
			return nil, fmt.Errorf("invalid exceptionUserIds")
		}
		if _, ok := seen[id]; ok {
			continue
		}

		seen[id] = struct{}{}
		result = append(result, id)
	}

	return result, nil
}

func formatSettingUserIDs(values []uuid.UUID) []string {
	if len(values) == 0 {
		return []string{}
	}

	result := make([]string, 0, len(values))
	for _, value := range values {
		result = append(result, value.String())
	}

	return result
}

func hasKpiUploadException(userID uuid.UUID, exceptionUserIDs []uuid.UUID) bool {
	for _, candidate := range exceptionUserIDs {
		if candidate == userID {
			return true
		}
	}

	return false
}

func textValue(value pgtype.Text) string {
	if !value.Valid {
		return ""
	}

	return value.String
}
