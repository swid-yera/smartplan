package service

import (
	"strings"
	"testing"
	"unicode/utf8"

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
