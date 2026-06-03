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
		Ru: strings.TrimSpace(ru),
		Kz: strings.TrimSpace(kz),
	}
}

func (l *LocaleText) Normalize() {
	if l == nil {
		return
	}
	l.Ru = strings.TrimSpace(l.Ru)
	l.Kz = strings.TrimSpace(l.Kz)
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
