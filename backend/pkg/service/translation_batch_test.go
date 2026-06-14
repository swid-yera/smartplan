package service

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"eduplan/backend/pkg/localization"
)

type fakeTranslationService struct {
	batches []TranslateBatchRequest
	err     error
}

func (f *fakeTranslationService) TranslateText(ctx context.Context, req TranslateTextRequest) (string, error) {
	texts, err := f.TranslateBatch(ctx, TranslateBatchRequest{
		Texts:          []string{req.Text},
		SourceLanguage: req.SourceLanguage,
		TargetLanguage: req.TargetLanguage,
		Domain:         req.Domain,
	})
	if err != nil || len(texts) == 0 {
		return "", err
	}
	return texts[0], nil
}

func (f *fakeTranslationService) TranslateBatch(_ context.Context, req TranslateBatchRequest) ([]string, error) {
	f.batches = append(f.batches, req)
	if f.err != nil {
		return nil, f.err
	}

	out := make([]string, len(req.Texts))
	for i, text := range req.Texts {
		out[i] = req.TargetLanguage + ":" + text
	}
	return out, nil
}

func TestRupTranslateLocaleTextsUsesSingleBatchForMissingTargets(t *testing.T) {
	translation := &fakeTranslationService{}
	svc := &rupService{translation: translation}
	name := localization.LocaleText{Ru: "Название"}
	existing := localization.LocaleText{Ru: "Цели", Kz: "Бар мақсат"}
	empty := localization.LocaleText{}

	err := svc.translateLocaleTexts(
		context.Background(),
		[]rupLocaleTextTranslationRef{
			{value: &name},
			{value: &existing},
			{value: &empty},
		},
		"ru",
		"kz",
		false,
	)
	if err != nil {
		t.Fatalf("translate locale texts: %v", err)
	}

	if name.Kz != "kz:Название" {
		t.Fatalf("unexpected translated name: %q", name.Kz)
	}
	if existing.Kz != "Бар мақсат" {
		t.Fatalf("existing target was overwritten: %q", existing.Kz)
	}
	if len(translation.batches) != 1 {
		t.Fatalf("unexpected batch count: got %d", len(translation.batches))
	}
	if !reflect.DeepEqual(translation.batches[0].Texts, []string{"Название"}) {
		t.Fatalf("unexpected batch texts: %#v", translation.batches[0].Texts)
	}
	if translation.batches[0].Domain != "rup" {
		t.Fatalf("unexpected domain: %q", translation.batches[0].Domain)
	}
}

func TestLessonBuildBilingualLessonTextsUsesBatch(t *testing.T) {
	translation := &fakeTranslationService{}
	svc := &LessonService{translation: translation}

	result, err := svc.buildBilingualLessonTexts(context.Background(), []string{" Цель ", "", "Задача"}, "ru")
	if err != nil {
		t.Fatalf("build bilingual texts: %v", err)
	}

	if len(result) != 3 {
		t.Fatalf("unexpected result length: %d", len(result))
	}
	if result[0].Ru != "Цель" || result[0].Kz != "kz:Цель" {
		t.Fatalf("unexpected first result: %#v", result[0])
	}
	if result[1].Ru != "" || result[1].Kz != "" {
		t.Fatalf("empty input should stay empty: %#v", result[1])
	}
	if result[2].Ru != "Задача" || result[2].Kz != "kz:Задача" {
		t.Fatalf("unexpected second result: %#v", result[2])
	}
	if len(translation.batches) != 1 {
		t.Fatalf("unexpected batch count: %d", len(translation.batches))
	}
	if !reflect.DeepEqual(translation.batches[0].Texts, []string{"Цель", "Задача"}) {
		t.Fatalf("unexpected lesson batch texts: %#v", translation.batches[0].Texts)
	}
	if translation.batches[0].Domain != "lesson" {
		t.Fatalf("unexpected domain: %q", translation.batches[0].Domain)
	}
}

func TestLessonBuildBilingualLessonTextsReturnsTranslationErrorWithoutTargetFallback(t *testing.T) {
	translation := &fakeTranslationService{err: errors.New("translation unavailable")}
	svc := &LessonService{translation: translation}

	result, err := svc.buildBilingualLessonTexts(context.Background(), []string{"Цель"}, "ru")
	if err == nil {
		t.Fatal("expected translation error")
	}
	if result[0].Ru != "Цель" {
		t.Fatalf("source language should remain set: %#v", result[0])
	}
	if result[0].Kz != "" {
		t.Fatalf("target language should not fall back to source: %#v", result[0])
	}
}
