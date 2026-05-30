package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"eduplan/backend/config"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sirupsen/logrus"
)

type RupService interface {
	CreateRup(ctx context.Context, req CreateRupRequest) (*RupResponse, error)
	GetRupByID(ctx context.Context, id uuid.UUID) (*RupResponse, error)
	GetLanguageGenerationStatus(ctx context.Context, id uuid.UUID) (*RupLanguageGenerationStatus, error)
	RegenerateLanguageGeneration(ctx context.Context, id uuid.UUID, sourceLanguage string) (*RupLanguageGenerationStatus, error)
	UpdateRupStatus(ctx context.Context, req UpdateRupStatusRequest) error
	UpdateRup(ctx context.Context, id uuid.UUID, req CreateRupRequest) (*RupResponse, error)
	DeleteRup(ctx context.Context, id uuid.UUID) error
	GetRupDownloadURL(ctx context.Context, id uuid.UUID) (string, error)
	GetRupPaginated(ctx context.Context, currentPage int, pageSize int, search string, sort string, teacher pgtype.UUID, methodist pgtype.UUID, status []string) (*PaginatedRupsResponse, error)
	CountRups(ctx context.Context) (int64, error)
}

type PaginatedRupsResponse struct {
	Data []*ListAllRupsResponse `json:"data"`
	Meta PaginationMeta         `json:"meta"`
}

const (
	rupLanguageGenerationStatusQueued    = "queued"
	rupLanguageGenerationStatusRunning   = "running"
	rupLanguageGenerationStatusCompleted = "completed"
	rupLanguageGenerationStatusFailed    = "failed"
)

