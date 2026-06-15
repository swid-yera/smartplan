package service

import (
	"testing"

	storage "eduplan/backend/pkg/sqlc/generated"
)

func TestBasePermissionsForRoleSpecialAddsKPIViewWithDepartment(t *testing.T) {
	t.Parallel()

	perms := basePermissionsForRole(
		storage.UserRoleSPECIAL,
		storage.UserTypeMASTER,
		[]UserDepartment{{}},
	)

	if !containsPermission(perms, PermRUPView) {
		t.Fatalf("expected RUP view permission, got %v", perms)
	}

	if !containsPermission(perms, PermKPIView) {
		t.Fatalf("expected KPI view permission, got %v", perms)
	}
}

func TestBasePermissionsForRoleSpecialSkipsKPIViewWithoutDepartmentOrUnsupportedType(t *testing.T) {
	t.Parallel()

	t.Run("without department", func(t *testing.T) {
		t.Parallel()

		perms := basePermissionsForRole(storage.UserRoleSPECIAL, storage.UserTypeMASTER, nil)
		if containsPermission(perms, PermKPIView) {
			t.Fatalf("did not expect KPI view permission, got %v", perms)
		}
	})

	t.Run("with head type", func(t *testing.T) {
		t.Parallel()

		perms := basePermissionsForRole(
			storage.UserRoleSPECIAL,
			storage.UserTypeHEAD,
			[]UserDepartment{{}},
		)
		if containsPermission(perms, PermKPIView) {
			t.Fatalf("did not expect KPI view permission, got %v", perms)
		}
	})
}

func TestBasePermissionsForRoleMethodistDoesNotReceiveKPIView(t *testing.T) {
	t.Parallel()

	perms := basePermissionsForRole(
		storage.UserRoleMETHODIST,
		storage.UserTypeMASTER,
		[]UserDepartment{{}},
	)

	if containsPermission(perms, PermKPIView) {
		t.Fatalf("did not expect KPI view permission, got %v", perms)
	}
}

func containsPermission(perms []PermissionCode, target PermissionCode) bool {
	for _, perm := range perms {
		if perm == target {
			return true
		}
	}

	return false
}
