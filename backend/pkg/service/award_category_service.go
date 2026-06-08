package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"
	"time"

	"eduplan/backend/pkg/localization"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

var allowedDynamicFieldTypes = map[string]struct{}{
	"text":         {},
	"textarea":     {},
	"group":        {},
	"number":       {},
	"select":       {},
	"date":         {},
	"file":         {},
	"url":          {},
	"multi_fields": {},
}

var allowedMultiFieldTypes = map[string]struct{}{
	"text":     {},
	"textarea": {},
	"group":    {},
	"number":   {},
	"select":   {},
	"date":     {},
}

var numericValidationKeysByFieldType = map[string][]string{
	"text":     {"minLength", "maxLength"},
	"textarea": {"minLength", "maxLength"},
	"number":   {"min", "max"},
	"file":     {"maxSizeMb"},
}

type AwardCategoryMultiFieldOption struct {
	Key         string                   `json:"key"`
	Label       localization.LocaleText  `json:"label"`
	Type        string                   `json:"type"`
	Required    bool                     `json:"required"`
	Placeholder *localization.LocaleText `json:"placeholder"`
	HelpText    *localization.LocaleText `json:"helpText"`
	Options     any                      `json:"options"`
	Validation  map[string]any           `json:"validation"`
	SortOrder   int32                    `json:"sortOrder"`
}

type AwardCategoryFieldRequest struct {
	Key         string                   `json:"key"`
	Label       localization.LocaleText  `json:"label"`
	Type        string                   `json:"type"`
	Required    bool                     `json:"required"`
	Placeholder *localization.LocaleText `json:"placeholder"`
	HelpText    *localization.LocaleText `json:"helpText"`
	Options     any                      `json:"options"`
	Validation  map[string]any           `json:"validation"`
	SortOrder   int32                    `json:"sortOrder"`
}

type AwardCategoryFieldResponse struct {
	ID          uuid.UUID                `json:"id"`
	Key         string                   `json:"key"`
	Label       localization.LocaleText  `json:"label"`
	Type        string                   `json:"type"`
	Required    bool                     `json:"required"`
	Placeholder *localization.LocaleText `json:"placeholder,omitempty"`
	HelpText    *localization.LocaleText `json:"helpText,omitempty"`
	Options     any                      `json:"options"`
	Validation  map[string]any           `json:"validation"`
	SortOrder   int32                    `json:"sortOrder"`
	CreatedAt   time.Time                `json:"createdAt"`
	UpdatedAt   time.Time                `json:"updatedAt"`
}

type AwardCategoryRequest struct {
	Name        localization.LocaleText     `json:"name"`
	Icon        string                      `json:"icon"`
	Description localization.LocaleText     `json:"description"`
	AwardTypes  []string                    `json:"awardTypes"`
	Fields      []AwardCategoryFieldRequest `json:"fields"`
}

type AwardCategoryResponse struct {
	ID                 uuid.UUID                    `json:"id"`
	Name               localization.LocaleText      `json:"name"`
	Icon               string                       `json:"icon,omitempty"`
	Description        localization.LocaleText      `json:"description,omitempty"`
	AwardTypes         []string                     `json:"awardTypes"`
	AwardTypesExpanded []TypeResponse               `json:"awardTypesExpanded,omitempty"`
	FieldsExpanded     []AwardCategoryFieldResponse `json:"fieldsExpanded"`
	CreatedAt          time.Time                    `json:"createdAt"`
	UpdatedAt          time.Time                    `json:"updatedAt"`
}

type AwardCategoryListItemResponse struct {
	ID          uuid.UUID               `json:"id"`
	Name        localization.LocaleText `json:"name"`
	Icon        string                  `json:"icon,omitempty"`
	Description localization.LocaleText `json:"description,omitempty"`
}

func (s *AwardService) CreateCategory(ctx context.Context, req AwardCategoryRequest) (AwardCategoryResponse, error) {
	awardTypeIDs, err := s.validateCategoryRequest(ctx, req)
	if err != nil {
		return AwardCategoryResponse{}, err
	}

	category, err := s.repo.CreateAwardCategory(ctx, &storage.CreateAwardCategoryParams{
		Name:        req.Name.ToJSONB(),
		Icon:        toPgText(req.Icon),
		Description: req.Description.ToJSONB(),
		AwardTypes:  awardTypeIDs,
	})
	if err != nil {
		return AwardCategoryResponse{}, err
	}

	if err = s.createCategoryFields(ctx, category.ID, req.Fields); err != nil {
		return AwardCategoryResponse{}, err
	}

	return s.GetCategoryByID(ctx, category.ID)
}

