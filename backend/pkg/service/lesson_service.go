package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"mime"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"eduplan/backend/config"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sirupsen/logrus"
)

type LessonParams struct {
	RupName            localization.LocaleText  `json:"rup_name"`
	DisciplineName     *localization.LocaleText `json:"discipline_name"`
	TopicName          *localization.LocaleText `json:"topic_name"`
	PlanNumber         *int32                   `json:"plan_number"`
	TeacherID          uuid.UUID                `json:"teacher_id"`
	EventDate          string                   `json:"event_date"`
	GroupID            uuid.UUID                `json:"group_id"`
	Type               string                   `json:"type"`
	Goals              *localization.LocaleText `json:"goals"`
	Tasks              *localization.LocaleText `json:"tasks"`
	Expected           *localization.LocaleText `json:"expected"`
	InternetResources  []uuid.UUID              `json:"internet_resources"`
	TechnicalResources []uuid.UUID              `json:"technical_resources"`
}

type LessonResponse struct {
	ID                 uuid.UUID                 `json:"id"`
	RupID              *uuid.UUID                `json:"rupId,omitempty"`
	DisciplineID       *uuid.UUID                `json:"disciplineId,omitempty"`
	TopicID            *uuid.UUID                `json:"topicId,omitempty"`
	RupName            localization.LocaleText   `json:"rup_name"`
	DisciplineName     *localization.LocaleText  `json:"discipline_name"`
	TopicName          *localization.LocaleText  `json:"topic_name"`
	PlanNumber         int32                     `json:"plan_number"`
	Topic              *TopicResponse            `json:"topic,omitempty"`
	Teacher            *helpers.UserResponse     `json:"teacher"`
	EventDate          string                    `json:"event_date"`
	Group              *GroupResponse            `json:"group"`
	Type               string                    `json:"type"`
	Goals              *localization.LocaleText  `json:"goals"`
	Tasks              *localization.LocaleText  `json:"tasks"`
	Expected           *localization.LocaleText  `json:"expected"`
	InternetResources  []*ResourceResponse       `json:"internet_resources"`
	TechnicalResources []*ResourceResponse       `json:"technical_resources"`
	LessonProgress     []LessonProgressData      `json:"lesson_progress"`
	FileURL            *string                   `json:"file_url"`
	CreatedAt          string                    `json:"created_at"`
	UpdatedAt          string                    `json:"updated_at"`
	PreviousLesson     *LessonNavigationResponse `json:"previous_lesson,omitempty"`
	NextLesson         *LessonNavigationResponse `json:"next_lesson,omitempty"`
}

type LessonNavigationResponse struct {
	ID        uuid.UUID               `json:"id"`
	TopicName localization.LocaleText `json:"topic_name"`
}

type LessonProgressData struct {
	ID         uuid.UUID                 `json:"id"`
	StepOrder  int16                     `json:"step_order"`
	Name       localization.LocaleText   `json:"name"`
	FirstTime  []int32                   `json:"first_time"`
	SecondTime []int32                   `json:"second_time"`
	ThirdTime  []int32                   `json:"third_time"`
	Content    []localization.LocaleText `json:"content"`
}

type PaginatedLessonsResponse struct {
	Data []LessonResponse `json:"data"`
	Meta PaginationMeta   `json:"meta"`
}

type LessonFilterOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type LessonUserFilterDataResponse struct {
	Types       []LessonFilterOption `json:"types"`
	Disciplines []LessonFilterOption `json:"disciplines"`
	Groups      []LessonFilterOption `json:"groups"`
}

type LessonProgressParams struct {
	ID         uuid.UUID                 `json:"id"`
	StepOrder  int16                     `json:"step_order"`
	Name       localization.LocaleText   `json:"name"`
	FirstTime  []int32                   `json:"first_time"`
	SecondTime []int32                   `json:"second_time"`
	ThirdTime  []int32                   `json:"third_time"`
	Content    []localization.LocaleText `json:"content"`
}

type UpdateLessonResourceRequest struct {
	ID   string                  `json:"id"`
	Name localization.LocaleText `json:"name"`
	Link string                  `json:"link"`
	Type string                  `json:"type"`
}

type UpdateLessonProgressRequest struct {
	ID         string                    `json:"id"`
	StepOrder  int16                     `json:"step_order"`
	Name       localization.LocaleText   `json:"name"`
	FirstTime  []int32                   `json:"first_time"`
	SecondTime []int32                   `json:"second_time"`
	ThirdTime  []int32                   `json:"third_time"`
	Content    []localization.LocaleText `json:"content"`
}

type UpdateLessonRequest struct {
	TopicName          localization.LocaleText       `json:"topic_name"`
	EventDate          string                        `json:"event_date"`
	Type               string                        `json:"type"`
	Goals              localization.LocaleText       `json:"goals"`
	Tasks              localization.LocaleText       `json:"tasks"`
	Expected           localization.LocaleText       `json:"expected"`
	InternetResources  []UpdateLessonResourceRequest `json:"internet_resources"`
	TechnicalResources []UpdateLessonResourceRequest `json:"technical_resources"`
	LessonProgress     []UpdateLessonProgressRequest `json:"lesson_progress"`
	SourceLanguage     string                        `json:"sourceLanguage"`
}

type GenerateLessonInput struct {
	RupID          uuid.UUID                `json:"rupId"`
	DisciplineID   uuid.UUID                `json:"disciplineId"`
	TopicID        uuid.UUID                `json:"topicId"`
	SourceLanguage string                   `json:"sourceLanguage"`
	EventDate      string                   `json:"event_date"`
	UpdatedTopic   GenerateLessonTopicInput `json:"updatedTopic"`
	Message        string                   `json:"message"`
}

type GenerateLessonTopicInput struct {
	Name            localization.LocaleText `json:"name"`
	Type            string                  `json:"type"`
	TotalHours      int32                   `json:"total_hours"`
	TheoryHours     int32                   `json:"theory_hours"`
	PracticeHours   int32                   `json:"practice_hours"`
	IndividualHours int32                   `json:"individual_hours"`
	SrspHours       int32                   `json:"srsp_hours"`
	SrsHours        int32                   `json:"srs_hours"`
}

type RegenerateLessonByIDInput struct {
	TopicName localization.LocaleText `json:"topic_name"`
	Type      string                  `json:"type"`
	EventDate string                  `json:"event_date"`
	Goals     localization.LocaleText `json:"goals"`
	Tasks     localization.LocaleText `json:"tasks"`
	Expected  localization.LocaleText `json:"expected"`
	Message   string                  `json:"message"`
}

type generatedLessonPlan struct {
	LessonType storage.EnumLessonType
	Goals      string
	Tasks      string
	Expected   string
	Progress   []GeneratedLessonProgressStep
}

type canonicalLessonStage struct {
	StepOrder      int16
	Name           localization.LocaleText
	FirstTime      int32
	SecondTime     int32
	ThirdTime      int32
	DefaultContent localization.LocaleText
}

type lessonDocumentProgressRow struct {
	Num     string `json:"num"`
	Name    string `json:"name"`
	Content string `json:"content"`
}

type lessonDocumentPayload struct {
	Language           string                      `json:"language,omitempty"`
	RupName            string                      `json:"rup_name"`
	DisciplineName     string                      `json:"discipline_name"`
	TopicName          string                      `json:"topic_name"`
	PlanNum            int32                       `json:"plan_num"`
	TeacherName        string                      `json:"teacher_name"`
	EventDate          string                      `json:"event_date"`
	Course             int32                       `json:"course"`
	GroupName          string                      `json:"group_name"`
	Type               string                      `json:"type"`
	Goals              string                      `json:"goals"`
	Tasks              string                      `json:"tasks"`
	Expected           string                      `json:"expected"`
	InternetResources  string                      `json:"internet_resources"`
	TechnicalResources string                      `json:"technical_resources"`
	LessonProgress     []lessonDocumentProgressRow `json:"lesson_progress"`
}

type generatedLessonDocument struct {
	FileName string
	Content  []byte
}

type LessonService struct {
	repo        repository.Lessons
	rupRepo     repository.RupRepository
	aiService   AIService
	translation TranslationService
	cfg         *config.DocumentRenderConfig
	httpClient  *http.Client
	docRender   *DocumentRenderClient
	fileStorage FileStorage
	log         *logrus.Logger
}

const (
	defaultLessonPlanNumber = int32(47)
	lessonVariantTotalMins  = int32(90)
)

var canonicalLessonStages = []canonicalLessonStage{
	{
		StepOrder:  1,
		Name:       localization.LocaleText{Ru: "Организационно-мотивационный момент", Kz: "Ұйымдастыру-мотивациялық кезең"},
		FirstTime:  5,
		SecondTime: 5,
		ThirdTime:  10,
		DefaultContent: localization.LocaleText{
			Ru: "Приветствие студентов, проверка посещаемости, мотивация к предстоящей деятельности.",
			Kz: "Білім алушылармен сәлемдесу, қатысуды тексеру, алдағы оқу әрекетіне ынталандыру.",
		},
	},
	{
		StepOrder:  2,
		Name:       localization.LocaleText{Ru: "Актуализация знаний", Kz: "Білімді өзектендіру"},
		FirstTime:  15,
		SecondTime: 10,
		ThirdTime:  20,
		DefaultContent: localization.LocaleText{
			Ru: "Повторение базовых знаний, умений и навыков; ввод в новую тему; инструктаж по технике безопасности (при необходимости).",
			Kz: "Негізгі білім, білік және дағдыларды қайталау; жаңа тақырыпқа кіріспе; қажет болған жағдайда қауіпсіздік техникасы бойынша нұсқаулық беру.",
		},
	},
	{
		StepOrder:  3,
		Name:       localization.LocaleText{Ru: "Формирование новых знаний и навыков", Kz: "Жаңа білім мен дағдыларды қалыптастыру"},
		FirstTime:  40,
		SecondTime: 40,
		ThirdTime:  30,
		DefaultContent: localization.LocaleText{
			Ru: "Выдача практических заданий; демонстрация выполнения; выполнение заданий; контроль, корректировка и помощь студентам при работе.",
			Kz: "Практикалық тапсырмаларды беру; орындау үлгісін көрсету; тапсырмаларды орындау; жұмыс барысында білім алушыларды бақылау, түзету және қолдау.",
		},
	},
	{
		StepOrder:  4,
		Name:       localization.LocaleText{Ru: "Закрепление новой темы", Kz: "Жаңа тақырыпты бекіту"},
		FirstTime:  15,
		SecondTime: 20,
		ThirdTime:  15,
		DefaultContent: localization.LocaleText{
			Ru: "Оформление отчета студентами по выполненной работе; сдача отчетов; обсуждение результатов.",
			Kz: "Орындалған жұмыс бойынша есепті рәсімдеу; есептерді тапсыру; нәтижелерді талқылау.",
		},
	},
	{
		StepOrder:  5,
		Name:       localization.LocaleText{Ru: "Рефлексия", Kz: "Рефлексия"},
		FirstTime:  7,
		SecondTime: 5,
		ThirdTime:  5,
		DefaultContent: localization.LocaleText{
			Ru: "Обсуждение: какие навыки приобретены, чему научились, что было полезно и что вызвало затруднения.",
			Kz: "Талқылау: қандай дағдылар қалыптасты, нені үйренді, не пайдалы болды және қандай қиындықтар кездесті.",
		},
	},
	{
		StepOrder:  6,
		Name:       localization.LocaleText{Ru: "Оценивание", Kz: "Бағалау"},
		FirstTime:  5,
		SecondTime: 7,
		ThirdTime:  7,
		DefaultContent: localization.LocaleText{
			Ru: "Проверка и оценка выполненных работ; комментарии преподавателя.",
			Kz: "Орындалған жұмыстарды тексеру және бағалау; оқытушының кері байланысы.",
		},
	},
	{
		StepOrder:  7,
		Name:       localization.LocaleText{Ru: "Домашнее задание", Kz: "Үй тапсырмасы"},
		FirstTime:  3,
		SecondTime: 3,
		ThirdTime:  3,
		DefaultContent: localization.LocaleText{
			Ru: "Задания для самостоятельного закрепления материала.",
			Kz: "Материалды өз бетінше бекітуге арналған тапсырмалар.",
		},
	},
}

