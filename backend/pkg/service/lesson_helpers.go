package service

import "time"

func ptrToString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func parseTime(value string) (time.Time, error) {
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
