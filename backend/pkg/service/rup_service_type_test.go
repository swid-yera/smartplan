package service

import "testing"

func TestNormalizeRupTypeValue(t *testing.T) {
	testCases := []struct {
		name  string
		input string
		want  string
	}{
		{name: "canonical practice", input: "PRACTICE", want: "PRACTICE"},
		{name: "canonical theory", input: "THEORY", want: "THEORY"},
		{name: "practical alias", input: "PRACTICAL", want: "PRACTICE"},
		{name: "combined alias", input: "COMBINED", want: "THEORY"},
		{name: "lowercase practice", input: "practice", want: "PRACTICE"},
		{name: "cyrillic practice", input: "практика", want: "PRACTICE"},
		{name: "production practice", input: "производственная практика", want: "PRACTICE"},
		{name: "kazakh practice", input: "өндірістік оқыту", want: "PRACTICE"},
		{name: "cyrillic theory", input: "теоретический", want: "THEORY"},
		{name: "unknown", input: "something-else", want: "SOMETHING-ELSE"},
		{name: "empty", input: "   ", want: ""},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizeRupTypeValue(tc.input)
			if got != tc.want {
				t.Fatalf("normalizeRupTypeValue(%q) = %q, want %q", tc.input, got, tc.want)
			}
		})
	}
}