func (s *AwardService) GetAllCategories(ctx context.Context) ([]AwardCategoryListItemResponse, error) {
	categories, err := s.repo.GetAllAwardCategories(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]AwardCategoryListItemResponse, 0, len(categories))
	for _, category := range categories {
		result = append(result, AwardCategoryListItemResponse{
			ID:          category.ID,
			Name:        localization.LocaleTextFromJSONB(category.Name),
			Icon:        fromPgText(category.Icon),
			Description: localization.LocaleTextFromJSONB(category.Description),
		})
	}

	return result, nil
}

func (s *AwardService) GetCategoryByID(ctx context.Context, id uuid.UUID) (AwardCategoryResponse, error) {
	category, err := s.repo.GetAwardCategoryByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AwardCategoryResponse{}, &HTTPStatusError{StatusCode: http.StatusNotFound, Message: "category not found"}
		}
		return AwardCategoryResponse{}, err
	}

	return s.mapCategoryResponse(ctx, category, true)
}

func (s *AwardService) UpdateCategory(ctx context.Context, id uuid.UUID, req AwardCategoryRequest) (AwardCategoryResponse, error) {
	_, err := s.repo.GetAwardCategoryByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AwardCategoryResponse{}, &HTTPStatusError{StatusCode: http.StatusNotFound, Message: "category not found"}
		}
		return AwardCategoryResponse{}, err
	}

	awardTypeIDs, err := s.validateCategoryRequest(ctx, req)
	if err != nil {
		return AwardCategoryResponse{}, err
	}

	_, err = s.repo.UpdateAwardCategory(ctx, storage.UpdateAwardCategoryParams{
		ID:          id,
		Name:        req.Name.ToJSONB(),
		Icon:        toPgText(req.Icon),
		Description: req.Description.ToJSONB(),
		AwardTypes:  awardTypeIDs,
	})
	if err != nil {
		return AwardCategoryResponse{}, err
	}

	if err = s.repo.DeleteAwardCategoryFieldsByCategoryID(ctx, id); err != nil {
		return AwardCategoryResponse{}, err
	}

	if err = s.createCategoryFields(ctx, id, req.Fields); err != nil {
		return AwardCategoryResponse{}, err
	}

	return s.GetCategoryByID(ctx, id)
}

func (s *AwardService) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetAwardCategoryByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &HTTPStatusError{StatusCode: http.StatusNotFound, Message: "category not found"}
		}
		return err
	}

	err = s.repo.DeleteAwardCategory(ctx, id)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return &HTTPStatusError{StatusCode: http.StatusConflict, Message: "category is used by awards"}
		}
		return err
	}

	return nil
}

func (s *AwardService) createCategoryFields(ctx context.Context, categoryID uuid.UUID, fields []AwardCategoryFieldRequest) error {
	for _, field := range fields {
		normalizedOptions, err := normalizeFieldOptionsForStorage(field.Type, field.Options)
		if err != nil {
			return err
		}

		fieldType := strings.ToLower(strings.TrimSpace(field.Type))
		required := field.Required
		if fieldType == "file" || fieldType == "url" {
			required = false
		}

		optionsJSON, err := json.Marshal(normalizedOptions)
		if err != nil || len(optionsJSON) == 0 || string(optionsJSON) == "null" {
			optionsJSON = []byte("[]")
		}

		validationJSON, err := json.Marshal(field.Validation)
		if err != nil || len(validationJSON) == 0 || string(validationJSON) == "null" {
			validationJSON = []byte("{}")
		}

		_, err = s.repo.CreateAwardCategoryField(ctx, &storage.CreateAwardCategoryFieldParams{
			CategoryID:  categoryID,
			Key:         strings.TrimSpace(field.Key),
			Label:       field.Label.ToJSONB(),
			Type:        fieldType,
			Required:    required,
			Placeholder: localePtrToJSONB(field.Placeholder),
			HelpText:    localePtrToJSONB(field.HelpText),
			Options:     optionsJSON,
			Validation:  validationJSON,
			SortOrder:   field.SortOrder,
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *AwardService) validateCategoryRequest(ctx context.Context, req AwardCategoryRequest) ([]uuid.UUID, error) {
	if req.Name.Ru == "" && req.Name.Kz == "" {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "name is required"}
	}

	awardTypeIDs, err := parseUUIDStrings(req.AwardTypes)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid awardTypes uuid"}
	}

	for _, id := range awardTypeIDs {
		_, err = s.repo.GetAwardTypeByID(ctx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "award type not found"}
			}
			return nil, err
		}
	}

	seen := make(map[string]struct{}, len(req.Fields))
	for _, field := range req.Fields {
		key := strings.TrimSpace(field.Key)
		labelRu := strings.TrimSpace(field.Label.Ru)
		labelKz := strings.TrimSpace(field.Label.Kz)
		fieldType := strings.ToLower(strings.TrimSpace(field.Type))

		if key == "" {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "field key is required"}
		}
		if labelRu == "" && labelKz == "" {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "field label is required"}
		}
		if _, ok := allowedDynamicFieldTypes[fieldType]; !ok {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("unsupported field type: %s", field.Type)}
		}
		if fieldType == "multi_fields" {
			if _, err := normalizeMultiFieldOptions(field.Options); err != nil {
				return nil, err
			}
		}
		if _, ok := seen[strings.ToLower(key)]; ok {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("duplicate field key: %s", key)}
		}
		seen[strings.ToLower(key)] = struct{}{}
	}

	return awardTypeIDs, nil
}

