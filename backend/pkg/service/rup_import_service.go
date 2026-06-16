package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"eduplan/backend/pkg/localization"

	"github.com/google/uuid"
)

const maxRupImportFileBytes = 15 * 1024 * 1024

var studyYearPattern = regexp.MustCompile(`^\d{4}-\d{4}$`)

type ParsedRupPayload struct {
	SourceLanguage      string                  `json:"sourceLanguage"`
	Name                localization.LocaleText `json:"name"`
	Type                string                  `json:"type"`
	StudyForm           string                  `json:"studyForm"`
	TotalHours          int32                   `json:"totalHours"`
	CourseSuggestion    int32                   `json:"courseSuggestion"`
	StudyYearSuggestion string                  `json:"studyYearSuggestion"`
	GroupsRaw           []string                `json:"groupsRaw"`
	SpecialtyRaw        string                  `json:"specialtyRaw"`
	QualificationRaw    string                  `json:"qualificationRaw"`
	DevelopersRaw       []string                `json:"developersRaw"`
	ExplorationNote     *ExplorationNoteRequest `json:"explorationNote"`
	Disciplines         []*DisciplineRequest    `json:"disciplines"`
	Warnings            []string                `json:"warnings"`
}

type RupImportDraft struct {
	ID        uuid.UUID        `json:"id"`
	CreatedBy uuid.UUID        `json:"createdBy"`
	Payload   ParsedRupPayload `json:"payload"`
	Warnings  []string         `json:"warnings"`
	CreatedAt time.Time        `json:"createdAt"`
}

type ParseRupImportResponse struct {
	ImportDraftID uuid.UUID        `json:"importDraftId"`
	Payload       ParsedRupPayload `json:"payload"`
	Warnings      []string         `json:"warnings"`
}

type ConfirmRupImportRequest struct {
	ImportDraftID uuid.UUID `json:"importDraftId"`
	GroupID       uuid.UUID `json:"groupId"`
	StudyYear     string    `json:"studyYear"`
	Course        int32     `json:"course"`
}

func (s *rupService) ParseRupImport(
	ctx context.Context,
	fileName string,
	content []byte,
	userID uuid.UUID,
) (*ParseRupImportResponse, error) {
	if userID == uuid.Nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusUnauthorized, Message: "User not authenticated"}
	}
	if len(content) == 0 {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "empty file"}
	}
	if len(content) > maxRupImportFileBytes {
		return nil, &HTTPStatusError{StatusCode: http.StatusRequestEntityTooLarge, Message: "file is too large"}
	}
	if strings.ToLower(filepath.Ext(fileName)) != ".docx" {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "only .docx files are supported"}
	}
	if s.importDrafts == nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusServiceUnavailable, Message: "import draft store is not configured"}
	}

	endpoint := strings.TrimRight(s.cfg.Url, "/") + "/parse-rup-docx"
	resp, err := s.docRender.PostMultipartFile(ctx, endpoint, "file", fileName, content)
	if err != nil {
		return nil, fmt.Errorf("parse rup docx request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(resp.Body)
		return nil, &HTTPStatusError{
			StatusCode: resp.StatusCode,
			Message:    strings.TrimSpace(string(errBody)),
		}
	}

	var payload ParsedRupPayload
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode rup import payload: %w", err)
	}
	if err := validateParsedRupPayload(payload); err != nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusUnprocessableEntity, Message: err.Error()}
	}

	draftID := uuid.New()
	warnings := normalizeWarnings(payload.Warnings)
	draft := RupImportDraft{
		ID:        draftID,
		CreatedBy: userID,
		Payload:   payload,
		Warnings:  warnings,
		CreatedAt: time.Now().UTC(),
	}
	if err := s.importDrafts.Set(ctx, draft); err != nil {
		return nil, err
	}

	return &ParseRupImportResponse{
		ImportDraftID: draftID,
		Payload:       payload,
		Warnings:      warnings,
	}, nil
}

