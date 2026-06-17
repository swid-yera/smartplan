package service

import (
	"context"
	"testing"
	"time"

	"eduplan/backend/pkg/repository"

	"github.com/google/uuid"
)

type kpiSettingsStub struct {
	settings *repository.KPIUploadSettingsData
	err      error
}

func (s *kpiSettingsStub) GetKpiUploadSettings(context.Context) (*repository.KPIUploadSettingsData, error) {
	return s.settings, s.err
}

func (s *kpiSettingsStub) SetKpiUploadSettings(context.Context, repository.KPIUploadSettingsData) error {
	return nil
}

func TestEnsureKpiUploadAllowed(t *testing.T) {
	t.Parallel()

	blockedDate := time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC)

	t.Run("allows exception user after blocked date", func(t *testing.T) {
		t.Parallel()

		userID := uuid.New()
		svc := &AwardService{
			kpiSettings: &kpiSettingsStub{
				settings: &repository.KPIUploadSettingsData{
					BlockedAfterDate: &blockedDate,
					ExceptionUserIDs: []uuid.UUID{userID},
				},
			},
		}

		err := svc.ensureKpiUploadAllowed(context.Background(), &User{
			KeycloakID:  userID,
			Permissions: []PermissionCode{PermKPIView},
		})
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
	})

	t.Run("blocks regular user after blocked date", func(t *testing.T) {
		t.Parallel()

		svc := &AwardService{
			kpiSettings: &kpiSettingsStub{
				settings: &repository.KPIUploadSettingsData{
					BlockedAfterDate: &blockedDate,
				},
			},
		}

		err := svc.ensureKpiUploadAllowed(context.Background(), &User{
			KeycloakID:  uuid.New(),
			Permissions: []PermissionCode{PermKPIView},
		})
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}
