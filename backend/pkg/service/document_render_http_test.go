package service

import (
	"strings"
	"testing"
)

func TestSanitizeMultipartFilenamePreservesDocxExtension(t *testing.T) {
	got := sanitizeMultipartFilename("РУП КМ4 ПО практика қазақша.docx")
	if !strings.HasSuffix(got, ".docx") {
		t.Fatalf("expected sanitized filename to keep .docx extension, got %q", got)
	}
}

func TestSanitizeMultipartFilenameFallsBackForNonASCIIBase(t *testing.T) {
	got := sanitizeMultipartFilename("қазақша.docx")
	if got != "upload.docx" {
		t.Fatalf("expected upload.docx fallback, got %q", got)
	}
}

func TestSanitizeMultipartFilenameKeepsSafeASCIICharacters(t *testing.T) {
	got := sanitizeMultipartFilename("Postgresql_ru_20260616_142100.docx")
	if got != "Postgresql_ru_20260616_142100.docx" {
		t.Fatalf("unexpected sanitized filename: %q", got)
	}
}
