package service

import (
	"context"
	"errors"
	"math"
	"sort"
	"strings"
	"time"

	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

type UserDepartment struct {
	KeycloakID uuid.UUID               `json:"keycloakId"`
	Name       localization.LocaleText `json:"name"`
}

type User struct {
	KeycloakID         uuid.UUID          `json:"keycloakId"`
	Email              string             `json:"email"`
	Username           string             `json:"username"`
	FirstName          string             `json:"firstName"`
	LastName           string             `json:"lastName"`
	Role               string             `json:"role"`
	UserType           string             `json:"userType"`
	Phone              string             `json:"phone"`
	Departments        []UserDepartment   `json:"departments"`
	Permissions        []PermissionCode   `json:"permissions"`
	PointsByCategories map[string]int32   `json:"pointsByCategories"`
	Violation          string             `json:"violation"`
	Violations         []*ViolationRecord `json:"violations"`
}

type Penalty struct {
	ID          uuid.UUID `json:"id"`
	Points      int32     `json:"points"`
	TeacherID   uuid.UUID `json:"teacherId"`
	MethodistID uuid.UUID `json:"methodistId"`
	Note        string    `json:"note"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ViolationRecord struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	IssuedBy  uuid.UUID `json:"issuedBy"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ViolationActionResponse struct {
	Violation *ViolationRecord `json:"violation"`
	User      *User            `json:"user"`
}

type PaginationMeta struct {
	CurrentPage int `json:"currentPage"`
	Pages       int `json:"pages"`
	Total       int `json:"total"`
	PageSize    int `json:"pageSize"`
}

type PaginatedUsersResponse struct {
	Data []*User        `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type DepartmentTopTeachersResponse struct {
	KeycloakID    uuid.UUID               `json:"keycloakId"`
	Name          localization.LocaleText `json:"name"`
	TeachersCount int                     `json:"teachersCount"`
	Teachers      []*User                 `json:"teachers"`
}

type departmentTeachersGroup struct {
	response DepartmentTopTeachersResponse
	score    int32
}

type UserService interface {
	GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*User, error)
	GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*User, error)
	GetUserBySessionIDFromStorageUser(ctx context.Context, sessionID uuid.UUID) (*storage.User, error)
	GetUsersPaginated(ctx context.Context, CurrentPage int, pageSize int, search string, sort string, userType string, departmentID pgtype.UUID) (*PaginatedUsersResponse, error)
	GetUsersRatingPaginated(ctx context.Context, CurrentPage int, pageSize int, search string, sort string) (*PaginatedUsersResponse, error)
	GetTeachersRatingWithDepartments(ctx context.Context) ([]*User, error)
	GetTopTeachersByDepartment(ctx context.Context) ([]DepartmentTopTeachersResponse, error)
	GetTeachersByDepartment(ctx context.Context, departmentID uuid.UUID) (*DepartmentTopTeachersResponse, error)
	GetTopAwardDepartmentsStats(ctx context.Context) ([]AwardDepartmentResponse, error)
	IssueViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, note string) (*ViolationActionResponse, error)
	UpdateViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, violationID uuid.UUID, note string) (*ViolationActionResponse, error)
	DeleteViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, violationID uuid.UUID) error
	CreatePenalty(ctx context.Context, methodistID uuid.UUID, teacherID uuid.UUID, points int32, note string) (*Penalty, error)
	GetPenaltiesByTeacherID(ctx context.Context, teacherID uuid.UUID) ([]*Penalty, error)
	GetPenaltyByIDAndTeacherID(ctx context.Context, penaltyID uuid.UUID, teacherID uuid.UUID) (*Penalty, error)
	DeletePenaltyByIDAndTeacherID(ctx context.Context, penaltyID uuid.UUID, teacherID uuid.UUID) error
	CountUsers(ctx context.Context) (int64, error)
}

type userService struct {
	repo        repository.UsersRepository
	permissions repository.Permissions
	redis       *redis.Client
}

func NewUserService(repo repository.UsersRepository, permissions repository.Permissions, redisClient *redis.Client) UserService {
	return &userService{repo: repo, permissions: permissions, redis: redisClient}
}

func (s *userService) GetUserBySessionID(ctx context.Context, sessionID uuid.UUID) (*User, error) {
	sessionKey := "session:" + sessionID.String()

	sessionData, err := s.redis.HGetAll(ctx, sessionKey).Result()
	if err != nil {
		return nil, err
	}

	keycloakIDStr := strings.TrimSpace(sessionData["keycloak_id"])
	if keycloakIDStr == "" {
		return nil, errors.New("session missing keycloak_id")
	}

	keycloakID, err := uuid.Parse(keycloakIDStr)
	if err != nil {
		return nil, err
	}

	dbUser, err := s.repo.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, err
	}

	return s.toServiceUser(ctx, dbUser)
}

func (s *userService) GetUserBySessionIDFromStorageUser(ctx context.Context, sessionID uuid.UUID) (*storage.User, error) {
	sessionKey := "session:" + sessionID.String()

	keycloakIDStr, err := s.redis.HGet(ctx, sessionKey, "keycloak_id").Result()
	if err != nil {
		return nil, err
	}

	keycloakID, err := uuid.Parse(keycloakIDStr)
	if err != nil {
		return nil, err
	}
	return s.repo.GetUserByKeycloakID(ctx, keycloakID)
}

func (s *userService) GetUsersPaginated(
	ctx context.Context,
	currentPage int,
	pageSize int,
	search string,
	sort string,
	userType string,
	departmentID pgtype.UUID,
) (*PaginatedUsersResponse, error) {
	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountUsersFiltered(ctx, search, userType, departmentID)
	if err != nil {
		return nil, err
	}

	dbUsers, err := s.repo.GetUsersPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		search,
		sort,
		userType,
		departmentID,
	)
	if err != nil {
		return nil, err
	}

	users, err := s.toServiceUsers(ctx, dbUsers)
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	return &PaginatedUsersResponse{
		Data: users,
		Meta: PaginationMeta{
			CurrentPage: currentPage,
			Pages:       pages,
			Total:       int(total),
			PageSize:    pageSize,
		},
	}, nil
}

func (s *userService) GetUsersRatingPaginated(
	ctx context.Context,
	currentPage int,
	pageSize int,
	search string,
	sort string,
) (*PaginatedUsersResponse, error) {
	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountUsersRatingFiltered(ctx, search)
	if err != nil {
		return nil, err
	}

	dbUsers, err := s.repo.GetUsersRatingPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		search,
		sort,
	)
	if err != nil {
		return nil, err
	}

	users, err := s.toServiceUsers(ctx, dbUsers)
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	return &PaginatedUsersResponse{
		Data: users,
		Meta: PaginationMeta{
			CurrentPage: currentPage,
			Pages:       pages,
			Total:       int(total),
			PageSize:    pageSize,
		},
	}, nil
}

func (s *userService) GetTeachersRatingWithDepartments(ctx context.Context) ([]*User, error) {
	dbUsers, err := s.repo.GetTeachersRatingWithDepartments(ctx)
	if err != nil {
		return nil, err
	}

	users, err := s.toServiceUsers(ctx, dbUsers)
	if err != nil {
		return nil, err
	}

	filteredUsers := make([]*User, 0, len(users))
	for _, user := range users {
		if user == nil {
			continue
		}

		if user.Role == string(storage.UserRoleMETHODIST) {
			continue
		}

		if len(user.Departments) == 0 {
			continue
		}

		if !HasPermissionExact(user.Permissions, PermKPIView) {
			continue
		}

		if !isKPIStatsUserType(user.UserType) {
			continue
		}

		filteredUsers = append(filteredUsers, user)
	}

	sortTeachersByScoreAndLastName(filteredUsers)

	return filteredUsers, nil
}

func (s *userService) GetTopTeachersByDepartment(ctx context.Context) ([]DepartmentTopTeachersResponse, error) {
	users, err := s.GetTeachersRatingWithDepartments(ctx)
	if err != nil {
		return nil, err
	}

	groups := s.groupTeachersByDepartment(users, 3)
	result := make([]DepartmentTopTeachersResponse, 0, len(groups))
	for _, group := range groups {
		result = append(result, group.response)
	}

	return result, nil
}

func (s *userService) GetTeachersByDepartment(ctx context.Context, departmentID uuid.UUID) (*DepartmentTopTeachersResponse, error) {
	dbUsers, err := s.repo.GetUsersPaginated(
		ctx,
		math.MaxInt32,
		0,
		"",
		"desc",
		"",
		pgtype.UUID{Bytes: departmentID, Valid: true},
	)
	if err != nil {
		return nil, err
	}

	users, err := s.toServiceUsers(ctx, dbUsers)
	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "department not found"}
	}

	teachers := make([]*User, 0, len(users))
	var departmentName localization.LocaleText
	departmentFound := false

	for _, user := range users {
		if user == nil {
			continue
		}

		for _, department := range user.Departments {
			if department.KeycloakID != departmentID {
				continue
			}

			if !departmentFound {
				departmentName = department.Name
				departmentFound = true
			}

			teachers = append(teachers, user)
			break
		}
	}

	if !departmentFound {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "department not found"}
	}

	sortTeachersByScoreAndName(teachers)

	return &DepartmentTopTeachersResponse{
		KeycloakID:    departmentID,
		Name:          departmentName,
		TeachersCount: len(teachers),
		Teachers:      teachers,
	}, nil
}

func (s *userService) groupTeachersByDepartment(users []*User, limit int) []departmentTeachersGroup {
	groups := make(map[string]*departmentTeachersGroup)

	for _, user := range users {
		if user == nil {
			continue
		}

		for _, department := range user.Departments {
			key := department.KeycloakID.String()
			group, ok := groups[key]
			if !ok {
				group = &departmentTeachersGroup{
					response: DepartmentTopTeachersResponse{
						KeycloakID:    department.KeycloakID,
						Name:          department.Name,
						Teachers:      []*User{},
						TeachersCount: 0,
					},
				}
				groups[key] = group
			}

			group.response.Teachers = append(group.response.Teachers, user)
			group.response.TeachersCount++
		}
	}

	result := make([]departmentTeachersGroup, 0, len(groups))
	for _, group := range groups {
		sortTeachersByScoreAndName(group.response.Teachers)

		if limit > 0 && len(group.response.Teachers) > limit {
			group.response.Teachers = group.response.Teachers[:limit]
		}

		for _, teacher := range group.response.Teachers {
			if teacher != nil {
				group.score += sumPointsByCategories(teacher.PointsByCategories)
			}
		}

		result = append(result, *group)
	}

	sort.SliceStable(result, func(i, j int) bool {
		if result[i].score != result[j].score {
			return result[i].score > result[j].score
		}

		left := localization.LocaleTextFromJSONB(result[i].response.Name.ToJSONB())
		right := localization.LocaleTextFromJSONB(result[j].response.Name.ToJSONB())
		return strings.TrimSpace(left.Ru+left.Kz) < strings.TrimSpace(right.Ru+right.Kz)
	})

	return result
}

func sortTeachersByScoreAndName(teachers []*User) {
	sort.SliceStable(teachers, func(i, j int) bool {
		left := teachers[i]
		right := teachers[j]

		leftPoints := int32(0)
		rightPoints := int32(0)
		leftName := ""
		rightName := ""
		leftID := ""
		rightID := ""

		if left != nil {
			leftPoints = sumPointsByCategories(left.PointsByCategories)
			leftName = strings.TrimSpace(left.FirstName + " " + left.LastName)
			leftID = left.KeycloakID.String()
		}
		if right != nil {
			rightPoints = sumPointsByCategories(right.PointsByCategories)
			rightName = strings.TrimSpace(right.FirstName + " " + right.LastName)
			rightID = right.KeycloakID.String()
		}

		if leftPoints != rightPoints {
			return leftPoints > rightPoints
		}
		if leftName != rightName {
			return leftName < rightName
		}
		return leftID < rightID
	})
}

func sortTeachersByScoreAndLastName(teachers []*User) {
	sort.SliceStable(teachers, func(i, j int) bool {
		left := teachers[i]
		right := teachers[j]

		leftPoints := int32(0)
		rightPoints := int32(0)
		leftLastName := ""
		rightLastName := ""
		leftFirstName := ""
		rightFirstName := ""
		leftUsername := ""
		rightUsername := ""
		leftID := ""
		rightID := ""

		if left != nil {
			leftPoints = sumPointsByCategories(left.PointsByCategories)
			leftLastName = strings.ToLower(strings.TrimSpace(left.LastName))
			leftFirstName = strings.ToLower(strings.TrimSpace(left.FirstName))
			leftUsername = strings.ToLower(strings.TrimSpace(left.Username))
			leftID = left.KeycloakID.String()
		}
		if right != nil {
			rightPoints = sumPointsByCategories(right.PointsByCategories)
			rightLastName = strings.ToLower(strings.TrimSpace(right.LastName))
			rightFirstName = strings.ToLower(strings.TrimSpace(right.FirstName))
			rightUsername = strings.ToLower(strings.TrimSpace(right.Username))
			rightID = right.KeycloakID.String()
		}

		if leftPoints != rightPoints {
			return leftPoints > rightPoints
		}
		if leftLastName != rightLastName {
			return leftLastName < rightLastName
		}
		if leftFirstName != rightFirstName {
			return leftFirstName < rightFirstName
		}
		if leftUsername != rightUsername {
			return leftUsername < rightUsername
		}
		return leftID < rightID
	})
}

func isKPIStatsUserType(userType string) bool {
	switch strings.ToUpper(strings.TrimSpace(userType)) {
	case "GENERAL", "SPECIALIST", "MASTER":
		return true
	default:
		return false
	}
}

func (s *userService) GetTopAwardDepartmentsStats(ctx context.Context) ([]AwardDepartmentResponse, error) {
	rows, err := s.repo.GetTopAwardDepartmentsStats(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]AwardDepartmentResponse, 0, len(rows))
	for _, row := range rows {
		result = append(result, AwardDepartmentResponse{
			KeycloakID:  row.KeycloakID,
			Name:        localization.LocaleTextFromJSONB(row.Name),
			TotalPoints: row.TotalPoints,
			UserCount:   row.UserCount,
		})
	}

	return result, nil
}

// toServiceUsers — batch-версия toServiceUser.
// Загружает departments и violations для всех пользователей за 2 запроса вместо 2×N.
func (s *userService) toServiceUsers(ctx context.Context, dbUsers []storage.User) ([]*User, error) {
	if len(dbUsers) == 0 {
		return []*User{}, nil
	}

	// Собираем ID всех пользователей
	userIDs := make([]uuid.UUID, len(dbUsers))
	for i, u := range dbUsers {
		userIDs[i] = u.KeycloakID
	}

	// Batch: departments для всех пользователей за 1 запрос
	deptRows, err := s.repo.GetDepartmentsForUsers(ctx, userIDs)
	if err != nil {
		return nil, err
	}
	// Строим map: userID → []UserDepartment
	// GetDepartmentsForUsersRow содержит одну запись на каждую пару (department, member).
	// MemberID — interface{} из-за unnest, приводим к uuid.UUID через pgtype.
	deptMap := map[uuid.UUID][]UserDepartment{}
	for _, row := range deptRows {
		var memberID uuid.UUID
		switch v := row.MemberID.(type) {
		case uuid.UUID:
			memberID = v
		case [16]byte:
			memberID = uuid.UUID(v)
		case string:
			if parsed, err := uuid.Parse(v); err == nil {
				memberID = parsed
			}
		default:
			continue
		}
		dept := UserDepartment{
			KeycloakID: row.KeycloakID,
			Name:       localization.LocaleTextFromJSONB(row.Name),
		}
		deptMap[memberID] = append(deptMap[memberID], dept)
	}

	// Batch: violations — собираем все ViolationIds
	var allViolationIDs []uuid.UUID
	for _, u := range dbUsers {
		allViolationIDs = append(allViolationIDs, u.ViolationIds...)
	}
	violationMap := map[uuid.UUID]*ViolationRecord{}
	if len(allViolationIDs) > 0 {
		dbViolations, err := s.repo.GetViolationsByIDs(ctx, allViolationIDs)
		if err != nil {
			return nil, err
		}
		for _, v := range dbViolations {
			v := v
			violationMap[v.ID] = mapViolationRecord(v)
		}
	}

	// Собираем результат
	users := make([]*User, 0, len(dbUsers))
	for _, dbUser := range dbUsers {
		firstName, lastName, phone := "", "", ""
		if dbUser.FirstName.Valid {
			firstName = dbUser.FirstName.String
		}
		if dbUser.LastName.Valid {
			lastName = dbUser.LastName.String
		}
		if dbUser.Phone.Valid {
			phone = dbUser.Phone.String
		}

		departments := deptMap[dbUser.KeycloakID]
		if departments == nil {
			departments = []UserDepartment{}
		}

		violations := make([]*ViolationRecord, 0, len(dbUser.ViolationIds))
		for _, vid := range dbUser.ViolationIds {
			if v, ok := violationMap[vid]; ok {
				violations = append(violations, v)
			}
		}

		permissions, err := s.resolveEffectivePermissions(ctx, storage.UserRole(dbUser.Role), dbUser.UserType, dbUser.KeycloakID, departments)
		if err != nil {
			return nil, err
		}

		pointsByCategories, err := decodePointsByCategories(dbUser.PointsByCategories)
		if err != nil {
			return nil, err
		}

		users = append(users, &User{
			KeycloakID:         dbUser.KeycloakID,
			Email:              dbUser.Email,
			Username:           dbUser.Username,
			FirstName:          firstName,
			LastName:           lastName,
			Role:               string(dbUser.Role),
			UserType:           string(dbUser.UserType),
			Phone:              phone,
			Departments:        departments,
			Permissions:        permissions,
			PointsByCategories: pointsByCategories,
			Violation:          string(dbUser.Violation),
			Violations:         violations,
		})
	}
	return users, nil
}

func (s *userService) toServiceUser(ctx context.Context, user *storage.User) (*User, error) {
	firstName := ""
	lastName := ""
	phone := ""

	if user.FirstName.Valid {
		firstName = user.FirstName.String
	}
	if user.LastName.Valid {
		lastName = user.LastName.String
	}
	if user.Phone.Valid {
		phone = user.Phone.String
	}

	departments, err := s.repo.GetDepartmentsByUserID(ctx, user.KeycloakID)
	if err != nil {
		return nil, err
	}

	mappedDepartments := make([]UserDepartment, 0, len(departments))
	for _, department := range departments {
		mappedDepartments = append(mappedDepartments, UserDepartment{
			KeycloakID: department.KeycloakID,
			Name:       localization.LocaleTextFromJSONB(department.Name),
		})
	}

	violations := make([]*ViolationRecord, 0)
	if len(user.ViolationIds) > 0 {
		dbViolations, err := s.repo.GetViolationsByIDs(ctx, user.ViolationIds)
		if err != nil {
			return nil, err
		}
		violations = make([]*ViolationRecord, 0, len(dbViolations))
		for _, dbViolation := range dbViolations {
			violations = append(violations, mapViolationRecord(dbViolation))
		}
	}

	permissions, err := s.resolveEffectivePermissions(ctx, user.Role, user.UserType, user.KeycloakID, mappedDepartments)
	if err != nil {
		return nil, err
	}

	pointsByCategories, err := decodePointsByCategories(user.PointsByCategories)
	if err != nil {
		return nil, err
	}

	return &User{
		KeycloakID:         user.KeycloakID,
		Email:              user.Email,
		Username:           user.Username,
		FirstName:          firstName,
		LastName:           lastName,
		Role:               string(user.Role),
		UserType:           string(user.UserType),
		Phone:              phone,
		Departments:        mappedDepartments,
		Permissions:        permissions,
		PointsByCategories: pointsByCategories,
		Violation:          string(user.Violation),
		Violations:         violations,
	}, nil
}

func (s *userService) GetUserByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*User, error) {
	dbUser, err := s.repo.GetUserByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, err
	}

	return s.toServiceUser(ctx, dbUser)
}

func (s *userService) CountUsers(ctx context.Context) (int64, error) {
	return s.repo.CountUsers(ctx)
}

func (s *userService) resolveEffectivePermissions(
	ctx context.Context,
	role storage.UserRole,
	userType storage.UserType,
	userID uuid.UUID,
	departments []UserDepartment,
) ([]PermissionCode, error) {
	basePermissions := basePermissionsForRole(role, userType, departments)

	if s.permissions == nil {
		return basePermissions, nil
	}

	if role == storage.UserRoleADMIN {
		return basePermissions, nil
	}

	row, err := s.permissions.GetUserPermissions(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return basePermissions, nil
		}
		return nil, err
	}

	return mergePermissionCodes(basePermissions, row.Permissions), nil
}

func basePermissionsForRole(
	role storage.UserRole,
	userType storage.UserType,
	departments []UserDepartment,
) []PermissionCode {
	switch role {
	case storage.UserRoleADMIN:
		return []PermissionCode{PermRUPFull, PermKPIFull}
	case storage.UserRoleSPECIAL:
		perms := []PermissionCode{PermRUPView}
		if len(departments) > 0 && isKPIAccessSpecialType(userType) {
			perms = append(perms, PermKPIView)
		}
		return perms
	case storage.UserRoleMETHODIST:
		return []PermissionCode{PermRUPManage, PermKPIManage}
	case storage.UserRoleTEACHER:
		perms := []PermissionCode{PermRUPView}
		if len(departments) > 0 && isKPIAccessTeacherType(userType) {
			perms = append(perms, PermKPIView)
		}
		return perms
	default:
		return []PermissionCode{}
	}
}

func isKPIAccessTeacherType(userType storage.UserType) bool {
	switch userType {
	case storage.UserTypeGENERAL, storage.UserTypeHEAD, storage.UserTypeMASTER, storage.UserTypeSPECIALIST:
		return true
	default:
		return false
	}
}

func isKPIAccessSpecialType(userType storage.UserType) bool {
	switch userType {
	case storage.UserTypeGENERAL, storage.UserTypeMASTER, storage.UserTypeSPECIALIST:
		return true
	default:
		return false
	}
}

func normalizePermissionCodes(codes []PermissionCode) []PermissionCode {
	if len(codes) == 0 {
		return []PermissionCode{}
	}

	seen := make(map[PermissionCode]struct{}, len(codes))
	result := make([]PermissionCode, 0, len(codes))
	for _, code := range codes {
		if _, ok := seen[code]; ok {
			continue
		}
		seen[code] = struct{}{}
		result = append(result, code)
	}

	return result
}

func (s *userService) CreatePenalty(ctx context.Context, methodistID uuid.UUID, teacherID uuid.UUID, points int32, note string) (*Penalty, error) {
	if points <= 0 {
		return nil, &HTTPStatusError{StatusCode: 400, Message: "points must be greater than 0"}
	}

	note = strings.TrimSpace(note)
	if note == "" {
		return nil, &HTTPStatusError{StatusCode: 400, Message: "note is required"}
	}

	teacher, err := s.repo.GetUserByKeycloakID(ctx, teacherID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "teacher not found"}
	}

	_, err = s.repo.GetUserByKeycloakID(ctx, methodistID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "methodist not found"}
	}

	penaltyID := uuid.New()
	err = s.repo.CreatePenalty(ctx, storage.CreatePenaltyParams{
		ID:        penaltyID,
		Points:    []int32{points},
		Teacher:   pgtype.UUID{Bytes: teacher.KeycloakID, Valid: true},
		Methodist: pgtype.UUID{Bytes: methodistID, Valid: true},
		Note:      pgtype.Text{String: note, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	if err = s.repo.AdjustUserCategoryPoints(ctx, teacherID, violationsAndPenaltiesCategoryKey, -points); err != nil {
		return nil, err
	}

	return s.GetPenaltyByIDAndTeacherID(ctx, penaltyID, teacherID)
}

func (s *userService) GetPenaltiesByTeacherID(ctx context.Context, teacherID uuid.UUID) ([]*Penalty, error) {
	dbPenalties, err := s.repo.GetPenaltiesByTeacherID(ctx, teacherID)
	if err != nil {
		return nil, err
	}

	penalties := make([]*Penalty, 0, len(dbPenalties))
	for _, dbPenalty := range dbPenalties {
		penalties = append(penalties, mapPenalty(dbPenalty))
	}

	return penalties, nil
}

func (s *userService) GetPenaltyByIDAndTeacherID(ctx context.Context, penaltyID uuid.UUID, teacherID uuid.UUID) (*Penalty, error) {
	dbPenalty, err := s.repo.GetPenaltyByIDAndTeacherID(ctx, storage.GetPenaltyByIDAndTeacherIDParams{
		ID:      penaltyID,
		Teacher: pgtype.UUID{Bytes: teacherID, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	return mapPenalty(dbPenalty), nil
}

func (s *userService) DeletePenaltyByIDAndTeacherID(ctx context.Context, penaltyID uuid.UUID, teacherID uuid.UUID) error {
	dbPenalty, err := s.repo.GetPenaltyByIDAndTeacherID(ctx, storage.GetPenaltyByIDAndTeacherIDParams{
		ID:      penaltyID,
		Teacher: pgtype.UUID{Bytes: teacherID, Valid: true},
	})
	if err != nil {
		return err
	}

	if err = s.repo.DeletePenaltyByIDAndTeacherID(ctx, storage.DeletePenaltyByIDAndTeacherIDParams{
		ID:      penaltyID,
		Teacher: pgtype.UUID{Bytes: teacherID, Valid: true},
	}); err != nil {
		return err
	}

	penaltyPoints := int32(0)
	if len(dbPenalty.Points) > 0 {
		penaltyPoints = dbPenalty.Points[0]
	}

	if penaltyPoints != 0 {
		if err = s.repo.AdjustUserCategoryPoints(ctx, teacherID, violationsAndPenaltiesCategoryKey, penaltyPoints); err != nil {
			return err
		}
	}

	return nil
}

func mapPenalty(dbPenalty storage.Penalty) *Penalty {
	points := int32(0)
	if len(dbPenalty.Points) > 0 {
		points = dbPenalty.Points[0]
	}

	note := ""
	if dbPenalty.Note.Valid {
		note = dbPenalty.Note.String
	}

	return &Penalty{
		ID:          dbPenalty.ID,
		Points:      points,
		TeacherID:   dbPenalty.Teacher.Bytes,
		MethodistID: dbPenalty.Methodist.Bytes,
		Note:        note,
		CreatedAt:   dbPenalty.CreatedAt.Time,
		UpdatedAt:   dbPenalty.UpdatedAt.Time,
	}
}

func (s *userService) IssueViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, note string) (*ViolationActionResponse, error) {
	note = strings.TrimSpace(note)

	if err := s.ensureViolationIssuer(ctx, issuedByID); err != nil {
		return nil, err
	}

	_, err := s.repo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}

	dbViolation, err := s.repo.CreateViolation(ctx, storage.CreateViolationParams{
		UserID:   userID,
		IssuedBy: issuedByID,
		Note: pgtype.Text{
			String: note,
			Valid:  note != "",
		},
	})
	if err != nil {
		return nil, err
	}

	updatedUser, err := s.repo.ApplyViolationToUser(ctx, storage.ApplyViolationToUserParams{
		ViolationID: dbViolation.ID,
		KeycloakID:  userID,
		CategoryKey: violationsAndPenaltiesCategoryKey,
	})
	if err != nil {
		return nil, err
	}

	mappedUser, err := s.toServiceUser(ctx, updatedUser)
	if err != nil {
		return nil, err
	}

	return &ViolationActionResponse{
		Violation: mapViolationRecord(dbViolation),
		User:      mappedUser,
	}, nil
}

func (s *userService) UpdateViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, violationID uuid.UUID, note string) (*ViolationActionResponse, error) {
	note = strings.TrimSpace(note)

	if err := s.ensureViolationIssuer(ctx, issuedByID); err != nil {
		return nil, err
	}

	_, err := s.repo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}

	dbViolation, err := s.repo.UpdateViolationByIDAndUserID(ctx, storage.UpdateViolationByIDAndUserIDParams{
		ID:     violationID,
		UserID: userID,
		Note: pgtype.Text{
			String: note,
			Valid:  note != "",
		},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &HTTPStatusError{StatusCode: 404, Message: "violation not found"}
		}
		return nil, err
	}

	updatedUser, err := s.repo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, err
	}

	mappedUser, err := s.toServiceUser(ctx, updatedUser)
	if err != nil {
		return nil, err
	}

	return &ViolationActionResponse{
		Violation: mapViolationRecord(dbViolation),
		User:      mappedUser,
	}, nil
}

func (s *userService) DeleteViolation(ctx context.Context, issuedByID uuid.UUID, userID uuid.UUID, violationID uuid.UUID) error {
	if err := s.ensureViolationIssuer(ctx, issuedByID); err != nil {
		return err
	}

	_, err := s.repo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}

	_, err = s.repo.GetViolationByIDAndUserID(ctx, storage.GetViolationByIDAndUserIDParams{
		ID:     violationID,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &HTTPStatusError{StatusCode: 404, Message: "violation not found"}
		}
		return err
	}

	if err = s.repo.DeleteViolationByIDAndUserID(ctx, storage.DeleteViolationByIDAndUserIDParams{
		ID:     violationID,
		UserID: userID,
	}); err != nil {
		return err
	}

	_, err = s.repo.RemoveViolationFromUser(ctx, storage.RemoveViolationFromUserParams{
		ViolationID: violationID,
		KeycloakID:  userID,
		CategoryKey: violationsAndPenaltiesCategoryKey,
	})
	return err
}

func (s *userService) ensureViolationIssuer(ctx context.Context, issuedByID uuid.UUID) error {
	issuer, err := s.repo.GetUserByKeycloakID(ctx, issuedByID)
	if err != nil {
		return &HTTPStatusError{StatusCode: 404, Message: "issuer not found"}
	}
	if issuer.Role != storage.UserRoleMETHODIST && issuer.Role != storage.UserRoleADMIN {
		return &HTTPStatusError{StatusCode: 403, Message: "forbidden"}
	}
	return nil
}

func mapViolationRecord(dbViolation storage.Violation) *ViolationRecord {
	note := ""
	if dbViolation.Note.Valid {
		note = dbViolation.Note.String
	}

	return &ViolationRecord{
		ID:        dbViolation.ID,
		UserID:    dbViolation.UserID,
		IssuedBy:  dbViolation.IssuedBy,
		Note:      note,
		CreatedAt: dbViolation.CreatedAt.Time,
		UpdatedAt: dbViolation.UpdatedAt.Time,
	}
}