func (s *AwardService) mapCategoryResponse(ctx context.Context, category storage.AwardCategory, withAwardTypesExpanded bool) (AwardCategoryResponse, error) {
	fields, err := s.repo.GetAwardCategoryFieldsByCategoryID(ctx, category.ID)
	if err != nil {
		return AwardCategoryResponse{}, err
	}

	fieldsExpanded := make([]AwardCategoryFieldResponse, 0, len(fields))
	for _, field := range fields {
		mappedField, mapErr := s.mapCategoryFieldResponse(field)
		if mapErr != nil {
			return AwardCategoryResponse{}, mapErr
		}
		fieldsExpanded = append(fieldsExpanded, mappedField)
	}

	response := AwardCategoryResponse{
		ID:             category.ID,
		Name:           localization.LocaleTextFromJSONB(category.Name),
		Icon:           category.Icon.String,
		Description:    localization.LocaleTextFromJSONB(category.Description),
		AwardTypes:     formatUUIDs(category.AwardTypes),
		FieldsExpanded: fieldsExpanded,
		CreatedAt:      category.CreatedAt.Time,
		UpdatedAt:      category.UpdatedAt.Time,
	}

	if !withAwardTypesExpanded {
		return response, nil
	}

	typesExpanded := make([]TypeResponse, 0, len(category.AwardTypes))
	for _, typeID := range category.AwardTypes {
		dbType, typeErr := s.repo.GetAwardTypeByID(ctx, typeID)
		if typeErr != nil {
			if errors.Is(typeErr, pgx.ErrNoRows) {
				return AwardCategoryResponse{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "award type not found"}
			}
			return AwardCategoryResponse{}, typeErr
		}

		mappedType, buildErr := s.BuildType(ctx, dbType)
		if buildErr != nil {
			return AwardCategoryResponse{}, buildErr
		}
		typesExpanded = append(typesExpanded, mappedType)
	}

	response.AwardTypesExpanded = typesExpanded
	return response, nil
}

func (s *AwardService) mapCategoryFieldResponse(field storage.AwardCategoryField) (AwardCategoryFieldResponse, error) {
	var options any = []any{}
	if strings.EqualFold(strings.TrimSpace(field.Type), "multi_fields") {
		parsedOptions, err := parseStoredMultiFieldOptions(field.Options)
		if err != nil {
			return AwardCategoryFieldResponse{}, err
		}
		options = parsedOptions
	} else if len(field.Options) > 0 {
		if err := json.Unmarshal(field.Options, &options); err != nil {
			return AwardCategoryFieldResponse{}, err
		}
	}

	validation := map[string]any{}
	if len(field.Validation) > 0 {
		if err := json.Unmarshal(field.Validation, &validation); err != nil {
			return AwardCategoryFieldResponse{}, err
		}
	}

	return AwardCategoryFieldResponse{
		ID:          field.ID,
		Key:         field.Key,
		Label:       localization.LocaleTextFromJSONB(field.Label),
		Type:        field.Type,
		Required:    !strings.EqualFold(strings.TrimSpace(field.Type), "file") && !strings.EqualFold(strings.TrimSpace(field.Type), "url") && field.Required,
		Placeholder: localization.LocaleTextPtrFromJSONB(field.Placeholder),
		HelpText:    localization.LocaleTextPtrFromJSONB(field.HelpText),
		Options:     options,
		Validation:  validation,
		SortOrder:   field.SortOrder,
		CreatedAt:   field.CreatedAt.Time,
		UpdatedAt:   field.UpdatedAt.Time,
	}, nil
}

