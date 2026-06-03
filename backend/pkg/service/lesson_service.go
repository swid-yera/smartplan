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
	ID         uuid.UUID               `json:"id"`
	Name       localization.LocaleText `json:"name"`
	FirstTime  []int32                 `json:"first_time"`
	SecondTime []int32                 `json:"second_time"`
	ThirdTime  []int32                 `json:"third_time"`
	Content    []string                `json:"content"`
}

type PaginatedLessonsResponse struct {
	Data []LessonResponse `json:"data"`
	Meta PaginationMeta   `json:"meta"`
}

type LessonProgressParams struct {
	ID         uuid.UUID               `json:"id"`
	Name       localization.LocaleText `json:"name"`
	FirstTime  []int32                 `json:"first_time"`
	SecondTime []int32                 `json:"second_time"`
	ThirdTime  []int32                 `json:"third_time"`
	Content    []string                `json:"content"`
}

type GenerateLessonInput struct {
	RupID        uuid.UUID                `json:"rupId"`
	DisciplineID uuid.UUID                `json:"disciplineId"`
	TopicID      uuid.UUID                `json:"topicId"`
	UpdatedTopic GenerateLessonTopicInput `json:"updatedTopic"`
	Message      string                   `json:"message"`
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
	cfg         *config.DocumentRenderConfig
	httpClient  *http.Client
	fileStorage FileStorage
	log         *logrus.Logger
}

const (
	defaultLessonPlanNumber = int32(47)
	lessonVariantTotalMins  = int32(90)
)

func NewLessonService(
	repo repository.Lessons,
	rupRepo repository.RupRepository,
	aiService AIService,
	cfg *config.DocumentRenderConfig,
	httpClient *http.Client,
	fileStorage FileStorage,
	logger *logrus.Logger,
) *LessonService {
	return &LessonService{
		repo:        repo,
		rupRepo:     rupRepo,
		aiService:   aiService,
		cfg:         cfg,
		httpClient:  httpClient,
		fileStorage: fileStorage,
		log:         logger,
	}
}

