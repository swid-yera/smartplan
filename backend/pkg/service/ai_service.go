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
	"strings"

	"eduplan/backend/config"
	"eduplan/backend/pkg/helpers"

	"github.com/sirupsen/logrus"
)

type AIService interface {
	GenerateRupMeta(ctx context.Context, req GenerateRupMetaRequest) (*GenerateRupMetaResponse, error)
	GenerateResources(ctx context.Context, req GenerateResourcesRequest) (*GenerateResourcesResponse, error)
	GenerateDisciplines(ctx context.Context, req GenerateDisciplinesRequest) ([]GeneratedDiscipline, error)
	GenerateTopicsForDiscipline(ctx context.Context, req GenerateTopicsForDisciplineRequest) ([]GeneratedTopic, error)
	GenerateLesson(ctx context.Context, req GenerateLessonRequest) (*GenerateLessonResponse, error)
}

type aiService struct {
	httpClient *http.Client
	cfg        *config.GeminiConfig
	log        *logrus.Logger
}

func NewAIService(httpClient *http.Client, cfg *config.GeminiConfig, log *logrus.Logger) AIService {
	return &aiService{
		httpClient: httpClient,
		cfg:        cfg,
		log:        log,
	}
}

type GenerateRupMetaRequest = helpers.GenerateRupMetaRequest
type GenerateRupGroup = helpers.GenerateRupGroup
type GenerateRupMetaResponse = helpers.GenerateRupMetaResponse
type GenerateResourcesRequest = helpers.GenerateResourcesRequest
type GenerateResourcesResponse = helpers.GenerateResourcesResponse
type GeneratedResource = helpers.GeneratedResource
type GenerateDisciplinesRequest = helpers.GenerateDisciplinesRequest
type GenerateTopicsForDisciplineRequest = helpers.GenerateTopicsForDisciplineRequest
type GeneratedDiscipline = helpers.GeneratedDiscipline
type GeneratedSemester = helpers.GeneratedSemester
type GeneratedTopic = helpers.GeneratedTopic
type GenerateLessonRequest = helpers.GenerateLessonRequest
type GenerateLessonResponse = helpers.GenerateLessonResponse
type GeneratedLessonProgressStep = helpers.GeneratedLessonProgressStep
type geminiGenerateContentRequest = helpers.GeminiGenerateContentRequest
type geminiContent = helpers.GeminiContent
type geminiPart = helpers.GeminiPart
type geminiGenerateContentResponse = helpers.GeminiGenerateContentResponse
type geminiErrorResponse = helpers.GeminiErrorResponse
type geminiRequestError = helpers.GeminiRequestError