func normalizeFieldOptionsForStorage(fieldType string, rawOptions any) (any, error) {
	switch strings.ToLower(strings.TrimSpace(fieldType)) {
	case "multi_fields":
		return normalizeMultiFieldOptions(rawOptions)
	default:
		return rawOptions, nil
	}
}

func normalizeMultiFieldOptions(rawOptions any) ([]AwardCategoryMultiFieldOption, error) {
	if rawOptions == nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "multi_fields must contain at least one subfield"}
	}

	payload, err := json.Marshal(rawOptions)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid multi_fields options payload"}
	}

	var parsed []AwardCategoryMultiFieldOption
	if err = json.Unmarshal(payload, &parsed); err != nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid multi_fields options payload"}
	}

	if len(parsed) == 0 {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "multi_fields must contain at least one subfield"}
	}

	seen := make(map[string]struct{}, len(parsed))
	normalized := make([]AwardCategoryMultiFieldOption, 0, len(parsed))
	for _, option := range parsed {
		key := strings.TrimSpace(option.Key)
		labelRu := strings.TrimSpace(option.Label.Ru)
		labelKz := strings.TrimSpace(option.Label.Kz)
		fieldType := strings.ToLower(strings.TrimSpace(option.Type))

		if key == "" {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "multi_fields subfield key is required"}
		}
		if labelRu == "" && labelKz == "" {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("multi_fields subfield label is required: %s", key)}
		}
		if _, ok := allowedMultiFieldTypes[fieldType]; !ok {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    fmt.Sprintf("unsupported multi_fields subfield type: %s", option.Type),
			}
		}
		if _, ok := seen[strings.ToLower(key)]; ok {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    fmt.Sprintf("duplicate multi_fields subfield key: %s", key),
			}
		}

		normalizedOption := AwardCategoryMultiFieldOption{
			Key:         key,
			Label:       option.Label,
			Type:        fieldType,
			Required:    option.Required,
			Placeholder: trimEmptyLocaleTextPtr(option.Placeholder),
			HelpText:    trimEmptyLocaleTextPtr(option.HelpText),
			Options:     []string{},
			Validation:  sanitizeValidationMap(fieldType, option.Validation),
			SortOrder:   option.SortOrder,
		}

		if fieldType == "select" {
			selectOptions := normalizeStringOptions(option.Options)
			if len(selectOptions) == 0 {
				return nil, &HTTPStatusError{
					StatusCode: http.StatusBadRequest,
					Message:    fmt.Sprintf("multi_fields select subfield requires options: %s", key),
				}
			}
			normalizedOption.Options = selectOptions
		}

		seen[strings.ToLower(key)] = struct{}{}
		normalized = append(normalized, normalizedOption)
	}

	return normalized, nil
}

func parseStoredMultiFieldOptions(rawOptions []byte) ([]AwardCategoryMultiFieldOption, error) {
	if len(rawOptions) == 0 {
		return []AwardCategoryMultiFieldOption{}, nil
	}

	var options []AwardCategoryMultiFieldOption
	if err := json.Unmarshal(rawOptions, &options); err != nil {
		return nil, err
	}

	return options, nil
}

func sanitizeValidationMap(fieldType string, validation map[string]any) map[string]any {
	if len(validation) == 0 {
		return map[string]any{}
	}

	allowedKeys := numericValidationKeysByFieldType[strings.ToLower(strings.TrimSpace(fieldType))]
	if len(allowedKeys) == 0 {
		return map[string]any{}
	}

	sanitized := make(map[string]any, len(allowedKeys))
	for _, key := range allowedKeys {
		value, ok := validation[key]
		if !ok {
			continue
		}

		normalizedValue, ok := normalizeNumericValue(value)
		if !ok {
			continue
		}

		sanitized[key] = normalizedValue
	}

	return sanitized
}