func NewLessonService(
	repo repository.Lessons,
	rupRepo repository.RupRepository,
	aiService AIService,
	translationService TranslationService,
	cfg *config.DocumentRenderConfig,
	httpClient *http.Client,
	fileStorage FileStorage,
	logger *logrus.Logger,
) *LessonService {
	return &LessonService{
		repo:        repo,
		rupRepo:     rupRepo,
		aiService:   aiService,
		translation: translationService,
		cfg:         cfg,
		httpClient:  httpClient,
		docRender:   NewDocumentRenderClient(httpClient, cfg.ApiKey),
		fileStorage: fileStorage,
		log:         logger,
	}
}

func canonicalLessonProgress(_ storage.EnumLessonType, language string) []GeneratedLessonProgressStep {
	selectedLanguage := normalizeBackendLanguage(language)
	progress := make([]GeneratedLessonProgressStep, 0, len(canonicalLessonStages))

	for _, stage := range canonicalLessonStages {
		progress = append(progress, GeneratedLessonProgressStep{
			Name:       localeTextByLanguage(stage.Name, selectedLanguage),
			FirstTime:  stage.FirstTime,
			SecondTime: stage.SecondTime,
			ThirdTime:  stage.ThirdTime,
			Content: []string{
				localeTextByLanguage(stage.DefaultContent, selectedLanguage),
			},
		})
	}

	return progress
}

func canonicalLessonStageName(order int16) localization.LocaleText {
	for _, stage := range canonicalLessonStages {
		if stage.StepOrder == order {
			return stage.Name
		}
	}

	return localization.LocaleText{}
}

func canonicalLessonStageTimes(order int16) ([]int32, []int32, []int32) {
	for _, stage := range canonicalLessonStages {
		if stage.StepOrder == order {
			return []int32{stage.FirstTime}, []int32{stage.SecondTime}, []int32{stage.ThirdTime}
		}
	}

	return []int32{0}, []int32{0}, []int32{0}
}

func canonicalLessonStageDefaultContent(order int16) localization.LocaleText {
	for _, stage := range canonicalLessonStages {
		if stage.StepOrder == order {
			return stage.DefaultContent
		}
	}

	return localization.LocaleText{}
}

func canonicalLessonStepOrder(index int) int16 {
	return int16(index + 1)
}

func normalizeCanonicalLessonStepOrder(order int16, index int) int16 {
	if order >= 1 && order <= int16(len(canonicalLessonStages)) {
		return order
	}

	return canonicalLessonStepOrder(index)
}

func (s *LessonService) CreateLesson(ctx context.Context, params LessonParams) error {
	eventDate, eventDateValid, err := helpers.ParseTimeOptional(params.EventDate)
	if err != nil {
		return err
	}
	planNumber := normalizeLessonPlanNumber(params.PlanNumber)
	createParams := storage.CreateLessonsParams{
		RupName:            params.RupName.ToJSONB(),
		DisciplineName:     lessonLocalePtrToJSONB(params.DisciplineName),
		TopicName:          lessonLocalePtrToJSONB(params.TopicName),
		PlanNumber:         planNumber,
		Teacher:            params.TeacherID,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: eventDateValid},
		GroupID:            params.GroupID,
		Type:               storage.EnumLessonType(params.Type),
		Goals:              lessonLocalePtrToJSONB(params.Goals),
		Tasks:              lessonLocalePtrToJSONB(params.Tasks),
		Expected:           lessonLocalePtrToJSONB(params.Expected),
		InternetResources:  params.InternetResources,
		TechnicalResources: params.TechnicalResources,
	}
	_, err = s.repo.CreateLesson(ctx, createParams)
	return err
}

func (s *LessonService) GenerateLesson(ctx context.Context, teacherID uuid.UUID, input GenerateLessonInput) (uuid.UUID, error) {
	if err := validateGenerateLessonInput(input); err != nil {
		return uuid.Nil, err
	}

	rup, err := s.rupRepo.GetRupByID(ctx, input.RupID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get rup: %w", err)
	}
	if !containsUUID(rup.Disciplines, input.DisciplineID) {
		return uuid.Nil, fmt.Errorf("discipline %s is not attached to rup %s", input.DisciplineID, input.RupID)
	}

	discipline, err := s.rupRepo.GetDisciplineByID(ctx, input.DisciplineID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get discipline: %w", err)
	}
	if !containsUUID(discipline.Topics, input.TopicID) {
		return uuid.Nil, fmt.Errorf("topic %s is not attached to discipline %s", input.TopicID, input.DisciplineID)
	}

	selectedLanguage := normalizeBackendLanguage(input.SourceLanguage)
	if selectedLanguage == "" {
		if strings.TrimSpace(input.UpdatedTopic.Name.Kz) != "" && strings.TrimSpace(input.UpdatedTopic.Name.Ru) == "" {
			selectedLanguage = "kz"
		} else {
			selectedLanguage = "ru"
		}
	}

	topicType, err := parseDisciplineTopicType(input.UpdatedTopic.Type)
	if err != nil {
		return uuid.Nil, err
	}

	eventDate := time.Now().UTC()
	if strings.TrimSpace(input.EventDate) != "" {
		parsedEventDate, eventDateValid, parseErr := helpers.ParseTimeOptional(input.EventDate)
		if parseErr != nil {
			return uuid.Nil, fmt.Errorf("parse event_date: %w", parseErr)
		}
		if eventDateValid {
			eventDate = parsedEventDate
		}
	}

	if err := s.rupRepo.UpdateTopic(ctx, storage.UpdateDisciplineTopicParams{
		ID:              input.TopicID,
		Name:            input.UpdatedTopic.Name.ToJSONB(),
		Type:            topicType,
		TotalHours:      input.UpdatedTopic.TotalHours,
		TheoryHours:     input.UpdatedTopic.TheoryHours,
		PracticeHours:   input.UpdatedTopic.PracticeHours,
		IndividualHours: input.UpdatedTopic.IndividualHours,
		SrspHours:       input.UpdatedTopic.SrspHours,
		SrsHours:        input.UpdatedTopic.SrsHours,
	}); err != nil {
		return uuid.Nil, fmt.Errorf("update topic: %w", err)
	}

	updatedTopic, err := s.rupRepo.GetTopicByID(ctx, input.TopicID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get updated topic: %w", err)
	}

	group, err := s.resolvePrimaryGroup(ctx, rup)
	if err != nil {
		return uuid.Nil, err
	}

	exploration, err := s.resolveExplorationNote(ctx, rup)
	if err != nil {
		return uuid.Nil, err
	}

	internetResourceIDs, internetResources := s.resolveResources(ctx, exploration.InternetResources)
	technicalResourceIDs, technicalResources := s.resolveResources(ctx, exploration.TechnicalResources)

	recentLessons, err := s.repo.GetRecentLessonsByDiscipline(
		ctx,
		localeTextByLanguage(localization.LocaleTextFromJSONB(rup.Name), selectedLanguage),
		localeTextByLanguage(localization.LocaleTextFromJSONB(discipline.Name), selectedLanguage),
		3,
	)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get recent lessons: %w", err)
	}

	previousLessonNames := extractPreviousLessonNames(recentLessons, selectedLanguage)
	aiResult, err := s.aiService.GenerateLesson(ctx, GenerateLessonRequest{
		SourceLanguage:     selectedLanguage,
		RupName:            localeTextByLanguage(localization.LocaleTextFromJSONB(rup.Name), selectedLanguage),
		DisciplineName:     localeTextByLanguage(localization.LocaleTextFromJSONB(discipline.Name), selectedLanguage),
		TopicName:          localeTextByLanguage(localization.LocaleTextFromJSONB(updatedTopic.Name), selectedLanguage),
		TopicType:          string(updatedTopic.Type),
		TotalHours:         updatedTopic.TotalHours,
		TheoryHours:        updatedTopic.TheoryHours,
		PracticeHours:      updatedTopic.PracticeHours,
		IndividualHours:    updatedTopic.IndividualHours,
		SrspHours:          updatedTopic.SrspHours,
		SrsHours:           updatedTopic.SrsHours,
		GroupName:          group.Name,
		GroupSpecialty:     localeTextByLanguage(localization.LocaleTextFromJSONB(group.Specialty), selectedLanguage),
		GroupQualification: localeTextByLanguage(localization.LocaleTextFromJSONB(group.Qualification), selectedLanguage),
		ExplorationGoals:   localeTextByLanguage(localization.LocaleTextFromJSONB(exploration.Goals), selectedLanguage),
		Prerequisites:      localeTextByLanguage(localization.LocaleTextFromJSONB(exploration.Prerequisites), selectedLanguage),
		Postrequisites:     localeTextByLanguage(localization.LocaleTextFromJSONB(exploration.Postrequisites), selectedLanguage),
		InternetResources:  resourceStringsForPrompt(internetResources),
		TechnicalResources: resourceStringsForPrompt(technicalResources),
		PreviousLessons:    previousLessonNames,
		Message:            input.Message,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("generate lesson via ai: %w", err)
	}

	createdResourceIDs := make([]uuid.UUID, 0)
	uploadedObjectName := ""
	lessonID := uuid.Nil
	createdLesson := false
	generationCompleted := false
	defer func() {
		if generationCompleted {
			return
		}

		if uploadedObjectName != "" {
			if cleanupErr := s.fileStorage.DeleteFile(ctx, uploadedObjectName); cleanupErr != nil && s.log != nil {
				s.log.WithError(cleanupErr).WithField("object_name", uploadedObjectName).Warn("failed to cleanup generated lesson file")
			}
		}

		if createdLesson && lessonID != uuid.Nil {
			if cleanupErr := s.DeleteLesson(ctx, lessonID); cleanupErr != nil && s.log != nil {
				s.log.WithError(cleanupErr).WithField("lesson_id", lessonID).Warn("failed to cleanup generated lesson")
			}
		}

		for _, resourceID := range createdResourceIDs {
			if cleanupErr := s.rupRepo.DeleteResource(ctx, resourceID); cleanupErr != nil && s.log != nil {
				s.log.WithError(cleanupErr).WithField("resource_id", resourceID).Warn("failed to cleanup generated lesson resource")
			}
		}
	}()

	if generatedIDs, generated, persistErr := s.persistGeneratedResources(ctx, aiResult.InternetResources, selectedLanguage); persistErr != nil {
		return uuid.Nil, fmt.Errorf("persist generated internet resources: %w", persistErr)
	} else if len(generatedIDs) > 0 {
		createdResourceIDs = append(createdResourceIDs, generatedIDs...)
		internetResourceIDs = generatedIDs
		internetResources = generated
	}
	if generatedIDs, generated, persistErr := s.persistGeneratedResources(ctx, aiResult.TechnicalResources, selectedLanguage); persistErr != nil {
		return uuid.Nil, fmt.Errorf("persist generated technical resources: %w", persistErr)
	} else if len(generatedIDs) > 0 {
		createdResourceIDs = append(createdResourceIDs, generatedIDs...)
		technicalResourceIDs = generatedIDs
		technicalResources = generated
	}

	fallbackType := lessonTypeByTopic(*updatedTopic)
	generatedPlan, err := normalizeGeneratedLessonPlan(aiResult, fallbackType, selectedLanguage)
	if err != nil {
		return uuid.Nil, err
	}

	planNumber := defaultLessonPlanNumber
	if resolvedPlanNumber, planErr := s.resolveLessonPlanNumber(ctx, rup, updatedTopic.ID); planErr == nil {
		planNumber = resolvedPlanNumber
	} else if updatedTopic.LessonID.Valid {
		if existingLesson, getErr := s.repo.GetLessonByID(ctx, updatedTopic.LessonID.Bytes); getErr == nil {
			if existingLesson.PlanNumber > 0 {
				planNumber = existingLesson.PlanNumber
			}
		}
	}

	lessonTexts, err := s.buildBilingualLessonTexts(ctx, []string{
		generatedPlan.Goals,
		generatedPlan.Tasks,
		generatedPlan.Expected,
	}, selectedLanguage)
	if err != nil {
		return uuid.Nil, fmt.Errorf("translate lesson summary: %w", err)
	}
	goalsText := lessonTexts[0]
	tasksText := lessonTexts[1]
	expectedText := lessonTexts[2]

	lessonParams := storage.CreateLessonsParams{
		RupName:            rup.Name,
		DisciplineName:     discipline.Name,
		TopicName:          updatedTopic.Name,
		PlanNumber:         planNumber,
		Teacher:            teacherID,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: true},
		GroupID:            group.KeycloakID,
		Type:               generatedPlan.LessonType,
		Goals:              goalsText.ToJSONB(),
		Tasks:              tasksText.ToJSONB(),
		Expected:           expectedText.ToJSONB(),
		InternetResources:  internetResourceIDs,
		TechnicalResources: technicalResourceIDs,
	}

	lessonID, createdLesson, err = s.upsertGeneratedLesson(ctx, updatedTopic.LessonID, lessonParams, generatedPlan.Progress, selectedLanguage)
	if err != nil {
		return uuid.Nil, err
	}

	teacherName := ""
	teacher, teacherErr := s.rupRepo.GetUserByID(ctx, teacherID)
	if teacherErr == nil {
		teacherName = strings.TrimSpace(strings.TrimSpace(teacher.FirstName.String + " " + teacher.LastName.String))
	}
	if teacherName == "" {
		teacherName = localizedTeacherFallback(selectedLanguage)
	}

	documentPayload := buildLessonDocumentPayload(
		selectedLanguage,
		localeTextByLanguage(localization.LocaleTextFromJSONB(rup.Name), selectedLanguage),
		localeTextByLanguage(localization.LocaleTextFromJSONB(discipline.Name), selectedLanguage),
		localeTextByLanguage(localization.LocaleTextFromJSONB(updatedTopic.Name), selectedLanguage),
		lessonParams.PlanNumber,
		teacherName,
		eventDate,
		rup.Course,
		group.Name,
		generatedPlan,
		resourceStringsForDocument(internetResources),
		resourceStringsForDocument(technicalResources),
	)

	document, err := s.generateLessonViaPython(ctx, documentPayload)
	if err != nil {
		return uuid.Nil, err
	}

	objectName := buildLessonObjectName(
		lessonID,
		localeTextByLanguage(localization.LocaleTextFromJSONB(updatedTopic.Name), selectedLanguage),
	)
	if err := s.fileStorage.UploadFile(ctx, objectName, bytes.NewReader(document.Content), int64(len(document.Content))); err != nil {
		return uuid.Nil, fmt.Errorf("upload lesson to minio: %w", err)
	}
	uploadedObjectName = objectName

	if err := s.repo.UpdateLessonFileURL(ctx, lessonID, objectName); err != nil {
		return uuid.Nil, fmt.Errorf("update lesson file_url: %w", err)
	}

	if err := s.rupRepo.LinkLessonToTopic(ctx, input.TopicID, &lessonID); err != nil {
		return uuid.Nil, fmt.Errorf("link lesson to topic: %w", err)
	}

	generationCompleted = true
	return lessonID, nil
}