type RupLanguageGenerationStatus struct {
	RupID           uuid.UUID `json:"rupId"`
	SourceLanguage  string    `json:"sourceLanguage"`
	TargetLanguage  string    `json:"targetLanguage"`
	Status          string    `json:"status"`
	CurrentStage    string    `json:"currentStage"`
	StageIndex      int       `json:"stageIndex"`
	TotalStages     int       `json:"totalStages"`
	ProgressPercent int       `json:"progressPercent"`
	Error           string    `json:"error,omitempty"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type CreateRupRequest struct {
	Name            localization.LocaleText `json:"name"`
	Type            string                  `json:"type"`
	StudyYear       string                  `json:"studyYear"`
	Course          int32                   `json:"course"`
	StudyForm       string                  `json:"studyForm"`
	Contacts        []string                `json:"contacts"`
	Groups          []string                `json:"groups"`
	Methodist       string                  `json:"methodist"`
	Teacher         string                  `json:"teacher"`
	SourceLanguage  string                  `json:"sourceLanguage"`
	ExplorationNote *ExplorationNoteRequest `json:"explorationNote"`
	Disciplines     []*DisciplineRequest    `json:"disciplines"`
}

type Rup struct {
	Name            localization.LocaleText `json:"name"`
	Type            string                  `json:"type"`
	StudyYear       string                  `json:"studyYear"`
	Course          int32                   `json:"course"`
	StudyForm       string                  `json:"studyForm"`
	Contacts        []string                `json:"contacts"`
	Groups          []string                `json:"groups"`
	Methodist       string                  `json:"methodist"`
	Teacher         string                  `json:"teacher"`
	ExplorationNote *ExplorationNoteRequest `json:"explorationNote"`
	Disciplines     []*DisciplineRequest    `json:"disciplines"`
}

type ExplorationNoteRequest struct {
	Basis              localization.LocaleText `json:"basis"`
	Goals              localization.LocaleText `json:"goals"`
	Summary            localization.LocaleText `json:"summary"`
	Competencies       localization.LocaleText `json:"competencies"`
	Prerequisites      localization.LocaleText `json:"prerequisites"`
	Postrequisites     localization.LocaleText `json:"postrequisites"`
	InternetResources  []*ResourceRequest      `json:"internetResources"`
	TechnicalResources []*ResourceRequest      `json:"technicalResources"`
}

type ResourceRequest struct {
	Name localization.LocaleText `json:"name"`
	Link string                  `json:"link"`
}

type DisciplineRequest struct {
	Name      localization.LocaleText `json:"name"`
	Semesters []*SemesterRequest      `json:"semesters"`
	Topics    []*TopicRequest         `json:"topics"`
}

type SemesterRequest struct {
	Semester   int32 `json:"semester"`
	TotalHours int32 `json:"totalHours"`
}

type TopicRequest struct {
	Name            localization.LocaleText `json:"name"`
	Type            string                  `json:"type"`
	TheoryHours     int32                   `json:"theoryHours"`
	PracticeHours   int32                   `json:"practiceHours"`
	IndividualHours int32                   `json:"individualHours"`
	SrspHours       int32                   `json:"srspHours"`
	SrsHours        int32                   `json:"srsHours"`
}

type RupResponse struct {
	ID              uuid.UUID               `json:"id"`
	Name            localization.LocaleText `json:"name"`
	Status          string                  `json:"status"`
	Reason          string                  `json:"reason"`
	Course          int32                   `json:"course"`
	StudyForm       string                  `json:"studyForm"`
	StudyYear       string                  `json:"studyYear"`
	Type            string                  `json:"type"`
	TotalHours      int32                   `json:"totalHours"`
	Contacts        []*helpers.UserResponse `json:"contacts"`
	Groups          []*GroupResponse        `json:"groups"`
	Methodist       *helpers.UserResponse   `json:"methodist"`
	Teacher         *helpers.UserResponse   `json:"teacher"`
	ExplorationNote ExplorationNoteResponse `json:"explorationNote"`
	Disciplines     []*DisciplineResponse   `json:"disciplines"`
	CreatedAt       time.Time               `json:"createdAt"`
	UpdatedAt       time.Time               `json:"updatedAt"`
}

type RupDocumentPayload struct {
	ID              uuid.UUID                  `json:"id"`
	Name            string                     `json:"name"`
	Course          int32                      `json:"course"`
	StudyForm       string                     `json:"studyForm"`
	StudyYear       string                     `json:"studyYear"`
	Type            string                     `json:"type"`
	TotalHours      int32                      `json:"totalHours"`
	Contacts        []*helpers.UserResponse    `json:"contacts"`
	Group           *GroupResponse             `json:"group"`
	ExplorationNote RupDocumentExplorationNote `json:"explorationNote"`
	Disciplines     []*DisciplineResponse      `json:"disciplines"`
}

type ListAllRupsResponse struct {
	ID         uuid.UUID               `json:"id"`
	Name       localization.LocaleText `json:"name"`
	Status     string                  `json:"status"`
	Reason     string                  `json:"reason"`
	Course     int32                   `json:"course"`
	StudyForm  string                  `json:"studyForm"`
	StudyYear  string                  `json:"studyYear"`
	Type       string                  `json:"type"`
	TotalHours int32                   `json:"totalHours"`
	Groups     []*GroupResponse        `json:"groups"`
	Methodist  *helpers.UserResponse   `json:"methodist"`
	Teacher    *helpers.UserResponse   `json:"teacher"`
	CreatedAt  time.Time               `json:"createdAt"`
	UpdatedAt  time.Time               `json:"updatedAt"`
}

type GroupResponse struct {
	KeycloakID    uuid.UUID               `json:"keycloakId"`
	Name          string                  `json:"name"`
	Qualification localization.LocaleText `json:"qualification"`
	Specialty     localization.LocaleText `json:"specialty"`
}

type ExplorationNoteResponse struct {
	ID                 uuid.UUID                `json:"id"`
	Basis              *localization.LocaleText `json:"basis,omitempty"`
	Goals              *localization.LocaleText `json:"goals,omitempty"`
	Summary            *localization.LocaleText `json:"summary,omitempty"`
	Competencies       *localization.LocaleText `json:"competencies,omitempty"`
	Prerequisites      *localization.LocaleText `json:"prerequisites,omitempty"`
	Postrequisites     *localization.LocaleText `json:"postrequisites,omitempty"`
	InternetResources  []*ResourceResponse      `json:"internetResources"`
	TechnicalResources []*ResourceResponse      `json:"technicalResources"`
}

type ResourceResponse struct {
	ID   uuid.UUID               `json:"id"`
	Name localization.LocaleText `json:"name"`
	Link string                  `json:"link"`
	Type string                  `json:"type"`
}

type RupDocumentExplorationNote struct {
	Basis              *localization.LocaleText `json:"basis,omitempty"`
	Goals              *localization.LocaleText `json:"goals,omitempty"`
	Summary            *localization.LocaleText `json:"summary,omitempty"`
	Competencies       *localization.LocaleText `json:"competencies,omitempty"`
	Prerequisites      *localization.LocaleText `json:"prerequisites,omitempty"`
	Postrequisites     *localization.LocaleText `json:"postrequisites,omitempty"`
	InternetResources  []*RupDocumentResource   `json:"internetResources"`
	TechnicalResources []*RupDocumentResource   `json:"technicalResources"`
}

type RupDocumentResource struct {
	Name string `json:"name"`
	Link string `json:"link"`
}

type DisciplineResponse struct {
	ID         uuid.UUID               `json:"id"`
	Name       localization.LocaleText `json:"name"`
	TotalHours int32                   `json:"totalHours"`
	Semesters  []*SemesterResponse     `json:"semesters"`
	Topics     []*TopicResponse        `json:"topics"`
	CreatedAt  time.Time               `json:"createdAt"`
	UpdatedAt  time.Time               `json:"updatedAt"`
}

type SemesterResponse struct {
	ID         uuid.UUID `json:"id"`
	Semester   int32     `json:"semester"`
	TotalHours int32     `json:"totalHours"`
}

type TopicResponse struct {
	ID              uuid.UUID                   `json:"id"`
	Name            localization.LocaleText     `json:"name"`
	Type            storage.DisciplineTopicType `json:"type"`
	LessonID        *uuid.UUID                  `json:"lessonId"`
	TotalHours      int32                       `json:"totalHours"`
	TheoryHours     int32                       `json:"theoryHours"`
	PracticeHours   int32                       `json:"practiceHours"`
	IndividualHours int32                       `json:"individualHours"`
	SrspHours       int32                       `json:"srspHours"`
	SrsHours        int32                       `json:"srsHours"`
}

type rupService struct {
	repo                 repository.RupRepository
	cfg                  *config.DocumentRenderConfig
	httpClient           *http.Client
	aiService            AIService
	fileStorage          FileStorage
	crypto               CryptoClient
	log                  *logrus.Logger
	languageGenerationMu sync.RWMutex
	languageGeneration   map[uuid.UUID]RupLanguageGenerationStatus
}

type UpdateRupStatusRequest struct {
	ID            uuid.UUID `json:"id"`
	Status        string    `json:"status"`
	Reason        string    `json:"reason"`
	MethodistID   uuid.UUID `json:"methodistId"`
	CorrelationID string    `json:"correlationId"`
	KeyID         string    `json:"keyId"`
	UserID        string    `json:"userId"`
}

type GetRupsInput struct {
	Search      string
	currentPage int
	Limit       int

	UserID uuid.UUID
	Role   string // teacher | methodist | admin
}

func NewRupService(
	repo repository.RupRepository,
	cfg *config.DocumentRenderConfig,
	httpClient *http.Client,
	aiService AIService,
	fileStorage FileStorage,
	cryptoClient CryptoClient,
	log *logrus.Logger,
) RupService {
	if log == nil {
		log = logrus.New()
	}

	return &rupService{
		repo:               repo,
		cfg:                cfg,
		httpClient:         httpClient,
		aiService:          aiService,
		fileStorage:        fileStorage,
		crypto:             cryptoClient,
		log:                log,
		languageGeneration: make(map[uuid.UUID]RupLanguageGenerationStatus),
	}
}

func (s *rupService) CreateRup(ctx context.Context, req CreateRupRequest) (*RupResponse, error) {
	fmt.Printf("CreateRup called with contacts: %v\n", req.Contacts)
	// Валидация
	if err := s.validateCreateRupRequest(ctx, req); err != nil {
		fmt.Printf("Validation failed: %v\n", err)
		return nil, fmt.Errorf("validation failed: %w", err)
	}
	fmt.Printf("Validation passed\n")

	// Создание связанных сущностей
	explorationNoteID, err := s.createExplorationNote(ctx, req.ExplorationNote)
	if err != nil {
		return nil, fmt.Errorf("create exploration note failed: %w", err)
	}

	// Calculate total hours
	var totalHours int32
	for _, d := range req.Disciplines {
		for _, s := range d.Semesters {
			totalHours += s.TotalHours
		}
	}

	disciplineIDs, err := s.createDisciplines(ctx, req.Disciplines)
	if err != nil {
		return nil, fmt.Errorf("create disciplines failed: %w", err)
	}

	// Преобразование в параметры для repository
	params := s.convertToCreateParams(req, explorationNoteID, disciplineIDs, totalHours)

	// Создание RUP
	rup, err := s.repo.CreateRup(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create rup failed: %w", err)
	}

	// Сборка полного ответа
	response, err := s.buildRupResponse(ctx, *rup)
	if err != nil {
		return nil, fmt.Errorf("build response failed: %w", err)
	}

	sourceLanguage := normalizeBackendLanguage(req.SourceLanguage)
	targetLanguage := oppositeBackendLanguage(sourceLanguage)
	if sourceLanguage != "" && targetLanguage != "" && s.aiService != nil {
		s.beginLanguageGeneration(response.ID, sourceLanguage, targetLanguage)
		go s.generateLanguageForRup(response.ID, sourceLanguage, targetLanguage, false)
	}

	return response, nil
}

func (s *rupService) GetRupByID(ctx context.Context, id uuid.UUID) (*RupResponse, error) {
	rup, err := s.repo.GetRupByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return s.buildRupResponse(ctx, *rup)
}

func (s *rupService) GetLanguageGenerationStatus(ctx context.Context, id uuid.UUID) (*RupLanguageGenerationStatus, error) {
	s.languageGenerationMu.RLock()
	status, exists := s.languageGeneration[id]
	s.languageGenerationMu.RUnlock()
	if exists {
		statusCopy := status
		return &statusCopy, nil
	}

	if _, err := s.GetRupByID(ctx, id); err != nil {
		return nil, err
	}

	ready := RupLanguageGenerationStatus{
		RupID:           id,
		Status:          rupLanguageGenerationStatusCompleted,
		CurrentStage:    "ready",
		StageIndex:      1,
		TotalStages:     1,
		ProgressPercent: 100,
		UpdatedAt:       time.Now().UTC(),
	}

	return &ready, nil
}

func (s *rupService) RegenerateLanguageGeneration(
	ctx context.Context,
	id uuid.UUID,
	sourceLanguage string,
) (*RupLanguageGenerationStatus, error) {
	if s.aiService == nil {
		return nil, &HTTPStatusError{
			StatusCode: http.StatusBadGateway,
			Message:    "AI service is not configured",
		}
	}

	rup, err := s.GetRupByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if !strings.EqualFold(rup.Status, string(storage.RupsStatusDRAFT)) {
		return nil, &HTTPStatusError{
			StatusCode: http.StatusConflict,
			Message:    "regeneration is allowed only for draft RUP",
		}
	}

	if s.isLanguageGenerationInProgress(id) {
		return nil, &HTTPStatusError{
			StatusCode: http.StatusConflict,
			Message:    "language generation is already in progress",
		}
	}

	normalizedSourceLanguage := s.resolveSourceLanguageForRegeneration(id, sourceLanguage)
	targetLanguage := oppositeBackendLanguage(normalizedSourceLanguage)
	if normalizedSourceLanguage == "" || targetLanguage == "" {
		return nil, &HTTPStatusError{
			StatusCode: http.StatusBadRequest,
			Message:    "invalid source language",
		}
	}

	s.beginLanguageGeneration(id, normalizedSourceLanguage, targetLanguage)
	go s.generateLanguageForRup(id, normalizedSourceLanguage, targetLanguage, true)

	return s.GetLanguageGenerationStatus(ctx, id)
}

func cryptoStatusActive(resp *ValidateKeyOwnershipResponse) bool {
	return strings.ToUpper(strings.TrimSpace(resp.KeyStatus)) == "ACTIVE"
}

func (s *rupService) UpdateRupStatus(ctx context.Context, req UpdateRupStatusRequest) error {

	var rupStatus storage.RupsStatus
	switch req.Status {
	case "DRAFT":
		rupStatus = storage.RupsStatusDRAFT
	case "IN_REVIEW":
		rupStatus = storage.RupsStatusINREVIEW
	case "APPROVED":
		rupStatus = storage.RupsStatusAPPROVED
	case "REJECTED":
		rupStatus = storage.RupsStatusREJECTED
	default:
		return fmt.Errorf("invalid status: %s", req.Status)
	}

	// 1. если APPROVED — генерируем документ
	if rupStatus == storage.RupsStatusAPPROVED {
		if s.crypto == nil {
			return &HTTPStatusError{
				StatusCode: http.StatusBadGateway,
				Message:    "kripto client is not configured",
			}
		}
		if strings.TrimSpace(req.KeyID) == "" {
			return &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    "key_id is required for approved status",
			}
		}
		if strings.TrimSpace(req.UserID) == "" {
			return &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    "user_id is required for approved status",
			}
		}

		var err error
		var validationResp *ValidateKeyOwnershipResponse
		if rupStatus == storage.RupsStatusAPPROVED {
			startedAt := time.Now()
			validationResp, err = s.crypto.ValidateKeyOwnership(ctx, ValidateKeyOwnershipRequest{
				KeyID:  req.KeyID,
				UserID: req.UserID,
			}, req.CorrelationID)
			latency := time.Since(startedAt)
			if err != nil {
				var httpErr *CryptoHTTPError
				if errors.As(err, &httpErr) {
					s.log.WithFields(logrus.Fields{
						"correlation_id": req.CorrelationID,
						"key_id":         req.KeyID,
						"user_id":        req.UserID,
						"http_status":    httpErr.StatusCode,
						"latency_ms":     latency.Milliseconds(),
					}).WithError(err).Error("kripto validate key failed")

					if httpErr.StatusCode == http.StatusNotFound {
						rupStatus = storage.RupsStatusREJECTED
						req.Reason = "Ключ не найден в kripto"
					} else if httpErr.StatusCode == http.StatusUnauthorized || httpErr.StatusCode == http.StatusForbidden {
						return &HTTPStatusError{StatusCode: httpErr.StatusCode, Message: "kripto authorization failed"}
					} else if httpErr.StatusCode >= 500 {
						return &HTTPStatusError{StatusCode: http.StatusBadGateway, Message: "kripto temporary error"}
					} else {
						return &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: httpErr.Error()}
					}
				} else {
					s.log.WithFields(logrus.Fields{
						"correlation_id": req.CorrelationID,
						"key_id":         req.KeyID,
						"user_id":        req.UserID,
						"latency_ms":     latency.Milliseconds(),
					}).WithError(err).Error("kripto validate key network error")
					return &HTTPStatusError{StatusCode: http.StatusBadGateway, Message: "kripto request failed"}
				}
			}

			if validationResp != nil {
				s.log.WithFields(logrus.Fields{
					"correlation_id":    req.CorrelationID,
					"key_id":            req.KeyID,
					"user_id":           req.UserID,
					"http_status":       http.StatusOK,
					"key_status":        validationResp.KeyStatus,
					"validation_status": validationResp.ValidationStatus,
					"latency_ms":        latency.Milliseconds(),
				}).Info("kripto validate key response")
			}

			if validationResp != nil {
				validationStatus := strings.ToUpper(strings.TrimSpace(validationResp.ValidationStatus))
				if validationResp.KeyID != req.KeyID {
					rupStatus = storage.RupsStatusREJECTED
					req.Reason = "Идентификатор ключа не совпадает с ответом kripto"
				} else if validationResp.UserID != req.UserID {
					rupStatus = storage.RupsStatusREJECTED
					req.Reason = "Ключ не принадлежит текущему пользователю"
				} else if !cryptoStatusActive(validationResp) ||
					!validationResp.IsValid ||
					!validationResp.BelongsToUser ||
					validationStatus != "VALID" {
					rupStatus = storage.RupsStatusREJECTED
					switch validationStatus {
					case "USER_MISMATCH":
						req.Reason = "Ключ не принадлежит текущему пользователю"
					case "KEY_REVOKED":
						req.Reason = "Ключ отозван"
					default:
						req.Reason = "Ключ не прошел проверку"
					}
					if !cryptoStatusActive(validationResp) {
						req.Reason = "Ключ не активен"
					}
				}
			}

			if validationResp == nil {
				rupStatus = storage.RupsStatusREJECTED
				req.Reason = "Ключ не прошел проверку"
			}
		}

		// Генерация документов выполняется только если валидация ключа успешна.
		if rupStatus == storage.RupsStatusAPPROVED {
			rup, err := s.GetRupByID(ctx, req.ID)
			if err != nil {
				return err
			}
			if len(rup.Groups) == 0 {
				return fmt.Errorf("rup has no groups")
			}

			for _, group := range rup.Groups {
				if group == nil {
					continue
				}

				fileBytes, err := s.generateViaPythonForGroup(ctx, rup, group)
				if err != nil {
					return err
				}

				reader := bytes.NewReader(fileBytes)
				creationTime := time.Now().UTC().Format("20060102_150405")
				objectName := fmt.Sprintf(
					"rups/%s/%s_%s.docx",
					req.ID.String(),
					localePrimaryText(rup.Name),
					creationTime,
				)

				// 2. сохраняем в MinIO
				if err := s.fileStorage.UploadFile(
					ctx,
					objectName,
					reader,
					int64(len(fileBytes)),
				); err != nil {
					return err
				}
			}
		}
	}

	// 3. reason
	var reasonText pgtype.Text
	if req.Reason != "" {
		reasonText = pgtype.Text{String: req.Reason, Valid: true}
	}

	methodistUUID := pgtype.UUID{
		Bytes: req.MethodistID,
		Valid: req.MethodistID != uuid.Nil,
	}
	_, err := s.repo.GetUserByID(ctx, req.MethodistID)
	if err != nil {
		return err
	}

	// 4. обновляем статус в БД
	return s.repo.UpdateRupStatus(ctx, req.ID, rupStatus, reasonText, methodistUUID)
}

func (s *rupService) UpdateRup(ctx context.Context, id uuid.UUID, req CreateRupRequest) (*RupResponse, error) {
	// 1. Check if RUP exists and get current status
	existingRup, err := s.repo.GetRupByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("rup not found: %w", err)
	}

	// 2. Validate request
	if err := s.validateCreateRupRequest(ctx, req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// 3. Create new related entities (ExplorationNote, Disciplines)
	// We create new ones to replace the old ones.
	explorationNoteID, err := s.createExplorationNote(ctx, req.ExplorationNote)
	if err != nil {
		return nil, fmt.Errorf("create exploration note failed: %w", err)
	}

	// Calculate total hours
	var totalHours int32
	for _, d := range req.Disciplines {
		for _, s := range d.Semesters {
			totalHours += s.TotalHours
		}
	}

	disciplineIDs, err := s.createDisciplines(ctx, req.Disciplines)
	if err != nil {
		return nil, fmt.Errorf("create disciplines failed: %w", err)
	}

	// 4. Prepare update params
	// We preserve the existing status
	params := s.convertToUpdateParams(id, req, existingRup.Status, existingRup.Teacher, explorationNoteID, disciplineIDs, totalHours)

	// 5. Update RUP
	updatedRup, err := s.repo.UpdateRup(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("update rup failed: %w", err)
	}

	return s.buildRupResponse(ctx, *updatedRup)
}

func (s *rupService) generateViaPythonForGroup(ctx context.Context, rup *RupResponse, group *GroupResponse) ([]byte, error) {
	if rup == nil {
		return nil, fmt.Errorf("rup is nil")
	}
	if group == nil {
		return nil, fmt.Errorf("group is nil")
	}

	// 1. строим payload для конкретной группы
	payload := buildPayload(rup, group)

	// 2. JSON
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	// 3. HTTP -> Python (with redirect-safe POST retry)
	endpoint := strings.TrimRight(s.cfg.Url, "/") + "/generate-rup"
	resp, err := s.postDocumentRenderJSON(ctx, endpoint, body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(resp.Body)
		location := strings.TrimSpace(resp.Header.Get("Location"))
		if location != "" {
			return nil, fmt.Errorf(
				"python error: status=%d location=%s body=%s",
				resp.StatusCode,
				location,
				strings.TrimSpace(string(errBody)),
			)
		}
		return nil, fmt.Errorf("python error: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(errBody)))
	}

	// 4. читаем файл
	fileBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return fileBytes, nil
}

func (s *rupService) postDocumentRenderJSON(ctx context.Context, endpoint string, body []byte) (*http.Response, error) {
	const maxRedirects = 5
	currentURL := endpoint

	for i := 0; i <= maxRedirects; i++ {
		req, err := http.NewRequestWithContext(
			ctx,
			http.MethodPost,
			currentURL,
			bytes.NewReader(body),
		)
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Request-ID", uuid.NewString())
		if s.cfg.ApiKey != "" {
			req.Header.Set("X-API-Key", s.cfg.ApiKey)
		}

		resp, err := s.doWithoutAutoRedirect(req)
		if err != nil {
			return nil, err
		}

		if !isRedirectStatus(resp.StatusCode) {
			return resp, nil
		}

		nextLocation := strings.TrimSpace(resp.Header.Get("Location"))
		if nextLocation == "" {
			return resp, nil
		}

		nextURL, err := resolveRedirectURL(currentURL, nextLocation)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}
		currentURL = nextURL
	}

	return nil, fmt.Errorf("document rendering redirect limit exceeded for %s", endpoint)
}

func (s *rupService) doWithoutAutoRedirect(req *http.Request) (*http.Response, error) {
	if s.httpClient == nil {
		return nil, fmt.Errorf("http client is not configured")
	}

	clientCopy := *s.httpClient
	clientCopy.CheckRedirect = func(_ *http.Request, _ []*http.Request) error {
		return http.ErrUseLastResponse
	}

	return clientCopy.Do(req)
}

func isRedirectStatus(statusCode int) bool {
	switch statusCode {
	case http.StatusMovedPermanently,
		http.StatusFound,
		http.StatusSeeOther,
		http.StatusTemporaryRedirect,
		http.StatusPermanentRedirect:
		return true
	default:
		return false
	}
}

func resolveRedirectURL(currentURL string, location string) (string, error) {
	locURL, err := url.Parse(location)
	if err != nil {
		return "", fmt.Errorf("invalid redirect location %q: %w", location, err)
	}
	if locURL.IsAbs() {
		return locURL.String(), nil
	}

	baseURL, err := url.Parse(currentURL)
	if err != nil {
		return "", fmt.Errorf("invalid base url %q: %w", currentURL, err)
	}

	return baseURL.ResolveReference(locURL).String(), nil
}

func buildPayload(rup *RupResponse, group *GroupResponse) RupDocumentPayload {

	// ---------- GROUP ----------
	selectedGroup := GroupResponse{}
	if group != nil {
		selectedGroup = GroupResponse{
			Name:          group.Name,
			Specialty:     group.Specialty,
			Qualification: group.Qualification,
			KeycloakID:    group.KeycloakID,
		}
	}

	// ---------- CONTACTS ----------
	contacts := []*helpers.UserResponse{}
	for _, c := range rup.Contacts {
		contacts = append(contacts, &helpers.UserResponse{
			KeycloakID: c.KeycloakID,
			Email:      c.Email,
			Username:   c.Username,
			FirstName:  c.FirstName,
			LastName:   c.LastName,
			Phone:      c.Phone,
			Roles:      c.Roles,
		})
	}

	// ---------- DISCIPLINES ----------
	disciplines := make([]*DisciplineResponse, 0, len(rup.Disciplines))
	for _, d := range rup.Disciplines {

		semesters := []*SemesterResponse{}
		for _, s := range d.Semesters {
			semesters = append(semesters, &SemesterResponse{
				Semester:   s.Semester,
				TotalHours: s.TotalHours,
			})
		}

		topics := []*TopicResponse{}
		for _, t := range d.Topics {
			topics = append(topics, &TopicResponse{
				ID:              t.ID,
				Name:            t.Name,
				Type:            t.Type,
				TotalHours:      t.TotalHours,
				TheoryHours:     t.TheoryHours,
				PracticeHours:   t.PracticeHours,
				IndividualHours: t.IndividualHours,
				SrspHours:       t.SrspHours,
				SrsHours:        t.SrsHours,
			})
		}

		disciplines = append(disciplines, &DisciplineResponse{
			Name:      d.Name,
			Semesters: semesters,
			Topics:    topics,
		})
	}

	// ---------- EXPLORATION NOTE ----------
	exploration := RupDocumentExplorationNote{}
	en := rup.ExplorationNote

	exploration.Basis = en.Basis
	exploration.Goals = en.Goals
	exploration.Competencies = en.Competencies
	exploration.Prerequisites = en.Prerequisites
	exploration.Postrequisites = en.Postrequisites

	internet := []*RupDocumentResource{}
	for _, r := range en.InternetResources {
		internet = append(internet, &RupDocumentResource{
			Name: localePrimaryText(r.Name),
			Link: r.Link,
		})
	}

	technical := []*RupDocumentResource{}
	for _, r := range en.TechnicalResources {
		technical = append(technical, &RupDocumentResource{
			Name: localePrimaryText(r.Name),
			Link: r.Link,
		})
	}

	exploration.InternetResources = internet
	exploration.TechnicalResources = technical

	return RupDocumentPayload{
		ID:              rup.ID,
		Name:            localePrimaryText(rup.Name),
		Type:            rup.Type,
		StudyForm:       rup.StudyForm,
		StudyYear:       rup.StudyYear,
		Group:           &selectedGroup,
		Course:          rup.Course,
		TotalHours:      rup.TotalHours,
		Contacts:        contacts,
		Disciplines:     disciplines,
		ExplorationNote: exploration,
	}
}

func (s *rupService) GetRupDownloadURL(ctx context.Context, id uuid.UUID) (string, error) {
	prefix := fmt.Sprintf("rups/%s/", id.String())
	objects, err := s.fileStorage.ListFiles(ctx, prefix)
	if err != nil {
		return "", err
	}

	var latest string
	var latestTime time.Time
	for _, obj := range objects {
		if !strings.HasSuffix(obj.Key, ".docx") {
			continue
		}
		if obj.LastModified.After(latestTime) {
			latestTime = obj.LastModified
			latest = obj.Key
		}
	}

	if latest == "" {
		return "", fmt.Errorf("rup document not found for id %s", id.String())
	}

	return s.fileStorage.GetDownloadFileURL(ctx, latest, 10*time.Minute)
}

func (s *rupService) DeleteRup(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteRup(ctx, id)
}

func (s *rupService) validateCreateRupRequest(ctx context.Context, req CreateRupRequest) error {
	fmt.Printf("Validating request: contacts=%v, groups=%v\n", req.Contacts, req.Groups)
	if req.Name.Ru == "" && req.Name.Kz == "" {
		return fmt.Errorf("name is required")
	}
	if req.StudyYear == "" {
		return fmt.Errorf("studyYear is required")
	}
	if req.Course < 1 || req.Course > 4 {
		return fmt.Errorf("course must be between 1 and 4")
	}
	if req.Type != "PRACTICE" && req.Type != "THEORY" {
		return fmt.Errorf("type must be PRACTICE or THEORY")
	}
	if req.StudyForm != "CORRESPONDENCE" && req.StudyForm != "FULL_TIME" {
		return fmt.Errorf("studyForm must be CORRESPONDENCE or FULL_TIME")
	}
	// Validate contacts exist
	for _, contactIDStr := range req.Contacts {
		fmt.Printf("Validating contact: %s\n", contactIDStr)
		contactID, err := uuid.Parse(contactIDStr)
		if err != nil {
			fmt.Printf("Invalid UUID format: %s\n", contactIDStr)
			return fmt.Errorf("invalid contact ID format: %s", contactIDStr)
		}
		_, err = s.repo.GetUserByID(ctx, contactID)
		if err != nil {
			fmt.Printf("Contact not found: %s, error: %v\n", contactIDStr, err)
			return fmt.Errorf("contact with ID %s does not exist", contactIDStr)
		}
		fmt.Printf("Contact validated: %s\n", contactIDStr)
	}

	// Validate groups exist
	for _, groupIDStr := range req.Groups {
		groupID, err := uuid.Parse(groupIDStr)
		if err != nil {
			return fmt.Errorf("invalid group ID format: %s", groupIDStr)
		}
		_, err = s.repo.GetGroupByKeycloakID(ctx, groupID)
		if err != nil {
			return fmt.Errorf("group with ID %s does not exist", groupIDStr)
		}
	}

	// Validate methodist exists
	if req.Methodist != "" {
		methodistID, err := uuid.Parse(req.Methodist)
		if err != nil {
			return fmt.Errorf("invalid methodist ID format: %s", req.Methodist)
		}
		_, err = s.repo.GetUserByID(ctx, methodistID)
		if err != nil {
			return fmt.Errorf("methodist with ID %s does not exist", req.Methodist)
		}
	}

	// Teacher is always set from session, no need to validate from request

	// Validate disciplines have exactly 8 semesters
	for _, disc := range req.Disciplines {
		if len(disc.Semesters) != 8 {
			return fmt.Errorf("discipline must have exactly 8 semesters, got %d", len(disc.Semesters))
		}
		// Check semester numbers are sequential 1-8
		for i, sem := range disc.Semesters {
			if sem.Semester != int32(i+1) {
				return fmt.Errorf("semester number must be %d, got %d", i+1, sem.Semester)
			}
		}
	}

	return nil
}

func (s *rupService) convertToCreateParams(req CreateRupRequest, explorationNoteID *uuid.UUID, disciplineIDs []uuid.UUID, totalHours int32) storage.CreateRupsParams {
	var teacherUUID pgtype.UUID
	var explorationNoteUUID pgtype.UUID

	if req.Teacher != "" {
		if id, err := uuid.Parse(req.Teacher); err == nil {
			teacherUUID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}

	if explorationNoteID != nil {
		explorationNoteUUID = pgtype.UUID{Bytes: *explorationNoteID, Valid: true}
	}

	contacts := normalizeRupContacts(req.Contacts, teacherUUID)

	var rupType storage.RupsTypeEnum
	switch req.Type {
	case "PRACTICE":
		rupType = storage.RupsTypeEnumPRACTICE
	case "THEORY":
		rupType = storage.RupsTypeEnumTHEORY
	}

	var studyForm storage.StudyFormEnum
	switch req.StudyForm {
	case "CORRESPONDENCE":
		studyForm = storage.StudyFormEnumCORRESPONDENCE
	case "FULL_TIME":
		studyForm = storage.StudyFormEnumFULLTIME
	}

	return storage.CreateRupsParams{
		Name:              req.Name.ToJSONB(),
		Status:            storage.RupsStatusDRAFT,
		Course:            req.Course,
		StudyForm:         studyForm,
		StudyYear:         req.StudyYear,
		Type:              rupType,
		Contacts:          contacts,
		GroupIds:          req.Groups,
		Teacher:           teacherUUID,
		ExplorationNoteID: explorationNoteUUID,
		Disciplines:       disciplineIDs,
		TotalHours:        totalHours,
	}

}

func (s *rupService) convertToUpdateParams(
	id uuid.UUID,
	req CreateRupRequest,
	status storage.RupsStatus,
	creator pgtype.UUID,
	explorationNoteID *uuid.UUID,
	disciplineIDs []uuid.UUID,
	totalHours int32,
) storage.UpdateRupParams {
	var explorationNoteUUID pgtype.UUID

	if explorationNoteID != nil {
		explorationNoteUUID = pgtype.UUID{Bytes: *explorationNoteID, Valid: true}
	}

	contacts := normalizeRupContacts(req.Contacts, creator)

	var rupType storage.RupsTypeEnum
	switch req.Type {
	case "PRACTICE":
		rupType = storage.RupsTypeEnumPRACTICE
	case "THEORY":
		rupType = storage.RupsTypeEnumTHEORY
	}

	var studyForm storage.StudyFormEnum
	switch req.StudyForm {
	case "CORRESPONDENCE":
		studyForm = storage.StudyFormEnumCORRESPONDENCE
	case "FULL_TIME":
		studyForm = storage.StudyFormEnumFULLTIME
	}

	return storage.UpdateRupParams{
		ID:                id,
		Name:              req.Name.ToJSONB(),
		Course:            req.Course,
		StudyForm:         studyForm,
		StudyYear:         req.StudyYear,
		Type:              rupType,
		Contacts:          contacts,
		GroupIds:          req.Groups,
		ExplorationNoteID: explorationNoteUUID,
		Disciplines:       disciplineIDs,
		TotalHours:        totalHours,
	}
}

func normalizeRupContacts(rawContacts []string, creator pgtype.UUID) []uuid.UUID {
	contacts := make([]uuid.UUID, 0, len(rawContacts)+1)
	seen := make(map[uuid.UUID]struct{}, len(rawContacts)+1)

	for _, contactStr := range rawContacts {
		id, err := uuid.Parse(contactStr)
		if err != nil {
			continue
		}

		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		contacts = append(contacts, id)
	}

	if creator.Valid {
		if _, ok := seen[creator.Bytes]; !ok {
			contacts = append(contacts, creator.Bytes)
		}
	}

	return contacts
}

func (s *rupService) createExplorationNote(ctx context.Context, note *ExplorationNoteRequest) (*uuid.UUID, error) {
	if note == nil {
		return nil, nil
	}

	// Create internet resources
	var internetResourceIDs []uuid.UUID
	for _, res := range note.InternetResources {
		params := storage.CreateRupResourceParams{
			Name: res.Name.ToJSONB(),
			Link: pgtype.Text{String: res.Link, Valid: res.Link != ""},
		}
		resource, err := s.repo.CreateResource(ctx, params)
		if err != nil {
			return nil, err
		}
		internetResourceIDs = append(internetResourceIDs, resource.ID)
	}

	// Create technical resources
	var technicalResourceIDs []uuid.UUID
	for _, res := range note.TechnicalResources {
		params := storage.CreateRupResourceParams{
			Name: res.Name.ToJSONB(),
			Link: pgtype.Text{String: res.Link, Valid: res.Link != ""},
		}
		resource, err := s.repo.CreateResource(ctx, params)
		if err != nil {
			return nil, err
		}
		technicalResourceIDs = append(technicalResourceIDs, resource.ID)
	}

	params := storage.CreateRupExplorationNoteParams{
		Basis:              note.Basis.ToJSONB(),
		Goals:              note.Goals.ToJSONB(),
		Summary:            note.Summary.ToJSONB(),
		Competencies:       note.Competencies.ToJSONB(),
		Prerequisites:      note.Prerequisites.ToJSONB(),
		Postrequisites:     note.Postrequisites.ToJSONB(),
		InternetResources:  internetResourceIDs,
		TechnicalResources: technicalResourceIDs,
	}

	explorationNote, err := s.repo.CreateExplorationNote(ctx, params)
	if err != nil {
		return nil, err
	}

	return &explorationNote.ID, nil
}

func (s *rupService) createDisciplines(ctx context.Context, disciplines []*DisciplineRequest) ([]uuid.UUID, error) {
	var ids []uuid.UUID

	for _, disc := range disciplines {
		// Create semesters
		semesterIDs, err := s.createSemesters(ctx, disc.Semesters)
		if err != nil {
			return nil, err
		}

		// Create topics
		topicIDs, err := s.createTopics(ctx, disc.Topics)
		if err != nil {
			return nil, err
		}

		// Calculate discipline total hours
		var discTotalHours int32
		for _, sem := range disc.Semesters {
			discTotalHours += sem.TotalHours
		}

		params := storage.CreateRupDisciplineParams{
			Name:       disc.Name.ToJSONB(),
			TotalHours: discTotalHours,
			Semesters:  semesterIDs,
			Topics:     topicIDs,
		}

		discipline, err := s.repo.CreateDiscipline(ctx, params)
		if err != nil {
			return nil, err
		}

		ids = append(ids, discipline.ID)
	}

	return ids, nil
}

func (s *rupService) createSemesters(ctx context.Context, semesters []*SemesterRequest) ([]uuid.UUID, error) {
	var ids []uuid.UUID

	for _, sem := range semesters {
		params := storage.CreateDisciplineSemesterParams{
			Semester:   sem.Semester,
			TotalHours: sem.TotalHours,
		}

		semester, err := s.repo.CreateSemester(ctx, params)
		if err != nil {
			return nil, err
		}

		ids = append(ids, semester.ID)
	}

	return ids, nil
}

func (s *rupService) createTopics(ctx context.Context, topics []*TopicRequest) ([]uuid.UUID, error) {
	var ids []uuid.UUID

	for _, topic := range topics {
		var topicType storage.DisciplineTopicType
		switch topic.Type {
		case "SNZ":
			topicType = storage.DisciplineTopicTypeSNZ
		case "PRACTICAL":
			topicType = storage.DisciplineTopicTypePRACTICAL
		case "COMBINED":
			topicType = storage.DisciplineTopicTypeCOMBINED
		}

		TotalHours := topic.TheoryHours + topic.PracticeHours + topic.IndividualHours

		params := storage.CreateDisciplineTopicParams{
			Name:            topic.Name.ToJSONB(),
			Type:            topicType,
			TotalHours:      TotalHours,
			TheoryHours:     topic.TheoryHours,
			PracticeHours:   topic.PracticeHours,
			IndividualHours: topic.IndividualHours,
			SrspHours:       topic.SrspHours,
			SrsHours:        topic.SrsHours,
		}

		topicEntity, err := s.repo.CreateTopic(ctx, params)
		if err != nil {
			return nil, err
		}

		ids = append(ids, topicEntity.ID)
	}

	return ids, nil
}

func (s *rupService) toPgUUID(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{Valid: false}
	}
	return pgtype.UUID{Bytes: *id, Valid: true}
}

func (s *rupService) buildListAllRupsResponse(ctx context.Context, rup storage.Rup) (*ListAllRupsResponse, error) {

	// Get groups
	groups := []*GroupResponse{}
	for _, groupIDStr := range rup.GroupIds {
		groupID, err := uuid.Parse(groupIDStr)
		if err != nil {
			continue // Skip invalid UUIDs
		}
		group, err := s.repo.GetGroupByKeycloakID(ctx, groupID)
		if err != nil {
			continue // Skip if not found
		}
		groups = append(groups, s.convertToGroupResponse(*group))
	}

	// Get methodist
	var methodist *helpers.UserResponse
	if rup.Methodist.Valid {
		user, err := s.repo.GetUserByID(ctx, rup.Methodist.Bytes)
		if err == nil {
			methodist = helpers.ConvertToUserResponse(*user)
		}
	}

	// Get teacher
	var teacher *helpers.UserResponse
	if rup.Teacher.Valid {
		user, err := s.repo.GetUserByID(ctx, rup.Teacher.Bytes)
		if err == nil {
			teacher = helpers.ConvertToUserResponse(*user)
		}
	}

	return &ListAllRupsResponse{
		ID:         rup.ID,
		Name:       localization.LocaleTextFromJSONB(rup.Name),
		Status:     string(rup.Status),
		Reason:     rup.Reason.String,
		Course:     rup.Course,
		StudyForm:  string(rup.StudyForm),
		StudyYear:  rup.StudyYear,
		Type:       string(rup.Type),
		TotalHours: rup.TotalHours,
		Groups:     groups,
		Methodist:  methodist,
		Teacher:    teacher,
		CreatedAt:  rup.CreatedAt.Time,
		UpdatedAt:  rup.UpdatedAt.Time,
	}, nil
}

func (s *rupService) buildRupResponse(ctx context.Context, rup storage.Rup) (*RupResponse, error) {
	// Get contacts
	contacts := []*helpers.UserResponse{}
	for _, contactID := range rup.Contacts {
		user, err := s.repo.GetUserByID(ctx, contactID)
		if err != nil {
			continue // Skip if not found
		}
		contacts = append(contacts, helpers.ConvertToUserResponse(*user))
	}

	// Get groups
	groups := []*GroupResponse{}
	for _, groupIDStr := range rup.GroupIds {
		groupID, err := uuid.Parse(groupIDStr)
		if err != nil {
			continue // Skip invalid UUIDs
		}
		group, err := s.repo.GetGroupByKeycloakID(ctx, groupID)
		if err != nil {
			continue // Skip if not found
		}
		groups = append(groups, s.convertToGroupResponse(*group))
	}

	// Get methodist
	var methodist *helpers.UserResponse
	if rup.Methodist.Valid {
		user, err := s.repo.GetUserByID(ctx, rup.Methodist.Bytes)
		if err == nil {
			methodist = helpers.ConvertToUserResponse(*user)
		}
	}

	// Get teacher
	var teacher *helpers.UserResponse
	if rup.Teacher.Valid {
		user, err := s.repo.GetUserByID(ctx, rup.Teacher.Bytes)
		if err == nil {
			teacher = helpers.ConvertToUserResponse(*user)
		}
	}

	// Get exploration note
	explorationNote := ExplorationNoteResponse{
		ID:                 uuid.Nil,
		Basis:              nil,
		Goals:              nil,
		Summary:            nil,
		Competencies:       nil,
		Prerequisites:      nil,
		Postrequisites:     nil,
		InternetResources:  []*ResourceResponse{},
		TechnicalResources: []*ResourceResponse{},
	}
	if rup.ExplorationNoteID.Valid {
		note, err := s.repo.GetExplorationNoteByID(ctx, rup.ExplorationNoteID.Bytes)
		if err == nil {
			explorationNote = s.convertToExplorationNoteResponse(ctx, *note)
		}
	}

	// Get disciplines
	disciplines := []*DisciplineResponse{}
	for _, discID := range rup.Disciplines {
		disc, err := s.repo.GetDisciplineByID(ctx, discID)
		if err != nil {
			continue
		}
		disciplineResp, err := s.convertToDisciplineResponse(ctx, *disc)
		if err != nil {
			continue
		}
		disciplines = append(disciplines, disciplineResp)
	}

	return &RupResponse{
		ID:              rup.ID,
		Name:            localization.LocaleTextFromJSONB(rup.Name),
		Status:          string(rup.Status),
		Reason:          rup.Reason.String,
		Course:          rup.Course,
		StudyForm:       string(rup.StudyForm),
		StudyYear:       rup.StudyYear,
		Type:            string(rup.Type),
		TotalHours:      rup.TotalHours,
		Contacts:        contacts,
		Groups:          groups,
		Methodist:       methodist,
		Teacher:         teacher,
		ExplorationNote: explorationNote,
		Disciplines:     disciplines,
		CreatedAt:       rup.CreatedAt.Time,
		UpdatedAt:       rup.UpdatedAt.Time,
	}, nil
}

func (s *rupService) convertToGroupResponse(group storage.Group) *GroupResponse {
	return &GroupResponse{
		KeycloakID:    group.KeycloakID,
		Name:          group.Name,
		Qualification: localization.LocaleTextFromJSONB(group.Qualification),
		Specialty:     localization.LocaleTextFromJSONB(group.Specialty),
	}
}

func (s *rupService) convertToExplorationNoteResponse(ctx context.Context, note storage.RupExplorationNote) ExplorationNoteResponse {
	internetResources := []*ResourceResponse{}
	for _, resID := range note.InternetResources {
		res, err := s.repo.GetResourceByID(ctx, resID)
		if err != nil {
			continue
		}
		internetResources = append(internetResources, &ResourceResponse{
			ID:   res.ID,
			Name: localization.LocaleTextFromJSONB(res.Name),
			Link: res.Link.String,
			Type: "INTERNET",
		})
	}

	technicalResources := []*ResourceResponse{}
	for _, resID := range note.TechnicalResources {
		res, err := s.repo.GetResourceByID(ctx, resID)
		if err != nil {
			continue
		}
		technicalResources = append(technicalResources, &ResourceResponse{
			ID:   res.ID,
			Name: localization.LocaleTextFromJSONB(res.Name),
			Link: res.Link.String,
			Type: "TECHNICAL",
		})
	}

	return ExplorationNoteResponse{
		ID:                 note.ID,
		Basis:              localization.LocaleTextPtrFromJSONB(note.Basis),
		Goals:              localization.LocaleTextPtrFromJSONB(note.Goals),
		Summary:            localization.LocaleTextPtrFromJSONB(note.Summary),
		Competencies:       localization.LocaleTextPtrFromJSONB(note.Competencies),
		Prerequisites:      localization.LocaleTextPtrFromJSONB(note.Prerequisites),
		Postrequisites:     localization.LocaleTextPtrFromJSONB(note.Postrequisites),
		InternetResources:  internetResources,
		TechnicalResources: technicalResources,
	}
}

func (s *rupService) convertToDisciplineResponse(ctx context.Context, disc storage.RupDiscipline) (*DisciplineResponse, error) {
	semesters := []*SemesterResponse{}
	for _, semID := range disc.Semesters {
		sem, err := s.repo.GetSemesterByID(ctx, semID)
		if err != nil {
			continue
		}
		semesters = append(semesters, &SemesterResponse{
			ID:         sem.ID,
			Semester:   sem.Semester,
			TotalHours: sem.TotalHours,
		})
	}

	topics := []*TopicResponse{}
	for _, topicID := range disc.Topics {
		topic, err := s.repo.GetTopicByID(ctx, topicID)
		if err != nil {
			continue
		}

		topics = append(topics, &TopicResponse{
			ID:              topic.ID,
			Name:            localization.LocaleTextFromJSONB(topic.Name),
			Type:            topic.Type,
			LessonID:        helpers.PgUUIDToPtr(topic.LessonID),
			TotalHours:      topic.TotalHours,
			TheoryHours:     topic.TheoryHours,
			PracticeHours:   topic.PracticeHours,
			IndividualHours: topic.IndividualHours,
			SrspHours:       topic.SrspHours,
			SrsHours:        topic.SrsHours,
		})
	}

	return &DisciplineResponse{
		ID:         disc.ID,
		Name:       localization.LocaleTextFromJSONB(disc.Name),
		TotalHours: disc.TotalHours,
		Semesters:  semesters,
		Topics:     topics,
		CreatedAt:  time.Now(), // Placeholder
		UpdatedAt:  time.Now(), // Placeholder
	}, nil
}

func (s *rupService) CountRups(ctx context.Context) (int64, error) {
	return s.repo.CountRups(ctx)
}

func (s *rupService) GetRupPaginated(
	ctx context.Context,
	currentPage int,
	pageSize int,
	search string,
	sort string,
	teacher pgtype.UUID,
	methodist pgtype.UUID,
	status []string,
) (*PaginatedRupsResponse, error) {
	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	if len(status) == 0 {
		status = nil
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountRupsFiltered(
		ctx,
		search,
		teacher,
		methodist,
		status,
	)
	if err != nil {
		return nil, err
	}

	dbRups, err := s.repo.GetRupsPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		search,
		sort,
		teacher,
		methodist,
		status,
	)
	if err != nil {
		return nil, err
	}

	rups := make([]*ListAllRupsResponse, 0, len(dbRups))
	for _, rup := range dbRups {
		resp, err := s.buildListAllRupsResponse(ctx, rup)
		if err == nil {
			rups = append(rups, resp)
		}
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	return &PaginatedRupsResponse{
		Data: rups,
		Meta: PaginationMeta{
			CurrentPage: currentPage,
			Pages:       pages,
			Total:       int(total),
			PageSize:    pageSize,
		},
	}, nil
}

func normalizeBackendLanguage(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "ru":
		return "ru"
	case "kz", "kk":
		return "kz"
	default:
		return ""
	}
}

func oppositeBackendLanguage(value string) string {
	switch normalizeBackendLanguage(value) {
	case "ru":
		return "kz"
	case "kz":
		return "ru"
	default:
		return ""
	}
}

func localeValueByLanguage(value localization.LocaleText, language string) string {
	switch normalizeBackendLanguage(language) {
	case "ru":
		return strings.TrimSpace(value.Ru)
	case "kz":
		return strings.TrimSpace(value.Kz)
	default:
		return ""
	}
}

func setLocaleValueByLanguage(value localization.LocaleText, language string, text string) localization.LocaleText {
	trimmed := strings.TrimSpace(text)
	switch normalizeBackendLanguage(language) {
	case "ru":
		value.Ru = trimmed
	case "kz":
		value.Kz = trimmed
	}

	return value.Normalized()
}

func localePointerOrEmpty(value *localization.LocaleText) localization.LocaleText {
	if value == nil {
		return localization.LocaleText{}
	}

	return value.Normalized()
}

func (s *rupService) beginLanguageGeneration(rupID uuid.UUID, sourceLanguage string, targetLanguage string) {
	totalStages := 6
	s.updateLanguageGenerationState(RupLanguageGenerationStatus{
		RupID:           rupID,
		SourceLanguage:  sourceLanguage,
		TargetLanguage:  targetLanguage,
		Status:          rupLanguageGenerationStatusQueued,
		CurrentStage:    "queued",
		StageIndex:      0,
		TotalStages:     totalStages,
		ProgressPercent: 0,
		UpdatedAt:       time.Now().UTC(),
	})
}

func (s *rupService) updateLanguageGenerationProgress(
	rupID uuid.UUID,
	sourceLanguage string,
	targetLanguage string,
	stage string,
	stageIndex int,
	totalStages int,
) {
	progress := 0
	if totalStages > 0 && stageIndex > 0 {
		progress = int(math.Round(float64(stageIndex*100) / float64(totalStages)))
	}
	if progress > 99 {
		progress = 99
	}

	s.updateLanguageGenerationState(RupLanguageGenerationStatus{
		RupID:           rupID,
		SourceLanguage:  sourceLanguage,
		TargetLanguage:  targetLanguage,
		Status:          rupLanguageGenerationStatusRunning,
		CurrentStage:    stage,
		StageIndex:      stageIndex,
		TotalStages:     totalStages,
		ProgressPercent: progress,
		UpdatedAt:       time.Now().UTC(),
	})
}

func (s *rupService) markLanguageGenerationCompleted(
	rupID uuid.UUID,
	sourceLanguage string,
	targetLanguage string,
	totalStages int,
) {
	s.updateLanguageGenerationState(RupLanguageGenerationStatus{
		RupID:           rupID,
		SourceLanguage:  sourceLanguage,
		TargetLanguage:  targetLanguage,
		Status:          rupLanguageGenerationStatusCompleted,
		CurrentStage:    "completed",
		StageIndex:      totalStages,
		TotalStages:     totalStages,
		ProgressPercent: 100,
		UpdatedAt:       time.Now().UTC(),
	})
}

func (s *rupService) markLanguageGenerationFailed(
	rupID uuid.UUID,
	sourceLanguage string,
	targetLanguage string,
	stage string,
	stageIndex int,
	totalStages int,
	err error,
) {
	divisor := totalStages
	if divisor <= 0 {
		divisor = 1
	}

	s.updateLanguageGenerationState(RupLanguageGenerationStatus{
		RupID:           rupID,
		SourceLanguage:  sourceLanguage,
		TargetLanguage:  targetLanguage,
		Status:          rupLanguageGenerationStatusFailed,
		CurrentStage:    stage,
		StageIndex:      stageIndex,
		TotalStages:     totalStages,
		ProgressPercent: int(math.Round(float64(stageIndex*100) / float64(divisor))),
		Error:           strings.TrimSpace(err.Error()),
		UpdatedAt:       time.Now().UTC(),
	})
}

func (s *rupService) updateLanguageGenerationState(state RupLanguageGenerationStatus) {
	s.languageGenerationMu.Lock()
	defer s.languageGenerationMu.Unlock()
	s.languageGeneration[state.RupID] = state
}

func (s *rupService) isLanguageGenerationInProgress(rupID uuid.UUID) bool {
	s.languageGenerationMu.RLock()
	defer s.languageGenerationMu.RUnlock()

	status, exists := s.languageGeneration[rupID]
	if !exists {
		return false
	}

	return status.Status == rupLanguageGenerationStatusQueued || status.Status == rupLanguageGenerationStatusRunning
}

func (s *rupService) resolveSourceLanguageForRegeneration(rupID uuid.UUID, sourceLanguage string) string {
	if normalized := normalizeBackendLanguage(sourceLanguage); normalized != "" {
		return normalized
	}

	s.languageGenerationMu.RLock()
	defer s.languageGenerationMu.RUnlock()

	if status, exists := s.languageGeneration[rupID]; exists {
		if normalized := normalizeBackendLanguage(status.SourceLanguage); normalized != "" {
			return normalized
		}
	}

	return "ru"
}

func (s *rupService) translateLocaleText(
	ctx context.Context,
	value localization.LocaleText,
	sourceLanguage string,
	targetLanguage string,
	overwriteTarget bool,
) (localization.LocaleText, error) {
	sourceText := localeValueByLanguage(value, sourceLanguage)
	targetText := localeValueByLanguage(value, targetLanguage)
	if sourceText == "" {
		sourceText = strings.TrimSpace(value.Ru)
		if sourceText == "" {
			sourceText = strings.TrimSpace(value.Kz)
		}
	}

	if sourceText == "" || (!overwriteTarget && targetText != "") {
		return value, nil
	}

	translatedText, err := s.aiService.TranslateText(ctx, TranslateTextRequest{
		Text:             sourceText,
		SourceLanguage:   sourceLanguage,
		TargetLanguage:   targetLanguage,
		Domain:           "рабочая учебная программа (РУП) колледжа",
		AdditionalPrompt: "Сохрани методическую терминологию Республики Казахстан.",
	})
	if err != nil {
		return value, err
	}

	return setLocaleValueByLanguage(value, targetLanguage, translatedText), nil
}

func (s *rupService) generateLanguageForRup(
	rupID uuid.UUID,
	sourceLanguage string,
	targetLanguage string,
	overwriteTarget bool,
) {
	totalStages := 6
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Minute)
	defer cancel()

	fail := func(stage string, stageIndex int, err error) {
		s.log.WithFields(logrus.Fields{
			"rup_id":          rupID.String(),
			"source_language": sourceLanguage,
			"target_language": targetLanguage,
			"stage":           stage,
		}).WithError(err).Error("language generation failed")
		s.markLanguageGenerationFailed(rupID, sourceLanguage, targetLanguage, stage, stageIndex, totalStages, err)
	}

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "load_rup", 1, totalStages)
	rup, err := s.GetRupByID(ctx, rupID)
	if err != nil {
		fail("load_rup", 1, err)
		return
	}

	updateReq := mapRupResponseToCreateRequest(rup)
	updateReq.SourceLanguage = sourceLanguage

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "translate_core", 2, totalStages)
	updateReq.Name, err = s.translateLocaleText(ctx, updateReq.Name, sourceLanguage, targetLanguage, overwriteTarget)
	if err != nil {
		fail("translate_core", 2, err)
		return
	}
	if updateReq.ExplorationNote != nil {
		updateReq.ExplorationNote.Prerequisites, err = s.translateLocaleText(
			ctx,
			updateReq.ExplorationNote.Prerequisites,
			sourceLanguage,
			targetLanguage,
			overwriteTarget,
		)
		if err != nil {
			fail("translate_core", 2, err)
			return
		}
		updateReq.ExplorationNote.Postrequisites, err = s.translateLocaleText(
			ctx,
			updateReq.ExplorationNote.Postrequisites,
			sourceLanguage,
			targetLanguage,
			overwriteTarget,
		)
		if err != nil {
			fail("translate_core", 2, err)
			return
		}
	}

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "translate_exploration", 3, totalStages)
	if updateReq.ExplorationNote != nil {
		updateReq.ExplorationNote.Basis, err = s.translateLocaleText(
			ctx,
			updateReq.ExplorationNote.Basis,
			sourceLanguage,
			targetLanguage,
			overwriteTarget,
		)
		if err != nil {
			fail("translate_exploration", 3, err)
			return
		}
		updateReq.ExplorationNote.Goals, err = s.translateLocaleText(
			ctx,
			updateReq.ExplorationNote.Goals,
			sourceLanguage,
			targetLanguage,
			overwriteTarget,
		)
		if err != nil {
			fail("translate_exploration", 3, err)
			return
		}
		updateReq.ExplorationNote.Summary, err = s.translateLocaleText(
			ctx,
			updateReq.ExplorationNote.Summary,
			sourceLanguage,
			targetLanguage,
			overwriteTarget,
		)
		if err != nil {
			fail("translate_exploration", 3, err)
			return
		}
		updateReq.ExplorationNote.Competencies, err = s.translateLocaleText(
			ctx,
			updateReq.ExplorationNote.Competencies,
			sourceLanguage,
			targetLanguage,
			overwriteTarget,
		)
		if err != nil {
			fail("translate_exploration", 3, err)
			return
		}
	}

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "translate_resources", 4, totalStages)
	if updateReq.ExplorationNote != nil {
		for i := range updateReq.ExplorationNote.InternetResources {
			if updateReq.ExplorationNote.InternetResources[i] == nil {
				continue
			}

			updateReq.ExplorationNote.InternetResources[i].Name, err = s.translateLocaleText(
				ctx,
				updateReq.ExplorationNote.InternetResources[i].Name,
				sourceLanguage,
				targetLanguage,
				overwriteTarget,
			)
			if err != nil {
				fail("translate_resources", 4, err)
				return
			}
		}

		for i := range updateReq.ExplorationNote.TechnicalResources {
			if updateReq.ExplorationNote.TechnicalResources[i] == nil {
				continue
			}

			updateReq.ExplorationNote.TechnicalResources[i].Name, err = s.translateLocaleText(
				ctx,
				updateReq.ExplorationNote.TechnicalResources[i].Name,
				sourceLanguage,
				targetLanguage,
				overwriteTarget,
			)
			if err != nil {
				fail("translate_resources", 4, err)
				return
			}
		}
	}

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "translate_disciplines_and_topics", 5, totalStages)
	for i := range updateReq.Disciplines {
		if updateReq.Disciplines[i] == nil {
			continue
		}

		updateReq.Disciplines[i].Name, err = s.translateLocaleText(
			ctx,
			updateReq.Disciplines[i].Name,
			sourceLanguage,
			targetLanguage,
			overwriteTarget,
		)
		if err != nil {
			fail("translate_disciplines_and_topics", 5, err)
			return
		}

		for j := range updateReq.Disciplines[i].Topics {
			if updateReq.Disciplines[i].Topics[j] == nil {
				continue
			}

			updateReq.Disciplines[i].Topics[j].Name, err = s.translateLocaleText(
				ctx,
				updateReq.Disciplines[i].Topics[j].Name,
				sourceLanguage,
				targetLanguage,
				overwriteTarget,
			)
			if err != nil {
				fail("translate_disciplines_and_topics", 5, err)
				return
			}
		}
	}

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "save_translations", 6, totalStages)
	if _, err := s.UpdateRup(ctx, rupID, updateReq); err != nil {
		fail("save_translations", 6, err)
		return
	}

	s.markLanguageGenerationCompleted(rupID, sourceLanguage, targetLanguage, totalStages)
}

func mapRupResponseToCreateRequest(rup *RupResponse) CreateRupRequest {
	contacts := make([]string, 0, len(rup.Contacts))
	for _, contact := range rup.Contacts {
		if contact == nil || contact.KeycloakID == uuid.Nil {
			continue
		}
		contacts = append(contacts, contact.KeycloakID.String())
	}

	groups := make([]string, 0, len(rup.Groups))
	for _, group := range rup.Groups {
		if group == nil || group.KeycloakID == uuid.Nil {
			continue
		}
		groups = append(groups, group.KeycloakID.String())
	}

	var methodist string
	if rup.Methodist != nil && rup.Methodist.KeycloakID != uuid.Nil {
		methodist = rup.Methodist.KeycloakID.String()
	}

	var teacher string
	if rup.Teacher != nil && rup.Teacher.KeycloakID != uuid.Nil {
		teacher = rup.Teacher.KeycloakID.String()
	}

	internetResources := make([]*ResourceRequest, 0, len(rup.ExplorationNote.InternetResources))
	for _, resource := range rup.ExplorationNote.InternetResources {
		if resource == nil {
			continue
		}
		internetResources = append(internetResources, &ResourceRequest{
			Name: resource.Name,
			Link: resource.Link,
		})
	}

	technicalResources := make([]*ResourceRequest, 0, len(rup.ExplorationNote.TechnicalResources))
	for _, resource := range rup.ExplorationNote.TechnicalResources {
		if resource == nil {
			continue
		}
		technicalResources = append(technicalResources, &ResourceRequest{
			Name: resource.Name,
			Link: resource.Link,
		})
	}

	disciplines := make([]*DisciplineRequest, 0, len(rup.Disciplines))
	for _, discipline := range rup.Disciplines {
		if discipline == nil {
			continue
		}

		semesters := make([]*SemesterRequest, 0, len(discipline.Semesters))
		for _, semester := range discipline.Semesters {
			if semester == nil {
				continue
			}
			semesters = append(semesters, &SemesterRequest{
				Semester:   semester.Semester,
				TotalHours: semester.TotalHours,
			})
		}

		topics := make([]*TopicRequest, 0, len(discipline.Topics))
		for _, topic := range discipline.Topics {
			if topic == nil {
				continue
			}
			topics = append(topics, &TopicRequest{
				Name:            topic.Name,
				Type:            string(topic.Type),
				TheoryHours:     topic.TheoryHours,
				PracticeHours:   topic.PracticeHours,
				IndividualHours: topic.IndividualHours,
				SrspHours:       topic.SrspHours,
				SrsHours:        topic.SrsHours,
			})
		}

		disciplines = append(disciplines, &DisciplineRequest{
			Name:      discipline.Name,
			Semesters: semesters,
			Topics:    topics,
		})
	}

	return CreateRupRequest{
		Name:      rup.Name,
		Type:      rup.Type,
		StudyYear: rup.StudyYear,
		Course:    rup.Course,
		StudyForm: rup.StudyForm,
		Contacts:  contacts,
		Groups:    groups,
		Methodist: methodist,
		Teacher:   teacher,
		ExplorationNote: &ExplorationNoteRequest{
			Basis:              localePointerOrEmpty(rup.ExplorationNote.Basis),
			Goals:              localePointerOrEmpty(rup.ExplorationNote.Goals),
			Summary:            localePointerOrEmpty(rup.ExplorationNote.Summary),
			Competencies:       localePointerOrEmpty(rup.ExplorationNote.Competencies),
			Prerequisites:      localePointerOrEmpty(rup.ExplorationNote.Prerequisites),
			Postrequisites:     localePointerOrEmpty(rup.ExplorationNote.Postrequisites),
			InternetResources:  internetResources,
			TechnicalResources: technicalResources,
		},
		Disciplines: disciplines,
	}
}