func normalizeNumericValue(value any) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int8:
		return float64(v), true
	case int16:
		return float64(v), true
	case int32:
		return float64(v), true
	case int64:
		return float64(v), true
	case uint:
		return float64(v), true
	case uint8:
		return float64(v), true
	case uint16:
		return float64(v), true
	case uint32:
		return float64(v), true
	case uint64:
		return float64(v), true
	case json.Number:
		parsed, err := v.Float64()
		if err != nil {
			return 0, false
		}
		return parsed, true
	default:
		return 0, false
	}
}

func normalizeStringOptions(rawOptions any) []string {
	if !isNonNilArray(rawOptions) {
		return []string{}
	}

	payload, err := json.Marshal(rawOptions)
	if err != nil {
		return []string{}
	}

	var parsed []string
	if err = json.Unmarshal(payload, &parsed); err != nil {
		return []string{}
	}

	normalized := make([]string, 0, len(parsed))
	for _, option := range parsed {
		trimmed := strings.TrimSpace(option)
		if trimmed == "" {
			continue
		}
		normalized = append(normalized, trimmed)
	}

	return normalized
}

func isNonNilArray(value any) bool {
	switch value.(type) {
	case []any, []string, []AwardCategoryMultiFieldOption:
		return true
	default:
		return value != nil
	}
}

func trimEmptyLocaleTextPtr(value *localization.LocaleText) *localization.LocaleText {
	if value == nil {
		return nil
	}
	if strings.TrimSpace(value.Ru) == "" && strings.TrimSpace(value.Kz) == "" {
		return nil
	}
	return value
}

func (s *AwardService) normalizeFieldValuesInput(input any) (map[string]any, error) {
	switch v := input.(type) {
	case nil:
		return map[string]any{}, nil
	case []byte:
		if len(v) == 0 {
			return map[string]any{}, nil
		}
		var out map[string]any
		if err := json.Unmarshal(v, &out); err != nil {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid fieldValues JSON"}
		}
		if out == nil {
			out = map[string]any{}
		}
		return out, nil
	case map[string]any:
		if v == nil {
			return map[string]any{}, nil
		}
		return v, nil
	default:
		b, err := json.Marshal(v)
		if err != nil {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid fieldValues payload"}
		}
		var out map[string]any
		if err = json.Unmarshal(b, &out); err != nil {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid fieldValues payload"}
		}
		if out == nil {
			out = map[string]any{}
		}
		return out, nil
	}
}

func (s *AwardService) decodeFieldValues(raw []byte) (map[string]any, error) {
	return s.normalizeFieldValuesInput(raw)
}

func (s *AwardService) validateAndMarshalFieldValues(ctx context.Context, categoryID pgtype.UUID, values map[string]any) ([]byte, error) {
	if values == nil {
		values = map[string]any{}
	}

	if !categoryID.Valid {
		if len(values) > 0 {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "categoryId is required when fieldValues is provided"}
		}
		return []byte("{}"), nil
	}

	_, err := s.repo.GetAwardCategoryByID(ctx, categoryID.Bytes)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "category not found"}
		}
		return nil, err
	}

	fields, err := s.repo.GetAwardCategoryFieldsByCategoryID(ctx, categoryID.Bytes)
	if err != nil {
		return nil, err
	}

	fieldByKey := make(map[string]storage.AwardCategoryField, len(fields))
	for _, field := range fields {
		fieldByKey[field.Key] = field
	}

	for key := range values {
		if _, ok := fieldByKey[key]; !ok {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("unknown fieldValues key: %s", key)}
		}
	}

	for _, field := range fields {
		fieldType := strings.ToLower(strings.TrimSpace(field.Type))
		value, exists := values[field.Key]
		if !exists {
			if field.Required {
				return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("required field is missing: %s", field.Key)}
			}
			continue
		}

		if fieldType != "multi_fields" && fieldType != "file" && fieldType != "url" && field.Required && !hasProvidedValue(value) {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("required field is empty: %s", field.Key)}
		}

		if normalizedValue, normErr := normalizeAndValidateFieldValue(field, value); normErr != nil {
			return nil, normErr
		} else {
			values[field.Key] = normalizedValue
		}
	}

	payload, err := json.Marshal(values)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid fieldValues payload"}
	}

	return payload, nil
}

func normalizeAndValidateFieldValue(field storage.AwardCategoryField, value any) (any, error) {
	fieldType := strings.ToLower(strings.TrimSpace(field.Type))

	if fieldType == "multi_fields" {
		return validateMultiFieldValueType(field, value)
	}

	if err := validateFieldValueType(field, value); err != nil {
		return nil, err
	}

	return value, nil
}

