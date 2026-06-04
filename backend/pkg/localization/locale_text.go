package localization

import (
	"bytes"
	"encoding/json"
	"strings"
)

type LocaleText struct {
	Ru string `json:"ru"`
	Kz string `json:"kz"`
}

func NewLocaleText(ru string, kz string) LocaleText {
	return LocaleText{
		Ru: normalizeLocalizedString(ru),
		Kz: normalizeLocalizedString(kz),
	}
}

func (l *LocaleText) Normalize() {
	if l == nil {
		return
	}
	l.Ru = normalizeLocalizedString(l.Ru)
	l.Kz = normalizeLocalizedString(l.Kz)
}

func (l LocaleText) Normalized() LocaleText {
	l.Normalize()
	return l
}

func (l LocaleText) MarshalJSON() ([]byte, error) {
	n := l.Normalized()
	type alias LocaleText
	return json.Marshal(alias(n))
}

func (l *LocaleText) UnmarshalJSON(data []byte) error {
	if l == nil {
		return nil
	}

	trimmed := bytes.TrimSpace(data)
	if len(trimmed) == 0 || bytes.Equal(trimmed, []byte("null")) {
		*l = LocaleText{}
		return nil
	}

	if trimmed[0] == '"' {
		var value string
		if err := json.Unmarshal(trimmed, &value); err != nil {
			return err
		}
		*l = NewLocaleText(value, "")
		return nil
	}

	type payload struct {
		Ru string `json:"ru"`
		Kz string `json:"kz"`
	}

	var p payload
	if err := json.Unmarshal(trimmed, &p); err != nil {
		return err
	}

	*l = NewLocaleText(p.Ru, p.Kz)
	return nil
}

func (l LocaleText) ToJSONB() []byte {
	n := l.Normalized()
	payload, _ := json.Marshal(n)
	return payload
}

func (l *LocaleText) ToNullableJSONB() []byte {
	if l == nil {
		return nil
	}
	return l.ToJSONB()
}

func LocaleTextFromJSONB(raw []byte) LocaleText {
	if len(bytes.TrimSpace(raw)) == 0 || bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
		return LocaleText{}
	}

	var value LocaleText
	if err := json.Unmarshal(raw, &value); err != nil {
		return LocaleText{}
	}
	value.Normalize()
	return value
}

func LocaleTextPtrFromJSONB(raw []byte) *LocaleText {
	if len(bytes.TrimSpace(raw)) == 0 || bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
		return nil
	}
	value := LocaleTextFromJSONB(raw)
	return &value
}

func LocaleTextSliceToJSONB(values []LocaleText) []byte {
	if len(values) == 0 {
		return []byte("[]")
	}

	normalized := make([]LocaleText, 0, len(values))
	for _, value := range values {
		normalized = append(normalized, value.Normalized())
	}

	payload, _ := json.Marshal(normalized)
	return payload
}

func LocaleTextSliceFromJSONB(raw []byte) []LocaleText {
	trimmed := bytes.TrimSpace(raw)
	if len(trimmed) == 0 || bytes.Equal(trimmed, []byte("null")) {
		return nil
	}

	var values []LocaleText
	if err := json.Unmarshal(trimmed, &values); err == nil {
		for i := range values {
			values[i].Normalize()
		}
		return values
	}

	var legacy []string
	if err := json.Unmarshal(trimmed, &legacy); err == nil {
		values = make([]LocaleText, 0, len(legacy))
		for _, value := range legacy {
			normalized := NewLocaleText(value, "")
			if normalized.Ru == "" && normalized.Kz == "" {
				continue
			}
			values = append(values, normalized)
		}
		return values
	}

	return nil
}

func normalizeLocalizedString(value string) string {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return ""
	}

	for range 3 {
		next, changed := unwrapStructuredLocalizedString(normalized)
		if !changed {
			break
		}
		normalized = next
	}

	return stripWrappingQuotes(strings.TrimSpace(normalized))
}

func unwrapStructuredLocalizedString(value string) (string, bool) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", false
	}

	if !(strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[") || strings.HasPrefix(trimmed, "\"")) {
		return trimmed, false
	}

	var payload any
	if err := json.Unmarshal([]byte(trimmed), &payload); err != nil {
		return trimmed, false
	}

	extracted := extractStructuredLocalizedString(payload)
	if extracted == "" {
		return trimmed, false
	}

	return strings.TrimSpace(extracted), true
}

func extractStructuredLocalizedString(payload any) string {
	switch value := payload.(type) {
	case string:
		return strings.TrimSpace(value)
	case []any:
		for _, item := range value {
			if candidate := extractStructuredLocalizedString(item); candidate != "" {
				return candidate
			}
		}
	case map[string]any:
		for _, key := range []string{
			"translatedText",
			"text",
			"name",
			"title",
			"value",
			"label",
			"content",
			"result",
			"ru",
			"kz",
			"kk",
		} {
			if raw, ok := value[key]; ok {
				if candidate := extractStructuredLocalizedString(raw); candidate != "" {
					return candidate
				}
			}
		}

		for _, raw := range value {
			if candidate := extractStructuredLocalizedString(raw); candidate != "" {
				return candidate
			}
		}
	}

	return ""
}

func stripWrappingQuotes(value string) string {
	trimmed := strings.TrimSpace(value)
	for len(trimmed) >= 2 {
		if strings.HasPrefix(trimmed, "\"") && strings.HasSuffix(trimmed, "\"") {
			trimmed = strings.TrimSpace(trimmed[1 : len(trimmed)-1])
			continue
		}
		if strings.HasPrefix(trimmed, "'") && strings.HasSuffix(trimmed, "'") {
			trimmed = strings.TrimSpace(trimmed[1 : len(trimmed)-1])
			continue
		}
		break
	}
	return trimmed
}