func (s *LessonService) upsertGeneratedLesson(
	ctx context.Context,
	linkedLessonID pgtype.UUID,
	lessonParams storage.CreateLessonsParams,
	progress []GeneratedLessonProgressStep,
	language string,
) (uuid.UUID, bool, error) {
	if linkedLessonID.Valid {
		lessonID := linkedLessonID.Bytes
		if _, err := s.repo.GetLessonByID(ctx, lessonID); err == nil {
			if err := s.repo.UpdateLesson(ctx, storage.UpdateLessonParams{
				ID:                 lessonID,
				RupName:            lessonParams.RupName,
				DisciplineName:     lessonParams.DisciplineName,
				TopicName:          lessonParams.TopicName,
				PlanNumber:         lessonParams.PlanNumber,
				EventDate:          lessonParams.EventDate,
				GroupID:            lessonParams.GroupID,
				Type:               lessonParams.Type,
				Goals:              lessonParams.Goals,
				Tasks:              lessonParams.Tasks,
				Expected:           lessonParams.Expected,
				InternetResources:  lessonParams.InternetResources,
				TechnicalResources: lessonParams.TechnicalResources,
			}); err != nil {
				return uuid.Nil, false, fmt.Errorf("update lesson: %w", err)
			}

			if err := s.replaceLessonProgress(ctx, lessonID, progress, language); err != nil {
				return uuid.Nil, false, err
			}

			return lessonID, false, nil
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, false, fmt.Errorf("get linked lesson: %w", err)
		}
	}

	lessonID, err := s.repo.CreateLesson(ctx, lessonParams)
	if err != nil {
		return uuid.Nil, false, fmt.Errorf("create lesson: %w", err)
	}

	if err := s.replaceLessonProgress(ctx, lessonID, progress, language); err != nil {
		if cleanupErr := s.DeleteLesson(ctx, lessonID); cleanupErr != nil && s.log != nil {
			s.log.WithError(cleanupErr).WithField("lesson_id", lessonID).Warn("failed to cleanup generated lesson after progress error")
		}
		return uuid.Nil, false, err
	}

	return lessonID, true, nil
}

func (s *LessonService) replaceLessonProgress(
	ctx context.Context,
	lessonID uuid.UUID,
	progress []GeneratedLessonProgressStep,
	language string,
) error {
	existingProgress, err := s.repo.GetLessonProgressByLessonID(ctx, lessonID)
	if err != nil {
		return fmt.Errorf("get lesson progress: %w", err)
	}

	for _, item := range existingProgress {
		if err := s.repo.DeleteLessonProgress(ctx, item.ID); err != nil {
			return fmt.Errorf("delete lesson progress: %w", err)
		}
	}

	for index, step := range progress {
		stepOrder := normalizeCanonicalLessonStepOrder(int16(index+1), index)
		sourceContent := make([]string, 0, len(step.Content))
		for _, item := range step.Content {
			item = strings.TrimSpace(item)
			if item != "" {
				sourceContent = append(sourceContent, item)
			}
		}
		if len(sourceContent) == 0 {
			sourceContent = []string{localeTextByLanguage(canonicalLessonStageDefaultContent(stepOrder), language)}
		}

		content, err := s.buildBilingualLessonContent(
			ctx,
			sourceContent,
			language,
			"содержание этапа поурочного плана колледжа",
			"Сохрани методический стиль и формат коротких инструкций для преподавателя и обучающихся.",
		)
		if err != nil {
			return fmt.Errorf("translate lesson progress content: %w", err)
		}

		firstTime, secondTime, thirdTime := canonicalLessonStageTimes(stepOrder)
		if err := s.repo.CreateLessonProgress(ctx, storage.CreateLessonProgressParams{
			StepOrder:  stepOrder,
			LessonID:   lessonID,
			Name:       canonicalLessonStageName(stepOrder).ToJSONB(),
			FirstTime:  firstTime,
			SecondTime: secondTime,
			ThirdTime:  thirdTime,
			Content:    localization.LocaleTextSliceToJSONB(content),
		}); err != nil {
			return fmt.Errorf("create lesson progress: %w", err)
		}
	}

	return nil
}

func (s *LessonService) UpdateLesson(ctx context.Context, id uuid.UUID, req UpdateLessonRequest) error {
	existingLesson, err := s.repo.GetLessonByID(ctx, id)
	if err != nil {
		return err
	}

	eventDate, eventDateValid, err := helpers.ParseTimeOptional(req.EventDate)
	if err != nil {
		return err
	}
	if !eventDateValid {
		eventDate = existingLesson.EventDate.Time
		eventDateValid = existingLesson.EventDate.Valid
	}

	lessonType := existingLesson.Type
	if candidate := strings.ToUpper(strings.TrimSpace(req.Type)); candidate != "" {
		switch candidate {
		case string(storage.EnumLessonTypePRACTICE), string(storage.EnumLessonTypeTHEORY):
			lessonType = storage.EnumLessonType(candidate)
		default:
			return fmt.Errorf("unsupported lesson type: %s", req.Type)
		}
	}

	internetResourceIDs, err := s.resolveManualLessonResources(ctx, req.InternetResources)
	if err != nil {
		return err
	}
	technicalResourceIDs, err := s.resolveManualLessonResources(ctx, req.TechnicalResources)
	if err != nil {
		return err
	}

	progress := manualProgressToLessonProgressParams(req.LessonProgress)

	topicName := req.TopicName.Normalized()
	if topicName.Ru == "" && topicName.Kz == "" {
		topicName = localization.LocaleTextFromJSONB(existingLesson.TopicName)
	}

	updateParams := storage.UpdateLessonParams{
		ID:                 id,
		RupName:            existingLesson.RupName,
		DisciplineName:     existingLesson.DisciplineName,
		TopicName:          topicName.ToJSONB(),
		PlanNumber:         existingLesson.PlanNumber,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: eventDateValid},
		GroupID:            existingLesson.GroupID,
		Type:               lessonType,
		Goals:              req.Goals.ToJSONB(),
		Tasks:              req.Tasks.ToJSONB(),
		Expected:           req.Expected.ToJSONB(),
		InternetResources:  internetResourceIDs,
		TechnicalResources: technicalResourceIDs,
	}
	if err := s.repo.UpdateLesson(ctx, updateParams); err != nil {
		return err
	}

	if len(progress) > 0 {
		if err := s.replaceManualLessonProgress(ctx, id, progress); err != nil {
			return err
		}
	}

	if err := s.regenerateStoredLessonDocument(ctx, id, req.SourceLanguage); err != nil {
		return err
	}

	return nil
}