func validateFieldValueType(field storage.AwardCategoryField, value any) error {
	fieldType := strings.ToLower(strings.TrimSpace(field.Type))
	key := field.Key

	switch fieldType {
	case "text", "textarea", "date", "group":
		if _, ok := value.(string); !ok {
			return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a string", key)}
		}
		if strings.TrimSpace(value.(string)) == "" {
			return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must not be empty", key)}
		}
	case "url":
		if err := validateURLOrURLArray(value, key); err != nil {
			return err
		}
	case "number":
		switch value.(type) {
		case float64, float32, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, json.Number:
		default:
			return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a number", key)}
		}
	case "select":
		if err := validateStringOrStringArray(value, key, "select option"); err != nil {
			return err
		}
	case "file":
		if err := validateStringOrStringArray(value, key, "file URL"); err != nil {
			return err
		}
	default:
		return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("unsupported field type for %s", key)}
	}

	return nil
}

func validateMultiFieldValueType(field storage.AwardCategoryField, value any) (any, error) {
	options, err := parseStoredMultiFieldOptions(field.Options)
	if err != nil {
		return nil, err
	}

	rows, err := normalizeMultiFieldRows(value)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be an array of objects", field.Key)}
	}

	if field.Required && len(rows) == 0 {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("required field is empty: %s", field.Key)}
	}

	if len(rows) == 0 {
		return []map[string]any{}, nil
	}

	childByKey := make(map[string]AwardCategoryMultiFieldOption, len(options))
	for _, option := range options {
		childByKey[option.Key] = option
	}

	for rowIndex, row := range rows {
		for key := range row {
			if _, ok := childByKey[key]; !ok {
				return nil, &HTTPStatusError{
					StatusCode: http.StatusBadRequest,
					Message:    fmt.Sprintf("unknown multi_fields key %s in %s[%d]", key, field.Key, rowIndex),
				}
			}
		}

		for _, option := range options {
			rawValue, exists := row[option.Key]
			if !exists {
				if option.Required {
					return nil, &HTTPStatusError{
						StatusCode: http.StatusBadRequest,
						Message:    fmt.Sprintf("required field is missing: %s.%s", field.Key, option.Key),
					}
				}
				continue
			}

			if option.Required && !hasProvidedValue(rawValue) {
				return nil, &HTTPStatusError{
					StatusCode: http.StatusBadRequest,
					Message:    fmt.Sprintf("required field is empty: %s.%s", field.Key, option.Key),
				}
			}

			normalizedValue, normalizeErr := normalizeMultiFieldChildValue(field.Key, option, rawValue)
			if normalizeErr != nil {
				return nil, normalizeErr
			}
			row[option.Key] = normalizedValue
		}
	}

	return rows, nil
}

func normalizeMultiFieldRows(value any) ([]map[string]any, error) {
	switch rows := value.(type) {
	case []map[string]any:
		if rows == nil {
			return []map[string]any{}, nil
		}
		return rows, nil
	case []any:
		normalized := make([]map[string]any, 0, len(rows))
		for _, row := range rows {
			rowMap, ok := row.(map[string]any)
			if !ok || rowMap == nil {
				return nil, fmt.Errorf("multi_fields row must be an object")
			}
			normalized = append(normalized, rowMap)
		}
		return normalized, nil
	default:
		return nil, fmt.Errorf("multi_fields value must be array")
	}
}

func normalizeMultiFieldChildValue(parentKey string, option AwardCategoryMultiFieldOption, value any) (any, error) {
	key := fmt.Sprintf("%s.%s", parentKey, option.Key)
	switch option.Type {
	case "text", "textarea", "date", "group":
		if _, ok := value.(string); !ok {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a string", key)}
		}
		if strings.TrimSpace(value.(string)) == "" {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must not be empty", key)}
		}
		return value, nil
	case "number":
		switch v := value.(type) {
		case float64, float32, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, json.Number:
			return v, nil
		default:
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a number", key)}
		}
	case "select":
		if err := validateStringOrStringArray(value, key, "select option"); err != nil {
			return nil, err
		}
		return value, nil
	default:
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("unsupported multi_fields subfield type for %s", key)}
	}
}

func validateStringOrStringArray(value any, key string, label string) error {
	switch v := value.(type) {
	case string:
		return nil
	case []string:
		return nil
	case []any:
		for _, item := range v {
			if _, ok := item.(string); !ok {
				return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must contain %s strings", key, label)}
			}
		}
		return nil
	default:
		return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a string or array of strings", key)}
	}
}