func (s *LessonService) CreateLesson(ctx context.Context, params LessonParams) error {
	eventDate, eventDateValid, err := helpers.ParseTimeOptional(params.EventDate)
	if err != nil {
		return err
	}
	planNumber := normalizeLessonPlanNumber(params.PlanNumber)
	createParams := storage.CreateLessonsParams{
		RupName:            params.RupName.ToJSONB(),
		DisciplineName:     localePtrToJSONB(params.DisciplineName),
		TopicName:          localePtrToJSONB(params.TopicName),
		PlanNumber:         planNumber,
		Teacher:            params.TeacherID,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: eventDateValid},
		GroupID:            params.GroupID,
		Type:               storage.EnumLessonType(params.Type),
		Goals:              localePtrToJSONB(params.Goals),
		Tasks:              localePtrToJSONB(params.Tasks),
		Expected:           localePtrToJSONB(params.Expected),
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

	topicType, err := parseDisciplineTopicType(input.UpdatedTopic.Type)
	if err != nil {
		return uuid.Nil, err
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
		localePrimary(rup.Name),
		localePrimary(discipline.Name),
		3,
	)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get recent lessons: %w", err)
	}

	previousLessonNames := extractPreviousLessonNames(recentLessons)
	aiResult, err := s.aiService.GenerateLesson(ctx, GenerateLessonRequest{
		RupName:            localePrimary(rup.Name),
		DisciplineName:     localePrimary(discipline.Name),
		TopicName:          localePrimary(updatedTopic.Name),
		TopicType:          string(updatedTopic.Type),
		TotalHours:         updatedTopic.TotalHours,
		TheoryHours:        updatedTopic.TheoryHours,
		PracticeHours:      updatedTopic.PracticeHours,
		IndividualHours:    updatedTopic.IndividualHours,
		SrspHours:          updatedTopic.SrspHours,
		SrsHours:           updatedTopic.SrsHours,
		GroupName:          group.Name,
		GroupSpecialty:     localePrimary(group.Specialty),
		GroupQualification: localePrimary(group.Qualification),
		ExplorationGoals:   localePrimary(exploration.Goals),
		Prerequisites:      localePrimary(exploration.Prerequisites),
		Postrequisites:     localePrimary(exploration.Postrequisites),
		InternetResources:  resourceStringsForPrompt(internetResources),
		TechnicalResources: resourceStringsForPrompt(technicalResources),
		PreviousLessons:    previousLessonNames,
		Message:            input.Message,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("generate lesson via ai: %w", err)
	}

	if generatedIDs, generated := s.persistGeneratedResources(ctx, aiResult.InternetResources); len(generatedIDs) > 0 {
		internetResourceIDs = generatedIDs
		internetResources = generated
	}
	if generatedIDs, generated := s.persistGeneratedResources(ctx, aiResult.TechnicalResources); len(generatedIDs) > 0 {
		technicalResourceIDs = generatedIDs
		technicalResources = generated
	}

	fallbackType := lessonTypeByTopic(*updatedTopic)
	generatedPlan, err := normalizeGeneratedLessonPlan(aiResult, fallbackType)
	if err != nil {
		return uuid.Nil, err
	}

	eventDate := time.Now().UTC()
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

	lessonParams := storage.CreateLessonsParams{
		RupName:            rup.Name,
		DisciplineName:     discipline.Name,
		TopicName:          updatedTopic.Name,
		PlanNumber:         planNumber,
		Teacher:            teacherID,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: true},
		GroupID:            group.KeycloakID,
		Type:               generatedPlan.LessonType,
		Goals:              localization.NewLocaleText(generatedPlan.Goals, "").ToJSONB(),
		Tasks:              localization.NewLocaleText(generatedPlan.Tasks, "").ToJSONB(),
		Expected:           localization.NewLocaleText(generatedPlan.Expected, "").ToJSONB(),
		InternetResources:  internetResourceIDs,
		TechnicalResources: technicalResourceIDs,
	}

	lessonID, err := s.upsertGeneratedLesson(ctx, updatedTopic.LessonID, lessonParams, generatedPlan.Progress)
	if err != nil {
		return uuid.Nil, err
	}

	teacherName := ""
	teacher, teacherErr := s.rupRepo.GetUserByID(ctx, teacherID)
	if teacherErr == nil {
		teacherName = strings.TrimSpace(strings.TrimSpace(teacher.FirstName.String + " " + teacher.LastName.String))
	}
	if teacherName == "" {
		teacherName = localizedTeacherFallback("ru")
	}

	documentPayload := buildLessonDocumentPayload(
		"ru",
		localePrimary(rup.Name),
		localePrimary(discipline.Name),
		localePrimary(updatedTopic.Name),
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

	objectName := buildLessonObjectName(lessonID, localePrimary(updatedTopic.Name))
	if err := s.fileStorage.UploadFile(ctx, objectName, bytes.NewReader(document.Content), int64(len(document.Content))); err != nil {
		return uuid.Nil, fmt.Errorf("upload lesson to minio: %w", err)
	}

	if err := s.repo.UpdateLessonFileURL(ctx, lessonID, objectName); err != nil {
		return uuid.Nil, fmt.Errorf("update lesson file_url: %w", err)
	}

	if err := s.rupRepo.LinkLessonToTopic(ctx, input.TopicID, &lessonID); err != nil {
		return uuid.Nil, fmt.Errorf("link lesson to topic: %w", err)
	}

	return lessonID, nil
}

func (s *LessonService) upsertGeneratedLesson(
	ctx context.Context,
	linkedLessonID pgtype.UUID,
	lessonParams storage.CreateLessonsParams,
	progress []GeneratedLessonProgressStep,
) (uuid.UUID, error) {
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
				return uuid.Nil, fmt.Errorf("update lesson: %w", err)
			}

			if err := s.replaceLessonProgress(ctx, lessonID, progress); err != nil {
				return uuid.Nil, err
			}

			return lessonID, nil
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, fmt.Errorf("get linked lesson: %w", err)
		}
	}

	lessonID, err := s.repo.CreateLesson(ctx, lessonParams)
	if err != nil {
		return uuid.Nil, fmt.Errorf("create lesson: %w", err)
	}

	if err := s.replaceLessonProgress(ctx, lessonID, progress); err != nil {
		return uuid.Nil, err
	}

	return lessonID, nil
}

