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
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sirupsen/logrus"
)

type LessonParams struct {
	RupName            string      `json:"rup_name"`
	DisciplineName     *string     `json:"discipline_name"`
	TopicName          *string     `json:"topic_name"`
	TeacherID          uuid.UUID   `json:"teacher_id"`
	EventDate          string      `json:"event_date"`
	GroupID            uuid.UUID   `json:"group_id"`
	Type               string      `json:"type"`
	Goals              *string     `json:"goals"`
	Tasks              *string     `json:"tasks"`
	Expected           *string     `json:"expected"`
	InternetResources  []uuid.UUID `json:"internet_resources"`
	TechnicalResources []uuid.UUID `json:"technical_resources"`
}

type LessonResponse struct {
	ID                 uuid.UUID             `json:"id"`
	RupName            string                `json:"rup_name"`
	DisciplineName     *string               `json:"discipline_name"`
	TopicName          *string               `json:"topic_name"`
	Teacher            *helpers.UserResponse `json:"teacher"`
	EventDate          string                `json:"event_date"`
	Group              *GroupResponse        `json:"group"`
	Type               string                `json:"type"`
	Goals              *string               `json:"goals"`
	Tasks              *string               `json:"tasks"`
	Expected           *string               `json:"expected"`
	InternetResources  []*ResourceResponse   `json:"internet_resources"`
	TechnicalResources []*ResourceResponse   `json:"technical_resources"`
	FileURL            *string               `json:"file_url"`
	CreatedAt          string                `json:"created_at"`
	UpdatedAt          string                `json:"updated_at"`
}

type PaginatedLessonsResponse struct {
	Data []LessonResponse `json:"data"`
	Meta PaginationMeta   `json:"meta"`
}

type LessonProgressParams struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	StartMinute []int32   `json:"start_minute"`
	EndMinute   []int32   `json:"end_minute"`
	Content     []string  `json:"content"`
}

type GenerateLessonInput struct {
	RupID        uuid.UUID                `json:"rupId"`
	DisciplineID uuid.UUID                `json:"disciplineId"`
	TopicID      uuid.UUID                `json:"topicId"`
	UpdatedTopic GenerateLessonTopicInput `json:"updatedTopic"`
	Message      string                   `json:"message"`
}

