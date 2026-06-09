package service

import (
	"testing"

	"eduplan/backend/config"
)

func TestGetGeminiModels(t *testing.T) {
	svc := &aiService{
		cfg: &config.GeminiConfig{
			PrimaryModel:           "gemini-2.5-flash-lite",
			FallbackModel:          "gemini-2.5-flash",
			SecondaryFallbackModel: "gemini-2.0-flash",
			TertiaryFallbackModel:  "gemini-2.0-flash-lite",
		},
	}

	models := svc.getGeminiModels()
	expected := []string{
		"gemini-2.5-flash-lite",
		"gemini-2.5-flash",
		"gemini-2.0-flash",
		"gemini-2.0-flash-lite",
	}

	if len(models) != len(expected) {
		t.Fatalf("unexpected model count: got %d want %d (%v)", len(models), len(expected), models)
	}

	for i := range expected {
		if models[i] != expected[i] {
			t.Fatalf("unexpected model at index %d: got %q want %q (all=%v)", i, models[i], expected[i], models)
		}
	}
}

func TestGetGeminiModelsSkipsEmptyAndDuplicateEntries(t *testing.T) {
	svc := &aiService{
		cfg: &config.GeminiConfig{
			PrimaryModel:           " gemini-2.5-flash-lite ",
			FallbackModel:          "gemini-2.5-flash-lite",
			SecondaryFallbackModel: "",
			TertiaryFallbackModel:  "gemini-2.0-flash-lite",
		},
	}

	models := svc.getGeminiModels()
	expected := []string{
		"gemini-2.5-flash-lite",
		"gemini-2.0-flash-lite",
	}

	if len(models) != len(expected) {
		t.Fatalf("unexpected model count: got %d want %d (%v)", len(models), len(expected), models)
	}

	for i := range expected {
		if models[i] != expected[i] {
			t.Fatalf("unexpected model at index %d: got %q want %q (all=%v)", i, models[i], expected[i], models)
		}
	}
}
