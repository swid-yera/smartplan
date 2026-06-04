package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"eduplan/backend/config"
	"eduplan/backend/pkg/helpers"

	"github.com/sirupsen/logrus"
)

type openAIService struct {
	httpClient *http.Client
	cfg        *config.OpenAIConfig
	log        *logrus.Logger
}

func NewOpenAIService(httpClient *http.Client, cfg *config.OpenAIConfig, log *logrus.Logger) AIService {
	return &openAIService{
		httpClient: httpClient,
		cfg:        cfg,
		log:        log,
	}
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIRequest struct {
	Model       string          `json:"model"`
	Messages    []openAIMessage `json:"messages"`
	Temperature float64         `json:"temperature,omitempty"`
	MaxTokens   int             `json:"max_tokens,omitempty"`
	Stream      bool            `json:"stream,omitempty"`
}

type openAIResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

type openAIErrorResponse struct {
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error"`
}

func (s *openAIService) GenerateRupMeta(ctx context.Context, req GenerateRupMetaRequest) (*GenerateRupMetaResponse, error) {
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

	responseText, err := s.generateContent(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate rup meta: %w", err)
	}

	var out GenerateRupMetaResponse
	if err := decodeJSONObject(responseText, &out); err != nil {
		return nil, fmt.Errorf("decode rup meta response: %w", err)
	}

	return &out, nil
}

func (s *openAIService) GenerateResources(ctx context.Context, req GenerateResourcesRequest) (*GenerateResourcesResponse, error) {
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

	responseText, err := s.generateContent(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate resources: %w", err)
	}

	var out GenerateResourcesResponse
	if err := decodeJSONObject(responseText, &out); err != nil {
		return nil, fmt.Errorf("decode resources response: %w", err)
	}

	return &out, nil
}

func (s *openAIService) GenerateDisciplines(ctx context.Context, req GenerateDisciplinesRequest) ([]GeneratedDiscipline, error) {
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

	responseText, err := s.generateContent(ctx, prompt)
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

func (s *openAIService) GenerateTopicsForDiscipline(ctx context.Context, req GenerateTopicsForDisciplineRequest) ([]GeneratedTopic, error) {
	topicHours := 2
	if strings.EqualFold(req.RupType, "PRACTICE") {
		topicHours = 6
	}
	hasPreferredTopicCounts := req.PreferredPracticalCount > 0 || req.PreferredSnzCount > 0 || req.PreferredCombinedCount > 0
	preferredTopicCount := req.PreferredPracticalCount + req.PreferredSnzCount + req.PreferredCombinedCount
	shouldUsePreferredTopicCount := !strings.EqualFold(req.RupType, "PRACTICE") && hasPreferredTopicCounts && preferredTopicCount > 0
	baseTopicCount := req.DisciplineHours / topicHours
	topicCount := baseTopicCount
	if shouldUsePreferredTopicCount && preferredTopicCount == baseTopicCount {
		topicCount = preferredTopicCount
	}

	currentValuesContext := helpers.BuildCurrentValuesContext(
		req.IncludeCurrentContent,
		req.CurrentValues,
		"СТАРЫЕ ДАННЫЕ (currentValues) ПО ДИСЦИПЛИНЕ ДЛЯ ПЕРЕГЕНЕРАЦИИ",
	)

	chunks := splitTopicCountInHalf(topicCount)
	result := make([]GeneratedTopic, 0, topicCount)
	for idx, chunkCount := range chunks {
		if chunkCount <= 0 {
			continue
		}

		partReq := req
		partReq.DisciplineHours = chunkCount * topicHours
		partReq.PreferredPracticalCount = splitPreferredCountForChunk(req.PreferredPracticalCount, idx, chunkCount, topicCount)
		partReq.PreferredSnzCount = splitPreferredCountForChunk(req.PreferredSnzCount, idx, chunkCount, topicCount)
		partReq.PreferredCombinedCount = splitPreferredCountForChunk(req.PreferredCombinedCount, idx, chunkCount, topicCount)

		batchContext := fmt.Sprintf(
			"Сейчас генерируется часть %d из %d. Верни ровно %d тем только для этой части.",
			idx+1,
			len(chunks),
			chunkCount,
		)

		partTopics, err := s.generateTopicsChunk(ctx, partReq, chunkCount, currentValuesContext, batchContext)
		if err != nil {
			return nil, fmt.Errorf("generate topics for discipline (part %d/%d): %w", idx+1, len(chunks), err)
		}

		result = append(result, partTopics...)
	}

	return normalizeGeneratedTopics(result, req, topicHours), nil
}

func (s *openAIService) generateTopicsChunk(
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
		CurrentValuesContext:    currentValuesContext,
	})

	responseText, err := s.generateContent(ctx, prompt)
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

func (s *openAIService) GenerateLesson(ctx context.Context, req GenerateLessonRequest) (*GenerateLessonResponse, error) {
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

	responseText, err := s.generateContent(ctx, prompt)
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

func (s *openAIService) TranslateText(ctx context.Context, req TranslateTextRequest) (string, error) {
	text := strings.TrimSpace(req.Text)
	if text == "" {
		return "", nil
	}

	sourceLanguage := strings.TrimSpace(req.SourceLanguage)
	targetLanguage := strings.TrimSpace(req.TargetLanguage)
	if sourceLanguage == "" || targetLanguage == "" {
		return "", fmt.Errorf("sourceLanguage and targetLanguage are required")
	}
	if strings.EqualFold(sourceLanguage, targetLanguage) {
		return text, nil
	}

	prompt := helpers.BuildTranslateTextPrompt(helpers.TranslateTextPromptInput{
		Text:             text,
		SourceLanguage:   sourceLanguage,
		TargetLanguage:   targetLanguage,
		Domain:           req.Domain,
		AdditionalPrompt: req.AdditionalPrompt,
	})

	responseText, err := s.generateContent(ctx, prompt)
	if err != nil {
		return "", fmt.Errorf("translate text: %w", err)
	}

	translatedText := extractTranslationTextResponse(responseText)
	if translatedText == "" {
		return "", errors.New("empty translation response")
	}

	return translatedText, nil
}

func (s *openAIService) generateContent(ctx context.Context, prompt string) (string, error) {
	if strings.TrimSpace(s.cfg.APIKey) == "" {
		return "", errors.New("OPENAI_API_KEY is not configured")
	}
	if strings.TrimSpace(s.cfg.Model) == "" {
		return "", errors.New("openai model is not configured")
	}

	requestPayload := openAIRequest{
		Model: s.cfg.Model,
		Messages: []openAIMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.7,
		Stream:      false, // Отключаем streaming
	}

	body, err := json.Marshal(requestPayload)
	if err != nil {
		return "", fmt.Errorf("marshal openai request: %w", err)
	}

	endpoint := strings.TrimRight(s.cfg.BaseURL, "/") + "/chat/completions"

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create openai request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.cfg.APIKey)

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("send openai request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read openai response: %w", err)
	}

	// Временное логирование для отладки
	s.log.WithFields(map[string]interface{}{
		"status_code":   resp.StatusCode,
		"response_body": string(respBody),
	}).Debug("OpenAI API raw response")

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errorResp openAIErrorResponse
		if err := json.Unmarshal(respBody, &errorResp); err == nil {
			return "", fmt.Errorf("openai request failed with status %d: %s", resp.StatusCode, errorResp.Error.Message)
		}

		return "", fmt.Errorf("openai request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	// Проверяем, является ли ответ SSE (Server-Sent Events)
	responseText := string(respBody)
	if strings.HasPrefix(responseText, "data: ") {
		// Это streaming ответ в формате SSE, парсим его
		text, err := s.parseSSEResponse(responseText)
		if err != nil {
			s.log.WithFields(map[string]interface{}{
				"error":         err.Error(),
				"response_body": responseText,
			}).Error("Failed to parse SSE response")
			return "", fmt.Errorf("parse sse response: %w", err)
		}
		return text, nil
	}

	// Обычный JSON ответ
	var openAIResp openAIResponse
	if err := json.Unmarshal(respBody, &openAIResp); err != nil {
		s.log.WithFields(map[string]interface{}{
			"error":         err.Error(),
			"response_body": string(respBody),
		}).Error("Failed to decode OpenAI response")
		return "", fmt.Errorf("decode openai success response: %w", err)
	}

	if len(openAIResp.Choices) == 0 {
		return "", errors.New("openai returned empty choices")
	}

	text := strings.TrimSpace(openAIResp.Choices[0].Message.Content)
	if text == "" {
		return "", errors.New("openai returned empty response text")
	}

	return text, nil
}

func (s *openAIService) parseSSEResponse(sseData string) (string, error) {
	var fullContent strings.Builder
	lines := strings.Split(sseData, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || line == "data: [DONE]" || strings.HasPrefix(line, ":") {
			continue
		}

		if strings.HasPrefix(line, "data: ") {
			jsonData := strings.TrimPrefix(line, "data: ")

			var chunk struct {
				ID      string `json:"id"`
				Object  string `json:"object"`
				Model   string `json:"model"`
				Choices []struct {
					Index int `json:"index"`
					Delta struct {
						Role    string `json:"role"`
						Content string `json:"content"`
					} `json:"delta"`
					FinishReason *string `json:"finish_reason"`
				} `json:"choices"`
			}

			if err := json.Unmarshal([]byte(jsonData), &chunk); err != nil {
				// Пропускаем строки, которые не удалось распарсить (например, keepalive)
				continue
			}

			if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
				fullContent.WriteString(chunk.Choices[0].Delta.Content)
			}
		}
	}

	result := strings.TrimSpace(fullContent.String())
	if result == "" {
		return "", errors.New("no content in sse response")
	}

	return result, nil
}