func (s *LessonService) replaceLessonProgress(
	ctx context.Context,
	lessonID uuid.UUID,
	progress []GeneratedLessonProgressStep,
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

	for _, step := range progress {
		content := make([]string, 0, len(step.Content))
		for _, item := range step.Content {
			item = strings.TrimSpace(item)
			if item != "" {
				content = append(content, item)
			}
		}
		if len(content) == 0 {
			content = []string{"Этап выполняется согласно теме урока."}
		}

		if err := s.repo.CreateLessonProgress(ctx, storage.CreateLessonProgressParams{
			LessonID:   lessonID,
			Name:       localization.NewLocaleText(step.Name, "").ToJSONB(),
			FirstTime:  []int32{step.FirstTime},
			SecondTime: []int32{step.SecondTime},
			ThirdTime:  []int32{step.ThirdTime},
			Content:    content,
		}); err != nil {
			return fmt.Errorf("create lesson progress: %w", err)
		}
	}

	return nil
}

func (s *LessonService) UpdateLesson(ctx context.Context, id uuid.UUID, params LessonParams, progress []LessonProgressParams) error {
	eventDate, eventDateValid, err := helpers.ParseTimeOptional(params.EventDate)
	if err != nil {
		return err
	}
	if params.PlanNumber == nil {
		if existingLesson, getErr := s.repo.GetLessonByID(ctx, id); getErr == nil {
			if params.PlanNumber == nil {
				resolved := existingLesson.PlanNumber
				params.PlanNumber = &resolved
			}
		}
	}
	planNumber := normalizeLessonPlanNumber(params.PlanNumber)
	updateParams := storage.UpdateLessonParams{
		ID:                 id,
		RupName:            params.RupName.ToJSONB(),
		DisciplineName:     localePtrToJSONB(params.DisciplineName),
		TopicName:          localePtrToJSONB(params.TopicName),
		PlanNumber:         planNumber,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: eventDateValid},
		GroupID:            params.GroupID,
		Type:               storage.EnumLessonType(params.Type),
		Goals:              localePtrToJSONB(params.Goals),
		Tasks:              localePtrToJSONB(params.Tasks),
		Expected:           localePtrToJSONB(params.Expected),
		InternetResources:  params.InternetResources,
		TechnicalResources: params.TechnicalResources,
	}
	if len(progress) > 0 && !isValidLessonProgressOptions(progress, lessonVariantTotalMins) {
		return fmt.Errorf("invalid lesson progress durations: each variant must sum to %d minutes", lessonVariantTotalMins)
	}
	if err := s.repo.UpdateLesson(ctx, updateParams); err != nil {
		return err
	}
	for _, item := range progress {
		firstTime, secondTime, thirdTime := normalizeProgressTriples(item)
		updateProgress := storage.UpdateLessonProgressParams{
			ID:         item.ID,
			Name:       item.Name.ToJSONB(),
			FirstTime:  firstTime,
			SecondTime: secondTime,
			ThirdTime:  thirdTime,
			Content:    item.Content,
		}
		if err := s.repo.UpdateLessonProgress(ctx, updateProgress); err != nil {
			return err
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
	lessonType string,
	discipline string,
	groupName string,
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
	lessonType = strings.TrimSpace(lessonType)
	discipline = strings.TrimSpace(discipline)
	groupName = strings.TrimSpace(groupName)
	sort = strings.ToLower(strings.TrimSpace(sort))
	if sort != "asc" && sort != "desc" {
		sort = "desc"
	}

	total, err := s.repo.CountLessonsFiltered(ctx, search, teacher, id, lessonType, discipline, groupName)
	if err != nil {
		return nil, err
	}

	dbLessons, err := s.repo.GetLessons(ctx, search, teacher, id, lessonType, discipline, groupName, sort, int32(pageSize), int32(offset))
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

	lessonProgressRows, err := s.repo.GetLessonProgressByLessonID(ctx, id)
	if err != nil {
		return "", fmt.Errorf("get lesson progress: %w", err)
	}

	progress := make([]GeneratedLessonProgressStep, 0, len(lessonProgressRows))
	for _, row := range lessonProgressRows {
		progress = append(progress, GeneratedLessonProgressStep{
			Name:       localeTextByLanguage(localization.LocaleTextFromJSONB(row.Name), selectedLanguage),
			FirstTime:  firstProgressMinute(row.FirstTime),
			SecondTime: firstProgressMinute(row.SecondTime),
			ThirdTime:  firstProgressMinute(row.ThirdTime),
			Content:    row.Content,
		})
	}
	if len(progress) == 0 {
		progress = defaultLessonProgress(lesson.Type)
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
		s.resolveLocalizedLessonResources(ctx, lesson.InternetResources, selectedLanguage),
		s.resolveLocalizedLessonResources(ctx, lesson.TechnicalResources, selectedLanguage),
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

func (s *LessonService) CreateLessonProgress(ctx context.Context, params LessonProgressParams, lessonID uuid.UUID) error {
	firstTime, secondTime, thirdTime := normalizeProgressTriples(params)
	createParams := storage.CreateLessonProgressParams{
		LessonID:   lessonID,
		Name:       params.Name.ToJSONB(),
		FirstTime:  firstTime,
		SecondTime: secondTime,
		ThirdTime:  thirdTime,
		Content:    params.Content,
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

func (s *LessonService) persistGeneratedResources(ctx context.Context, generated []GeneratedResource) ([]uuid.UUID, []GeneratedResource) {
	if len(generated) == 0 {
		return nil, nil
	}

	createdIDs := make([]uuid.UUID, 0, len(generated))
	createdResources := make([]GeneratedResource, 0, len(generated))
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

		resource, err := s.rupRepo.CreateResource(ctx, storage.CreateRupResourceParams{
			Name: localization.NewLocaleText(name, "").ToJSONB(),
			Link: pgtype.Text{String: link, Valid: link != ""},
		})
		if err != nil {
			if s.log != nil {
				s.log.WithError(err).WithField("resource_name", name).Warn("failed to persist generated lesson resource")
			}
			continue
		}

		createdIDs = append(createdIDs, resource.ID)
		createdResources = append(createdResources, GeneratedResource{
			Name: strings.TrimSpace(localePrimary(resource.Name)),
			Link: strings.TrimSpace(resource.Link.String),
		})
	}

	return createdIDs, createdResources
}

func (s *LessonService) generateLessonViaPython(ctx context.Context, payload lessonDocumentPayload) (*generatedLessonDocument, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal lesson payload: %w", err)
	}

	endpoint := strings.TrimRight(s.cfg.Url, "/") + "/generate-lesson"
	resp, err := s.postDocumentRenderJSON(ctx, endpoint, body)
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

func (s *LessonService) postDocumentRenderJSON(ctx context.Context, endpoint string, body []byte) (*http.Response, error) {
	const maxRedirects = 5
	currentURL := endpoint

	for i := 0; i <= maxRedirects; i++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, currentURL, bytes.NewReader(body))
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Request-ID", uuid.NewString())
		if s.cfg.ApiKey != "" {
			req.Header.Set("X-API-Key", s.cfg.ApiKey)
		}

		resp, err := s.doWithoutAutoRedirect(req)
		if err != nil {
			return nil, err
		}

		if !isRedirectStatus(resp.StatusCode) {
			return resp, nil
		}

		nextLocation := strings.TrimSpace(resp.Header.Get("Location"))
		if nextLocation == "" {
			return resp, nil
		}

		nextURL, err := resolveRedirectURL(currentURL, nextLocation)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}
		currentURL = nextURL
	}

	return nil, fmt.Errorf("document rendering redirect limit exceeded for %s", endpoint)
}

func (s *LessonService) doWithoutAutoRedirect(req *http.Request) (*http.Response, error) {
	if s.httpClient == nil {
		return nil, fmt.Errorf("http client is not configured")
	}

	clientCopy := *s.httpClient
	clientCopy.CheckRedirect = func(_ *http.Request, _ []*http.Request) error {
		return http.ErrUseLastResponse
	}

	return clientCopy.Do(req)
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

func normalizeGeneratedLessonPlan(aiResult *GenerateLessonResponse, fallbackType storage.EnumLessonType) (*generatedLessonPlan, error) {
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

	progress := make([]GeneratedLessonProgressStep, 0, len(aiResult.LessonProgress))
	for _, step := range aiResult.LessonProgress {
		name := strings.TrimSpace(step.Name)
		if name == "" {
			continue
		}

		content := make([]string, 0, len(step.Content))
		for _, item := range step.Content {
			item = strings.TrimSpace(item)
			if item != "" {
				content = append(content, item)
			}
		}
		if len(content) == 0 {
			continue
		}

		firstTime := step.FirstTime
		if firstTime < 0 {
			firstTime = 0
		}
		secondTime := step.SecondTime
		if secondTime < 0 {
			secondTime = 0
		}
		thirdTime := step.ThirdTime
		if thirdTime < 0 {
			thirdTime = 0
		}

		progress = append(progress, GeneratedLessonProgressStep{
			Name:       name,
			FirstTime:  firstTime,
			SecondTime: secondTime,
			ThirdTime:  thirdTime,
			Content:    content,
		})
	}

	if len(progress) == 0 {
		progress = defaultLessonProgress(lessonType)
	}
	if !isValidVariantDurations(progress, lessonVariantTotalMins) {
		progress = defaultLessonProgress(lessonType)
	}

	return &generatedLessonPlan{
		LessonType: lessonType,
		Goals:      goals,
		Tasks:      tasks,
		Expected:   expected,
		Progress:   progress,
	}, nil
}

func defaultLessonProgress(lessonType storage.EnumLessonType) []GeneratedLessonProgressStep {
	_ = lessonType
	return []GeneratedLessonProgressStep{
		{Name: "Организационно-мотивационный момент", FirstTime: 5, SecondTime: 10, ThirdTime: 15, Content: []string{"Приветствие студентов, проверка посещаемости, мотивация и предоставление деятельности."}},
		{Name: "Актуализация знаний", FirstTime: 15, SecondTime: 10, ThirdTime: 10, Content: []string{"Повторение базовых знаний, умений и навыков; ввод в новую тему; инструктаж по технике безопасности при необходимости."}},
		{Name: "Формирование новых знаний и навыков", FirstTime: 40, SecondTime: 35, ThirdTime: 30, Content: []string{"Выдача практических заданий; демонстрация выполнения; выполнение заданий; контроль, корректировка и помощь студентам при работе."}},
		{Name: "Закрепление новой темы", FirstTime: 15, SecondTime: 15, ThirdTime: 15, Content: []string{"Оформление отчета студентами по выполненной работе; сдача отчетов; обсуждение результатов."}},
		{Name: "Рефлексия", FirstTime: 7, SecondTime: 8, ThirdTime: 8, Content: []string{"Обсуждение: какие навыки приобрели, чему научились, что было полезно и что вызвало затруднения."}},
		{Name: "Оценивание", FirstTime: 5, SecondTime: 7, ThirdTime: 7, Content: []string{"Проверка и оценка выполненных работ; комментарии преподавателя."}},
		{Name: "Домашнее задание", FirstTime: 3, SecondTime: 5, ThirdTime: 5, Content: []string{"Задания для самостоятельного закрепления материала."}},
	}
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

func extractPreviousLessonNames(lessons []storage.Lesson) []string {
	unique := make(map[string]struct{}, len(lessons))
	result := make([]string, 0, len(lessons))

	for _, lesson := range lessons {
		name := strings.TrimSpace(localePrimary(lesson.TopicName))
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
	name := strings.TrimSpace(value)
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

	if len(name) > 120 {
		name = name[:120]
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

	lessonProgress := make([]LessonProgressData, 0, len(lessonProgressRows))
	for _, item := range lessonProgressRows {
		lessonProgress = append(lessonProgress, LessonProgressData{
			ID:         item.ID,
			Name:       localization.LocaleTextFromJSONB(item.Name),
			FirstTime:  item.FirstTime,
			SecondTime: item.SecondTime,
			ThirdTime:  item.ThirdTime,
			Content:    item.Content,
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
