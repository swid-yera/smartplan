package service

import (
	"testing"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func TestBuildRupResponseIncludesType(t *testing.T) {
	svc := &rupService{}

	rup, err := svc.buildRupResponse(nil, storage.Rup{
		ID:         uuid.New(),
		Name:       []byte(`{"ru":"Test","kz":"Тест"}`),
		Status:     storage.RupsStatusDRAFT,
		Course:     1,
		StudyForm:  storage.StudyFormEnumFULLTIME,
		StudyYear:  "2025-2026",
		Type:       storage.RupsTypeEnumTHEORY,
		TotalHours: 72,
		CreatedAt:  pgtype.Timestamptz{Time: time.Now(), Valid: true},
		UpdatedAt:  pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	if err != nil {
		t.Fatalf("buildRupResponse returned error: %v", err)
	}

	if rup.Type != "THEORY" {
		t.Fatalf("unexpected type: got %q want %q", rup.Type, "THEORY")
	}
}
