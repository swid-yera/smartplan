package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"eduplan/backend/config"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/localization"

	"github.com/sirupsen/logrus"
)

type AIService interface {
	GenerateRupMeta(ctx context.Context, req GenerateRupMetaRequest) (*GenerateRupMetaResponse, error)
	GenerateResources(ctx context.Context, req GenerateResourcesRequest) (*GenerateResourcesResponse, error)
	GenerateDisciplines(ctx context.Context, req GenerateDisciplinesRequest) ([]LocalizedGeneratedDiscipline, error)
	GenerateTopicsForDiscipline(ctx context.Context, req GenerateTopicsForDisciplineRequest) ([]LocalizedGeneratedTopic, error)
	GenerateLesson(ctx context.Context, req GenerateLessonRequest) (*GenerateLessonResponse, error)
}

type aiService struct {
	httpClient  *http.Client
	cfg         *config.GeminiConfig
	translation TranslationService
	log         *logrus.Logger
}

func NewAIService(httpClient *http.Client, cfg *config.GeminiConfig, translation TranslationService, log *logrus.Logger) AIService {
	return &aiService{
		httpClient:  httpClient,
		cfg:         cfg,
		translation: translation,
		log:         log,
	}
}

type GenerateRupMetaRequest = helpers.GenerateRupMetaRequest
type GenerateRupGroup = helpers.GenerateRupGroup
type GenerateRupMetaResponse struct {
	Basis        localization.LocaleText `json:"basis"`
	Goals        localization.LocaleText `json:"goals"`
	Competencies localization.LocaleText `json:"competencies"`
}
type GenerateResourcesRequest = helpers.GenerateResourcesRequest
type GenerateResourcesResponse struct {
	InternetResources  []LocalizedGeneratedResource `json:"internetResources"`
	TechnicalResources []LocalizedGeneratedResource `json:"technicalResources"`
}
type GeneratedResource = helpers.GeneratedResource
type GenerateDisciplinesRequest = helpers.GenerateDisciplinesRequest
type GenerateTopicsForDisciplineRequest = helpers.GenerateTopicsForDisciplineRequest
type GeneratedDiscipline = helpers.GeneratedDiscipline
type GeneratedSemester = helpers.GeneratedSemester
type GeneratedTopic = helpers.GeneratedTopic
type LocalizedGeneratedResource struct {
	Name localization.LocaleText `json:"name"`
	Link string                  `json:"link,omitempty"`
}
type LocalizedGeneratedDiscipline struct {
	Name       localization.LocaleText   `json:"name"`
	TotalHours int                       `json:"totalHours"`
	Semesters  []GeneratedSemester       `json:"semesters"`
	Topics     []LocalizedGeneratedTopic `json:"topics"`
}
type LocalizedGeneratedTopic struct {
	Name            localization.LocaleText `json:"name"`
	Type            string                  `json:"type"`
	DurationHours   int                     `json:"durationHours"`
	TheoryHours     int                     `json:"theoryHours"`
	PracticeHours   int                     `json:"practiceHours"`
	IndividualHours int                     `json:"individualHours"`
	SrspHours       int                     `json:"srspHours"`
	SrsHours        int                     `json:"srsHours"`
}
type rawGenerateRupMetaResponse = helpers.GenerateRupMetaResponse
type rawGenerateResourcesResponse = helpers.GenerateResourcesResponse
type GenerateLessonRequest = helpers.GenerateLessonRequest
type GenerateLessonResponse = helpers.GenerateLessonResponse
type GeneratedLessonProgressStep = helpers.GeneratedLessonProgressStep
type geminiGenerateContentRequest = helpers.GeminiGenerateContentRequest
type geminiContent = helpers.GeminiContent
type geminiPart = helpers.GeminiPart
type geminiGenerateContentResponse = helpers.GeminiGenerateContentResponse
type geminiErrorResponse = helpers.GeminiErrorResponse
type geminiRequestError = helpers.GeminiRequestError

type rawGeneratedDiscipline struct {
	Name       string `json:"name"`
	Code       string `json:"code"`
	TotalHours int    `json:"totalHours"`
	Semesters  []int  `json:"semesters"`
}

var (
	disciplineCodePrefixPattern = regexp.MustCompile(`(?i)^(?:р\s*\.?\s*о\s*\.?|ро|pm|пм)\s*\d+(?:\s*\.\s*\d+)*\s*[:.-]?\s*`)
	topicPlaceholderPattern     = regexp.MustCompile(`(?i)^(?:тема|тақырып|theme)\s*\d+\b`)
)