func hasProvidedValue(value any) bool {
	if value == nil {
		return false
	}

	switch v := value.(type) {
	case string:
		return strings.TrimSpace(v) != ""
	case []string:
		for _, item := range v {
			if strings.TrimSpace(item) != "" {
				return true
			}
		}
		return false
	case []any:
		for _, item := range v {
			if hasProvidedValue(item) {
				return true
			}
		}
		return false
	case map[string]any:
		for _, item := range v {
			if hasProvidedValue(item) {
				return true
			}
		}
		return false
	default:
		return true
	}
}

func validateURLOrURLArray(value any, key string) error {
	validate := func(raw string) error {
		trimmed := strings.TrimSpace(raw)
		if trimmed == "" {
			return nil
		}
		if parsed, err := url.ParseRequestURI(trimmed); err == nil && parsed.Scheme != "" && parsed.Host != "" {
			return nil
		}

		withScheme := "https://" + trimmed
		if parsed, err := url.ParseRequestURI(withScheme); err == nil && parsed.Host != "" {
			if host := parsed.Hostname(); strings.Contains(host, ".") {
				return nil
			}
		}

		return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a valid URL", key)}
	}

	switch v := value.(type) {
	case string:
		return validate(v)
	case []string:
		for _, item := range v {
			if err := validate(item); err != nil {
				return err
			}
		}
		return nil
	case []any:
		for _, item := range v {
			str, ok := item.(string)
			if !ok {
				return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must contain URL strings", key)}
			}
			if err := validate(str); err != nil {
				return err
			}
		}
		return nil
	default:
		return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a string or array of strings", key)}
	}
}

func (s *AwardService) MergeUploadedFilesIntoFieldValues(
	ctx context.Context,
	userID uuid.UUID,
	awardID uuid.UUID,
	categoryID pgtype.UUID,
	rawFieldValues any,
	formFiles map[string][]*multipart.FileHeader,
) (map[string]any, error) {
	values, err := s.normalizeFieldValuesInput(rawFieldValues)
	if err != nil {
		return nil, err
	}

	if len(formFiles) == 0 {
		return values, nil
	}

	if !categoryID.Valid {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "categoryId is required when uploading files"}
	}

	fields, err := s.repo.GetAwardCategoryFieldsByCategoryID(ctx, categoryID.Bytes)
	if err != nil {
		return nil, err
	}

	fileFieldKeys := make([]string, 0)
	fileFieldSet := make(map[string]struct{})
	for _, field := range fields {
		if strings.EqualFold(strings.TrimSpace(field.Type), "file") {
			fileFieldKeys = append(fileFieldKeys, field.Key)
			fileFieldSet[field.Key] = struct{}{}
		}
	}

	for formKey, headers := range formFiles {
		if len(headers) == 0 {
			continue
		}

		targetKey := strings.TrimSpace(formKey)
		if targetKey == "files" || targetKey == "files[]" {
			if len(fileFieldKeys) != 1 {
				return nil, &HTTPStatusError{
					StatusCode: http.StatusBadRequest,
					Message:    "ambiguous file field: upload using multipart key fieldValues.<fieldKey>",
				}
			}
			targetKey = fileFieldKeys[0]
		} else if strings.HasPrefix(targetKey, "fieldValues.") {
			targetKey = strings.TrimPrefix(targetKey, "fieldValues.")
		} else if strings.HasPrefix(targetKey, "fieldValues[") && strings.HasSuffix(targetKey, "]") {
			targetKey = strings.TrimSuffix(strings.TrimPrefix(targetKey, "fieldValues["), "]")
		}

		if _, ok := fileFieldSet[targetKey]; !ok {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    fmt.Sprintf("unknown file field key: %s", targetKey),
			}
		}

		uploaded := make([]string, 0, len(headers))
		for _, fileHeader := range headers {
			file, openErr := fileHeader.Open()
			if openErr != nil {
				return nil, openErr
			}

			objectName := fmt.Sprintf(
				"awards/%s/%s/%s",
				userID.String(),
				awardID.String(),
				fileHeader.Filename,
			)

			fileKey, uploadErr := s.UploadFile(ctx, objectName, file, fileHeader.Size)
			closeErr := file.Close()
			if uploadErr != nil {
				return nil, uploadErr
			}
			if closeErr != nil {
				return nil, closeErr
			}

			uploaded = append(uploaded, fileKey)
		}

		values[targetKey] = mergeUploadedFileKeys(values[targetKey], uploaded)
	}

	return values, nil
}

