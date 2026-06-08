package service

import (
	"testing"

	storage "eduplan/backend/pkg/sqlc/generated"
)

func TestValidateFieldValueTypeGroup(t *testing.T) {
	t.Parallel()

	field := storage.AwardCategoryField{
		Key:  "group",
		Type: "group",
	}

	t.Run("accepts non-empty string", func(t *testing.T) {
		t.Parallel()

		if err := validateFieldValueType(field, "10A"); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})

	t.Run("rejects empty string", func(t *testing.T) {
		t.Parallel()

		err := validateFieldValueType(field, "   ")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}

func TestNormalizeMultiFieldChildValueGroup(t *testing.T) {
	t.Parallel()

	option := AwardCategoryMultiFieldOption{
		Key:  "group",
		Type: "group",
	}

	t.Run("accepts non-empty string", func(t *testing.T) {
		t.Parallel()

		value, err := normalizeMultiFieldChildValue("parent", option, "10A")
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != "10A" {
			t.Fatalf("expected value to be preserved, got %#v", value)
		}
	})

	t.Run("rejects empty string", func(t *testing.T) {
		t.Parallel()

		if _, err := normalizeMultiFieldChildValue("parent", option, " "); err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}
