package service

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"eduplan/backend/config"
	"eduplan/backend/pkg/localization"
)

func TestBuildBilingualLocaleTextsUsesTranslationBatch(t *testing.T) {
	translation := &fakeTranslationService{}
	svc := &aiService{translation: translation}

	result, err := svc.buildBilingualLocaleTexts(context.Background(), "ru", true, []string{"Название", "", "Цели"})
	if err != nil {
		t.Fatalf("build bilingual locale texts: %v", err)
	}

	if len(result) != 3 {
		t.Fatalf("unexpected result length: got %d want %d", len(result), 3)
	}
	if result[0].Ru != "Название" || result[0].Kz != "kz:Название" {
		t.Fatalf("unexpected first localized text: %#v", result[0])
	}
	if result[1] != (localization.LocaleText{}) {
		t.Fatalf("empty text should stay empty: %#v", result[1])
	}
	if result[2].Ru != "Цели" || result[2].Kz != "kz:Цели" {
		t.Fatalf("unexpected third localized text: %#v", result[2])
	}
	if len(translation.batches) != 1 {
		t.Fatalf("unexpected translation batch count: got %d want %d", len(translation.batches), 1)
	}
	if !reflect.DeepEqual(translation.batches[0].Texts, []string{"Название", "Цели"}) {
		t.Fatalf("unexpected translation batch texts: %#v", translation.batches[0].Texts)
	}
	if translation.batches[0].Domain != "rup" {
		t.Fatalf("unexpected translation batch domain: %q", translation.batches[0].Domain)
	}
}

func TestBuildBilingualLocaleTextsSkipsTranslationWhenDisabled(t *testing.T) {
	translation := &fakeTranslationService{err: errors.New("translation should not be called")}
	svc := &aiService{translation: translation}

	result, err := svc.buildBilingualLocaleTexts(context.Background(), "kk", false, []string{"Бағдарлама"})
	if err != nil {
		t.Fatalf("build bilingual locale texts: %v", err)
	}

	if len(result) != 1 {
		t.Fatalf("unexpected result length: got %d want %d", len(result), 1)
	}
	if result[0].Ru != "" || result[0].Kz != "Бағдарлама" {
		t.Fatalf("unexpected source-only localized text: %#v", result[0])
	}
	if len(translation.batches) != 0 {
		t.Fatalf("translation must not be called in single-language mode, got %d batches", len(translation.batches))
	}
}

func TestGetGeminiModels(t *testing.T) {
	svc := &aiService{
		cfg: &config.GeminiConfig{
			PrimaryModel: "gemini-2.5-flash-lite",
			FallbackModels: []string{
				"gemini-2.5-flash",
				"gemini-2.0-flash",
				"gemini-2.0-flash-lite",
			},
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
			PrimaryModel: " gemini-2.5-flash-lite ",
			FallbackModels: []string{
				"gemini-2.5-flash-lite",
				"",
				"gemini-2.0-flash-lite",
			},
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

func TestRoundUpToMultiple(t *testing.T) {
	if got := roundUpToMultiple(140, 24); got != 144 {
		t.Fatalf("unexpected rounded value: got %d want %d", got, 144)
	}

	if got := roundUpToMultiple(144, 24); got != 144 {
		t.Fatalf("unexpected rounded value for exact multiple: got %d want %d", got, 144)
	}
}

func TestRebalanceGeneratedDisciplineHoursKeepsTotalsMultipleOf24(t *testing.T) {
	disciplines := []rawGeneratedDiscipline{
		{
			Name:       "Основы сетей",
			Code:       "РО5.1",
			TotalHours: 70,
			Semesters:  []int{0, 0, 0, 0, 35, 35, 0, 0},
		},
		{
			Name:       "Администрирование",
			Code:       "РО5.2",
			TotalHours: 70,
			Semesters:  []int{0, 0, 0, 0, 0, 70, 0, 0},
		},
	}

	result := rebalanceGeneratedDisciplineHours(disciplines, 144, 3)
	if len(result) != 2 {
		t.Fatalf("unexpected discipline count: got %d want %d", len(result), 2)
	}

	total := 0
	for i, discipline := range result {
		if discipline.TotalHours%24 != 0 {
			t.Fatalf("discipline %d total hours must be multiple of 24: got %d", i, discipline.TotalHours)
		}

		semesterTotal := sumHours(discipline.Semesters)
		if semesterTotal != discipline.TotalHours {
			t.Fatalf("discipline %d semester total mismatch: got %d want %d", i, semesterTotal, discipline.TotalHours)
		}

		total += discipline.TotalHours
	}

	if total != 144 {
		t.Fatalf("unexpected overall total: got %d want %d", total, 144)
	}
}

func TestSanitizeGeneratedDisciplineNameRemovesDuplicateCodePrefix(t *testing.T) {
	got := sanitizeGeneratedDisciplineName("РО5.1", "Р.О5.1 Информационная безопасность")
	want := "РО5.1 Информационная безопасность"

	if got != want {
		t.Fatalf("sanitizeGeneratedDisciplineName() = %q, want %q", got, want)
	}
}

func TestNormalizeGeneratedTopicsReplacesPlaceholderNames(t *testing.T) {
	req := GenerateTopicsForDisciplineRequest{
		SourceLanguage:  "ru",
		DisciplineName:  "Информационная безопасность",
		DisciplineHours: 4,
	}

	topics := normalizeGeneratedTopics([]GeneratedTopic{
		{Name: "Тема 67", Type: "COMBINED", DurationHours: 2},
		{Name: "Тема 68", Type: "PRACTICAL", DurationHours: 2},
	}, req, 2)

	if len(topics) != 2 {
		t.Fatalf("unexpected topic count: got %d want %d", len(topics), 2)
	}

	for i, topic := range topics {
		if topicPlaceholderPattern.MatchString(topic.Name) {
			t.Fatalf("topic %d still contains placeholder name: %q", i, topic.Name)
		}
		if topic.Name == "" {
			t.Fatalf("topic %d name must not be empty", i)
		}
	}
}

func TestNormalizeGeneratedTopicsForcesPracticalDurationToTwoHours(t *testing.T) {
	req := GenerateTopicsForDisciplineRequest{
		SourceLanguage:  "ru",
		DisciplineName:  "Администрирование серверов",
		DisciplineHours: 2,
	}

	topics := normalizeGeneratedTopics([]GeneratedTopic{
		{Name: "Настраивает серверные службы", Type: "PRACTICAL", DurationHours: 6},
	}, req, 2)

	if len(topics) != 1 {
		t.Fatalf("unexpected topic count: got %d want %d", len(topics), 1)
	}
	if topics[0].DurationHours != 2 {
		t.Fatalf("practical topic duration = %d, want 2", topics[0].DurationHours)
	}
	if topics[0].PracticeHours != 2 {
		t.Fatalf("practical topic practice hours = %d, want 2", topics[0].PracticeHours)
	}
}
