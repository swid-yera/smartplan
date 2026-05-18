package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	storage "eduplan/backend/pkg/sqlc/generated"
)

var allowedDynamicFieldTypes = map[string]struct{}{
	"text":     {},
	"textarea": {},
	"number":   {},
	"select":   {},
	"date":     {},
	"file":     {},
	"url":      {},
	"checkbox": {},
}

type AwardCategoryFieldRequest struct {
	Key         string         `json:"key"`
	Label       string         `json:"label"`
	Type        string         `json:"type"`
	Required    bool           `json:"required"`
	Placeholder string         `json:"placeholder"`
	HelpText    string         `json:"helpText"`
	Options     any            `json:"options"`
	Validation  map[string]any `json:"validation"`
	SortOrder   int32          `json:"sortOrder"`
}

type AwardCategoryFieldResponse struct {
	ID          uuid.UUID      `json:"id"`
	Key         string         `json:"key"`
	Label       string         `json:"label"`
	Type        string         `json:"type"`
	Required    bool           `json:"required"`
	Placeholder string         `json:"placeholder,omitempty"`
	HelpText    string         `json:"helpText,omitempty"`
	Options     any            `json:"options"`
	Validation  map[string]any `json:"validation"`
	SortOrder   int32          `json:"sortOrder"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

type AwardCategoryRequest struct {
	Name        string   `json:"name"`
	Icon        string   `json:"icon"`
	Description string   `json:"description"`
	AwardTypes  []string `json:"awardTypes"`
	Fields      []string `json:"fields"`
}

type AwardCategoryResponse struct {
	ID                 uuid.UUID                    `json:"id"`
	Name               string                       `json:"name"`
	Icon               string                       `json:"icon,omitempty"`
	Description        string                       `json:"description,omitempty"`
	AwardTypes         []string                     `json:"awardTypes"`
	Fields             []string                     `json:"fields"`
	AwardTypesExpanded []TypeResponse               `json:"awardTypesExpanded,omitempty"`
	FieldsExpanded     []AwardCategoryFieldResponse `json:"fieldsExpanded,omitempty"`
	CreatedAt          time.Time                    `json:"createdAt"`
	UpdatedAt          time.Time                    `json:"updatedAt"`
}

func (s *AwardService) CreateCategoryField(ctx context.Context, req AwardCategoryFieldRequest) (AwardCategoryFieldResponse, error) {
	fieldType := strings.ToLower(strings.TrimSpace(req.Type))
	if strings.TrimSpace(req.Key) == "" {
		return AwardCategoryFieldResponse{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "key is required"}
	}
	if strings.TrimSpace(req.Label) == "" {
		return AwardCategoryFieldResponse{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "label is required"}
	}
	if _, ok := allowedDynamicFieldTypes[fieldType]; !ok {
		return AwardCategoryFieldResponse{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "unsupported field type"}
	}

	optionsJSON, err := json.Marshal(req.Options)
	if err != nil || len(optionsJSON) == 0 || string(optionsJSON) == "null" {
		optionsJSON = []byte("[]")
	}
	validationJSON, err := json.Marshal(req.Validation)
	if err != nil || len(validationJSON) == 0 || string(validationJSON) == "null" {
		validationJSON = []byte("{}")
	}

	dbField, err := s.repo.CreateAwardCategoryField(ctx, &storage.CreateAwardCategoryFieldParams{
		Key:         strings.TrimSpace(req.Key),
		Label:       strings.TrimSpace(req.Label),
		Type:        fieldType,
		Required:    req.Required,
		Placeholder: toPgText(req.Placeholder),
		HelpText:    toPgText(req.HelpText),
		Options:     optionsJSON,
		Validation:  validationJSON,
		SortOrder:   req.SortOrder,
	})
	if err != nil {
		return AwardCategoryFieldResponse{}, err
	}

	return s.mapCategoryFieldResponse(dbField)
}

func (s *AwardService) GetAllCategoryFields(ctx context.Context) ([]AwardCategoryFieldResponse, error) {
	fields, err := s.repo.GetAllAwardCategoryFields(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]AwardCategoryFieldResponse, 0, len(fields))
	for _, f := range fields {
		item, mapErr := s.mapCategoryFieldResponse(f)
		if mapErr != nil {
			return nil, mapErr
		}
		result = append(result, item)
	}
	return result, nil
}

func (s *AwardService) GetCategoryFieldByID(ctx context.Context, id uuid.UUID) (AwardCategoryFieldResponse, error) {
	field, err := s.repo.GetAwardCategoryFieldByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AwardCategoryFieldResponse{}, &HTTPStatusError{StatusCode: http.StatusNotFound, Message: "category field not found"}
		}
		return AwardCategoryFieldResponse{}, err
	}
	return s.mapCategoryFieldResponse(field)
}

func (s *AwardService) UpdateCategoryField(ctx context.Context, id uuid.UUID, req AwardCategoryFieldRequest) (AwardCategoryFieldResponse, error) {
	_, err := s.repo.GetAwardCategoryFieldByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AwardCategoryFieldResponse{}, &HTTPStatusError{StatusCode: http.StatusNotFound, Message: "category field not found"}
		}
		return AwardCategoryFieldResponse{}, err
	}

	fieldType := strings.ToLower(strings.TrimSpace(req.Type))
	if strings.TrimSpace(req.Key) == "" || strings.TrimSpace(req.Label) == "" {
		return AwardCategoryFieldResponse{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "key and label are required"}
	}
	if _, ok := allowedDynamicFieldTypes[fieldType]; !ok {
		return AwardCategoryFieldResponse{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "unsupported field type"}
	}

	optionsJSON, err := json.Marshal(req.Options)
	if err != nil || len(optionsJSON) == 0 || string(optionsJSON) == "null" {
		optionsJSON = []byte("[]")
	}
	validationJSON, err := json.Marshal(req.Validation)
	if err != nil || len(validationJSON) == 0 || string(validationJSON) == "null" {
		validationJSON = []byte("{}")
	}

	field, err := s.repo.UpdateAwardCategoryField(ctx, storage.UpdateAwardCategoryFieldParams{
		ID:          id,
		Key:         strings.TrimSpace(req.Key),
		Label:       strings.TrimSpace(req.Label),
		Type:        fieldType,
		Required:    req.Required,
		Placeholder: toPgText(req.Placeholder),
		HelpText:    toPgText(req.HelpText),
		Options:     optionsJSON,
		Validation:  validationJSON,
		SortOrder:   req.SortOrder,
	})
	if err != nil {
		return AwardCategoryFieldResponse{}, err
	}

	return s.mapCategoryFieldResponse(field)
}

func (s *AwardService) DeleteCategoryField(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetAwardCategoryFieldByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &HTTPStatusError{StatusCode: http.StatusNotFound, Message: "category field not found"}
		}
		return err
	}
	return s.repo.DeleteAwardCategoryField(ctx, id)
}

func (s *AwardService) CreateCategory(ctx context.Context, req AwardCategoryRequest) (AwardCategoryResponse, error) {
	categoryParams, err := s.buildCategoryParams(ctx, req)
	if err != nil {
		return AwardCategoryResponse{}, err
	}
	dbCategory, err := s.repo.CreateAwardCategory(ctx, &categoryParams)
	if err != nil {
		return AwardCategoryResponse{}, err
	}
	return s.mapCategoryResponse(ctx, dbCategory, false)
}

func (s *AwardService) GetAllCategories(ctx context.Context) ([]AwardCategoryResponse, error) {
	categories, err := s.repo.GetAllAwardCategories(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]AwardCategoryResponse, 0, len(categories))
	for _, c := range categories {
		item, mapErr := s.mapCategoryResponse(ctx, c, false)
		if mapErr != nil {
			return nil, mapErr
		}
		result = append(result, item)
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

	params, err := s.buildCategoryParams(ctx, req)
	if err != nil {
		return AwardCategoryResponse{}, err
	}

	updated, err := s.repo.UpdateAwardCategory(ctx, storage.UpdateAwardCategoryParams{
		ID:          id,
		Name:        params.Name,
		AwardTypes:  params.AwardTypes,
		Fields:      params.Fields,
		Icon:        params.Icon,
		Description: params.Description,
	})
	if err != nil {
		return AwardCategoryResponse{}, err
	}
	return s.mapCategoryResponse(ctx, updated, false)
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

func (s *AwardService) buildCategoryParams(ctx context.Context, req AwardCategoryRequest) (storage.CreateAwardCategoryParams, error) {
	if strings.TrimSpace(req.Name) == "" {
		return storage.CreateAwardCategoryParams{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "name is required"}
	}

	awardTypeIDs, err := parseUUIDStrings(req.AwardTypes)
	if err != nil {
		return storage.CreateAwardCategoryParams{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid awardTypes uuid"}
	}
	fieldIDs, err := parseUUIDStrings(req.Fields)
	if err != nil {
		return storage.CreateAwardCategoryParams{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid fields uuid"}
	}

	for _, id := range awardTypeIDs {
		if _, err = s.repo.GetAwardTypeByID(ctx, id); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return storage.CreateAwardCategoryParams{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "award type not found"}
			}
			return storage.CreateAwardCategoryParams{}, err
		}
	}
	for _, id := range fieldIDs {
		if _, err = s.repo.GetAwardCategoryFieldByID(ctx, id); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return storage.CreateAwardCategoryParams{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "category field not found"}
			}
			return storage.CreateAwardCategoryParams{}, err
		}
	}

	return storage.CreateAwardCategoryParams{
		Name:        strings.TrimSpace(req.Name),
		Icon:        toPgText(req.Icon),
		Description: toPgText(req.Description),
		AwardTypes:  awardTypeIDs,
		Fields:      fieldIDs,
	}, nil
}

func (s *AwardService) mapCategoryFieldResponse(field storage.AwardCategoryField) (AwardCategoryFieldResponse, error) {
	var options any = []any{}
	if len(field.Options) > 0 {
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
		Label:       field.Label,
		Type:        field.Type,
		Required:    field.Required,
		Placeholder: field.Placeholder.String,
		HelpText:    field.HelpText.String,
		Options:     options,
		Validation:  validation,
		SortOrder:   field.SortOrder,
		CreatedAt:   field.CreatedAt.Time,
		UpdatedAt:   field.UpdatedAt.Time,
	}, nil
}

func (s *AwardService) mapCategoryResponse(ctx context.Context, category storage.AwardCategory, withExpanded bool) (AwardCategoryResponse, error) {
	resp := AwardCategoryResponse{
		ID:          category.ID,
		Name:        category.Name,
		Icon:        category.Icon.String,
		Description: category.Description.String,
		AwardTypes:  formatUUIDs(category.AwardTypes),
		Fields:      formatUUIDs(category.Fields),
		CreatedAt:   category.CreatedAt.Time,
		UpdatedAt:   category.UpdatedAt.Time,
	}

	if !withExpanded {
		return resp, nil
	}

	typesExpanded := make([]TypeResponse, 0, len(category.AwardTypes))
	for _, id := range category.AwardTypes {
		dbType, err := s.repo.GetAwardTypeByID(ctx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return AwardCategoryResponse{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "award type not found"}
			}
			return AwardCategoryResponse{}, err
		}
		mappedType, err := s.BuildType(ctx, dbType)
		if err != nil {
			return AwardCategoryResponse{}, err
		}
		typesExpanded = append(typesExpanded, mappedType)
	}
	resp.AwardTypesExpanded = typesExpanded

	if len(category.Fields) == 0 {
		resp.FieldsExpanded = []AwardCategoryFieldResponse{}
		return resp, nil
	}

	dbFields, err := s.repo.GetAwardCategoryFieldsByIDs(ctx, category.Fields)
	if err != nil {
		return AwardCategoryResponse{}, err
	}
	fieldMap := make(map[uuid.UUID]storage.AwardCategoryField, len(dbFields))
	for _, f := range dbFields {
		fieldMap[f.ID] = f
	}
	resp.FieldsExpanded = make([]AwardCategoryFieldResponse, 0, len(category.Fields))
	for _, id := range category.Fields {
		field, ok := fieldMap[id]
		if !ok {
			return AwardCategoryResponse{}, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "category field not found"}
		}
		mapped, mapErr := s.mapCategoryFieldResponse(field)
		if mapErr != nil {
			return AwardCategoryResponse{}, mapErr
		}
		resp.FieldsExpanded = append(resp.FieldsExpanded, mapped)
	}

	return resp, nil
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

	category, err := s.repo.GetAwardCategoryByID(ctx, categoryID.Bytes)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "category not found"}
		}
		return nil, err
	}

	fields, err := s.repo.GetAwardCategoryFieldsByIDs(ctx, category.Fields)
	if err != nil {
		return nil, err
	}

	fieldByKey := make(map[string]storage.AwardCategoryField, len(fields))
	for _, f := range fields {
		fieldByKey[f.Key] = f
	}

	for key := range values {
		if _, ok := fieldByKey[key]; !ok {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("unknown fieldValues key: %s", key)}
		}
	}

	for _, f := range fields {
		value, exists := values[f.Key]
		if !exists {
			if f.Required {
				return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("required field is missing: %s", f.Key)}
			}
			continue
		}

		if f.Required && !hasProvidedValue(value) {
			return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("required field is empty: %s", f.Key)}
		}

		if err := validateFieldValueType(f, value); err != nil {
			return nil, err
		}
	}

	out, err := json.Marshal(values)
	if err != nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "invalid fieldValues payload"}
	}
	return out, nil
}

func validateFieldValueType(field storage.AwardCategoryField, value any) error {
	fieldType := strings.ToLower(strings.TrimSpace(field.Type))
	switch fieldType {
	case "text", "textarea", "date":
		if _, ok := value.(string); !ok {
			return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a string", field.Key)}
		}
	case "url":
		str, ok := value.(string)
		if !ok {
			return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a string URL", field.Key)}
		}
		if strings.TrimSpace(str) != "" {
			if _, err := url.ParseRequestURI(str); err != nil {
				return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a valid URL", field.Key)}
			}
		}
	case "number":
		switch value.(type) {
		case float64, float32, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, json.Number:
		default:
			return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a number", field.Key)}
		}
	case "checkbox":
		if _, ok := value.(bool); !ok {
			return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("field %s must be a boolean", field.Key)}
		}
	case "select":
		if err := validateStringOrStringArray(value, field.Key, "select option"); err != nil {
			return err
		}
	case "file":
		if err := validateStringOrStringArray(value, field.Key, "file URL"); err != nil {
			return err
		}
	default:
		return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("unsupported field type for %s", field.Key)}
	}
	return nil
}

func validateStringOrStringArray(value any, key string, label string) error {
	switch v := value.(type) {
	case string:
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
	case []any:
		return len(v) > 0
	default:
		return true
	}
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

func toPgText(value string) pgtype.Text {
	if strings.TrimSpace(value) == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: value, Valid: true}
}
