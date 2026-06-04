package repository

import (
	"context"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UsersRepository interface {
	DeleteByKeycloakID(ctx context.Context, keycloakID uuid.UUID) error
	UpdateLastSeenAt(ctx context.Context, keycloakID uuid.UUID, at time.Time) error
	UpdatePasswordChangedAt(ctx context.Context, keycloakID uuid.UUID, at time.Time) error
	UpdateRoles(ctx context.Context, keycloakID uuid.UUID, roles storage.UserRole) error
	GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.User, error)
	GetAllUsers(ctx context.Context, limit int32, offset int32, search string) ([]storage.User, error)
	CountUsers(ctx context.Context) (int64, error)
	GetUsersPaginated(ctx context.Context, limit int32, offset int32, search string, sort string, departmentID pgtype.UUID) ([]storage.User, error)
	GetUsersRatingPaginated(ctx context.Context, limit int32, offset int32, search string, sort string) ([]storage.User, error)
	GetTeachersRatingWithDepartments(ctx context.Context) ([]storage.User, error)
	GetTopAwardDepartmentsStats(ctx context.Context) ([]storage.GetTopAwardDepartmentsStatsRow, error)

	CountUsersFiltered(ctx context.Context, search string, departmentID pgtype.UUID) (int64, error)
	CountUsersRatingFiltered(ctx context.Context, search string) (int64, error)
	GetDepartmentsByUserID(ctx context.Context, userID uuid.UUID) ([]storage.Department, error)

	UpdateUserTotalPoints(ctx context.Context, teacher uuid.UUID, points int32) error
	CreatePenalty(ctx context.Context, params storage.CreatePenaltyParams) error
	GetPenaltiesByTeacherID(ctx context.Context, teacherID uuid.UUID) ([]storage.Penalty, error)
	GetPenaltyByIDAndTeacherID(ctx context.Context, params storage.GetPenaltyByIDAndTeacherIDParams) (storage.Penalty, error)
	DeletePenaltyByIDAndTeacherID(ctx context.Context, params storage.DeletePenaltyByIDAndTeacherIDParams) error

	CreateViolation(ctx context.Context, params storage.CreateViolationParams) (storage.Violation, error)
	UpdateViolationByIDAndUserID(ctx context.Context, params storage.UpdateViolationByIDAndUserIDParams) (storage.Violation, error)
	GetViolationByIDAndUserID(ctx context.Context, params storage.GetViolationByIDAndUserIDParams) (storage.Violation, error)
	DeleteViolationByIDAndUserID(ctx context.Context, params storage.DeleteViolationByIDAndUserIDParams) error
	GetViolationsByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.Violation, error)
	ApplyViolationToUser(ctx context.Context, params storage.ApplyViolationToUserParams) (*storage.User, error)
	RemoveViolationFromUser(ctx context.Context, params storage.RemoveViolationFromUserParams) (*storage.User, error)
}

type Auth interface {
	GetUserByKeycloakID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
}