func (s *aiService) GenerateRupMeta(ctx context.Context, req GenerateRupMetaRequest) (*GenerateRupMetaResponse, error) {
	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	prompt := helpers.BuildGenerateRupMetaPrompt(helpers.GenerateRupMetaPromptInput{
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

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate rup meta: %w", err)
	}

	var out GenerateRupMetaResponse
	if err := decodeJSONObject(responseText, &out); err != nil {
		return nil, fmt.Errorf("decode rup meta response: %w", err)
	}

	return &out, nil
}

func (s *aiService) GenerateResources(ctx context.Context, req GenerateResourcesRequest) (*GenerateResourcesResponse, error) {
	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	prompt := helpers.BuildGenerateResourcesPrompt(helpers.GenerateResourcesPromptInput{
		Name:                 req.Name,
		Prerequisites:        req.Prerequisites,
		Postrequisites:       req.Postrequisites,
		Basic:                req.Basic,
		Goals:                req.Goals,
		Competencies:         req.Competencies,
		Message:              req.Message,
		CurrentValuesContext: currentValuesContext,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate resources: %w", err)
	}

	var out GenerateResourcesResponse
	if err := decodeJSONObject(responseText, &out); err != nil {
		return nil, fmt.Errorf("decode resources response: %w", err)
	}

	return &out, nil
}

func (s *aiService) GenerateDisciplines(ctx context.Context, req GenerateDisciplinesRequest) ([]GeneratedDiscipline, error) {
	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	prompt := helpers.BuildGenerateDisciplinesPrompt(helpers.GenerateDisciplinesPromptInput{
		WantsHours:           req.WantsHours,
		DisciplineCount:      req.DisciplineCount,
		Course:               req.Course,
		Name:                 req.Name,
		Goals:                req.Goals,
		Competencies:         req.Competencies,
		Message:              req.Message,
		CurrentValuesContext: currentValuesContext,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate disciplines: %w", err)
	}

	var raw struct {
		Disciplines []struct {
			Name      string `json:"name"`
			Code      string `json:"code"`
			Semesters []int  `json:"semesters"`
		} `json:"disciplines"`
	}

	if err := decodeJSONObject(responseText, &raw); err != nil {
		return nil, fmt.Errorf("decode disciplines response: %w", err)
	}

	result := make([]GeneratedDiscipline, 0, len(raw.Disciplines))
	for _, discipline := range raw.Disciplines {
		normalized := normalizeSemesterHours(discipline.Semesters)
		semesters := make([]GeneratedSemester, 0, len(normalized))
		for i, hours := range normalized {
			semesters = append(semesters, GeneratedSemester{
				Semester:   i + 1,
				TotalHours: hours,
			})
		}

		name := strings.TrimSpace(strings.TrimSpace(discipline.Code) + " " + strings.TrimSpace(discipline.Name))
		result = append(result, GeneratedDiscipline{
			Name:      name,
			Semesters: semesters,
			Topics:    []GeneratedTopic{},
		})
	}

	return result, nil
}

func (s *aiService) GenerateTopicsForDiscipline(ctx context.Context, req GenerateTopicsForDisciplineRequest) ([]GeneratedTopic, error) {
	topicHours := 2
	if strings.EqualFold(req.RupType, "PRACTICE") {
		topicHours = 6
	}
	hasPreferredTopicCounts := req.PreferredPracticalCount > 0 || req.PreferredSnzCount > 0 || req.PreferredCombinedCount > 0
	preferredTopicCount := req.PreferredPracticalCount + req.PreferredSnzCount + req.PreferredCombinedCount
	shouldUsePreferredTopicCount := !strings.EqualFold(req.RupType, "PRACTICE") && hasPreferredTopicCounts && preferredTopicCount > 0
	topicCount := req.DisciplineHours / topicHours
	if shouldUsePreferredTopicCount {
		topicCount = preferredTopicCount
	}

	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ПО ДИСЦИПЛИНЕ ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	prompt := helpers.BuildGenerateTopicsForDisciplinePrompt(helpers.GenerateTopicsForDisciplinePromptInput{
		DisciplineName:          req.DisciplineName,
		RupName:                 req.RupName,
		DisciplineHours:         req.DisciplineHours,
		RupType:                 req.RupType,
		Goals:                   req.Goals,
		Competencies:            req.Competencies,
		Message:                 req.Message,
		TopicCount:              topicCount,
		PreferredPracticalCount: req.PreferredPracticalCount,
		PreferredSnzCount:       req.PreferredSnzCount,
		PreferredCombinedCount:  req.PreferredCombinedCount,
		CurrentValuesContext:    currentValuesContext,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate topics for discipline: %w", err)
	}

	var rawTopics []struct {
		Name          string `json:"name"`
		Type          string `json:"type"`
		TheoryHours   int    `json:"theoryHours"`
		PracticeHours int    `json:"practiceHours"`
	}

	if err := decodeJSONObject(responseText, &rawTopics); err != nil {
		var wrapped struct {
			Topics []struct {
				Name          string `json:"name"`
				Type          string `json:"type"`
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
		result = append(result, GeneratedTopic{
			Name:            topic.Name,
			Type:            strings.ToUpper(strings.TrimSpace(topic.Type)),
			TheoryHours:     topic.TheoryHours,
			PracticeHours:   topic.PracticeHours,
			IndividualHours: 0,
			SrspHours:       0,
			SrsHours:        0,
		})
	}

	return result, nil
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

	lessonMinutes := req.TotalHours * 45
	if lessonMinutes <= 0 {
		lessonMinutes = 90
	}

	prompt := helpers.BuildGenerateLessonPrompt(helpers.GenerateLessonPromptInput{
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
		ExplorationSummary:     req.ExplorationSummary,
		Prerequisites:          req.Prerequisites,
		Postrequisites:         req.Postrequisites,
		InternetResourcesJSON:  string(internetResourcesJSON),
		TechnicalResourcesJSON: string(technicalResourcesJSON),
		PreviousLessonsJSON:    string(previousLessonsJSON),
		Message:                req.Message,
		LessonMinutes:          lessonMinutes,
	})

	responseText, err := s.generateContentWithFallback(ctx, prompt)
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
		out.LessonProgress[i].Name = strings.TrimSpace(out.LessonProgress[i].Name)
		for j := range out.LessonProgress[i].Content {
			out.LessonProgress[i].Content[j] = strings.TrimSpace(out.LessonProgress[i].Content[j])
		}
	}

	return &out, nil
}

func (s *aiService) generateContentWithFallback(ctx context.Context, prompt string) (string, error) {
	responseText, err := s.generateContent(ctx, s.cfg.PrimaryModel, prompt)
	if err == nil {
		return responseText, nil
	}

	var reqErr *geminiRequestError
	if errors.As(err, &reqErr) && reqErr.IsRateLimit() && s.cfg.FallbackModel != "" && s.cfg.FallbackModel != s.cfg.PrimaryModel {
		s.log.WithField("primary_model", s.cfg.PrimaryModel).WithField("fallback_model", s.cfg.FallbackModel).Warn("Gemini limit reached, switching to fallback model")
		return s.generateContent(ctx, s.cfg.FallbackModel, prompt)
	}

	return "", err
}

func (s *aiService) generateContent(ctx context.Context, model string, prompt string) (string, error) {
	if strings.TrimSpace(s.cfg.APIKey) == "" {
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
	requestPayload.GenerationConfig.ResponseMimeType = "application/json"

	body, err := json.Marshal(requestPayload)
	if err != nil {
		return "", fmt.Errorf("marshal gemini request: %w", err)
	}

	endpoint, err := buildGeminiEndpoint(s.cfg.BaseURL, model, s.cfg.APIKey)
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