func (s *LessonService) resolveManualLessonResources(
	ctx context.Context,
	resources []UpdateLessonResourceRequest,
) ([]uuid.UUID, error) {
	resourceIDs := make([]uuid.UUID, 0, len(resources))
	seen := make(map[uuid.UUID]struct{}, len(resources))

	for _, resource := range resources {
		name := resource.Name.Normalized()
		if name.Ru == "" && name.Kz == "" {
			continue
		}

		link := strings.TrimSpace(resource.Link)
		if parsedID, err := uuid.Parse(strings.TrimSpace(resource.ID)); err == nil && parsedID != uuid.Nil {
			existingResource, getErr := s.rupRepo.GetResourceByID(ctx, parsedID)
			if getErr == nil && manualResourceMatches(existingResource, name, link) {
				if _, exists := seen[parsedID]; !exists {
					seen[parsedID] = struct{}{}
					resourceIDs = append(resourceIDs, parsedID)
				}
				continue
			}
		}

		created, err := s.rupRepo.CreateResource(ctx, storage.CreateRupResourceParams{
			Name: name.ToJSONB(),
			Link: pgtype.Text{String: link, Valid: link != ""},
		})
		if err != nil {
			return nil, fmt.Errorf("create lesson resource: %w", err)
		}
		if _, exists := seen[created.ID]; !exists {
			seen[created.ID] = struct{}{}
			resourceIDs = append(resourceIDs, created.ID)
		}
	}

	return resourceIDs, nil
}

func manualResourceMatches(resource *storage.RupResource, name localization.LocaleText, link string) bool {
	if resource == nil {
		return false
	}

	existingName := localization.LocaleTextFromJSONB(resource.Name).Normalized()
	existingLink := strings.TrimSpace(resource.Link.String)
	if !resource.Link.Valid {
		existingLink = ""
	}

	return existingName == name.Normalized() && existingLink == strings.TrimSpace(link)
}

func manualProgressToLessonProgressParams(progress []UpdateLessonProgressRequest) []LessonProgressParams {
	result := make([]LessonProgressParams, 0, len(progress))
	for index, item := range progress {
		var id uuid.UUID
		if parsedID, err := uuid.Parse(strings.TrimSpace(item.ID)); err == nil {
			id = parsedID
		}

		result = append(result, LessonProgressParams{
			ID:         id,
			StepOrder:  normalizeCanonicalLessonStepOrder(item.StepOrder, index),
			Name:       item.Name.Normalized(),
			FirstTime:  item.FirstTime,
			SecondTime: item.SecondTime,
			ThirdTime:  item.ThirdTime,
			Content:    normalizeLocaleTextSlice(item.Content),
		})
	}

	return result
}

func normalizeLocaleTextSlice(values []localization.LocaleText) []localization.LocaleText {
	result := make([]localization.LocaleText, 0, len(values))
	for _, value := range values {
		normalized := value.Normalized()
		if normalized.Ru == "" && normalized.Kz == "" {
			continue
		}
		result = append(result, normalized)
	}
	return result
}

func (s *LessonService) replaceManualLessonProgress(
	ctx context.Context,
	lessonID uuid.UUID,
	progress []LessonProgressParams,
) error {
	existingProgress, err := s.repo.GetLessonProgressByLessonID(ctx, lessonID)
	if err != nil {
		return fmt.Errorf("get lesson progress: %w", err)
	}

	for _, item := range existingProgress {
		if err := s.repo.DeleteLessonProgress(ctx, item.ID); err != nil {
			return fmt.Errorf("delete lesson progress: %w", err)
		}
	}

	for index := range canonicalLessonStages {
		stepOrder := canonicalLessonStepOrder(index)
		var content []localization.LocaleText
		for _, item := range progress {
			if item.StepOrder == stepOrder {
				content = normalizeLocaleTextSlice(item.Content)
				break
			}
		}
		if len(content) == 0 {
			content = []localization.LocaleText{canonicalLessonStageDefaultContent(stepOrder)}
		}

		firstTime, secondTime, thirdTime := canonicalLessonStageTimes(stepOrder)
		if err := s.repo.CreateLessonProgress(ctx, storage.CreateLessonProgressParams{
			StepOrder:  stepOrder,
			LessonID:   lessonID,
			Name:       canonicalLessonStageName(stepOrder).ToJSONB(),
			FirstTime:  firstTime,
			SecondTime: secondTime,
			ThirdTime:  thirdTime,
			Content:    localization.LocaleTextSliceToJSONB(content),
		}); err != nil {
			return fmt.Errorf("create lesson progress: %w", err)
		}
	}

	return nil
}

func (s *LessonService) RegenerateLessonByID(
	ctx context.Context,
	lessonID uuid.UUID,
	teacherID uuid.UUID,
	input RegenerateLessonByIDInput,
) (uuid.UUID, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get lesson: %w", err)
	}

	if teacherID == uuid.Nil {
		teacherID = lesson.Teacher
	}

	topic, err := s.rupRepo.GetTopicByLessonID(ctx, lessonID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, fmt.Errorf("lesson %s is not linked to topic, regeneration is unavailable", lessonID)
		}
		return uuid.Nil, fmt.Errorf("get topic by lesson id: %w", err)
	}

	discipline, err := s.rupRepo.GetDisciplineByTopicID(ctx, topic.ID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get discipline by topic id: %w", err)
	}

	rup, err := s.rupRepo.GetRupByDisciplineID(ctx, discipline.ID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get rup by discipline id: %w", err)
	}

	topicName := input.TopicName
	if topicName.Ru == "" && topicName.Kz == "" {
		topicName = localization.LocaleTextFromJSONB(topic.Name)
	}

	topicType := mapLessonTypeToTopicType(input.Type, topic.Type)

	generateInput := GenerateLessonInput{
		RupID:        rup.ID,
		DisciplineID: discipline.ID,
		TopicID:      topic.ID,
		UpdatedTopic: GenerateLessonTopicInput{
			Name:            topicName,
			Type:            string(topicType),
			TotalHours:      topic.TotalHours,
			TheoryHours:     topic.TheoryHours,
			PracticeHours:   topic.PracticeHours,
			IndividualHours: topic.IndividualHours,
			SrspHours:       topic.SrspHours,
			SrsHours:        topic.SrsHours,
		},
		Message: buildRegenerationMessage(input),
	}

	return s.GenerateLesson(ctx, teacherID, generateInput)
}

func (s *LessonService) DeleteLesson(ctx context.Context, id uuid.UUID) error {
	if _, err := s.repo.GetLessonByID(ctx, id); err != nil {
		return err
	}

	topic, err := s.rupRepo.GetTopicByLessonID(ctx, id)
	if err == nil {
		if err := s.rupRepo.LinkLessonToTopic(ctx, topic.ID, nil); err != nil {
			return fmt.Errorf("unlink lesson from topic: %w", err)
		}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("get topic by lesson id: %w", err)
	}

	progress, err := s.repo.GetLessonProgressByLessonID(ctx, id)
	if err != nil {
		return err
	}
	for _, item := range progress {
		if err := s.repo.DeleteLessonProgress(ctx, item.ID); err != nil {
			return err
		}
	}
	return s.repo.DeleteLesson(ctx, id)
}

func (s *LessonService) GetAllLessons(
	ctx context.Context,
	currentPage int,
	pageSize int,
	teacher pgtype.UUID,
	id pgtype.UUID,
	search string,
	lessonTypes []string,
	disciplines []string,
	groupNames []string,
	sort string,
) (*PaginatedLessonsResponse, error) {
	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (currentPage - 1) * pageSize
	search = strings.TrimSpace(search)
	lessonTypes = normalizeNonEmptyStrings(lessonTypes)
	disciplines = normalizeNonEmptyStrings(disciplines)
	groupNames = normalizeNonEmptyStrings(groupNames)
	sort = strings.ToLower(strings.TrimSpace(sort))
	if sort != "asc" && sort != "desc" {
		sort = "desc"
	}

	total, err := s.repo.CountLessonsFiltered(ctx, search, teacher, id, lessonTypes, disciplines, groupNames)
	if err != nil {
		return nil, err
	}

	dbLessons, err := s.repo.GetLessons(ctx, search, teacher, id, lessonTypes, disciplines, groupNames, sort, int32(pageSize), int32(offset))
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	var result []LessonResponse
	for _, dbLesson := range dbLessons {
		lessonResp, buildErr := s.buildLessonResponse(ctx, dbLesson)
		if buildErr != nil {
			continue
		}
		result = append(result, *lessonResp)
	}

	return &PaginatedLessonsResponse{
		Data: result,
		Meta: PaginationMeta{
			CurrentPage: currentPage,
			Pages:       pages,
			Total:       int(total),
			PageSize:    pageSize,
		},
	}, nil
}

func (s *LessonService) GetLessonUserFilterData(ctx context.Context, teacher pgtype.UUID, locale string) (*LessonUserFilterDataResponse, error) {
	locale = strings.ToLower(strings.TrimSpace(locale))
	if locale != "kk" {
		locale = "ru"
	}

	rows, err := s.repo.GetLessonUserFilterData(ctx, teacher, locale)
	if err != nil {
		return nil, err
	}

	response := &LessonUserFilterDataResponse{
		Types:       []LessonFilterOption{},
		Disciplines: []LessonFilterOption{},
		Groups:      []LessonFilterOption{},
	}

	for _, row := range rows {
		value := strings.TrimSpace(row.Value)
		if value == "" {
			continue
		}

		option := LessonFilterOption{Value: value, Label: value}
		switch row.Filter {
		case "type":
			response.Types = append(response.Types, option)
		case "discipline":
			response.Disciplines = append(response.Disciplines, option)
		case "group":
			response.Groups = append(response.Groups, option)
		}
	}

	return response, nil
}

func (s *LessonService) GetLessonByID(ctx context.Context, id uuid.UUID) (*LessonResponse, error) {
	lesson, err := s.repo.GetLessonByID(ctx, id)
	if err != nil {
		return nil, err
	}

	response, err := s.buildLessonResponse(ctx, lesson)
	if err != nil {
		return nil, err
	}

	if previousLesson, err := s.repo.GetPreviousLessonByCreatedAt(ctx, lesson.CreatedAt, lesson.ID); err == nil {
		response.PreviousLesson = buildLessonNavigationResponse(previousLesson)
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("get previous lesson: %w", err)
	}

	if nextLesson, err := s.repo.GetNextLessonByCreatedAt(ctx, lesson.CreatedAt, lesson.ID); err == nil {
		response.NextLesson = buildLessonNavigationResponse(nextLesson)
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("get next lesson: %w", err)
	}

	return response, nil
}

