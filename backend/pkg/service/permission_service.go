package service

import (
	"context"
	"errors"
	"math"

	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// PermissionCode — строковый тип для передачи кодов доступа через API
type PermissionCode = storage.PermissionCode

// Константы для удобного использования в хендлерах и middleware
const (
	PermRUPManage PermissionCode = storage.PermissionCodeRUPManage
	PermRUPView   PermissionCode = storage.PermissionCodeRUPView
	PermRUPFull   PermissionCode = storage.PermissionCodeRUPFull
	PermKPIManage PermissionCode = storage.PermissionCodeKPIManage
	PermKPIView   PermissionCode = storage.PermissionCodeKPIView
	PermKPIFull   PermissionCode = storage.PermissionCodeKPIFull
)

func defaultSpecialPermissionCodes() []PermissionCode {
	return []PermissionCode{PermRUPView, PermKPIView}
}

var permissionRanks = map[PermissionCode]int{
	PermRUPView:   1,
	PermRUPManage: 2,
	PermRUPFull:   3,
	PermKPIView:   1,
	PermKPIManage: 2,
	PermKPIFull:   3,
}

func HasPermissionLevel(granted []PermissionCode, required PermissionCode) bool {
	requiredRank, ok := permissionRanks[required]
	if !ok {
		return false
	}

	requiredDomain := permissionDomain(required)
	for _, code := range granted {
		if permissionDomain(code) != requiredDomain {
			continue
		}

		if rank, ok := permissionRanks[code]; ok && rank >= requiredRank {
			return true
		}
	}

	return false
}

func canonicalizePermissionCodes(codes []PermissionCode) []PermissionCode {
	if len(codes) == 0 {
		return []PermissionCode{}
	}

	seen := make(map[PermissionCode]struct{}, len(codes))
	for _, code := range codes {
		if permissionDomain(code) == "" {
			continue
		}
		seen[code] = struct{}{}
	}

	result := make([]PermissionCode, 0, len(seen))
	orderedDomains := []struct {
		view   PermissionCode
		manage PermissionCode
		full   PermissionCode
	}{
		{view: PermRUPView, manage: PermRUPManage, full: PermRUPFull},
		{view: PermKPIView, manage: PermKPIManage, full: PermKPIFull},
	}

	for _, domain := range orderedDomains {
		if _, ok := seen[domain.full]; ok {
			result = append(result, domain.full)
			continue
		}
		if _, ok := seen[domain.view]; ok {
			result = append(result, domain.view)
		}
		if _, ok := seen[domain.manage]; ok {
			result = append(result, domain.manage)
		}
	}

	return result
}

func permissionDomain(code PermissionCode) string {
	switch code {
	case PermRUPManage, PermRUPView, PermRUPFull:
		return "RUP"
	case PermKPIManage, PermKPIView, PermKPIFull:
		return "KPI"
	default:
		return ""
	}
}

// UserPermissions — DTO ответа с правами пользователя
type UserPermissions struct {
	UserID      uuid.UUID        `json:"userId"`
	Permissions []PermissionCode `json:"permissions"`
}

// SpecialUserWithPermissions — пользователь со своим набором прав
type SpecialUserWithPermissions struct {
	KeycloakID  uuid.UUID        `json:"keycloakId"`
	Email       string           `json:"email"`
	Username    string           `json:"username"`
	FirstName   string           `json:"firstName"`
	LastName    string           `json:"lastName"`
	Permissions []PermissionCode `json:"permissions"`
}

// SetPermissionsRequest — тело запроса на выдачу/обновление прав
type SetPermissionsRequest struct {
	Permissions []PermissionCode `json:"permissions"`
}

// PermissionService описывает бизнес-логику управления правами
type PermissionService interface {
	// SetPermissions выдаёт или обновляет права любого пользователя.
	// Доступ контролируется middleware на уровне route.
	SetPermissions(ctx context.Context, userID uuid.UUID, codes []PermissionCode) (*UserPermissions, error)

	// GetPermissions возвращает права конкретного пользователя.
	GetPermissions(ctx context.Context, userID uuid.UUID) (*UserPermissions, error)

	// RevokePermissions удаляет все права пользователя.
	RevokePermissions(ctx context.Context, userID uuid.UUID) error

	// ListSpecialUsers возвращает пользователей с их правами.
	ListSpecialUsers(ctx context.Context) ([]SpecialUserWithPermissions, error)

	// HasPermission проверяет, есть ли у пользователя конкретное право.
	// Используется middleware RequirePermission.
	HasPermission(ctx context.Context, userID uuid.UUID, code PermissionCode) (bool, error)
}

type permissionService struct {
	repo     repository.Permissions
	userRepo repository.UsersRepository
}

func NewPermissionService(repo repository.Permissions, userRepo repository.UsersRepository) PermissionService {
	return &permissionService{repo: repo, userRepo: userRepo}
}

func (s *permissionService) SetPermissions(ctx context.Context, userID uuid.UUID, codes []PermissionCode) (*UserPermissions, error) {
	// Убеждаемся, что пользователь существует
	user, err := s.userRepo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}
	if user.Role == storage.UserRoleADMIN {
		return nil, &HTTPStatusError{StatusCode: 403, Message: "admin permissions cannot be modified"}
	}

	canonicalCodes := canonicalizePermissionCodes(codes)

	perm, err := s.repo.UpsertUserPermissions(ctx, userID, canonicalCodes)
	if err != nil {
		return nil, err
	}

	return &UserPermissions{
		UserID:      perm.UserID,
		Permissions: resolveExplicitPermissions(perm.Permissions),
	}, nil
}

