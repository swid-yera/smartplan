package helpers

import (
	"eduplan/backend/config"
	storage "eduplan/backend/pkg/sqlc/generated"
	"testing"
)

func TestResolveUserType(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input string
		want  storage.UserType
	}{
		{name: "general group", input: "General", want: storage.UserTypeGENERAL},
		{name: "head group", input: "Head", want: storage.UserTypeHEAD},
		{name: "master group", input: "Master", want: storage.UserTypeMASTER},
		{name: "specialist group", input: "Specialist", want: storage.UserTypeSPECIALIST},
		{name: "trimmed and case insensitive", input: "  master  ", want: storage.UserTypeMASTER},
		{name: "unknown fallback", input: "SomethingElse", want: storage.UserTypeNULL},
		{name: "empty fallback", input: "", want: storage.UserTypeNULL},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got := ResolveUserType(tt.input)
			if got != tt.want {
				t.Fatalf("ResolveUserType(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestResolveHighestRoleFromGroups(t *testing.T) {
	t.Parallel()

	cfg := config.KeycloakConfig{
		AdminRoles:     []string{"Admins_site"},
		SpecialRoles:   []string{"Special"},
		MethodistRoles: []string{"Methodists"},
		TeacherRoles:   []string{"Teachers"},
	}

	role, ok := ResolveHighestRoleFromGroups([]string{"Admins_site", "Methodists", "Teachers"}, cfg)
	if !ok {
		t.Fatal("expected role to be resolved")
	}
	if role != storage.UserRoleADMIN {
		t.Fatalf("ResolveHighestRoleFromGroups(...) = %q, want %q", role, storage.UserRoleADMIN)
	}
}

func TestResolveHighestRoleFromClaims(t *testing.T) {
	t.Parallel()

	cfg := config.KeycloakConfig{
		AdminRoles:     []string{"Admins_site"},
		SpecialRoles:   []string{"Special"},
		MethodistRoles: []string{"Methodists"},
		TeacherRoles:   []string{"Teachers"},
	}

	role, ok := ResolveHighestRoleFromClaims(nil, []string{"Methodists"}, cfg)
	if !ok {
		t.Fatal("expected fallback role to be resolved")
	}
	if role != storage.UserRoleMETHODIST {
		t.Fatalf("ResolveHighestRoleFromClaims(...) = %q, want %q", role, storage.UserRoleMETHODIST)
	}
}

func TestResolveHighestRolePrefersSpecialAndAdminOverTeacher(t *testing.T) {
	t.Parallel()

	cfg := config.KeycloakConfig{
		AdminRoles:     []string{"admin"},
		SpecialRoles:   []string{"special"},
		MethodistRoles: []string{"methodist"},
		TeacherRoles:   []string{"teacher"},
	}

	specialRole, ok := ResolveHighestRole([]string{"teacher", "special"}, cfg)
	if !ok {
		t.Fatal("expected special role to be resolved")
	}
	if specialRole != storage.UserRoleSPECIAL {
		t.Fatalf("ResolveHighestRole(...) = %q, want %q", specialRole, storage.UserRoleSPECIAL)
	}

	adminRole, ok := ResolveHighestRole([]string{"teacher", "admin"}, cfg)
	if !ok {
		t.Fatal("expected admin role to be resolved")
	}
	if adminRole != storage.UserRoleADMIN {
		t.Fatalf("ResolveHighestRole(...) = %q, want %q", adminRole, storage.UserRoleADMIN)
	}
}

func TestResolveUserTypeFromGroups(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input []string
		want  storage.UserType
	}{
		{
			name:  "finds teacher type among unrelated groups",
			input: []string{"Admins_site", "Master", "laborants"},
			want:  storage.UserTypeMASTER,
		},
		{
			name:  "returns null when there is no teacher type",
			input: []string{"Admins_site", "laborants"},
			want:  storage.UserTypeNULL,
		},
		{
			name:  "supports general group",
			input: []string{"Teachers", "General"},
			want:  storage.UserTypeGENERAL,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got := ResolveUserTypeFromGroups(tt.input)
			if got != tt.want {
				t.Fatalf("ResolveUserTypeFromGroups(%v) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}