func (s *LessonService) GetLessonDownloadURL(ctx context.Context, id uuid.UUID, language string) (string, error) {
	selectedLanguage := normalizeBackendLanguage(language)
	if selectedLanguage == "" {
		selectedLanguage = "ru"
	}
	sourceLanguage := oppositeBackendLanguage(selectedLanguage)
	if sourceLanguage == "" {
		sourceLanguage = "ru"
	}

	lesson, err := s.repo.GetLessonByID(ctx, id)
	if err != nil {
		return "", err
	}

	rupID, _, topicID, _ := s.resolveLessonLinks(ctx, id)

	planNumber := lesson.PlanNumber
	var course int32
	if rupID != nil {
		if rup, getErr := s.rupRepo.GetRupByID(ctx, *rupID); getErr == nil {
			course = rup.Course
			if topicID != nil {
				if resolvedPlanNumber, planErr := s.resolveLessonPlanNumber(ctx, rup, *topicID); planErr == nil {
					planNumber = resolvedPlanNumber
				}
			}
		}
	}

	teacherName := localizedTeacherFallback(selectedLanguage)
	if teacher, teacherErr := s.rupRepo.GetUserByID(ctx, lesson.Teacher); teacherErr == nil {
		resolvedTeacherName := strings.TrimSpace(strings.TrimSpace(teacher.FirstName.String + " " + teacher.LastName.String))
		if resolvedTeacherName != "" {
			teacherName = resolvedTeacherName
		}
	}

	groupName := ""
	if group, groupErr := s.rupRepo.GetGroupByKeycloakID(ctx, lesson.GroupID); groupErr == nil {
		groupName = strings.TrimSpace(group.Name)
	}

	progress, err := s.buildStoredLessonProgressForDocument(ctx, id, selectedLanguage, sourceLanguage, lesson.Type)
	if err != nil {
		return "", err
	}

	goals, err := s.resolveLocalizedLessonText(
		ctx,
		localization.LocaleTextFromJSONB(lesson.Goals),
		selectedLanguage,
		"цели поурочного плана колледжа",
		"Сохрани официальный методический стиль Республики Казахстан.",
	)
	if err != nil {
		return "", fmt.Errorf("translate lesson goals: %w", err)
	}
	tasks, err := s.resolveLocalizedLessonText(
		ctx,
		localization.LocaleTextFromJSONB(lesson.Tasks),
		selectedLanguage,
		"задачи поурочного плана колледжа",
		"Сохрани официальный методический стиль Республики Казахстан.",
	)
	if err != nil {
		return "", fmt.Errorf("translate lesson tasks: %w", err)
	}
	expected, err := s.resolveLocalizedLessonText(
		ctx,
		localization.LocaleTextFromJSONB(lesson.Expected),
		selectedLanguage,
		"ожидаемые результаты поурочного плана колледжа",
		"Сохрани официальный методический стиль Республики Казахстан.",
	)
	if err != nil {
		return "", fmt.Errorf("translate lesson expected results: %w", err)
	}

	internetResources, err := s.resolveLocalizedLessonResources(ctx, lesson.InternetResources, selectedLanguage)
	if err != nil {
		return "", fmt.Errorf("translate lesson internet resources: %w", err)
	}
	technicalResources, err := s.resolveLocalizedLessonResources(ctx, lesson.TechnicalResources, selectedLanguage)
	if err != nil {
		return "", fmt.Errorf("translate lesson technical resources: %w", err)
	}

	documentPayload := buildLessonDocumentPayload(
		selectedLanguage,
		localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.RupName), selectedLanguage),
		localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.DisciplineName), selectedLanguage),
		localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.TopicName), selectedLanguage),
		planNumber,
		teacherName,
		resolveLessonEventDate(lesson.EventDate),
		course,
		groupName,
		&generatedLessonPlan{
			LessonType: lesson.Type,
			Goals:      goals,
			Tasks:      tasks,
			Expected:   expected,
			Progress:   progress,
		},
		internetResources,
		technicalResources,
	)

	document, err := s.generateLessonViaPython(ctx, documentPayload)
	if err != nil {
		return "", err
	}

	objectName := buildLessonObjectName(
		id,
		localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.TopicName), selectedLanguage),
	)
	if err := s.fileStorage.UploadFile(ctx, objectName, bytes.NewReader(document.Content), int64(len(document.Content))); err != nil {
		return "", fmt.Errorf("upload lesson to minio: %w", err)
	}

	if err := s.repo.UpdateLessonFileURL(ctx, id, objectName); err != nil {
		return "", fmt.Errorf("update lesson file_url: %w", err)
	}

	return s.fileStorage.GetDownloadFileURL(ctx, objectName, 10*time.Minute)
}

func (s *LessonService) regenerateStoredLessonDocument(
	ctx context.Context,
	id uuid.UUID,
	language string,
) error {
	selectedLanguage := normalizeBackendLanguage(language)
	if selectedLanguage == "" {
		selectedLanguage = "ru"
	}
	sourceLanguage := oppositeBackendLanguage(selectedLanguage)
	if sourceLanguage == "" {
		sourceLanguage = "ru"
	}

	lesson, err := s.repo.GetLessonByID(ctx, id)
	if err != nil {
		return fmt.Errorf("get lesson: %w", err)
	}

	rupID, _, topicID, _ := s.resolveLessonLinks(ctx, id)

	planNumber := lesson.PlanNumber
	var course int32
	if rupID != nil {
		if rup, getErr := s.rupRepo.GetRupByID(ctx, *rupID); getErr == nil {
			course = rup.Course
			if topicID != nil {
				if resolvedPlanNumber, planErr := s.resolveLessonPlanNumber(ctx, rup, *topicID); planErr == nil {
					planNumber = resolvedPlanNumber
				}
			}
		}
	}

	teacherName := localizedTeacherFallback(selectedLanguage)
	if teacher, teacherErr := s.rupRepo.GetUserByID(ctx, lesson.Teacher); teacherErr == nil {
		resolvedTeacherName := strings.TrimSpace(strings.TrimSpace(teacher.FirstName.String + " " + teacher.LastName.String))
		if resolvedTeacherName != "" {
			teacherName = resolvedTeacherName
		}
	}

	groupName := ""
	if group, groupErr := s.rupRepo.GetGroupByKeycloakID(ctx, lesson.GroupID); groupErr == nil {
		groupName = strings.TrimSpace(group.Name)
	}

	progress, err := s.buildStoredLessonProgressForDocument(ctx, id, selectedLanguage, sourceLanguage, lesson.Type)
	if err != nil {
		return err
	}

	documentPayload := buildLessonDocumentPayload(
		selectedLanguage,
		localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.RupName), selectedLanguage),
		localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.DisciplineName), selectedLanguage),
		localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.TopicName), selectedLanguage),
		planNumber,
		teacherName,
		resolveLessonEventDate(lesson.EventDate),
		course,
		groupName,
		&generatedLessonPlan{
			LessonType: lesson.Type,
			Goals:      localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.Goals), selectedLanguage),
			Tasks:      localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.Tasks), selectedLanguage),
			Expected:   localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.Expected), selectedLanguage),
			Progress:   progress,
		},
		s.resourceStringsFromIDs(ctx, lesson.InternetResources, selectedLanguage),
		s.resourceStringsFromIDs(ctx, lesson.TechnicalResources, selectedLanguage),
	)

	document, err := s.generateLessonViaPython(ctx, documentPayload)
	if err != nil {
		return fmt.Errorf("generate lesson document: %w", err)
	}

	objectName := buildLessonObjectName(
		id,
		localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.TopicName), selectedLanguage),
	)
	if err := s.fileStorage.UploadFile(ctx, objectName, bytes.NewReader(document.Content), int64(len(document.Content))); err != nil {
		return fmt.Errorf("upload lesson to minio: %w", err)
	}

	if err := s.repo.UpdateLessonFileURL(ctx, id, objectName); err != nil {
		return fmt.Errorf("update lesson file_url: %w", err)
	}

	return nil
}

func (s *LessonService) buildStoredLessonProgressForDocument(
	ctx context.Context,
	lessonID uuid.UUID,
	selectedLanguage string,
	sourceLanguage string,
	lessonType storage.EnumLessonType,
) ([]GeneratedLessonProgressStep, error) {
	lessonProgressRows, err := s.repo.GetLessonProgressByLessonID(ctx, lessonID)
	if err != nil {
		return nil, fmt.Errorf("get lesson progress: %w", err)
	}

	progress := canonicalLessonProgress(lessonType, selectedLanguage)
	rowsByOrder := make(map[int16]storage.LessonProgress, len(lessonProgressRows))
	for _, row := range lessonProgressRows {
		rowsByOrder[row.StepOrder] = row
	}

	for index := range progress {
		stepOrder := canonicalLessonStepOrder(index)
		row, exists := rowsByOrder[stepOrder]
		if !exists {
			continue
		}

		contentValue := localization.LocaleTextSliceFromJSONB(row.Content)
		content := localizedLessonContentToStrings(contentValue, selectedLanguage)
		if len(content) == 0 {
			content = localizedLessonContentToStrings(contentValue, sourceLanguage)
		}
		if len(content) == 0 {
			content = progress[index].Content
		}

		progress[index].Content = content
	}

	return progress, nil
}

func (s *LessonService) resourceStringsFromIDs(
	ctx context.Context,
	ids []uuid.UUID,
	language string,
) []string {
	resources := make([]string, 0, len(ids))
	for _, id := range ids {
		resource, err := s.rupRepo.GetResourceByID(ctx, id)
		if err != nil {
			continue
		}

		name := strings.TrimSpace(localeTextByLanguage(localization.LocaleTextFromJSONB(resource.Name), language))
		if name == "" {
			continue
		}

		link := strings.TrimSpace(resource.Link.String)
		if link != "" {
			resources = append(resources, fmt.Sprintf("%s — %s", name, link))
			continue
		}
		resources = append(resources, name)
	}

	return resources
}

func (s *LessonService) CreateLessonProgress(ctx context.Context, params LessonProgressParams, lessonID uuid.UUID) error {
	stepOrder := normalizeCanonicalLessonStepOrder(params.StepOrder, 0)
	firstTime, secondTime, thirdTime := canonicalLessonStageTimes(stepOrder)
	content := normalizeLocaleTextSlice(params.Content)
	if len(content) == 0 {
		content = []localization.LocaleText{canonicalLessonStageDefaultContent(stepOrder)}
	}
	createParams := storage.CreateLessonProgressParams{
		StepOrder:  stepOrder,
		LessonID:   lessonID,
		Name:       canonicalLessonStageName(stepOrder).ToJSONB(),
		FirstTime:  firstTime,
		SecondTime: secondTime,
		ThirdTime:  thirdTime,
		Content:    localization.LocaleTextSliceToJSONB(content),
	}
	return s.repo.CreateLessonProgress(ctx, createParams)
}

func (s *LessonService) GetLessonProgressByID(ctx context.Context, id uuid.UUID) (storage.LessonProgress, error) {
	return s.repo.GetLessonProgressByID(ctx, id)
}

func (s *LessonService) GetLessonProgressByLessonID(ctx context.Context, lessonID uuid.UUID) ([]storage.LessonProgress, error) {
	return s.repo.GetLessonProgressByLessonID(ctx, lessonID)
}

func (s *LessonService) resolvePrimaryGroup(ctx context.Context, rup *storage.Rup) (*storage.Group, error) {
	if len(rup.GroupIds) == 0 {
		return nil, fmt.Errorf("rup has no groups")
	}

	groupID, err := uuid.Parse(rup.GroupIds[0])
	if err != nil {
		return nil, fmt.Errorf("invalid group id in rup: %w", err)
	}

	group, err := s.rupRepo.GetGroupByKeycloakID(ctx, groupID)
	if err != nil {
		return nil, fmt.Errorf("get group by id: %w", err)
	}
	return group, nil
}

func (s *LessonService) resolveExplorationNote(ctx context.Context, rup *storage.Rup) (*storage.RupExplorationNote, error) {
	if !rup.ExplorationNoteID.Valid {
		return nil, fmt.Errorf("rup does not contain exploration note")
	}

	exploration, err := s.rupRepo.GetExplorationNoteByID(ctx, rup.ExplorationNoteID.Bytes)
	if err != nil {
		return nil, fmt.Errorf("get exploration note: %w", err)
	}
	return exploration, nil
}