func (s *aiService) GenerateRupMeta(ctx context.Context, req GenerateRupMetaRequest) (*GenerateRupMetaResponse, error) {
	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	prompt := helpers.BuildGenerateRupMetaPrompt(helpers.GenerateRupMetaPromptInput{
		SourceLanguage:       req.SourceLanguage,
		Name:                 req.Name,
		Type:                 req.Type,
		StudyForm:            req.StudyForm,
		Prerequisites:        req.Prerequisites,
		Postrequisites:       req.Postrequisites,
		StudyYear:            req.StudyYear,
		GroupName:            req.Group.Name,
		GroupSpecialty:       req.Group.Specialty,
		GroupQualification:   req.Group.Qualification,
		Course:               req.Course,
		Message:              req.Message,
		CurrentValuesContext: currentValuesContext,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt, "application/json")
	if err != nil {
		return nil, fmt.Errorf("generate rup meta: %w", err)
	}

	var rawOut rawGenerateRupMetaResponse
	if err := decodeJSONObject(responseText, &rawOut); err != nil {
		return nil, fmt.Errorf("decode rup meta response: %w", err)
	}

	localized, err := s.buildBilingualLocaleTexts(
		ctx,
		req.SourceLanguage,
		req.IncludeTranslation,
		[]string{rawOut.Basis, rawOut.Goals, rawOut.Competencies},
	)
	if err != nil {
		return nil, fmt.Errorf("translate rup meta response: %w", err)
	}

	return &GenerateRupMetaResponse{
		Basis:        localized[0],
		Goals:        localized[1],
		Competencies: localized[2],
	}, nil
}

func (s *aiService) GenerateResources(ctx context.Context, req GenerateResourcesRequest) (*GenerateResourcesResponse, error) {
	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	prompt := helpers.BuildGenerateResourcesPrompt(helpers.GenerateResourcesPromptInput{
		SourceLanguage:       req.SourceLanguage,
		Name:                 req.Name,
		Prerequisites:        req.Prerequisites,
		Postrequisites:       req.Postrequisites,
		Basic:                req.Basic,
		Goals:                req.Goals,
		Competencies:         req.Competencies,
		Message:              req.Message,
		CurrentValuesContext: currentValuesContext,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt, "application/json")
	if err != nil {
		return nil, fmt.Errorf("generate resources: %w", err)
	}

	var rawOut rawGenerateResourcesResponse
	if err := decodeJSONObject(responseText, &rawOut); err != nil {
		return nil, fmt.Errorf("decode resources response: %w", err)
	}

	internetResources, err := s.localizeGeneratedResources(ctx, req.SourceLanguage, req.IncludeTranslation, rawOut.InternetResources)
	if err != nil {
		return nil, fmt.Errorf("translate internet resources: %w", err)
	}
	technicalResources, err := s.localizeGeneratedResources(ctx, req.SourceLanguage, req.IncludeTranslation, rawOut.TechnicalResources)
	if err != nil {
		return nil, fmt.Errorf("translate technical resources: %w", err)
	}

	return &GenerateResourcesResponse{
		InternetResources:  internetResources,
		TechnicalResources: technicalResources,
	}, nil
}

func (s *aiService) GenerateDisciplines(ctx context.Context, req GenerateDisciplinesRequest) ([]LocalizedGeneratedDiscipline, error) {
	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	prompt := helpers.BuildGenerateDisciplinesPrompt(helpers.GenerateDisciplinesPromptInput{
		SourceLanguage:       req.SourceLanguage,
		WantsHours:           req.WantsHours,
		DisciplineCount:      req.DisciplineCount,
		Course:               req.Course,
		Name:                 req.Name,
		Goals:                req.Goals,
		Competencies:         req.Competencies,
		Message:              req.Message,
		CurrentValuesContext: currentValuesContext,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt, "application/json")
	if err != nil {
		return nil, fmt.Errorf("generate disciplines: %w", err)
	}

	var raw struct {
		Disciplines []rawGeneratedDiscipline `json:"disciplines"`
	}

	if err := decodeJSONObject(responseText, &raw); err != nil {
		return nil, fmt.Errorf("decode disciplines response: %w", err)
	}

	targetHours := roundUpToMultiple(req.WantsHours, 24)
	allocations := rebalanceGeneratedDisciplineHours(raw.Disciplines, targetHours, req.Course)
	result, err := s.localizeGeneratedDisciplines(ctx, req.SourceLanguage, req.IncludeTranslation, allocations)
	if err != nil {
		return nil, fmt.Errorf("translate disciplines response: %w", err)
	}

	return result, nil
}

func (s *aiService) GenerateTopicsForDiscipline(ctx context.Context, req GenerateTopicsForDisciplineRequest) ([]LocalizedGeneratedTopic, error) {
	topicHours := 2
	baseTopicCount := req.DisciplineHours / topicHours
	if baseTopicCount <= 0 && req.DisciplineHours > 0 {
		baseTopicCount = 1
	}
	extraSrspTopicCount := maxInt(req.PreferredSrspCount, 0)
	topicCount := baseTopicCount + extraSrspTopicCount
	if topicCount <= 0 {
		return nil, nil
	}

	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ПО ДИСЦИПЛИНЕ ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	partTopics, err := s.generateTopicsChunk(ctx, req, topicCount, currentValuesContext, "")
	if err != nil {
		return nil, fmt.Errorf("generate topics for discipline: %w", err)
	}

	normalizedTopics := normalizeGeneratedTopics(partTopics, req, topicHours)
	result, err := s.localizeGeneratedTopics(ctx, req.SourceLanguage, req.IncludeTranslation, normalizedTopics)
	if err != nil {
		return nil, fmt.Errorf("translate topics response: %w", err)
	}

	return result, nil
}

func (s *aiService) generateTopicsChunk(
	ctx context.Context,
	req GenerateTopicsForDisciplineRequest,
	topicCount int,
	currentValuesContext string,
	batchContext string,
) ([]GeneratedTopic, error) {
	prompt := helpers.BuildGenerateTopicsForDisciplinePrompt(helpers.GenerateTopicsForDisciplinePromptInput{
		SourceLanguage:          req.SourceLanguage,
		DisciplineName:          req.DisciplineName,
		RupName:                 req.RupName,
		DisciplineHours:         req.DisciplineHours,
		RupType:                 req.RupType,
		Goals:                   req.Goals,
		Competencies:            req.Competencies,
		Message:                 req.Message,
		TopicCount:              topicCount,
		BatchContext:            batchContext,
		PreferredPracticalCount: req.PreferredPracticalCount,
		PreferredSnzCount:       req.PreferredSnzCount,
		PreferredCombinedCount:  req.PreferredCombinedCount,
		PreferredSrspCount:      req.PreferredSrspCount,
		CurrentValuesContext:    currentValuesContext,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt, "application/json")
	if err != nil {
		return nil, fmt.Errorf("generate topics for discipline: %w", err)
	}

	var rawTopics []struct {
		Name          string `json:"name"`
		Type          string `json:"type"`
		DurationHours int    `json:"durationHours"`
		TheoryHours   int    `json:"theoryHours"`
		PracticeHours int    `json:"practiceHours"`
	}

	if err := decodeJSONObject(responseText, &rawTopics); err != nil {
		var wrapped struct {
			Topics []struct {
				Name          string `json:"name"`
				Type          string `json:"type"`
				DurationHours int    `json:"durationHours"`
				TheoryHours   int    `json:"theoryHours"`
				PracticeHours int    `json:"practiceHours"`
			} `json:"topics"`
		}
		if wrappedErr := decodeJSONObject(responseText, &wrapped); wrappedErr != nil {
			return nil, fmt.Errorf("decode topics response: %w", err)
		}
		rawTopics = wrapped.Topics
	}

	result := make([]GeneratedTopic, 0, len(rawTopics))
	for _, topic := range rawTopics {
		topicType := normalizeTopicType(topic.Type)
		durationHours := normalizeTopicDurationHours(topicType, topic.DurationHours)
		result = append(result, GeneratedTopic{
			Name:            topic.Name,
			Type:            topicType,
			DurationHours:   durationHours,
			TheoryHours:     topic.TheoryHours,
			PracticeHours:   topic.PracticeHours,
			IndividualHours: 0,
			SrspHours:       0,
			SrsHours:        0,
		})
	}

	return result, nil
}

func (s *aiService) localizeGeneratedResources(ctx context.Context, sourceLanguage string, includeTranslation bool, resources []GeneratedResource) ([]LocalizedGeneratedResource, error) {
	if len(resources) == 0 {
		return nil, nil
	}

	texts := make([]string, len(resources))
	for i, resource := range resources {
		texts[i] = resource.Name
	}

	localizedTexts, err := s.buildBilingualLocaleTexts(ctx, sourceLanguage, includeTranslation, texts)
	if err != nil {
		return nil, err
	}

	result := make([]LocalizedGeneratedResource, len(resources))
	for i, resource := range resources {
		result[i] = LocalizedGeneratedResource{
			Name: localizedTexts[i],
			Link: resource.Link,
		}
	}

	return result, nil
}

func (s *aiService) localizeGeneratedDisciplines(ctx context.Context, sourceLanguage string, includeTranslation bool, disciplines []generatedDisciplineAllocation) ([]LocalizedGeneratedDiscipline, error) {
	if len(disciplines) == 0 {
		return nil, nil
	}

	texts := make([]string, len(disciplines))
	for i, discipline := range disciplines {
		texts[i] = sanitizeGeneratedDisciplineName(discipline.Code, discipline.Name)
	}

	localizedTexts, err := s.buildBilingualLocaleTexts(ctx, sourceLanguage, includeTranslation, texts)
	if err != nil {
		return nil, err
	}

	result := make([]LocalizedGeneratedDiscipline, len(disciplines))
	for i, discipline := range disciplines {
		semesters := convertSemesters(discipline.Semesters)
		result[i] = LocalizedGeneratedDiscipline{
			Name:       localizedTexts[i],
			TotalHours: discipline.TotalHours,
			Semesters:  semesters,
			Topics:     []LocalizedGeneratedTopic{},
		}
	}

	return result, nil
}

func (s *aiService) localizeGeneratedTopics(ctx context.Context, sourceLanguage string, includeTranslation bool, topics []GeneratedTopic) ([]LocalizedGeneratedTopic, error) {
	if len(topics) == 0 {
		return nil, nil
	}

	texts := make([]string, len(topics))
	for i, topic := range topics {
		texts[i] = topic.Name
	}

	localizedTexts, err := s.buildBilingualLocaleTexts(ctx, sourceLanguage, includeTranslation, texts)
	if err != nil {
		return nil, err
	}

	result := make([]LocalizedGeneratedTopic, len(topics))
	for i, topic := range topics {
		result[i] = LocalizedGeneratedTopic{
			Name:            localizedTexts[i],
			Type:            topic.Type,
			DurationHours:   topic.DurationHours,
			TheoryHours:     topic.TheoryHours,
			PracticeHours:   topic.PracticeHours,
			IndividualHours: topic.IndividualHours,
			SrspHours:       topic.SrspHours,
			SrsHours:        topic.SrsHours,
		}
	}

	return result, nil
}

func (s *aiService) buildBilingualLocaleTexts(ctx context.Context, sourceLanguage string, includeTranslation bool, texts []string) ([]localization.LocaleText, error) {
	normalizedSource := normalizeBackendLanguage(sourceLanguage)
	if normalizedSource == "" {
		normalizedSource = "ru"
	}

	result := make([]localization.LocaleText, len(texts))
	if len(texts) == 0 {
		return result, nil
	}

	pendingTexts := make([]string, 0, len(texts))
	pendingIndexes := make([]int, 0, len(texts))
	for i, text := range texts {
		trimmed := strings.TrimSpace(text)
		if trimmed == "" {
			continue
		}

		result[i] = setLocaleValueByLanguage(result[i], normalizedSource, trimmed)
		if includeTranslation {
			pendingTexts = append(pendingTexts, trimmed)
			pendingIndexes = append(pendingIndexes, i)
		}
	}

	if !includeTranslation || len(pendingTexts) == 0 {
		return result, nil
	}
	if s.translation == nil {
		return nil, fmt.Errorf("translation service is not configured")
	}

	targetLanguage := oppositeBackendLanguage(normalizedSource)
	if targetLanguage == "" {
		return nil, fmt.Errorf("unsupported source language %q", sourceLanguage)
	}

	translatedTexts, err := s.translation.TranslateBatch(ctx, TranslateBatchRequest{
		Texts:          pendingTexts,
		SourceLanguage: normalizedSource,
		TargetLanguage: targetLanguage,
		Domain:         "rup",
	})
	if err != nil {
		return nil, err
	}
	if len(translatedTexts) != len(pendingTexts) {
		return nil, fmt.Errorf("translation response count mismatch: got %d, want %d", len(translatedTexts), len(pendingTexts))
	}

	for i, translatedText := range translatedTexts {
		idx := pendingIndexes[i]
		result[idx] = setLocaleValueByLanguage(result[idx], targetLanguage, translatedText)
	}

	return result, nil
}

func convertSemesters(semesters []int) []GeneratedSemester {
	result := make([]GeneratedSemester, 0, len(semesters))
	for i, hours := range semesters {
		result = append(result, GeneratedSemester{
			Semester:   i + 1,
			TotalHours: hours,
		})
	}

	return result
}

func splitTopicCountInHalf(topicCount int) []int {
	if topicCount <= 0 {
		return nil
	}
	if topicCount == 1 {
		return []int{1}
	}

	first := topicCount / 2
	second := topicCount - first
	return []int{first, second}
}

func splitPreferredCountForChunk(total int, chunkIndex int, chunkTopicCount int, totalTopicCount int) int {
	if total <= 0 || totalTopicCount <= 0 || chunkTopicCount <= 0 {
		return 0
	}

	firstChunkTopicCount := totalTopicCount / 2
	firstPart := (total * firstChunkTopicCount) / totalTopicCount
	secondPart := total - firstPart

	if chunkIndex == 0 {
		return firstPart
	}

	return secondPart
}

func (s *aiService) GenerateLesson(ctx context.Context, req GenerateLessonRequest) (*GenerateLessonResponse, error) {
	internetResourcesJSON, err := json.Marshal(req.InternetResources)
	if err != nil {
		return nil, fmt.Errorf("marshal internet resources: %w", err)
	}
	technicalResourcesJSON, err := json.Marshal(req.TechnicalResources)
	if err != nil {
		return nil, fmt.Errorf("marshal technical resources: %w", err)
	}
	previousLessonsJSON, err := json.Marshal(req.PreviousLessons)
	if err != nil {
		return nil, fmt.Errorf("marshal previous lessons: %w", err)
	}

	lessonMinutes := int32(90)

	prompt := helpers.BuildGenerateLessonPrompt(helpers.GenerateLessonPromptInput{
		SourceLanguage:         req.SourceLanguage,
		RupName:                req.RupName,
		DisciplineName:         req.DisciplineName,
		TopicName:              req.TopicName,
		TopicType:              req.TopicType,
		TotalHours:             req.TotalHours,
		TheoryHours:            req.TheoryHours,
		PracticeHours:          req.PracticeHours,
		IndividualHours:        req.IndividualHours,
		SrspHours:              req.SrspHours,
		SrsHours:               req.SrsHours,
		GroupName:              req.GroupName,
		GroupSpecialty:         req.GroupSpecialty,
		GroupQualification:     req.GroupQualification,
		ExplorationGoals:       req.ExplorationGoals,
		Prerequisites:          req.Prerequisites,
		Postrequisites:         req.Postrequisites,
		InternetResourcesJSON:  string(internetResourcesJSON),
		TechnicalResourcesJSON: string(technicalResourcesJSON),
		PreviousLessonsJSON:    string(previousLessonsJSON),
		Message:                req.Message,
		LessonMinutes:          lessonMinutes,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt, "application/json")
	if err != nil {
		return nil, fmt.Errorf("generate lesson: %w", err)
	}

	var out GenerateLessonResponse
	if err := decodeJSONObject(responseText, &out); err != nil {
		return nil, fmt.Errorf("decode lesson response: %w", err)
	}

	out.Type = strings.ToUpper(strings.TrimSpace(out.Type))
	out.Goals = strings.TrimSpace(out.Goals)
	out.Tasks = strings.TrimSpace(out.Tasks)
	out.Expected = strings.TrimSpace(out.Expected)
	out.InternetResources = normalizeGeneratedResources(out.InternetResources)
	out.TechnicalResources = normalizeGeneratedResources(out.TechnicalResources)
	for i := range out.LessonProgress {
		for j := range out.LessonProgress[i].Content {
			out.LessonProgress[i].Content[j] = strings.TrimSpace(out.LessonProgress[i].Content[j])
		}
	}

	return &out, nil
}

func (s *aiService) generateContentWithFallback(ctx context.Context, prompt string, responseMimeType string) (string, error) {
	apiKeys := s.getGeminiAPIKeys()
	if len(apiKeys) == 0 {
		return "", errors.New("GEMINI_API_KEY is not configured")
	}

	models := s.getGeminiModels()
	if len(models) == 0 {
		return "", errors.New("gemini model is not configured")
	}

	var attempts []string
	for modelIndex, model := range models {
		for keyIndex, apiKey := range apiKeys {
			responseText, err := s.generateContent(ctx, model, prompt, apiKey, responseMimeType)
			if err == nil {
				if modelIndex > 0 {
					s.log.WithField("model", model).WithField("key_index", keyIndex+1).Warn("Gemini recovered on fallback model")
				}
				return responseText, nil
			}

			var reqErr *geminiRequestError
			if errors.As(err, &reqErr) {
				attempts = append(attempts, fmt.Sprintf("model=%s,key=%d,status=%d", model, keyIndex+1, reqErr.StatusCode))
				s.log.WithField("model", model).WithField("key_index", keyIndex+1).WithField("status_code", reqErr.StatusCode).Warn("Gemini request failed, rotating API key")
				continue
			}

			return "", err
		}
	}

	return "", fmt.Errorf("gemini request failed for all configured API keys (%d) and models (%d): %s", len(apiKeys), len(models), strings.Join(attempts, "; "))
}

func (s *aiService) getGeminiAPIKeys() []string {
	if len(s.cfg.APIKeys) > 0 {
		return s.cfg.APIKeys
	}

	if strings.TrimSpace(s.cfg.APIKey) == "" {
		return nil
	}

	return []string{s.cfg.APIKey}
}

func (s *aiService) getGeminiModels() []string {
	models := make([]string, 0, 1+len(s.cfg.FallbackModels))
	models = append(models, strings.TrimSpace(s.cfg.PrimaryModel))
	models = append(models, s.cfg.FallbackModels...)

	result := make([]string, 0, len(models))
	seen := make(map[string]struct{}, len(models))
	for _, model := range models {
		model = strings.TrimSpace(model)
		if model == "" {
			continue
		}
		if _, exists := seen[model]; exists {
			continue
		}
		seen[model] = struct{}{}
		result = append(result, model)
	}

	return result
}

func (s *aiService) generateContent(
	ctx context.Context,
	model string,
	prompt string,
	apiKey string,
	responseMimeType string,
) (string, error) {
	if strings.TrimSpace(apiKey) == "" {
		return "", errors.New("GEMINI_API_KEY is not configured")
	}
	if strings.TrimSpace(model) == "" {
		return "", errors.New("gemini model is not configured")
	}

	requestPayload := geminiGenerateContentRequest{
		Contents: []geminiContent{{
			Parts: []geminiPart{{Text: prompt}},
		}},
	}
	requestPayload.GenerationConfig.ResponseMimeType = strings.TrimSpace(responseMimeType)
	if requestPayload.GenerationConfig.ResponseMimeType == "" {
		requestPayload.GenerationConfig.ResponseMimeType = "application/json"
	}

	body, err := json.Marshal(requestPayload)
	if err != nil {
		return "", fmt.Errorf("marshal gemini request: %w", err)
	}

	endpoint, err := buildGeminiEndpoint(s.cfg.BaseURL, model, apiKey)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create gemini request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("send gemini request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read gemini response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errorResp geminiErrorResponse
		if err := json.Unmarshal(respBody, &errorResp); err == nil {
			return "", &geminiRequestError{
				StatusCode: resp.StatusCode,
				Message:    strings.TrimSpace(errorResp.Error.Message),
				Status:     strings.TrimSpace(errorResp.Error.Status),
			}
		}

		return "", &geminiRequestError{
			StatusCode: resp.StatusCode,
			Message:    strings.TrimSpace(string(respBody)),
		}
	}

	var geminiResp geminiGenerateContentResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return "", fmt.Errorf("decode gemini success response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("gemini returned empty candidates")
	}

	text := strings.TrimSpace(geminiResp.Candidates[0].Content.Parts[0].Text)
	if text == "" {
		return "", errors.New("gemini returned empty response text")
	}

	return text, nil
}

func extractTranslationTextResponse(responseText string) string {
	trimmed := strings.TrimSpace(responseText)
	if trimmed == "" {
		return ""
	}

	for range 3 {
		normalized := normalizeJSONText(trimmed)
		if normalized == "" {
			return ""
		}

		var wrapped struct {
			TranslatedText string `json:"translatedText"`
			Text           string `json:"text"`
			Result         string `json:"result"`
			Translation    string `json:"translation"`
		}
		if err := json.Unmarshal([]byte(normalized), &wrapped); err == nil {
			if candidate := firstNonEmptyString(
				wrapped.TranslatedText,
				wrapped.Text,
				wrapped.Result,
				wrapped.Translation,
			); candidate != "" {
				trimmed = candidate
				continue
			}
		}

		var plainString string
		if err := json.Unmarshal([]byte(normalized), &plainString); err == nil {
			trimmed = plainString
			continue
		}

		if unquoted, err := strconv.Unquote(normalized); err == nil {
			trimmed = unquoted
			continue
		}

		return strings.TrimSpace(stripWrappingQuotes(normalized))
	}

	return strings.TrimSpace(stripWrappingQuotes(trimmed))
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}

	return ""
}

func stripWrappingQuotes(value string) string {
	trimmed := strings.TrimSpace(value)
	for len(trimmed) >= 2 {
		if strings.HasPrefix(trimmed, `"`) && strings.HasSuffix(trimmed, `"`) {
			trimmed = strings.TrimSpace(trimmed[1 : len(trimmed)-1])
			continue
		}
		if strings.HasPrefix(trimmed, `'`) && strings.HasSuffix(trimmed, `'`) {
			trimmed = strings.TrimSpace(trimmed[1 : len(trimmed)-1])
			continue
		}
		break
	}

	return trimmed
}

func decodeJSONObject(responseText string, out interface{}) error {
	normalized := normalizeJSONText(responseText)
	if normalized == "" {
		return errors.New("empty response body")
	}

	if err := json.Unmarshal([]byte(normalized), out); err != nil {
		return fmt.Errorf("invalid json payload: %w", err)
	}

	return nil
}

func normalizeJSONText(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}

	if strings.HasPrefix(trimmed, "```") {
		trimmed = strings.TrimPrefix(trimmed, "```")
		trimmed = strings.TrimSpace(trimmed)
		if len(trimmed) >= 4 && strings.EqualFold(trimmed[:4], "json") {
			trimmed = strings.TrimSpace(trimmed[4:])
		}
		if idx := strings.LastIndex(trimmed, "```"); idx >= 0 {
			trimmed = strings.TrimSpace(trimmed[:idx])
		}
	}

	if strings.HasPrefix(trimmed, "`") && strings.HasSuffix(trimmed, "`") {
		trimmed = strings.Trim(trimmed, "`")
		trimmed = strings.TrimSpace(trimmed)
	}

	return trimmed
}

func normalizeSemesterHours(hours []int) []int {
	result := make([]int, 8)
	for i := 0; i < len(result) && i < len(hours); i++ {
		result[i] = hours[i]
	}
	return result
}

func roundUpToMultiple(value int, step int) int {
	if step <= 0 || value <= 0 {
		return value
	}

	remainder := value % step
	if remainder == 0 {
		return value
	}

	return value + step - remainder
}

func sumHours(hours []int) int {
	total := 0
	for _, hour := range hours {
		total += hour
	}
	return total
}

func courseSemesterIndexes(course int) []int {
	start := (course - 1) * 2
	if start < 0 {
		start = 0
	}
	if start > 6 {
		start = 6
	}

	return []int{start, start + 1}
}

type generatedDisciplineAllocation struct {
	Name       string
	Code       string
	TotalHours int
	Semesters  []int
}

func rebalanceGeneratedDisciplineHours(disciplines []rawGeneratedDiscipline, targetHours int, course int) []generatedDisciplineAllocation {
	result := make([]generatedDisciplineAllocation, 0, len(disciplines))

	if len(disciplines) == 0 {
		return result
	}

	weights := make([]int, len(disciplines))
	for i, discipline := range disciplines {
		rawSemesters := normalizeSemesterHours(discipline.Semesters)
		rawTotal := discipline.TotalHours
		if rawTotal <= 0 {
			rawTotal = sumHours(rawSemesters)
		}
		if rawTotal > 0 {
			weights[i] = rawTotal
		} else {
			weights[i] = 1
		}
	}

	allocatedTotals := allocateDisciplineTotals(weights, targetHours)
	activeIndexes := courseSemesterIndexes(course)

	for i, discipline := range disciplines {
		normalizedSemesters := normalizeSemesterHours(discipline.Semesters)
		rebalancedSemesters := spreadDisciplineHoursAcrossSemesters(normalizedSemesters, allocatedTotals[i], activeIndexes)
		result = append(result, generatedDisciplineAllocation{
			Name:       discipline.Name,
			Code:       discipline.Code,
			TotalHours: allocatedTotals[i],
			Semesters:  rebalancedSemesters,
		})
	}

	return result
}

func allocateDisciplineTotals(weights []int, targetHours int) []int {
	result := make([]int, len(weights))
	if len(weights) == 0 || targetHours <= 0 {
		return result
	}

	units := targetHours / 24
	if units <= 0 {
		return result
	}

	totalWeight := 0
	for _, weight := range weights {
		if weight > 0 {
			totalWeight += weight
		}
	}
	if totalWeight == 0 {
		totalWeight = len(weights)
		for i := range weights {
			weights[i] = 1
		}
	}

	baseUnits := make([]int, len(weights))
	if len(weights) <= units {
		for i := range baseUnits {
			baseUnits[i] = 1
		}
		units -= len(weights)
	}

	type remainderEntry struct {
		index     int
		remainder int
	}

	remainders := make([]remainderEntry, 0, len(weights))
	assignedExtra := 0
	for i, weight := range weights {
		exactNumerator := units * weight
		extraUnits := 0
		remainder := 0
		if totalWeight > 0 {
			extraUnits = exactNumerator / totalWeight
			remainder = exactNumerator % totalWeight
		}
		baseUnits[i] += extraUnits
		assignedExtra += extraUnits
		remainders = append(remainders, remainderEntry{index: i, remainder: remainder})
	}

	sort.SliceStable(remainders, func(i, j int) bool {
		return remainders[i].remainder > remainders[j].remainder
	})

	for i := 0; i < units-assignedExtra && i < len(remainders); i++ {
		baseUnits[remainders[i].index]++
	}

	for i, unitCount := range baseUnits {
		result[i] = unitCount * 24
	}

	return result
}

func spreadDisciplineHoursAcrossSemesters(rawSemesters []int, totalHours int, activeIndexes []int) []int {
	result := normalizeSemesterHours(rawSemesters)
	for i := range result {
		result[i] = 0
	}

	if totalHours <= 0 {
		return result
	}

	if len(activeIndexes) == 0 {
		result[0] = totalHours
		return result
	}

	activeRawSum := 0
	for _, index := range activeIndexes {
		if index >= 0 && index < len(rawSemesters) {
			activeRawSum += maxInt(rawSemesters[index], 0)
		}
	}

	if activeRawSum == 0 {
		result[activeIndexes[0]] = totalHours
		return result
	}

	remaining := totalHours
	for i, index := range activeIndexes {
		if index < 0 || index >= len(result) {
			continue
		}
		if i == len(activeIndexes)-1 {
			result[index] = remaining
			break
		}

		share := totalHours * maxInt(rawSemesters[index], 0) / activeRawSum
		result[index] = share
		remaining -= share
	}

	return result
}

func normalizeGeneratedTopics(rawTopics []GeneratedTopic, req GenerateTopicsForDisciplineRequest, topicHours int) []GeneratedTopic {
	baseTopicCount := 0
	if topicHours > 0 {
		baseTopicCount = req.DisciplineHours / topicHours
	}
	if baseTopicCount <= 0 && req.DisciplineHours > 0 {
		baseTopicCount = 1
	}
	targetTopicCount := baseTopicCount + maxInt(req.PreferredSrspCount, countTopicType(rawTopics, "SRSP"))
	if targetTopicCount <= 0 {
		return nil
	}

	types := buildNormalizedTopicTypes(rawTopics, req, baseTopicCount, targetTopicCount)
	result := make([]GeneratedTopic, 0, targetTopicCount)

	for i := 0; i < targetTopicCount; i++ {
		topicType := "COMBINED"
		if i < len(types) {
			topicType = types[i]
		}

		rawName := ""
		if i < len(rawTopics) {
			rawName = rawTopics[i].Name
		}
		name := normalizeGeneratedTopicName(rawName, req, topicType, i)

		durationHours := topicHours
		if i < len(rawTopics) && rawTopics[i].DurationHours > 0 {
			durationHours = rawTopics[i].DurationHours
		}
		durationHours = normalizeTopicDurationHours(topicType, durationHours)
		theoryHours, practiceHours, individualHours, srspHours := normalizeTopicHours(topicType, durationHours)

		result = append(result, GeneratedTopic{
			Name:            name,
			Type:            topicType,
			DurationHours:   durationHours,
			TheoryHours:     theoryHours,
			PracticeHours:   practiceHours,
			IndividualHours: individualHours,
			SrspHours:       srspHours,
			SrsHours:        0,
		})
	}

	return result
}

func buildNormalizedTopicTypes(rawTopics []GeneratedTopic, req GenerateTopicsForDisciplineRequest, baseTopicCount int, targetTopicCount int) []string {
	prefPractical := maxInt(req.PreferredPracticalCount, 0)
	prefSnz := maxInt(req.PreferredSnzCount, 0)
	prefCombined := maxInt(req.PreferredCombinedCount, 0)
	prefSrsp := maxInt(req.PreferredSrspCount, 0)

	result := make([]string, 0, targetTopicCount)
	if prefPractical+prefSnz+prefCombined+prefSrsp > 0 {
		practical, snz, combined := adjustPreferredTopicCounts(
			prefPractical,
			prefSnz,
			prefCombined,
			baseTopicCount,
		)
		for i := 0; i < combined; i++ {
			result = append(result, "COMBINED")
		}
		for i := 0; i < snz; i++ {
			result = append(result, "SNZ")
		}
		for i := 0; i < practical; i++ {
			result = append(result, "PRACTICAL")
		}
	}

	for _, topic := range rawTopics {
		if len(result) >= targetTopicCount {
			break
		}

		topicType := inferTopicType(topic)
		if topicType == "" {
			topicType = "COMBINED"
		}
		result = append(result, topicType)
	}

	for len(result) < baseTopicCount {
		result = append(result, "COMBINED")
	}

	for len(result) < targetTopicCount {
		result = append(result, "SRSP")
	}

	return result[:targetTopicCount]
}

func adjustPreferredTopicCounts(practical int, snz int, combined int, target int) (int, int, int) {
	total := practical + snz + combined
	if total < target {
		combined += target - total
		return practical, snz, combined
	}
	if total == target {
		return practical, snz, combined
	}

	overflow := total - target
	reduceCombined := minInt(combined, overflow)
	combined -= reduceCombined
	overflow -= reduceCombined

	reduceSnz := minInt(snz, overflow)
	snz -= reduceSnz
	overflow -= reduceSnz

	reducePractical := minInt(practical, overflow)
	practical -= reducePractical

	return practical, snz, combined
}

func normalizeTopicType(value string) string {
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "SRSP":
		return "SRSP"
	case "PRACTICAL", "PRACTICE":
		return "PRACTICAL"
	case "SNZ":
		return "SNZ"
	case "COMBINED", "THEORY":
		return "COMBINED"
	default:
		return ""
	}
}

func normalizeTopicDurationHours(topicType string, durationHours int) int {
	switch topicType {
	case "PRACTICAL":
		return 2
	case "COMBINED", "SNZ", "SRSP":
		return 2
	default:
		return 2
	}
}

func normalizeTopicHours(topicType string, durationHours int) (int, int, int, int) {
	if durationHours <= 0 {
		return 0, 0, 0, 0
	}

	switch topicType {
	case "PRACTICAL":
		return 0, durationHours, 0, 0
	case "SNZ":
		return 0, 0, durationHours, 0
	case "SRSP":
		return 0, 0, 0, durationHours
	default:
		theory := durationHours / 2
		practice := durationHours - theory
		return theory, practice, 0, 0
	}
}

func minInt(a int, b int) int {
	if a < b {
		return a
	}
	return b
}

func maxInt(a int, b int) int {
	if a > b {
		return a
	}
	return b
}

func countTopicType(topics []GeneratedTopic, topicType string) int {
	count := 0
	for _, topic := range topics {
		if normalizeTopicType(topic.Type) == topicType {
			count++
		}
	}
	return count
}

func inferTopicType(topic GeneratedTopic) string {
	if topicType := normalizeTopicType(topic.Type); topicType != "" {
		return topicType
	}
	if topic.SrspHours > 0 {
		return "SRSP"
	}
	if topic.IndividualHours > 0 && topic.TheoryHours == 0 && topic.PracticeHours == 0 {
		return "SNZ"
	}
	if topic.PracticeHours > 0 && topic.TheoryHours == 0 && topic.IndividualHours == 0 {
		return "PRACTICAL"
	}
	return "COMBINED"
}

func sanitizeGeneratedDisciplineName(code string, name string) string {
	trimmedCode := strings.TrimSpace(code)
	trimmedName := strings.TrimSpace(name)
	if trimmedName == "" {
		return trimmedCode
	}

	withoutCodePrefix := disciplineCodePrefixPattern.ReplaceAllString(trimmedName, "")
	withoutCodePrefix = strings.TrimSpace(strings.TrimLeft(withoutCodePrefix, ".:- "))
	if withoutCodePrefix == "" {
		withoutCodePrefix = trimmedName
	}

	if trimmedCode == "" {
		return withoutCodePrefix
	}

	return strings.TrimSpace(trimmedCode + " " + withoutCodePrefix)
}

func normalizeGeneratedTopicName(name string, req GenerateTopicsForDisciplineRequest, topicType string, index int) string {
	normalized := strings.TrimSpace(name)
	if normalized != "" {
		replacer := strings.NewReplacer(
			"Лабораторно-практическое занятие:", "",
			"Лабораторно-практическое занятие", "",
			"Лабораторно-практическая работа:", "",
			"Лабораторно-практическая работа", "",
			"Теоретическое занятие:", "",
			"Теоретическое занятие", "",
			"Лекция:", "",
			"Лекция.", "",
			"Лекция", "",
		)
		normalized = strings.TrimSpace(replacer.Replace(normalized))
		normalized = strings.TrimSpace(strings.TrimLeft(normalized, ".:- "))
	}

	if normalized == "" || topicPlaceholderPattern.MatchString(normalized) {
		return buildFallbackTopicName(req.SourceLanguage, strings.TrimSpace(req.DisciplineName), topicType, index)
	}

	return normalized
}

func buildFallbackTopicName(sourceLanguage string, disciplineName string, topicType string, index int) string {
	subject := disciplineName
	if subject == "" {
		if strings.EqualFold(sourceLanguage, "kk") {
			subject = "пән мазмұны"
		} else {
			subject = "содержание дисциплины"
		}
	}

	if strings.EqualFold(sourceLanguage, "kk") {
		switch topicType {
		case "PRACTICAL":
			templates := []string{
				"Орындайды \"%s\" пәні бойынша практикалық әрекеттерді",
				"Қолданады \"%s\" пәнінің жұмыс тәсілдерін",
				"Баптайды \"%s\" пәніне қатысты құралдарды",
				"Тексереді \"%s\" пәні бойынша орындалған нәтижелерді",
			}
			return fmt.Sprintf(templates[index%len(templates)], subject)
		case "SNZ":
			templates := []string{
				"Орындайды \"%s\" пәні бойынша жеке тапсырманы",
				"Жүйелейді \"%s\" пәні бойынша өзіндік жұмысты",
			}
			return fmt.Sprintf(templates[index%len(templates)], subject)
		case "SRSP":
			templates := []string{
				"Талдайды \"%s\" пәні бойынша кеңес беру сұрақтарын",
				"Нақтылайды \"%s\" пәні бойынша бақылау тапсырмаларын",
			}
			return fmt.Sprintf(templates[index%len(templates)], subject)
		default:
			templates := []string{
				"Түсіндіреді \"%s\" пәнінің негізгі ұғымдарын",
				"Сипаттайды \"%s\" пәнінің құрылымы мен мазмұнын",
				"Қолданады \"%s\" пәнінің негізгі әдістерін",
				"Талдайды \"%s\" пәні бойынша оқу жағдайларын",
			}
			return fmt.Sprintf(templates[index%len(templates)], subject)
		}
	}

	switch topicType {
	case "PRACTICAL":
		templates := []string{
			"Выполняет практические действия по дисциплине \"%s\"",
			"Применяет рабочие методы дисциплины \"%s\"",
			"Настраивает инструменты по дисциплине \"%s\"",
			"Проверяет результаты по дисциплине \"%s\"",
		}
		return fmt.Sprintf(templates[index%len(templates)], subject)
	case "SNZ":
		templates := []string{
			"Выполняет индивидуальное задание по дисциплине \"%s\"",
			"Систематизирует самостоятельную работу по дисциплине \"%s\"",
		}
		return fmt.Sprintf(templates[index%len(templates)], subject)
	case "SRSP":
		templates := []string{
			"Разбирает вопросы консультации по дисциплине \"%s\"",
			"Уточняет контрольные задания по дисциплине \"%s\"",
		}
		return fmt.Sprintf(templates[index%len(templates)], subject)
	default:
		templates := []string{
			"Объясняет ключевые понятия дисциплины \"%s\"",
			"Описывает структуру и содержание дисциплины \"%s\"",
			"Применяет базовые методы дисциплины \"%s\"",
			"Анализирует учебные ситуации по дисциплине \"%s\"",
		}
		return fmt.Sprintf(templates[index%len(templates)], subject)
	}
}

func normalizeGeneratedResources(resources []GeneratedResource) []GeneratedResource {
	if len(resources) == 0 {
		return nil
	}

	unique := make(map[string]struct{}, len(resources))
	result := make([]GeneratedResource, 0, len(resources))
	for _, resource := range resources {
		name := strings.TrimSpace(resource.Name)
		if isPlaceholderValue(name) {
			continue
		}

		link := strings.TrimSpace(resource.Link)
		if isPlaceholderValue(link) {
			link = ""
		}
		if link != "" && !strings.HasPrefix(strings.ToLower(link), "http://") && !strings.HasPrefix(strings.ToLower(link), "https://") {
			link = ""
		}

		key := strings.ToLower(name + "|" + link)
		if _, exists := unique[key]; exists {
			continue
		}
		unique[key] = struct{}{}

		result = append(result, GeneratedResource{
			Name: name,
			Link: link,
		})
	}

	return result
}

func isPlaceholderValue(value string) bool {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if normalized == "" {
		return true
	}

	switch normalized {
	case "asdf", "qwerty", "test", "null", "none", "-", "_":
		return true
	default:
		return false
	}
}

func buildGeminiEndpoint(baseURL string, model string, apiKey string) (string, error) {
	base := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if base == "" {
		base = "https://generativelanguage.googleapis.com/v1beta"
	}

	u, err := url.Parse(base + "/models/" + model + ":generateContent")
	if err != nil {
		return "", fmt.Errorf("parse gemini endpoint: %w", err)
	}

	q := u.Query()
	q.Set("key", apiKey)
	u.RawQuery = q.Encode()

	return u.String(), nil
}