type GenerateLessonTopicInput struct {
	Name            string `json:"name"`
	Type            string `json:"type"`
	TotalHours      int32  `json:"total_hours"`
	TheoryHours     int32  `json:"theory_hours"`
	PracticeHours   int32  `json:"practice_hours"`
	IndividualHours int32  `json:"individual_hours"`
	SrspHours       int32  `json:"srsp_hours"`
	SrsHours        int32  `json:"srs_hours"`
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
	RupName            string                      `json:"rup_name"`
	DisciplineName     string                      `json:"discipline_name"`
	TopicName          string                      `json:"topic_name"`
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
	createParams := storage.CreateLessonsParams{
		RupName:            params.RupName,
		DisciplineName:     pgtype.Text{String: helpers.PtrToString(params.DisciplineName), Valid: params.DisciplineName != nil},
		TopicName:          pgtype.Text{String: helpers.PtrToString(params.TopicName), Valid: params.TopicName != nil},
		Teacher:            params.TeacherID,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: eventDateValid},
		GroupID:            params.GroupID,
		Type:               storage.EnumLessonType(params.Type),
		Goals:              pgtype.Text{String: helpers.PtrToString(params.Goals), Valid: params.Goals != nil},
		Tasks:              pgtype.Text{String: helpers.PtrToString(params.Tasks), Valid: params.Tasks != nil},
		Expected:           pgtype.Text{String: helpers.PtrToString(params.Expected), Valid: params.Expected != nil},
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
		Name:            strings.TrimSpace(input.UpdatedTopic.Name),
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

	internetResourceIDs, internetResourceNames := s.resolveResources(ctx, exploration.InternetResources)
	technicalResourceIDs, technicalResourceNames := s.resolveResources(ctx, exploration.TechnicalResources)

	recentLessons, err := s.repo.GetRecentLessonsByDiscipline(
		ctx,
		rup.Name,
		pgtype.Text{String: discipline.Name, Valid: discipline.Name != ""},
		3,
	)
	if err != nil {
		return uuid.Nil, fmt.Errorf("get recent lessons: %w", err)
	}

	previousLessonNames := extractPreviousLessonNames(recentLessons)
	aiResult, err := s.aiService.GenerateLesson(ctx, GenerateLessonRequest{
		RupName:            rup.Name,
		DisciplineName:     discipline.Name,
		TopicName:          updatedTopic.Name,
		TopicType:          string(updatedTopic.Type),
		TotalHours:         updatedTopic.TotalHours,
		TheoryHours:        updatedTopic.TheoryHours,
		PracticeHours:      updatedTopic.PracticeHours,
		IndividualHours:    updatedTopic.IndividualHours,
		SrspHours:          updatedTopic.SrspHours,
		SrsHours:           updatedTopic.SrsHours,
		GroupName:          group.Name,
		GroupSpecialty:     group.Specialty.String,
		GroupQualification: group.Qualification.String,
		ExplorationGoals:   exploration.Goals.String,
		ExplorationSummary: exploration.Summary.String,
		Prerequisites:      exploration.Prerequisites.String,
		Postrequisites:     exploration.Postrequisites.String,
		InternetResources:  internetResourceNames,
		TechnicalResources: technicalResourceNames,
		PreviousLessons:    previousLessonNames,
		Message:            input.Message,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("generate lesson via ai: %w", err)
	}

	fallbackType := lessonTypeByTopic(*updatedTopic)
	generatedPlan, err := normalizeGeneratedLessonPlan(aiResult, fallbackType)
	if err != nil {
		return uuid.Nil, err
	}

	eventDate := time.Now().UTC()
	lessonParams := storage.CreateLessonsParams{
		RupName:            rup.Name,
		DisciplineName:     pgtype.Text{String: discipline.Name, Valid: discipline.Name != ""},
		TopicName:          pgtype.Text{String: updatedTopic.Name, Valid: updatedTopic.Name != ""},
		Teacher:            teacherID,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: true},
		GroupID:            group.KeycloakID,
		Type:               generatedPlan.LessonType,
		Goals:              pgtype.Text{String: generatedPlan.Goals, Valid: generatedPlan.Goals != ""},
		Tasks:              pgtype.Text{String: generatedPlan.Tasks, Valid: generatedPlan.Tasks != ""},
		Expected:           pgtype.Text{String: generatedPlan.Expected, Valid: generatedPlan.Expected != ""},
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
		teacherName = "Преподаватель"
	}

	documentPayload := buildLessonDocumentPayload(
		rup.Name,
		discipline.Name,
		updatedTopic.Name,
		teacherName,
		eventDate,
		rup.Course,
		group.Name,
		generatedPlan,
		internetResourceNames,
		technicalResourceNames,
	)

	document, err := s.generateLessonViaPython(ctx, documentPayload)
	if err != nil {
		return uuid.Nil, err
	}

	objectName := buildLessonObjectName(lessonID, discipline.Name)
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
			LessonID:    lessonID,
			Name:        step.Name,
			StartMinute: []int32{step.StartMinute},
			EndMinute:   []int32{step.EndMinute},
			Content:     content,
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
	updateParams := storage.UpdateLessonParams{
		ID:                 id,
		RupName:            params.RupName,
		DisciplineName:     pgtype.Text{String: helpers.PtrToString(params.DisciplineName), Valid: params.DisciplineName != nil},
		TopicName:          pgtype.Text{String: helpers.PtrToString(params.TopicName), Valid: params.TopicName != nil},
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: eventDateValid},
		GroupID:            params.GroupID,
		Type:               storage.EnumLessonType(params.Type),
		Goals:              pgtype.Text{String: helpers.PtrToString(params.Goals), Valid: params.Goals != nil},
		Tasks:              pgtype.Text{String: helpers.PtrToString(params.Tasks), Valid: params.Tasks != nil},
		Expected:           pgtype.Text{String: helpers.PtrToString(params.Expected), Valid: params.Expected != nil},
		InternetResources:  params.InternetResources,
		TechnicalResources: params.TechnicalResources,
	}
	if err := s.repo.UpdateLesson(ctx, updateParams); err != nil {
		return err
	}
	for _, item := range progress {
		updateProgress := storage.UpdateLessonProgressParams{
			ID:          item.ID,
			Name:        item.Name,
			StartMinute: item.StartMinute,
			EndMinute:   item.EndMinute,
			Content:     item.Content,
		}
		if err := s.repo.UpdateLessonProgress(ctx, updateProgress); err != nil {
			return err
		}
	}
	return nil
}