func (s *LessonService) resolveResources(ctx context.Context, ids []uuid.UUID) ([]uuid.UUID, []GeneratedResource) {
	resourceIDs := make([]uuid.UUID, 0, len(ids))
	resources := make([]GeneratedResource, 0, len(ids))

	for _, id := range ids {
		resource, err := s.rupRepo.GetResourceByID(ctx, id)
		if err != nil {
			continue
		}

		resourceIDs = append(resourceIDs, id)
		name := strings.TrimSpace(localePrimary(resource.Name))
		if name != "" {
			resources = append(resources, GeneratedResource{
				Name: name,
				Link: strings.TrimSpace(resource.Link.String),
			})
		}
	}

	return resourceIDs, resources
}

func (s *LessonService) resolveLocalizedLessonResources(
	ctx context.Context,
	ids []uuid.UUID,
	language string,
) ([]string, error) {
	resources := make([]string, 0, len(ids))

	for _, id := range ids {
		resource, err := s.rupRepo.GetResourceByID(ctx, id)
		if err != nil {
			continue
		}

		name, err := s.resolveLocalizedLessonText(
			ctx,
			localization.LocaleTextFromJSONB(resource.Name),
			language,
			"название ресурса поурочного плана колледжа",
			"Сохрани краткость и терминологию учебного ресурса.",
		)
		if err != nil && s.log != nil {
			s.log.WithError(err).WithField("resource_id", id.String()).Warn("failed to localize lesson resource name")
		}
		if err != nil {
			return nil, err
		}
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}

		link := strings.TrimSpace(resource.Link.String)
		if link != "" {
			resources = append(resources, fmt.Sprintf("%s — %s", name, link))
			continue
		}

		resources = append(resources, name)
	}

	return resources, nil
}

func (s *LessonService) resolveLocalizedLessonText(
	ctx context.Context,
	value localization.LocaleText,
	targetLanguage string,
	domain string,
	additionalPrompt string,
) (string, error) {
	if selected := localeValueByLanguage(value, targetLanguage); selected != "" {
		return selected, nil
	}

	sourceLanguage := oppositeBackendLanguage(targetLanguage)
	sourceText := localeValueByLanguage(value, sourceLanguage)
	if sourceText == "" {
		sourceText = strings.TrimSpace(value.Ru)
		if sourceText == "" {
			sourceText = strings.TrimSpace(value.Kz)
		}
	}
	if sourceText == "" {
		return "", nil
	}

	if sourceLanguage == "" || sourceLanguage == targetLanguage {
		return sourceText, nil
	}

	translatedText, err := s.translateLessonText(ctx, sourceText, sourceLanguage, targetLanguage)
	if err != nil {
		if s.log != nil {
			s.log.WithError(err).WithFields(logrus.Fields{
				"source_language": sourceLanguage,
				"target_language": targetLanguage,
				"domain":          domain,
			}).Warn("failed to translate lesson text")
		}
		return sourceText, err
	}

	return strings.TrimSpace(translatedText), nil
}

func (s *LessonService) translateLessonText(
	ctx context.Context,
	text string,
	sourceLanguage string,
	targetLanguage string,
) (string, error) {
	translated, err := s.translateLessonTexts(ctx, []string{text}, sourceLanguage, targetLanguage)
	if err != nil {
		return "", err
	}
	if len(translated) == 0 {
		return "", nil
	}
	return translated[0], nil
}

func (s *LessonService) translateLessonTexts(
	ctx context.Context,
	texts []string,
	sourceLanguage string,
	targetLanguage string,
) ([]string, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	sourceLanguage = normalizeBackendLanguage(sourceLanguage)
	targetLanguage = normalizeBackendLanguage(targetLanguage)
	if sourceLanguage == "" || targetLanguage == "" || sourceLanguage == targetLanguage {
		return append([]string(nil), texts...), nil
	}
	if s.translation == nil {
		return nil, fmt.Errorf("translation service is not configured")
	}

	translatedTexts, err := s.translation.TranslateBatch(ctx, TranslateBatchRequest{
		Texts:          texts,
		SourceLanguage: sourceLanguage,
		TargetLanguage: targetLanguage,
		Domain:         "lesson",
	})
	if err != nil {
		return nil, err
	}
	if len(translatedTexts) != len(texts) {
		return nil, fmt.Errorf("translation response count mismatch: got %d, want %d", len(translatedTexts), len(texts))
	}

	return translatedTexts, nil
}

func (s *LessonService) buildBilingualLessonText(
	ctx context.Context,
	text string,
	sourceLanguage string,
	domain string,
	additionalPrompt string,
) (localization.LocaleText, error) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return localization.LocaleText{}, nil
	}

	selectedLanguage := normalizeBackendLanguage(sourceLanguage)
	if selectedLanguage == "" {
		selectedLanguage = "ru"
	}

	value := setLocaleValueByLanguage(localization.LocaleText{}, selectedLanguage, trimmed)
	targetLanguage := oppositeBackendLanguage(selectedLanguage)
	if targetLanguage == "" {
		return value, nil
	}

	translatedText, err := s.translateLessonText(ctx, trimmed, selectedLanguage, targetLanguage)
	if err != nil {
		if s.log != nil {
			s.log.WithError(err).WithFields(logrus.Fields{
				"source_language": selectedLanguage,
				"target_language": targetLanguage,
				"domain":          domain,
			}).Warn("failed to build bilingual lesson text")
		}
		return value, err
	}

	return setLocaleValueByLanguage(value, targetLanguage, strings.TrimSpace(translatedText)), nil
}

func (s *LessonService) buildBilingualLessonTexts(
	ctx context.Context,
	texts []string,
	sourceLanguage string,
) ([]localization.LocaleText, error) {
	selectedLanguage := normalizeBackendLanguage(sourceLanguage)
	if selectedLanguage == "" {
		selectedLanguage = "ru"
	}

	targetLanguage := oppositeBackendLanguage(selectedLanguage)
	result := make([]localization.LocaleText, len(texts))
	pendingTexts := make([]string, 0, len(texts))
	pendingIndexes := make([]int, 0, len(texts))

	for i, text := range texts {
		trimmed := strings.TrimSpace(text)
		if trimmed == "" {
			continue
		}
		result[i] = setLocaleValueByLanguage(localization.LocaleText{}, selectedLanguage, trimmed)
		if targetLanguage == "" {
			continue
		}
		pendingTexts = append(pendingTexts, trimmed)
		pendingIndexes = append(pendingIndexes, i)
	}

	if len(pendingTexts) == 0 || targetLanguage == "" {
		return result, nil
	}

	translatedTexts, err := s.translateLessonTexts(ctx, pendingTexts, selectedLanguage, targetLanguage)
	if err != nil {
		return result, err
	}
	for i, translatedText := range translatedTexts {
		index := pendingIndexes[i]
		result[index] = setLocaleValueByLanguage(result[index], targetLanguage, strings.TrimSpace(translatedText))
	}

	return result, nil
}

func (s *LessonService) buildBilingualLessonContent(
	ctx context.Context,
	lines []string,
	sourceLanguage string,
	domain string,
	additionalPrompt string,
) ([]localization.LocaleText, error) {
	if len(lines) == 0 {
		return nil, nil
	}

	translatedTexts, err := s.buildBilingualLessonTexts(ctx, lines, sourceLanguage)
	if err != nil {
		if s.log != nil {
			s.log.WithError(err).WithField("domain", domain).Warn("failed to build bilingual lesson content")
		}
		return nil, err
	}

	result := make([]localization.LocaleText, 0, len(translatedTexts))
	for _, item := range translatedTexts {
		if item.Ru == "" && item.Kz == "" {
			continue
		}
		result = append(result, item)
	}

	return result, nil
}

func localizedLessonContentToStrings(content []localization.LocaleText, language string) []string {
	if len(content) == 0 {
		return nil
	}

	lines := make([]string, 0, len(content))
	for _, item := range content {
		value := strings.TrimSpace(localeTextByLanguage(item, language))
		if value == "" {
			continue
		}
		lines = append(lines, value)
	}

	return lines
}

func localizedLessonContentHasLanguage(content []localization.LocaleText, language string) bool {
	for _, item := range content {
		if strings.TrimSpace(localeValueByLanguage(item, language)) != "" {
			return true
		}
	}

	return false
}

func (s *LessonService) resolveLessonPlanNumber(
	ctx context.Context,
	rup *storage.Rup,
	topicID uuid.UUID,
) (int32, error) {
	if rup == nil {
		return 0, fmt.Errorf("rup is nil")
	}
	if topicID == uuid.Nil {
		return 0, fmt.Errorf("topic id is empty")
	}

	sequence := int32(1)
	for _, disciplineID := range rup.Disciplines {
		discipline, err := s.rupRepo.GetDisciplineByID(ctx, disciplineID)
		if err != nil {
			return 0, fmt.Errorf("get discipline by id: %w", err)
		}

		for _, currentTopicID := range discipline.Topics {
			if currentTopicID == topicID {
				return sequence, nil
			}
			sequence++
		}
	}

	return 0, fmt.Errorf("topic %s is not attached to rup %s", topicID, rup.ID)
}

func (s *LessonService) persistGeneratedResources(
	ctx context.Context,
	generated []GeneratedResource,
	language string,
) ([]uuid.UUID, []GeneratedResource, error) {
	if len(generated) == 0 {
		return nil, nil, nil
	}

	type normalizedResource struct {
		name string
		link string
	}

	normalized := make([]normalizedResource, 0, len(generated))
	seen := make(map[string]struct{}, len(generated))

	for _, item := range generated {
		name := strings.TrimSpace(item.Name)
		if isPlaceholderValue(name) {
			continue
		}

		link := strings.TrimSpace(item.Link)
		if isPlaceholderValue(link) {
			link = ""
		}

		key := strings.ToLower(name + "|" + link)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, normalizedResource{name: name, link: link})
	}

	if len(normalized) == 0 {
		return nil, nil, nil
	}

	names := make([]string, 0, len(normalized))
	for _, item := range normalized {
		names = append(names, item.name)
	}
	localizedNames, err := s.buildBilingualLessonTexts(ctx, names, language)
	if err != nil {
		return nil, nil, err
	}

	createdIDs := make([]uuid.UUID, 0, len(normalized))
	createdResources := make([]GeneratedResource, 0, len(normalized))
	for i, item := range normalized {
		localizedName := localizedNames[i]

		resource, err := s.rupRepo.CreateResource(ctx, storage.CreateRupResourceParams{
			Name: localizedName.ToJSONB(),
			Link: pgtype.Text{String: item.link, Valid: item.link != ""},
		})
		if err != nil {
			if s.log != nil {
				s.log.WithError(err).WithField("resource_name", item.name).Warn("failed to persist generated lesson resource")
			}
			continue
		}

		createdIDs = append(createdIDs, resource.ID)
		createdResources = append(createdResources, GeneratedResource{
			Name: strings.TrimSpace(localeTextByLanguage(localization.LocaleTextFromJSONB(resource.Name), language)),
			Link: strings.TrimSpace(resource.Link.String),
		})
	}

	return createdIDs, createdResources, nil
}

