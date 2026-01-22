package repository

import (
	"context"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type LessonRepository struct {
	queries *storage.Queries
}

func NewLessonRepository(queries *storage.Queries) *LessonRepository {
	return &LessonRepository{
		queries: queries,
	}
}

func (r *LessonRepository) CreateLesson(ctx context.Context, params storage.CreateLessonsParams) error {
	_, err := r.queries.CreateLessons(ctx, params)
	return err
}

func (r *LessonRepository) UpdateLesson(ctx context.Context, params storage.UpdateLessonParams) error {
	return r.queries.UpdateLesson(ctx, params)
}

func (r *LessonRepository) DeleteLesson(ctx context.Context, id uuid.UUID) error {
	{
		return r.queries.DeleteLesson(ctx, id)
	}
}

func (r *LessonRepository) GetAllLessons(ctx context.Context, from pgtype.Timestamptz, to pgtype.Timestamptz, limit int32, offset int32) ([]storage.Lesson, error) {
	lessons, err := r.queries.GetLessons(ctx, storage.GetLessonsParams{
		EventDate:   from,
		EventDate_2: to,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		return nil, err
	}
	return lessons, nil
}

func (r *LessonRepository) GetLesson(ctx context.Context, id uuid.UUID) (storage.Lesson, error) {
	lessons, err := r.queries.GetLessonByID(ctx, id)
	if err != nil {
		return storage.Lesson{}, err
	}
	return lessons, nil
}
func (r *LessonRepository) GetLessonsTeacher(ctx context.Context, teacherID uuid.UUID, from pgtype.Timestamptz, to pgtype.Timestamptz, limit int32, offset int32) ([]storage.Lesson, error) {
	lessons, err := r.queries.GetLessonsTeacher(ctx, storage.GetLessonsTeacherParams{
		TeacherID:   teacherID,
		EventDate:   from,
		EventDate_2: to,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		return nil, err
	}
	return lessons, nil
}

func (r *LessonRepository) GetLessonByID(ctx context.Context, id uuid.UUID) (*storage.Lesson, error) {
	lesson, err := r.queries.GetLessonByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &lesson, nil
}

func (r *LessonRepository) CreateLessonProgress(ctx context.Context, params storage.CreateLessonProgressParams) error {
	_, err := r.queries.CreateLessonProgress(ctx, params)
	return err
}

func (r *LessonRepository) UpdateLessonProgress(ctx context.Context, params storage.UpdateLessonProgressParams) error {
	return r.queries.UpdateLessonProgress(ctx, params)
}

func (r *LessonRepository) DeleteLessonProgress(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteLessonProgress(ctx, id)
}

func (r *LessonRepository) GetLessonProgressByID(ctx context.Context, id uuid.UUID) (storage.LessonProgress, error) {
	lessonProgress, err := r.queries.GetLessonProgressByID(ctx, id)
	if err != nil {
		return storage.LessonProgress{}, err
	}
	return lessonProgress, nil
}

func (r *LessonRepository) GetLessonProgressByLessonID(ctx context.Context, lessonID uuid.UUID) ([]storage.LessonProgress, error) {
	lessonProgress, err := r.queries.GetLessonProgressByLessonID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	return lessonProgress, nil
}
