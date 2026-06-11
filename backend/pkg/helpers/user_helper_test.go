package helpers

import (
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
