package service

import (
	"context"
	"errors"

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

// UserPermissions — DTO ответа с правами пользователя
type UserPermissions struct {
	UserID      uuid.UUID      `json:"userId"`
	Permissions []PermissionCode `json:"permissions"`
}

// SpecialUserWithPermissions — SPECIAL-пользователь со своим набором прав
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
	Permissions []PermissionCode `json:"permissions" binding:"required"`
}

// PermissionService описывает бизнес-логику управления правами
type PermissionService interface {
	// SetPermissions выдаёт или обновляет права для SPECIAL-пользователя.
	// Только ADMIN может вызывать этот метод (проверка роли — в хендлере/middleware).
	SetPermissions(ctx context.Context, userID uuid.UUID, codes []PermissionCode) (*UserPermissions, error)

	// GetPermissions возвращает права конкретного пользователя.
	GetPermissions(ctx context.Context, userID uuid.UUID) (*UserPermissions, error)

	// RevokePermissions удаляет все права пользователя.
	RevokePermissions(ctx context.Context, userID uuid.UUID) error

	// ListSpecialUsers возвращает всех SPECIAL-пользователей с их правами.
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
	// Убеждаемся, что пользователь существует и имеет роль SPECIAL
	user, err := s.userRepo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}
	if user.Role != storage.UserRoleSPECIAL {
		return nil, &HTTPStatusError{StatusCode: 422, Message: "permissions can only be assigned to SPECIAL users"}
	}

	perm, err := s.repo.UpsertUserPermissions(ctx, userID, codes)
	if err != nil {
		return nil, err
	}

	return &UserPermissions{
		UserID:      perm.UserID,
		Permissions: perm.Permissions,
	}, nil
}

func (s *permissionService) GetPermissions(ctx context.Context, userID uuid.UUID) (*UserPermissions, error) {
	perm, err := s.repo.GetUserPermissions(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Пользователь существует, но прав ещё нет — возвращаем пустой список
			return &UserPermissions{UserID: userID, Permissions: []PermissionCode{}}, nil
		}
		return nil, err
	}

	return &UserPermissions{
		UserID:      perm.UserID,
		Permissions: perm.Permissions,
	}, nil
}

func (s *permissionService) RevokePermissions(ctx context.Context, userID uuid.UUID) error {
	_, err := s.userRepo.GetUserByKeycloakID(ctx, userID)
	if err != nil {
		return &HTTPStatusError{StatusCode: 404, Message: "user not found"}
	}
	return s.repo.DeleteUserPermissions(ctx, userID)
}

func (s *permissionService) ListSpecialUsers(ctx context.Context) ([]SpecialUserWithPermissions, error) {
	rows, err := s.repo.GetUsersWithPermissions(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]SpecialUserWithPermissions, 0, len(rows))
	for _, row := range rows {
		firstName := ""
		lastName := ""
		if row.FirstName.Valid {
			firstName = row.FirstName.String
		}
		if row.LastName.Valid {
			lastName = row.LastName.String
		}

		perms := row.Permissions
		if perms == nil {
			perms = []PermissionCode{}
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
	perm, err := s.repo.GetUserPermissions(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	for _, p := range perm.Permissions {
		if p == code {
			return true, nil
		}
	}
	return false, nil
}