type Rup interface {
	CreateRup(ctx context.Context, params storage.CreateRupsParams) (*storage.Rup, error)
	GetRupByID(ctx context.Context, id uuid.UUID) (*storage.Rup, error)
	UpdateRupStatus(ctx context.Context, id uuid.UUID, status storage.RupsStatus, reason pgtype.Text, methodistID pgtype.UUID) error
	UpdateRup(ctx context.Context, params storage.UpdateRupParams) (*storage.Rup, error)
	DeleteRup(ctx context.Context, id uuid.UUID) error

	CreateExplorationNote(ctx context.Context, params storage.CreateRupExplorationNoteParams) (*storage.RupExplorationNote, error)
	CreateResource(ctx context.Context, params storage.CreateRupResourceParams) (*storage.RupResource, error)
	CreateDiscipline(ctx context.Context, params storage.CreateRupDisciplineParams) (*storage.RupDiscipline, error)
	CreateSemester(ctx context.Context, params storage.CreateDisciplineSemesterParams) (*storage.DisciplineSemester, error)
	CreateTopic(ctx context.Context, params storage.CreateDisciplineTopicParams) (*storage.DisciplineTopic, error)

	GetUserByID(ctx context.Context, id uuid.UUID) (*storage.User, error)
	GetGroupByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.Group, error)
	GetExplorationNoteByID(ctx context.Context, id uuid.UUID) (*storage.RupExplorationNote, error)
	GetDisciplineByID(ctx context.Context, id uuid.UUID) (*storage.RupDiscipline, error)
	GetDisciplineByTopicID(ctx context.Context, topicID uuid.UUID) (*storage.RupDiscipline, error)
	GetResourceByID(ctx context.Context, id uuid.UUID) (*storage.RupResource, error)
	GetSemesterByID(ctx context.Context, id uuid.UUID) (*storage.DisciplineSemester, error)
	GetTopicByID(ctx context.Context, id uuid.UUID) (*storage.DisciplineTopic, error)
	GetTopicByLessonID(ctx context.Context, lessonID uuid.UUID) (*storage.DisciplineTopic, error)
	GetRupByDisciplineID(ctx context.Context, disciplineID uuid.UUID) (*storage.Rup, error)
	UpdateTopic(ctx context.Context, params storage.UpdateDisciplineTopicParams) error
	LinkLessonToTopic(ctx context.Context, topicID uuid.UUID, lessonID *uuid.UUID) error

	CountRupsFiltered(ctx context.Context, search string, teacher pgtype.UUID, methodist pgtype.UUID, status []string) (int64, error)
	GetRupsPaginated(ctx context.Context, limit int32, offset int32, search string, sort string, teacher pgtype.UUID, methodist pgtype.UUID, status []string) ([]storage.Rup, error)
	CountRups(ctx context.Context) (int64, error)
}

type Lessons interface {
	CreateLesson(ctx context.Context, params storage.CreateLessonsParams) (uuid.UUID, error)
	UpdateLesson(ctx context.Context, params storage.UpdateLessonParams) error
	UpdateLessonFileURL(ctx context.Context, id uuid.UUID, fileURL string) error
	DeleteLesson(ctx context.Context, id uuid.UUID) error
	GetLessons(ctx context.Context, search string, teacher pgtype.UUID, id pgtype.UUID, lessonType string, discipline string, groupName string, sort string, limit int32, offset int32) ([]storage.Lesson, error)
	GetLessonByID(ctx context.Context, id uuid.UUID) (storage.Lesson, error)
	GetPreviousLessonByCreatedAt(ctx context.Context, createdAt pgtype.Timestamptz, id uuid.UUID) (storage.Lesson, error)
	GetNextLessonByCreatedAt(ctx context.Context, createdAt pgtype.Timestamptz, id uuid.UUID) (storage.Lesson, error)
	GetRecentLessonsByDiscipline(ctx context.Context, rupName string, disciplineName string, limit int32) ([]storage.Lesson, error)
	CountLessonsFiltered(ctx context.Context, search string, teacher pgtype.UUID, id pgtype.UUID, lessonType string, discipline string, groupName string) (int64, error)

	CreateLessonProgress(ctx context.Context, params storage.CreateLessonProgressParams) error
	UpdateLessonProgress(ctx context.Context, params storage.UpdateLessonProgressParams) error
	DeleteLessonProgress(ctx context.Context, id uuid.UUID) error
	GetLessonProgressByID(ctx context.Context, id uuid.UUID) (storage.LessonProgress, error)
	GetLessonProgressByLessonID(ctx context.Context, lessonID uuid.UUID) ([]storage.LessonProgress, error)
}

type Repository struct {
	Users   UsersRepository
	Auth    Auth
	Rup     Rup
	Lessons Lessons
}

func NewRepository(queries *storage.Queries) *Repository {
	return &Repository{
		Users:   NewUsersPostgres(queries),
		Auth:    NewAuthPostgres(queries),
		Rup:     NewRupPostgres(queries),
		Lessons: NewLessonRepository(queries),
	}
}
