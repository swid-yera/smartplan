package service

import (
	"testing"

	"github.com/google/uuid"
)

func TestParseSettingDate(t *testing.T) {
	t.Parallel()

	t.Run("nil is allowed", func(t *testing.T) {
		t.Parallel()

		value, err := parseSettingDate(nil)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != nil {
			t.Fatalf("expected nil value, got %#v", value)
		}
	})

	t.Run("empty string clears date", func(t *testing.T) {
		t.Parallel()

		raw := "   "
		value, err := parseSettingDate(&raw)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != nil {
			t.Fatalf("expected nil value, got %#v", value)
		}
	})

	t.Run("valid date is parsed", func(t *testing.T) {
		t.Parallel()

		raw := "2026-06-16"
		value, err := parseSettingDate(&raw)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value == nil {
			t.Fatal("expected date value, got nil")
		}

		formatted := formatSettingDate(value)
		if formatted == nil || *formatted != "2026-06-16" {
			t.Fatalf("unexpected formatted date: %#v", formatted)
		}
	})

	t.Run("invalid date is rejected", func(t *testing.T) {
		t.Parallel()

		raw := "16.06.2026"
		if _, err := parseSettingDate(&raw); err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("exception user ids are normalized", func(t *testing.T) {
		t.Parallel()

		first := uuid.New()
		second := uuid.New()
		values, err := parseSettingUserIDs([]string{
			"  " + first.String() + "  ",
			second.String(),
			first.String(),
		})
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if len(values) != 2 {
			t.Fatalf("expected 2 ids, got %d", len(values))
		}
		if values[0] != first || values[1] != second {
			t.Fatalf("unexpected ids order: %#v", values)
		}
	})

	t.Run("invalid exception user ids are rejected", func(t *testing.T) {
		t.Parallel()

		if _, err := parseSettingUserIDs([]string{"not-a-uuid"}); err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}
