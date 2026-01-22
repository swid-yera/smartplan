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
	GetUsersPaginated(ctx context.Context, limit int32, offset int32, search string) ([]storage.User, error)

	CountUsersFiltered(ctx context.Context, search string) (int64, error)
}

type Auth interface {
	GetUserByKeycloakID(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
}

type Rup interface {
	CreateRup(ctx context.Context, params storage.CreateRupsParams) (*storage.Rup, error)
	GetRupByID(ctx context.Context, id uuid.UUID) (*storage.Rup, error)
	GetAllRups(ctx context.Context, limit int32, offset int32) ([]storage.Rup, error)
	UpdateRupStatus(ctx context.Context, id uuid.UUID, status storage.RupsStatus, reason pgtype.Text, methodist pgtype.UUID) error
	GetRupsByMethodist(ctx context.Context, methodist pgtype.UUID) ([]storage.Rup, error)
	DeleteRup(ctx context.Context, id uuid.UUID) error

	// Additional methods for related entities
	CreateExplorationNote(ctx context.Context, params storage.CreateRupExplorationNoteParams) (*storage.RupExplorationNote, error)
	CreateResource(ctx context.Context, params storage.CreateRupResourceParams) (*storage.RupResource, error)
	CreateDiscipline(ctx context.Context, params storage.CreateRupDisciplineParams) (*storage.RupDiscipline, error)
	CreateSemester(ctx context.Context, params storage.CreateDisciplineSemesterParams) (*storage.DisciplineSemester, error)
	CreateTopic(ctx context.Context, params storage.CreateDisciplineTopicParams) (*storage.DisciplineTopic, error)

	GetUserByID(ctx context.Context, id uuid.UUID) (*storage.User, error)
	GetGroupByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.Group, error)
	GetExplorationNoteByID(ctx context.Context, id uuid.UUID) (*storage.RupExplorationNote, error)
	GetDisciplineByID(ctx context.Context, id uuid.UUID) (*storage.RupDiscipline, error)
	GetResourceByID(ctx context.Context, id uuid.UUID) (*storage.RupResource, error)
	GetSemesterByID(ctx context.Context, id uuid.UUID) (*storage.DisciplineSemester, error)
	GetTopicByID(ctx context.Context, id uuid.UUID) (*storage.DisciplineTopic, error)
}

type Repository struct {
	Users UsersRepository
	Auth  Auth
	Rup   Rup
}

func NewRepository(queries *storage.Queries) *Repository {
	return &Repository{
		Users: NewUsersPostgres(queries),
		Auth:  NewAuthPostgres(queries),
		Rup:   NewRupPostgres(queries),
	}
}
