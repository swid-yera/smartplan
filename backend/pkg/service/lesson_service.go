package service

import (
	"context"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"
	"math"
	"time"

	"github.com/google/uuid"
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
	ID                 uuid.UUID   `json:"id"`
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
	CreatedAt          string      `json:"created_at"`
	UpdatedAt          string      `json:"updated_at"`
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

type LessonService struct {
	repo repository.Lessons
	log  *logrus.Logger
}

func NewLessonService(repo repository.Lessons, logger *logrus.Logger) *LessonService {
	return &LessonService{
		repo: repo,
		log:  logger,
	}
}

func (s *LessonService) CreateLesson(ctx context.Context, params LessonParams) error {
	eventDate, eventDateValid, err := parseTimeOptional(params.EventDate)
	if err != nil {
		return err
	}
	createParams := storage.CreateLessonsParams{
		RupName:            params.RupName,
		DisciplineName:     pgtype.Text{String: ptrToString(params.DisciplineName), Valid: params.DisciplineName != nil},
		TopicName:          pgtype.Text{String: ptrToString(params.TopicName), Valid: params.TopicName != nil},
		Teacher:            params.TeacherID,
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: eventDateValid},
		GroupID:            params.GroupID,
		Type:               storage.EnumLessonType(params.Type),
		Goals:              pgtype.Text{String: ptrToString(params.Goals), Valid: params.Goals != nil},
		Tasks:              pgtype.Text{String: ptrToString(params.Tasks), Valid: params.Tasks != nil},
		Expected:           pgtype.Text{String: ptrToString(params.Expected), Valid: params.Expected != nil},
		InternetResources:  params.InternetResources,
		TechnicalResources: params.TechnicalResources,
	}
	return s.repo.CreateLesson(ctx, createParams)
}

func (s *LessonService) UpdateLesson(ctx context.Context, id uuid.UUID, params LessonParams, progress []LessonProgressParams) error {
	eventDate, eventDateValid, err := parseTimeOptional(params.EventDate)
	if err != nil {
		return err
	}
	updateParams := storage.UpdateLessonParams{
		ID:                 id,
		RupName:            params.RupName,
		DisciplineName:     pgtype.Text{String: ptrToString(params.DisciplineName), Valid: params.DisciplineName != nil},
		TopicName:          pgtype.Text{String: ptrToString(params.TopicName), Valid: params.TopicName != nil},
		EventDate:          pgtype.Timestamptz{Time: eventDate, Valid: eventDateValid},
		GroupID:            params.GroupID,
		Type:               storage.EnumLessonType(params.Type),
		Goals:              pgtype.Text{String: ptrToString(params.Goals), Valid: params.Goals != nil},
		Tasks:              pgtype.Text{String: ptrToString(params.Tasks), Valid: params.Tasks != nil},
		Expected:           pgtype.Text{String: ptrToString(params.Expected), Valid: params.Expected != nil},
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

	// Получаем общее количество уроков с фильтром
	total, err := s.repo.CountLessonsFiltered(ctx, teacher, id)
	if err != nil {
		return nil, err
	}

	// Получаем уроки с пагинацией
	dbLessons, err := s.repo.GetLessons(ctx, teacher, id, int32(pageSize), int32(offset))
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	// Если нужно, можно обработать уроки перед возвратом
	var result []LessonResponse
	for _, dbLesson := range dbLessons {
		lesson := LessonResponse{
			ID:                 dbLesson.ID,
			RupName:            dbLesson.RupName,
			DisciplineName:     pgTextToPtr(dbLesson.DisciplineName),
			TopicName:          pgTextToPtr(dbLesson.TopicName),
			TeacherID:          dbLesson.Teacher,
			EventDate:          dbLesson.EventDate.Time.Format(time.RFC3339),
			GroupID:            dbLesson.GroupID,
			Type:               string(dbLesson.Type),
			Goals:              pgTextToPtr(dbLesson.Goals),
			Tasks:              pgTextToPtr(dbLesson.Tasks),
			Expected:           pgTextToPtr(dbLesson.Expected),
			InternetResources:  dbLesson.InternetResources,
			TechnicalResources: dbLesson.TechnicalResources,
			CreatedAt:          pgTimeToString(dbLesson.CreatedAt),
			UpdatedAt:          pgTimeToString(dbLesson.UpdatedAt),
		}
		result = append(result, lesson)
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
