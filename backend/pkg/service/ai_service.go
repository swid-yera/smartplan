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
	"strconv"
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

	return normalizeGeneratedTopics(partTopics, req, topicHours), nil
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

	names := buildOrderedTopicNames(rawTopics)
	types := buildNormalizedTopicTypes(rawTopics, req, baseTopicCount, targetTopicCount)
	result := make([]GeneratedTopic, 0, targetTopicCount)
	namePrefix := "Тема"
	if strings.EqualFold(req.SourceLanguage, "kk") {
		namePrefix = "Тақырып"
	}

	for i := 0; i < targetTopicCount; i++ {
		name := fmt.Sprintf("%s %d", namePrefix, i+1)
		if i < len(names) {
			name = names[i]
		}

		topicType := "COMBINED"
		if i < len(types) {
			topicType = types[i]
		}

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
		if durationHours == 6 {
			return 6
		}
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

func buildOrderedTopicNames(rawTopics []GeneratedTopic) []string {
	names := make([]string, 0, len(rawTopics))
	for _, topic := range rawTopics {
		name := strings.TrimSpace(topic.Name)
		if name == "" {
			continue
		}
		names = append(names, name)
	}

	return names
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
	if topic.DurationHours >= 6 {
		return "PRACTICAL"
	}
	return "COMBINED"
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
