package service

import (
	"errors"
	"strings"
	"time"
)

func ptrToString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func parseTimeRequired(value string) (time.Time, error) {
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

func parseTimeOptional(value string) (time.Time, bool, error) {
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