func (s *LessonService) DeleteLesson(ctx context.Context, id uuid.UUID) error {
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
) (*PaginatedLessonsResponse, error) {
	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountLessonsFiltered(ctx, teacher, id)
	if err != nil {
		return nil, err
	}

	dbLessons, err := s.repo.GetLessons(ctx, teacher, id, int32(pageSize), int32(offset))
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

	return s.buildLessonResponse(ctx, lesson)
}

func (s *LessonService) CreateLessonProgress(ctx context.Context, params LessonProgressParams, lessonID uuid.UUID) error {
	createParams := storage.CreateLessonProgressParams{
		LessonID:    lessonID,
		Name:        params.Name,
		StartMinute: params.StartMinute,
		EndMinute:   params.EndMinute,
		Content:     params.Content,
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

func (s *LessonService) resolveResources(ctx context.Context, ids []uuid.UUID) ([]uuid.UUID, []string) {
	resourceIDs := make([]uuid.UUID, 0, len(ids))
	resourceNames := make([]string, 0, len(ids))

	for _, id := range ids {
		resource, err := s.rupRepo.GetResourceByID(ctx, id)
		if err != nil {
			continue
		}

		resourceIDs = append(resourceIDs, id)
		name := strings.TrimSpace(resource.Name)
		if name != "" {
			resourceNames = append(resourceNames, name)
		}
	}

	return resourceIDs, resourceNames
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

		startMinute := step.StartMinute
		if startMinute < 0 {
			startMinute = 0
		}
		endMinute := step.EndMinute
		if endMinute < 0 {
			endMinute = 0
		}

		progress = append(progress, GeneratedLessonProgressStep{
			Name:        name,
			StartMinute: startMinute,
			EndMinute:   endMinute,
			Content:     content,
		})
	}

	if len(progress) == 0 {
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
	if lessonType == storage.EnumLessonTypePRACTICE {
		return []GeneratedLessonProgressStep{
			{Name: "Организационный этап", StartMinute: 5, EndMinute: 10, Content: []string{"Проверка готовности аудитории и постановка целей занятия."}},
			{Name: "Вводный инструктаж", StartMinute: 25, EndMinute: 30, Content: []string{"Объяснение техники безопасности и ключевых шагов выполнения практики."}},
			{Name: "Текущий инструктаж", StartMinute: 25, EndMinute: 115, Content: []string{"Выполнение практических заданий по теме с консультацией преподавателя."}},
			{Name: "Заключительный инструктаж", StartMinute: 30, EndMinute: 110, Content: []string{"Анализ типичных ошибок и корректировка подходов."}},
			{Name: "Подведение итогов", StartMinute: 5, EndMinute: 0, Content: []string{"Рефлексия и фиксация результатов занятия."}},
		}
	}

	return []GeneratedLessonProgressStep{
		{Name: "Организационно-мотивационный этап", StartMinute: 5, EndMinute: 0, Content: []string{"Актуализация темы и критериев результата."}},
		{Name: "Актуализация знаний", StartMinute: 15, EndMinute: 0, Content: []string{"Повторение базовых понятий и проверка стартового уровня группы."}},
		{Name: "Изучение нового материала", StartMinute: 40, EndMinute: 0, Content: []string{"Объяснение теоретических положений и разбор примеров."}},
		{Name: "Закрепление", StartMinute: 15, EndMinute: 0, Content: []string{"Выполнение заданий на закрепление нового материала."}},
		{Name: "Оценивание и рефлексия", StartMinute: 15, EndMinute: 0, Content: []string{"Обратная связь, оценивание и формулирование домашнего задания."}},
	}
}

func buildLessonDocumentPayload(
	rupName string,
	disciplineName string,
	topicName string,
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
			Name:    formatLessonProgressName(step),
			Content: strings.Join(step.Content, "\n"),
		})
	}

	lessonTypeLabel := "Теоретический"
	if plan.LessonType == storage.EnumLessonTypePRACTICE {
		lessonTypeLabel = "Лабораторно-практическая"
	}

	return lessonDocumentPayload{
		RupName:            rupName,
		DisciplineName:     disciplineName,
		TopicName:          topicName,
		TeacherName:        teacherName,
		EventDate:          eventDate.Format("02.01.2006"),
		Course:             course,
		GroupName:          groupName,
		Type:               lessonTypeLabel,
		Goals:              "",
		Tasks:              "",
		Expected:           "",
		InternetResources:  "",
		TechnicalResources: "",
		LessonProgress:     rows,
	}
}