func (s *LessonService) generateLessonViaPython(ctx context.Context, payload lessonDocumentPayload) (*generatedLessonDocument, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal lesson payload: %w", err)
	}

	endpoint := strings.TrimRight(s.cfg.Url, "/") + "/generate-lesson"
	resp, err := s.docRender.PostJSON(ctx, endpoint, body)
	if err != nil {
		return nil, fmt.Errorf("send lesson to document rendering: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(resp.Body)
		location := strings.TrimSpace(resp.Header.Get("Location"))
		if location != "" {
			return nil, fmt.Errorf(
				"document rendering lesson error: status=%d location=%s body=%s",
				resp.StatusCode,
				location,
				strings.TrimSpace(string(errBody)),
			)
		}
		return nil, fmt.Errorf(
			"document rendering lesson error: status=%d body=%s",
			resp.StatusCode,
			strings.TrimSpace(string(errBody)),
		)
	}

	fileBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read lesson file bytes: %w", err)
	}

	return &generatedLessonDocument{
		FileName: extractFileNameFromDisposition(resp.Header.Get("Content-Disposition")),
		Content:  fileBytes,
	}, nil
}

func parseDisciplineTopicType(value string) (storage.DisciplineTopicType, error) {
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "SNZ":
		return storage.DisciplineTopicTypeSNZ, nil
	case "PRACTICAL", "PRACTICE":
		return storage.DisciplineTopicTypePRACTICAL, nil
	case "COMBINED", "THEORY":
		return storage.DisciplineTopicTypeCOMBINED, nil
	default:
		return "", fmt.Errorf("unsupported topic type: %s", value)
	}
}

func mapLessonTypeToTopicType(lessonType string, fallback storage.DisciplineTopicType) storage.DisciplineTopicType {
	switch strings.ToUpper(strings.TrimSpace(lessonType)) {
	case string(storage.EnumLessonTypePRACTICE):
		return storage.DisciplineTopicTypePRACTICAL
	case string(storage.EnumLessonTypeTHEORY):
		return storage.DisciplineTopicTypeCOMBINED
	default:
		return fallback
	}
}

func buildRegenerationMessage(input RegenerateLessonByIDInput) string {
	if message := strings.TrimSpace(input.Message); message != "" {
		return message
	}

	parts := make([]string, 0, 4)
	if goals := strings.TrimSpace(localePrimaryText(input.Goals)); goals != "" {
		parts = append(parts, "Сфокусируйся на целях: "+goals)
	}
	if tasks := strings.TrimSpace(localePrimaryText(input.Tasks)); tasks != "" {
		parts = append(parts, "Учти задачи: "+tasks)
	}
	if expected := strings.TrimSpace(localePrimaryText(input.Expected)); expected != "" {
		parts = append(parts, "Ожидаемые результаты: "+expected)
	}
	if eventDate := strings.TrimSpace(input.EventDate); eventDate != "" {
		parts = append(parts, "Планируемая дата проведения: "+eventDate)
	}

	return strings.Join(parts, "\n")
}

func lessonTypeByTopic(topic storage.DisciplineTopic) storage.EnumLessonType {
	if topic.Type == storage.DisciplineTopicTypePRACTICAL || topic.PracticeHours > topic.TheoryHours {
		return storage.EnumLessonTypePRACTICE
	}
	return storage.EnumLessonTypeTHEORY
}

func normalizeGeneratedLessonPlan(
	aiResult *GenerateLessonResponse,
	fallbackType storage.EnumLessonType,
	sourceLanguage string,
) (*generatedLessonPlan, error) {
	if aiResult == nil {
		return nil, fmt.Errorf("empty ai response")
	}

	lessonType := fallbackType
	switch strings.ToUpper(strings.TrimSpace(aiResult.Type)) {
	case string(storage.EnumLessonTypePRACTICE):
		lessonType = storage.EnumLessonTypePRACTICE
	case string(storage.EnumLessonTypeTHEORY):
		lessonType = storage.EnumLessonTypeTHEORY
	}

	goals := strings.TrimSpace(aiResult.Goals)
	if goals == "" {
		return nil, fmt.Errorf("ai response validation failed: goals is empty")
	}
	tasks := strings.TrimSpace(aiResult.Tasks)
	if tasks == "" {
		return nil, fmt.Errorf("ai response validation failed: tasks is empty")
	}
	expected := strings.TrimSpace(aiResult.Expected)
	if expected == "" {
		return nil, fmt.Errorf("ai response validation failed: expected is empty")
	}

	progress := canonicalLessonProgress(lessonType, sourceLanguage)
	for index := range progress {
		if index >= len(aiResult.LessonProgress) {
			continue
		}

		content := make([]string, 0, len(aiResult.LessonProgress[index].Content))
		for _, item := range aiResult.LessonProgress[index].Content {
			item = strings.TrimSpace(item)
			if item != "" {
				content = append(content, item)
			}
		}
		if len(content) > 0 {
			progress[index].Content = content
		}
	}

	return &generatedLessonPlan{
		LessonType: lessonType,
		Goals:      goals,
		Tasks:      tasks,
		Expected:   expected,
		Progress:   progress,
	}, nil
}

func defaultLessonProgress(lessonType storage.EnumLessonType, language string) []GeneratedLessonProgressStep {
	return canonicalLessonProgress(lessonType, language)
}

func buildLessonDocumentPayload(
	language string,
	rupName string,
	disciplineName string,
	topicName string,
	planNumber int32,
	teacherName string,
	eventDate time.Time,
	course int32,
	groupName string,
	plan *generatedLessonPlan,
	internetResources []string,
	technicalResources []string,
) lessonDocumentPayload {
	rows := make([]lessonDocumentProgressRow, 0, len(plan.Progress))
	for i, step := range plan.Progress {
		rows = append(rows, lessonDocumentProgressRow{
			Num:     fmt.Sprintf("%d", i+1),
			Name:    formatLessonProgressName(step, language),
			Content: strings.Join(step.Content, "\n"),
		})
	}

	return lessonDocumentPayload{
		Language:           language,
		RupName:            rupName,
		DisciplineName:     disciplineName,
		TopicName:          topicName,
		PlanNum:            planNumber,
		TeacherName:        teacherName,
		EventDate:          formatLessonEventDate(eventDate, language),
		Course:             course,
		GroupName:          groupName,
		Type:               formatLessonTypeLabel(plan.LessonType, language),
		Goals:              plan.Goals,
		Tasks:              plan.Tasks,
		Expected:           plan.Expected,
		InternetResources:  joinResourceList(internetResources),
		TechnicalResources: joinResourceList(technicalResources),
		LessonProgress:     rows,
	}
}

func formatLessonEventDate(value time.Time, language string) string {
	months := map[string][]string{
		"ru": {
			"января",
			"февраля",
			"марта",
			"апреля",
			"мая",
			"июня",
			"июля",
			"августа",
			"сентября",
			"октября",
			"ноября",
			"декабря",
		},
		"kz": {
			"қаңтар",
			"ақпан",
			"наурыз",
			"сәуір",
			"мамыр",
			"маусым",
			"шілде",
			"тамыз",
			"қыркүйек",
			"қазан",
			"қараша",
			"желтоқсан",
		},
	}

	selectedLanguage := normalizeBackendLanguage(language)
	if selectedLanguage == "" {
		selectedLanguage = "ru"
	}

	monthNames := months[selectedLanguage]
	month := monthNames[int(value.Month())-1]
	suffix := "г."
	if selectedLanguage == "kz" {
		suffix = "ж."
	}

	return fmt.Sprintf("«%02d» %s %d %s", value.Day(), month, value.Year(), suffix)
}

func formatLessonProgressName(step GeneratedLessonProgressStep, _ string) string {
	return fmt.Sprintf("%s\n%d/%d/%dмин.", step.Name, step.FirstTime, step.SecondTime, step.ThirdTime)
}

func formatLessonTypeLabel(lessonType storage.EnumLessonType, language string) string {
	if normalizeBackendLanguage(language) == "kz" {
		if lessonType == storage.EnumLessonTypePRACTICE {
			return "Зертханалық-практикалық"
		}
		return "Теориялық"
	}

	if lessonType == storage.EnumLessonTypePRACTICE {
		return "Лабораторно-практическая"
	}

	return "Теоретический"
}

func joinResourceList(resources []string) string {
	if len(resources) == 0 {
		return "-"
	}

	var lines []string
	for i, item := range resources {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		lines = append(lines, fmt.Sprintf("%d) %s", i+1, item))
	}

	if len(lines) == 0 {
		return "-"
	}

	return strings.Join(lines, "\n")
}

func firstProgressMinute(values []int32) int32 {
	if len(values) == 0 {
		return 0
	}

	return values[0]
}

func normalizeLessonPlanNumber(planNumber *int32) int32 {
	resolvedPlanNumber := defaultLessonPlanNumber
	if planNumber != nil && *planNumber > 0 {
		resolvedPlanNumber = *planNumber
	}
	return resolvedPlanNumber
}

func normalizeProgressTriples(params LessonProgressParams) ([]int32, []int32, []int32) {
	firstTime := params.FirstTime
	secondTime := params.SecondTime
	thirdTime := params.ThirdTime

	// Backward compatibility with old payload fields.
	if len(firstTime) == 0 {
		firstTime = []int32{0}
	}
	if len(secondTime) == 0 {
		secondTime = []int32{0}
	}
	if len(thirdTime) == 0 {
		thirdTime = []int32{0}
	}

	return firstTime, secondTime, thirdTime
}

func lessonLocalePtrToJSONB(value *localization.LocaleText) []byte {
	if value == nil {
		return localization.LocaleText{}.ToJSONB()
	}

	return value.ToJSONB()
}

func localePrimary(raw []byte) string {
	value := localization.LocaleTextFromJSONB(raw)
	if strings.TrimSpace(value.Ru) != "" {
		return strings.TrimSpace(value.Ru)
	}
	return strings.TrimSpace(value.Kz)
}

func localePrimaryText(value localization.LocaleText) string {
	if strings.TrimSpace(value.Ru) != "" {
		return strings.TrimSpace(value.Ru)
	}
	return strings.TrimSpace(value.Kz)
}

func localizedTeacherFallback(language string) string {
	if normalizeBackendLanguage(language) == "kz" {
		return "Оқытушы"
	}

	return "Преподаватель"
}

func resolveLessonEventDate(value pgtype.Timestamptz) time.Time {
	if value.Valid {
		return value.Time
	}

	return time.Now().UTC()
}

func isValidVariantDurations(progress []GeneratedLessonProgressStep, expectedTotal int32) bool {
	if len(progress) == 0 {
		return false
	}

	var firstTotal int32
	var secondTotal int32
	var thirdTotal int32
	for _, step := range progress {
		if step.FirstTime < 0 || step.SecondTime < 0 || step.ThirdTime < 0 {
			return false
		}
		firstTotal += step.FirstTime
		secondTotal += step.SecondTime
		thirdTotal += step.ThirdTime
	}

	return firstTotal == expectedTotal && secondTotal == expectedTotal && thirdTotal == expectedTotal
}

func isValidLessonProgressOptions(progress []LessonProgressParams, expectedTotal int32) bool {
	var firstTotal int32
	var secondTotal int32
	var thirdTotal int32

	for _, item := range progress {
		first, second, third := normalizeProgressTriples(item)
		if len(first) == 0 || len(second) == 0 || len(third) == 0 {
			return false
		}
		firstTotal += first[0]
		secondTotal += second[0]
		thirdTotal += third[0]
	}

	return firstTotal == expectedTotal && secondTotal == expectedTotal && thirdTotal == expectedTotal
}

