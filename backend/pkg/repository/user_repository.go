package repository

import (
	"context"
	"fmt"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UsersPostgres struct {
	queries *storage.Queries
}

func NewUsersPostgres(queries *storage.Queries) *UsersPostgres {
	return &UsersPostgres{queries: queries}
}

func (r *UsersPostgres) GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.User, error) {
	user, err := r.queries.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, fmt.Errorf("get user by keycloak id: %w", err)
	}
	return &user, nil
}

func (r *UsersPostgres) DeleteByKeycloakID(
	ctx context.Context,
	keycloakID uuid.UUID,
) error {
	return r.queries.DeleteUser(ctx, keycloakID)
}

func (r *UsersPostgres) UpdateLastSeenAt(
	ctx context.Context,
	keycloakID uuid.UUID,
	at time.Time,
) error {
	return r.queries.UpdateUserLastSeenAt(
		ctx,
		storage.UpdateUserLastSeenAtParams{
			KeycloakID: keycloakID,
			LastSeenAt: pgtype.Timestamptz{
				Time:  at,
				Valid: true,
			},
		},
	)
}

func (r *UsersPostgres) UpdatePasswordChangedAt(
	ctx context.Context,
	keycloakID uuid.UUID,
	at time.Time,
) error {
	return r.queries.UpdateUserPasswordChangedAt(
		ctx,
		storage.UpdateUserPasswordChangedAtParams{
			KeycloakID: keycloakID,
			PasswordChangedAt: pgtype.Timestamptz{
				Time:  at,
				Valid: true,
			},
		},
	)
}

func (r *UsersPostgres) UpdateRoles(
	ctx context.Context,
	keycloakID uuid.UUID,
	roles storage.UserRole,
) error {
	return r.queries.UpdateUserRole(
		ctx,
		storage.UpdateUserRoleParams{
			KeycloakID: keycloakID,
			Role:       roles,
		},
	)
}

func (r *UsersPostgres) GetAllUsers(ctx context.Context, limit int32, offset int32, search string) ([]storage.User, error) {
	return r.queries.GetAllUsers(ctx, storage.GetAllUsersParams{
		Limit:  limit,
		Offset: offset,
	})
}
func (r *UsersPostgres) CountUsers(ctx context.Context) (int64, error) {
	return r.queries.CountUsers(ctx)
}

func (r *UsersPostgres) GetUsersRatingPaginated(ctx context.Context, limit int32, offset int32, search string, sort string) ([]storage.User, error) {
	return r.queries.GetUsersRatingPaginated(ctx, storage.GetUsersRatingPaginatedParams{
		Search: search,
		Sort:   sort,
		Offset: offset,
		Limit:  limit,
	})
}

func (r *UsersPostgres) GetTeachersRatingWithDepartments(ctx context.Context) ([]storage.User, error) {
	return r.queries.GetTeachersRatingWithDepartments(ctx)
}

func (r *UsersPostgres) GetTopAwardDepartmentsStats(ctx context.Context) ([]storage.GetTopAwardDepartmentsStatsRow, error) {
	return r.queries.GetTopAwardDepartmentsStats(ctx)
}

func (r *UsersPostgres) GetUsersPaginated(ctx context.Context, limit int32, offset int32, search string, sort string, departmentID pgtype.UUID) ([]storage.User, error) {
	return r.queries.GetUsersPaginated(ctx, storage.GetUsersPaginatedParams{
		Search:       search,
		Limit:        limit,
		Offset:       offset,
		Sort:         sort,
		DepartmentID: departmentID,
	})
}

func (r *UsersPostgres) CountUsersFiltered(ctx context.Context, search string, departmentID pgtype.UUID) (int64, error) {
	return r.queries.CountUsersFiltered(ctx, storage.CountUsersFilteredParams{
		Search:       search,
		DepartmentID: departmentID,
	})
}

func (r *UsersPostgres) CountUsersRatingFiltered(ctx context.Context, search string) (int64, error) {
	return r.queries.CountUsersRatingFiltered(ctx, search)
}

func (r *UsersPostgres) GetDepartmentsByUserID(ctx context.Context, userID uuid.UUID) ([]storage.Department, error) {
	return r.queries.GetDepartmentsByUserID(ctx, userID)
}

func (r *UsersPostgres) UpdateUserTotalPoints(ctx context.Context, teacher uuid.UUID, points int32) error {
	return r.queries.UpdateUserTotalPoints(ctx, storage.UpdateUserTotalPointsParams{
		KeycloakID:  teacher,
		TotalPoints: points,
	})
}

func (r *UsersPostgres) CreatePenalty(ctx context.Context, params storage.CreatePenaltyParams) error {
	_, err := r.queries.CreatePenalty(ctx, params)
	return err
}

func (r *UsersPostgres) GetPenaltiesByTeacherID(ctx context.Context, teacherID uuid.UUID) ([]storage.Penalty, error) {
	return r.queries.GetPenaltiesByTeacherID(ctx, pgtype.UUID{
		Bytes: teacherID,
		Valid: true,
	})
}

func (r *UsersPostgres) GetPenaltyByIDAndTeacherID(ctx context.Context, params storage.GetPenaltyByIDAndTeacherIDParams) (storage.Penalty, error) {
	return r.queries.GetPenaltyByIDAndTeacherID(ctx, params)
}

func (r *UsersPostgres) DeletePenaltyByIDAndTeacherID(ctx context.Context, params storage.DeletePenaltyByIDAndTeacherIDParams) error {
	return r.queries.DeletePenaltyByIDAndTeacherID(ctx, params)
}

func (r *UsersPostgres) CreateViolation(ctx context.Context, params storage.CreateViolationParams) (storage.Violation, error) {
	return r.queries.CreateViolation(ctx, params)
}

func (r *UsersPostgres) UpdateViolationByIDAndUserID(ctx context.Context, params storage.UpdateViolationByIDAndUserIDParams) (storage.Violation, error) {
	return r.queries.UpdateViolationByIDAndUserID(ctx, params)
}

func (r *UsersPostgres) GetViolationByIDAndUserID(ctx context.Context, params storage.GetViolationByIDAndUserIDParams) (storage.Violation, error) {
	return r.queries.GetViolationByIDAndUserID(ctx, params)
}

func (r *UsersPostgres) DeleteViolationByIDAndUserID(ctx context.Context, params storage.DeleteViolationByIDAndUserIDParams) error {
	return r.queries.DeleteViolationByIDAndUserID(ctx, params)
}

func (r *UsersPostgres) GetViolationsByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.Violation, error) {
	return r.queries.GetViolationsByIDs(ctx, ids)
}

func (r *UsersPostgres) ApplyViolationToUser(ctx context.Context, params storage.ApplyViolationToUserParams) (*storage.User, error) {
	user, err := r.queries.ApplyViolationToUser(ctx, params)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UsersPostgres) RemoveViolationFromUser(ctx context.Context, params storage.RemoveViolationFromUserParams) (*storage.User, error) {
	user, err := r.queries.RemoveViolationFromUser(ctx, params)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