func (s *rupService) ConfirmRupImport(
	ctx context.Context,
	userID uuid.UUID,
	req ConfirmRupImportRequest,
) (*RupResponse, error) {
	if userID == uuid.Nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusUnauthorized, Message: "User not authenticated"}
	}
	if req.ImportDraftID == uuid.Nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "importDraftId is required"}
	}
	if req.GroupID == uuid.Nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "groupId is required"}
	}
	if !studyYearPattern.MatchString(strings.TrimSpace(req.StudyYear)) {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "studyYear must be in YYYY-YYYY format"}
	}
	if req.Course < 1 || req.Course > 4 {
		return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: "course must be between 1 and 4"}
	}
	if s.importDrafts == nil {
		return nil, &HTTPStatusError{StatusCode: http.StatusServiceUnavailable, Message: "import draft store is not configured"}
	}

	draft, exists, err := s.importDrafts.Get(ctx, req.ImportDraftID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, &HTTPStatusError{StatusCode: http.StatusNotFound, Message: "import draft not found or expired"}
	}
	if draft.CreatedBy != userID {
		return nil, &HTTPStatusError{StatusCode: http.StatusForbidden, Message: "forbidden"}
	}

	createReq := CreateRupRequest{
		Name:            draft.Payload.Name.Normalized(),
		Type:            normalizeImportedRupType(draft.Payload.Type),
		StudyForm:       normalizeImportedStudyForm(draft.Payload.StudyForm),
		StudyYear:       strings.TrimSpace(req.StudyYear),
		Course:          req.Course,
		Contacts:        []string{},
		Groups:          []string{req.GroupID.String()},
		Teacher:         userID.String(),
		SourceLanguage:  "",
		ExplorationNote: normalizeImportedExplorationNote(draft.Payload.ExplorationNote),
		Disciplines:     normalizeImportedDisciplines(draft.Payload.Disciplines),
	}

	rup, err := s.CreateImportedRup(ctx, createReq)
	if err != nil {
		return nil, err
	}

	_ = s.importDrafts.Delete(ctx, req.ImportDraftID)

	return rup, nil
}

func (s *rupService) CreateImportedRup(ctx context.Context, req CreateRupRequest) (*RupResponse, error) {
	return s.createRup(ctx, req, false)
}

func validateParsedRupPayload(payload ParsedRupPayload) error {
	if strings.TrimSpace(payload.Name.Ru) == "" && strings.TrimSpace(payload.Name.Kz) == "" {
		return fmt.Errorf("parsed RUP name is empty")
	}
	if len(payload.Disciplines) == 0 {
		return fmt.Errorf("parsed disciplines are empty")
	}
	return nil
}

func normalizeWarnings(warnings []string) []string {
	result := make([]string, 0, len(warnings))
	seen := map[string]struct{}{}
	for _, warning := range warnings {
		warning = strings.TrimSpace(warning)
		if warning == "" {
			continue
		}
		if _, ok := seen[warning]; ok {
			continue
		}
		seen[warning] = struct{}{}
		result = append(result, warning)
	}
	return result
}

func normalizeImportedRupType(value string) string {
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "PRACTICE":
		return "PRACTICE"
	default:
		return "THEORY"
	}
}

func normalizeImportedStudyForm(value string) string {
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "CORRESPONDENCE":
		return "CORRESPONDENCE"
	default:
		return "FULL_TIME"
	}
}

func normalizeImportedExplorationNote(note *ExplorationNoteRequest) *ExplorationNoteRequest {
	if note != nil {
		return note
	}
	return &ExplorationNoteRequest{
		Basis:              localization.LocaleText{},
		Goals:              localization.LocaleText{},
		Competencies:       localization.LocaleText{},
		Prerequisites:      localization.LocaleText{},
		Postrequisites:     localization.LocaleText{},
		InternetResources:  []*ResourceRequest{},
		TechnicalResources: []*ResourceRequest{},
	}
}

func normalizeImportedDisciplines(disciplines []*DisciplineRequest) []*DisciplineRequest {
	result := make([]*DisciplineRequest, 0, len(disciplines))
	for _, discipline := range disciplines {
		if discipline == nil {
			continue
		}
		if len(discipline.Semesters) != 8 {
			semesters := make([]*SemesterRequest, 8)
			for i := range semesters {
				semesters[i] = &SemesterRequest{Semester: int32(i + 1), TotalHours: 0}
			}
			for _, semester := range discipline.Semesters {
				if semester == nil || semester.Semester < 1 || semester.Semester > 8 {
					continue
				}
				semesters[int(semester.Semester)-1] = semester
			}
			discipline.Semesters = semesters
		}
		result = append(result, discipline)
	}
	return result
}