func (s *permissionService) GetPermissions(ctx context.Context, userID uuid.UUID) (*UserPermissions, error) {
	user, err := s.userRepo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}

	basePermissions, err := s.getBasePermissions(ctx, user)
	if err != nil {
		return nil, err
	}

	if user.Role == storage.UserRoleADMIN {
		return &UserPermissions{UserID: userID, Permissions: basePermissions}, nil
	}

	perm, err := s.repo.GetUserPermissions(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &UserPermissions{UserID: userID, Permissions: basePermissions}, nil
		}
		return nil, err
	}

	return &UserPermissions{
		UserID:      perm.UserID,
		Permissions: resolveExplicitPermissions(perm.Permissions),
	}, nil
}

func (s *permissionService) RevokePermissions(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}
	if user.Role == storage.UserRoleADMIN {
		return &HTTPStatusError{StatusCode: 403, Message: "admin permissions cannot be modified"}
	}
	return s.repo.DeleteUserPermissions(ctx, userID)
}

func (s *permissionService) ListSpecialUsers(ctx context.Context) ([]SpecialUserWithPermissions, error) {
	totalUsers, err := s.userRepo.CountUsers(ctx)
	if err != nil {
		return nil, err
	}

	limit := totalUsers
	if limit > math.MaxInt32 {
		limit = math.MaxInt32
	}

	users, err := s.userRepo.GetAllUsers(ctx, int32(limit), 0, "")
	if err != nil {
		return nil, err
	}

	result := make([]SpecialUserWithPermissions, 0)
	for _, row := range users {
		if row.Role != storage.UserRoleSPECIAL {
			continue
		}

		firstName := ""
		lastName := ""
		if row.FirstName.Valid {
			firstName = row.FirstName.String
		}
		if row.LastName.Valid {
			lastName = row.LastName.String
		}

		perms := defaultSpecialPermissionCodes()
		if rowPerms, err := s.repo.GetUserPermissions(ctx, row.KeycloakID); err == nil {
			perms = canonicalizePermissionCodes(rowPerms.Permissions)
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}

		result = append(result, SpecialUserWithPermissions{
			KeycloakID:  row.KeycloakID,
			Email:       row.Email,
			Username:    row.Username,
			FirstName:   firstName,
			LastName:    lastName,
			Permissions: perms,
		})
	}

	return result, nil
}

func (s *permissionService) HasPermission(ctx context.Context, userID uuid.UUID, code PermissionCode) (bool, error) {
	result, err := s.GetPermissions(ctx, userID)
	if err != nil {
		return false, err
	}

	for _, p := range result.Permissions {
		if p == code {
			return true, nil
		}
	}
	return false, nil
}

func (s *permissionService) getBasePermissions(ctx context.Context, user *storage.User) ([]PermissionCode, error) {
	departments, err := s.userRepo.GetDepartmentsByUserID(ctx, user.KeycloakID)
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

	return basePermissionsForRole(user.Role, mappedDepartments), nil
}

func mergePermissionCodes(groups ...[]PermissionCode) []PermissionCode {
	combined := make([]PermissionCode, 0)
	for _, group := range groups {
		combined = append(combined, group...)
	}

	return canonicalizePermissionCodes(combined)
}

func resolveExplicitPermissions(explicitPermissions []PermissionCode) []PermissionCode {
	if len(explicitPermissions) == 0 {
		return []PermissionCode{}
	}

	return canonicalizePermissionCodes(explicitPermissions)
}
