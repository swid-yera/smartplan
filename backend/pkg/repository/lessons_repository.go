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

func (r *LessonRepository) CreateLesson(ctx context.Context, params storage.CreateLessonsParams) (uuid.UUID, error) {
	return r.queries.CreateLessons(ctx, params)
}

func (r *LessonRepository) UpdateLesson(ctx context.Context, params storage.UpdateLessonParams) error {
	return r.queries.UpdateLesson(ctx, params)
}

func (r *LessonRepository) UpdateLessonFileURL(ctx context.Context, id uuid.UUID, fileURL string) error {
	return r.queries.UpdateLessonFileURL(ctx, storage.UpdateLessonFileURLParams{
		ID:      id,
		FileUrl: pgtype.Text{String: fileURL, Valid: fileURL != ""},
	})
}

func (r *LessonRepository) DeleteLesson(ctx context.Context, id uuid.UUID) error {
	{
		return r.queries.DeleteLesson(ctx, id)
	}
}

func (r *LessonRepository) GetLessons(
	ctx context.Context,
	search string,
	teacher pgtype.UUID,
	id pgtype.UUID,
	lessonType string,
	discipline string,
	groupName string,
	sort string,
	limit int32,
	offset int32,
) ([]storage.Lesson, error) {
	lessons, err := r.queries.GetLessons(ctx, storage.GetLessonsParams{
		Search:     search,
		Teacher:    teacher,
		ID:         id,
		LessonType: lessonType,
		Discipline: discipline,
		GroupName:  groupName,
		Sort:       sort,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return nil, err
	}
	return lessons, nil
}

func (r *LessonRepository) CountLessonsFiltered(
	ctx context.Context,
	search string,
	teacher pgtype.UUID,
	id pgtype.UUID,
	lessonType string,
	discipline string,
	groupName string,
) (int64, error) {
	return r.queries.CountLessonsFiltered(ctx, storage.CountLessonsFilteredParams{
		Search:     search,
		Teacher:    teacher,
		ID:         id,
		LessonType: lessonType,
		Discipline: discipline,
		GroupName:  groupName,
	})
}

func (r *LessonRepository) GetLessonByID(ctx context.Context, id uuid.UUID) (storage.Lesson, error) {
	return r.queries.GetLessonsByID(ctx, id)
}

func (r *LessonRepository) GetRecentLessonsByDiscipline(ctx context.Context, rupName string, disciplineName string, limit int32) ([]storage.Lesson, error) {
	return r.queries.GetRecentLessonsByDiscipline(ctx, storage.GetRecentLessonsByDisciplineParams{
		Column1: rupName,
		Column2: disciplineName,
		Limit:   limit,
	})
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
