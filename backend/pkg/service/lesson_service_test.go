package service

import (
	"strings"
	"testing"
	"time"
	"unicode/utf8"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
)

func TestBuildLessonObjectNameKeepsUTF8ValidForLongLocalizedNames(t *testing.T) {
	lessonID := uuid.New()
	lessonName := strings.Repeat("Қазақ тілі ", 40)

	objectName := buildLessonObjectName(lessonID, lessonName)

	if !utf8.ValidString(objectName) {
		t.Fatalf("object name must be valid UTF-8: %q", objectName)
	}

	if !strings.HasPrefix(objectName, "lessons/"+lessonID.String()+"/") {
		t.Fatalf("object name must include lessons prefix and lesson id, got %q", objectName)
	}

	if !strings.HasSuffix(objectName, ".docx") {
		t.Fatalf("object name must keep .docx suffix, got %q", objectName)
	}
}

func TestSanitizeLessonFileNameReplacesInvalidUTF8(t *testing.T) {
	name := sanitizeLessonFileName("lesson\xffname")

	if !utf8.ValidString(name) {
		t.Fatalf("sanitized file name must be valid UTF-8: %q", name)
	}

	if name == "" {
		t.Fatal("sanitized file name must not be empty")
	}
}

func TestBuildLessonDocumentPayloadIncludesSignatureArtifact(t *testing.T) {
	artifact := &RupSignatureArtifactResponse{
		ID:              uuid.New(),
		RupID:           uuid.New(),
		DocumentID:      "document-id",
		SignatureID:     "signature-id",
		VerificationURL: "https://example.com/verify/123",
		QRSvg:           "<svg />",
	}

	payload := buildLessonDocumentPayload(
		"ru",
		"RUP",
		"Discipline",
		"Topic",
		47,
		"Teacher",
		lessonTestTime(),
		1,
		"Group",
		&generatedLessonPlan{
			LessonType: storage.EnumLessonTypeTHEORY,
			Goals:      "Goals",
			Tasks:      "Tasks",
			Expected:   "Expected",
			Progress:   []GeneratedLessonProgressStep{},
		},
		[]string{"Internet resource"},
		[]string{"Technical resource"},
		artifact,
	)

	if payload.SignatureArtifact == nil {
		t.Fatal("expected signature artifact to be preserved in lesson payload")
	}

	if payload.SignatureArtifact.VerificationURL != artifact.VerificationURL {
		t.Fatalf("unexpected verification url: got %q want %q", payload.SignatureArtifact.VerificationURL, artifact.VerificationURL)
	}

	if payload.SignatureArtifact.SignatureID != artifact.SignatureID {
		t.Fatalf("unexpected signature id: got %q want %q", payload.SignatureArtifact.SignatureID, artifact.SignatureID)
	}
}

func lessonTestTime() time.Time {
	return time.Unix(0, 0).UTC()
}