func resourceStringsForPrompt(resources []GeneratedResource) []string {
	result := make([]string, 0, len(resources))
	for _, resource := range resources {
		name := strings.TrimSpace(resource.Name)
		if name == "" {
			continue
		}
		link := strings.TrimSpace(resource.Link)
		if link != "" {
			result = append(result, fmt.Sprintf("%s (%s)", name, link))
			continue
		}
		result = append(result, name)
	}
	return result
}

func resourceStringsForDocument(resources []GeneratedResource) []string {
	result := make([]string, 0, len(resources))
	for _, resource := range resources {
		name := strings.TrimSpace(resource.Name)
		if name == "" {
			continue
		}
		link := strings.TrimSpace(resource.Link)
		if link != "" {
			result = append(result, fmt.Sprintf("%s — %s", name, link))
			continue
		}
		result = append(result, name)
	}
	return result
}

func extractPreviousLessonNames(lessons []storage.Lesson, language string) []string {
	unique := make(map[string]struct{}, len(lessons))
	result := make([]string, 0, len(lessons))

	for _, lesson := range lessons {
		name := strings.TrimSpace(localeTextByLanguage(localization.LocaleTextFromJSONB(lesson.TopicName), language))
		if name == "" {
			continue
		}
		if _, exists := unique[name]; exists {
			continue
		}
		unique[name] = struct{}{}
		result = append(result, name)
	}

	return result
}

func validateGenerateLessonInput(input GenerateLessonInput) error {
	if input.RupID == uuid.Nil {
		return fmt.Errorf("rupId is required")
	}
	if input.DisciplineID == uuid.Nil {
		return fmt.Errorf("disciplineId is required")
	}
	if input.TopicID == uuid.Nil {
		return fmt.Errorf("topicId is required")
	}
	if input.UpdatedTopic.Name.Ru == "" && input.UpdatedTopic.Name.Kz == "" {
		return fmt.Errorf("updatedTopic.name is required")
	}
	if strings.TrimSpace(input.UpdatedTopic.Type) == "" {
		return fmt.Errorf("updatedTopic.type is required")
	}
	return nil
}

func containsUUID(values []uuid.UUID, target uuid.UUID) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func normalizeNonEmptyStrings(values []string) []string {
	if len(values) == 0 {
		return nil
	}

	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	if len(result) == 0 {
		return nil
	}

	return result
}

func buildLessonObjectName(lessonID uuid.UUID, lessonName string) string {
	baseName := sanitizeLessonFileName(lessonName)
	if baseName == "" {
		baseName = "lesson_plan"
	}

	timestamp := time.Now().UTC().Format("20060102_150405")
	shortID := lessonID.String()
	if len(shortID) > 8 {
		shortID = shortID[:8]
	}

	fileName := fmt.Sprintf("%s_%s_%s.docx", baseName, timestamp, shortID)
	return fmt.Sprintf("lessons/%s/%s", lessonID.String(), fileName)
}

func extractFileNameFromDisposition(contentDisposition string) string {
	cd := strings.TrimSpace(contentDisposition)
	if cd == "" {
		return ""
	}

	_, params, err := mime.ParseMediaType(cd)
	if err != nil {
		return ""
	}

	if encoded, ok := params["filename*"]; ok && encoded != "" {
		if idx := strings.Index(encoded, "''"); idx >= 0 && idx+2 < len(encoded) {
			decoded, decodeErr := url.QueryUnescape(encoded[idx+2:])
			if decodeErr == nil {
				return decoded
			}
		}
	}

	return params["filename"]
}

func sanitizeLessonFileName(value string) string {
	name := strings.TrimSpace(strings.ToValidUTF8(value, "_"))
	name = strings.Trim(name, `"'`)
	if name == "" {
		return ""
	}

	invalidChars := regexp.MustCompile(`[\\/:*?"<>|]+`)
	name = invalidChars.ReplaceAllString(name, "_")

	unsafeSymbols := regexp.MustCompile(`[^\p{L}\p{N}._\-\s]+`)
	name = unsafeSymbols.ReplaceAllString(name, "_")
	name = strings.Join(strings.Fields(name), "_")
	name = strings.Trim(name, "._-")
	if name == "" {
		return ""
	}

	const maxFileNameRunes = 120
	nameRunes := []rune(name)
	if len(nameRunes) > maxFileNameRunes {
		name = string(nameRunes[:maxFileNameRunes])
		name = strings.Trim(name, "._-")
	}

	return name
}

func (s *LessonService) buildLessonResponse(ctx context.Context, lesson storage.Lesson) (*LessonResponse, error) {
	rupID, disciplineID, topicID, topic := s.resolveLessonLinks(ctx, lesson.ID)

	// Get teacher
	var teacher *helpers.UserResponse
	if user, err := s.rupRepo.GetUserByID(ctx, lesson.Teacher); err == nil {
		teacher = helpers.ConvertToUserResponse(*user)
	}

	// Get group
	var group *GroupResponse
	if lessonGroup, err := s.rupRepo.GetGroupByKeycloakID(ctx, lesson.GroupID); err == nil {
		group = &GroupResponse{
			KeycloakID:    lessonGroup.KeycloakID,
			Name:          lessonGroup.Name,
			Qualification: localization.LocaleTextFromJSONB(lessonGroup.Qualification),
			Specialty:     localization.LocaleTextFromJSONB(lessonGroup.Specialty),
		}
	}

	// Get internet resources
	internetResources := make([]*ResourceResponse, 0, len(lesson.InternetResources))
	for _, resourceID := range lesson.InternetResources {
		resource, err := s.rupRepo.GetResourceByID(ctx, resourceID)
		if err != nil {
			continue
		}
		internetResources = append(internetResources, &ResourceResponse{
			ID:   resource.ID,
			Name: localization.LocaleTextFromJSONB(resource.Name),
			Link: resource.Link.String,
			Type: "INTERNET",
		})
	}

	// Get technical resources
	technicalResources := make([]*ResourceResponse, 0, len(lesson.TechnicalResources))
	for _, resourceID := range lesson.TechnicalResources {
		resource, err := s.rupRepo.GetResourceByID(ctx, resourceID)
		if err != nil {
			continue
		}
		technicalResources = append(technicalResources, &ResourceResponse{
			ID:   resource.ID,
			Name: localization.LocaleTextFromJSONB(resource.Name),
			Link: resource.Link.String,
			Type: "TECHNICAL",
		})
	}

	// Get lesson progress in persisted order.
	lessonProgressRows, _ := s.repo.GetLessonProgressByLessonID(ctx, lesson.ID)
	lessonProgressByOrder := make(map[int16]storage.LessonProgress, len(lessonProgressRows))
	for _, item := range lessonProgressRows {
		lessonProgressByOrder[item.StepOrder] = item
	}

	lessonProgress := make([]LessonProgressData, 0, len(canonicalLessonStages))
	for index := range canonicalLessonStages {
		stepOrder := canonicalLessonStepOrder(index)
		item, exists := lessonProgressByOrder[stepOrder]
		firstTime, secondTime, thirdTime := canonicalLessonStageTimes(stepOrder)
		content := []localization.LocaleText{canonicalLessonStageDefaultContent(stepOrder)}
		var id uuid.UUID
		if exists {
			id = item.ID
			content = localization.LocaleTextSliceFromJSONB(item.Content)
			if len(content) == 0 {
				content = []localization.LocaleText{canonicalLessonStageDefaultContent(stepOrder)}
			}
		}

		lessonProgress = append(lessonProgress, LessonProgressData{
			ID:         id,
			StepOrder:  stepOrder,
			Name:       canonicalLessonStageName(stepOrder),
			FirstTime:  firstTime,
			SecondTime: secondTime,
			ThirdTime:  thirdTime,
			Content:    content,
		})
	}

	fileURL := helpers.PgTextToPtr(lesson.FileUrl)
	if fileURL != nil && strings.TrimSpace(*fileURL) != "" {
		if fullURL, err := s.fileStorage.GetDownloadFileURL(ctx, *fileURL, 10*time.Minute); err == nil {
			fileURL = &fullURL
		}
	}

	planNumber := lesson.PlanNumber
	if planNumber == defaultLessonPlanNumber && rupID != nil && topicID != nil {
		if rup, err := s.rupRepo.GetRupByID(ctx, *rupID); err == nil {
			if resolvedPlanNumber, planErr := s.resolveLessonPlanNumber(ctx, rup, *topicID); planErr == nil {
				planNumber = resolvedPlanNumber
			}
		}
	}

	return &LessonResponse{
		ID:                 lesson.ID,
		RupID:              rupID,
		DisciplineID:       disciplineID,
		TopicID:            topicID,
		RupName:            localization.LocaleTextFromJSONB(lesson.RupName),
		DisciplineName:     localization.LocaleTextPtrFromJSONB(lesson.DisciplineName),
		TopicName:          localization.LocaleTextPtrFromJSONB(lesson.TopicName),
		PlanNumber:         planNumber,
		Topic:              topic,
		Teacher:            teacher,
		EventDate:          helpers.PgTimeToString(lesson.EventDate),
		Group:              group,
		Type:               string(lesson.Type),
		Goals:              localization.LocaleTextPtrFromJSONB(lesson.Goals),
		Tasks:              localization.LocaleTextPtrFromJSONB(lesson.Tasks),
		Expected:           localization.LocaleTextPtrFromJSONB(lesson.Expected),
		InternetResources:  internetResources,
		TechnicalResources: technicalResources,
		LessonProgress:     lessonProgress,
		FileURL:            fileURL,
		CreatedAt:          helpers.PgTimeToString(lesson.CreatedAt),
		UpdatedAt:          helpers.PgTimeToString(lesson.UpdatedAt),
	}, nil
}

func buildLessonNavigationResponse(lesson storage.Lesson) *LessonNavigationResponse {
	return &LessonNavigationResponse{
		ID:        lesson.ID,
		TopicName: localization.LocaleTextFromJSONB(lesson.TopicName),
	}
}

func (s *LessonService) resolveLessonLinks(
	ctx context.Context,
	lessonID uuid.UUID,
) (*uuid.UUID, *uuid.UUID, *uuid.UUID, *TopicResponse) {
	topicEntity, err := s.rupRepo.GetTopicByLessonID(ctx, lessonID)
	if err != nil {
		return nil, nil, nil, nil
	}

	topicID := topicEntity.ID
	var topicLessonID *uuid.UUID
	if topicEntity.LessonID.Valid {
		linkedLessonID := uuid.UUID(topicEntity.LessonID.Bytes)
		topicLessonID = &linkedLessonID
	}

	topic := &TopicResponse{
		ID:              topicEntity.ID,
		Name:            localization.LocaleTextFromJSONB(topicEntity.Name),
		Type:            topicEntity.Type,
		LessonID:        topicLessonID,
		TotalHours:      topicEntity.TotalHours,
		TheoryHours:     topicEntity.TheoryHours,
		PracticeHours:   topicEntity.PracticeHours,
		IndividualHours: topicEntity.IndividualHours,
		SrspHours:       topicEntity.SrspHours,
		SrsHours:        topicEntity.SrsHours,
	}

	discipline, err := s.rupRepo.GetDisciplineByTopicID(ctx, topicEntity.ID)
	if err != nil {
		return nil, nil, &topicID, topic
	}
	disciplineID := discipline.ID

	rup, err := s.rupRepo.GetRupByDisciplineID(ctx, discipline.ID)
	if err != nil {
		return nil, &disciplineID, &topicID, topic
	}
	rupID := rup.ID

	return &rupID, &disciplineID, &topicID, topic
}
