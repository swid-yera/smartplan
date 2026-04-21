package helpers

import (
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func PtrToString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func ParseTimeRequired(value string) (time.Time, error) {
	if strings.TrimSpace(value) == "" {
		return time.Time{}, errors.New("event_date is required")
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err == nil {
		return parsed, nil
	}
	parsed, err = time.Parse("2006-01-02 15:04:05", value)
	if err == nil {
		return parsed, nil
	}
	return time.Time{}, err
}

func ParseTimeOptional(value string) (time.Time, bool, error) {
	if strings.TrimSpace(value) == "" {
		return time.Time{}, false, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err == nil {
		return parsed, true, nil
	}
	parsed, err = time.Parse("2006-01-02 15:04:05", value)
	if err == nil {
		return parsed, true, nil
	}
	return time.Time{}, false, err
}

func PgTextToPtr(t pgtype.Text) *string {
	if t.Valid {
		return &t.String
	}
	return nil
}

func PgTimeToString(t pgtype.Timestamptz) string {
	if t.Valid {
		return t.Time.Format(time.RFC3339)
	}
	return ""
}