func formatLessonProgressName(step GeneratedLessonProgressStep) string {
	if step.EndMinute > 0 {
		return fmt.Sprintf("%s (%d мин./%d мин.)", step.Name, step.StartMinute, step.EndMinute)
	}
	return fmt.Sprintf("%s (%d мин.)", step.Name, step.StartMinute)
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

func extractPreviousLessonNames(lessons []storage.Lesson) []string {
	unique := make(map[string]struct{}, len(lessons))
	result := make([]string, 0, len(lessons))

	for _, lesson := range lessons {
		if !lesson.TopicName.Valid {
			continue
		}
		name := strings.TrimSpace(lesson.TopicName.String)
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
	if strings.TrimSpace(input.UpdatedTopic.Name) == "" {
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

func buildLessonObjectName(lessonID uuid.UUID, disciplineName string) string {
	baseName := sanitizeLessonFileName(disciplineName)
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
			Qualification: lessonGroup.Qualification.String,
			Specialty:     lessonGroup.Specialty.String,
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
			Name: resource.Name,
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
			Name: resource.Name,
			Link: resource.Link.String,
			Type: "TECHNICAL",
		})
	}

	fileURL := helpers.PgTextToPtr(lesson.FileUrl)
	if fileURL != nil && strings.TrimSpace(*fileURL) != "" {
		if fullURL, err := s.fileStorage.GetDownloadFileURL(ctx, *fileURL, 10*time.Minute); err == nil {
			fileURL = &fullURL
		}
	}

	return &LessonResponse{
		ID:                 lesson.ID,
		RupName:            lesson.RupName,
		DisciplineName:     helpers.PgTextToPtr(lesson.DisciplineName),
		TopicName:          helpers.PgTextToPtr(lesson.TopicName),
		Teacher:            teacher,
		EventDate:          helpers.PgTimeToString(lesson.EventDate),
		Group:              group,
		Type:               string(lesson.Type),
		Goals:              helpers.PgTextToPtr(lesson.Goals),
		Tasks:              helpers.PgTextToPtr(lesson.Tasks),
		Expected:           helpers.PgTextToPtr(lesson.Expected),
		InternetResources:  internetResources,
		TechnicalResources: technicalResources,
		FileURL:            fileURL,
		CreatedAt:          helpers.PgTimeToString(lesson.CreatedAt),
		UpdatedAt:          helpers.PgTimeToString(lesson.UpdatedAt),
	}, nil
}