func (s *AwardService) ResolveFieldValueFileURLs(
	ctx context.Context,
	categoryID *uuid.UUID,
	values map[string]any,
) (map[string]any, error) {
	if values == nil {
		return map[string]any{}, nil
	}
	if categoryID == nil {
		return values, nil
	}

	fields, err := s.repo.GetAwardCategoryFieldsByCategoryID(ctx, *categoryID)
	if err != nil {
		return nil, err
	}

	resolved := make(map[string]any, len(values))
	for key, value := range values {
		resolved[key] = value
	}

	for _, field := range fields {
		if !strings.EqualFold(strings.TrimSpace(field.Type), "file") {
			continue
		}
		value, ok := resolved[field.Key]
		if !ok {
			continue
		}

		resolved[field.Key] = s.resolveFileFieldValueURLs(ctx, value)
	}

	return resolved, nil
}

func mergeUploadedFileKeys(existing any, uploaded []string) any {
	if len(uploaded) == 0 {
		return existing
	}

	merged := make([]string, 0)
	seen := make(map[string]struct{})
	appendUnique := func(value string) {
		key := strings.TrimSpace(value)
		if key == "" {
			return
		}
		if _, ok := seen[key]; ok {
			return
		}
		seen[key] = struct{}{}
		merged = append(merged, key)
	}

	switch v := existing.(type) {
	case string:
		if normalized, ok := normalizeStoredFileReference(v); ok {
			appendUnique(normalized)
		}
	case []string:
		for _, item := range v {
			if normalized, ok := normalizeStoredFileReference(item); ok {
				appendUnique(normalized)
			}
		}
	case []any:
		for _, item := range v {
			str, ok := item.(string)
			if !ok {
				continue
			}
			if normalized, ok := normalizeStoredFileReference(str); ok {
				appendUnique(normalized)
			}
		}
	}

	for _, item := range uploaded {
		appendUnique(item)
	}
	return merged
}

func (s *AwardService) resolveFileFieldValueURLs(ctx context.Context, value any) any {
	resolve := func(key string) string {
		normalizedKey, ok := normalizeStoredFileReference(key)
		if !ok {
			return key
		}
		urlValue, err := s.GetFileDownloadURL(ctx, normalizedKey)
		if err != nil {
			return key
		}
		return urlValue
	}

	switch v := value.(type) {
	case string:
		return resolve(v)
	case []string:
		out := make([]string, 0, len(v))
		for _, key := range v {
			out = append(out, resolve(key))
		}
		return out
	case []any:
		out := make([]string, 0, len(v))
		for _, item := range v {
			key, ok := item.(string)
			if !ok {
				continue
			}
			out = append(out, resolve(key))
		}
		return out
	default:
		return value
	}
}

func normalizeStoredFileReference(raw string) (string, bool) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", false
	}

	if parsed, err := url.Parse(trimmed); err == nil && parsed.Scheme != "" && parsed.Host != "" {
		path := strings.Trim(parsed.Path, "/")
		if path == "" {
			return "", false
		}

		parts := strings.SplitN(path, "/", 2)
		if len(parts) == 2 && strings.TrimSpace(parts[1]) != "" {
			return parts[1], true
		}
		return "", false
	}

	if !strings.Contains(trimmed, "/") {
		return "", false
	}

	return trimmed, true
}

func parseUUIDStrings(values []string) ([]uuid.UUID, error) {
	if len(values) == 0 {
		return []uuid.UUID{}, nil
	}

	out := make([]uuid.UUID, 0, len(values))
	for _, value := range values {
		id, err := uuid.Parse(strings.TrimSpace(value))
		if err != nil {
			return nil, err
		}
		out = append(out, id)
	}

	return out, nil
}

func formatUUIDs(values []uuid.UUID) []string {
	if len(values) == 0 {
		return []string{}
	}

	out := make([]string, 0, len(values))
	for _, id := range values {
		out = append(out, id.String())
	}
	return out
}

func localePtrToJSONB(value *localization.LocaleText) []byte {
	if value == nil {
		return nil
	}
	return value.ToJSONB()
}

func toPgText(value string) pgtype.Text {
	if strings.TrimSpace(value) == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: value, Valid: true}
}

func fromPgText(value pgtype.Text) string {
	if !value.Valid {
		return ""
	}
	return value.String
}
