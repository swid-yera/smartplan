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
	"strings"
	"time"

	"eduplan/backend/config"
	"eduplan/backend/pkg/helpers"
	"eduplan/backend/pkg/localization"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

type RupService interface {
	CreateRup(ctx context.Context, req CreateRupRequest) (*RupResponse, error)
	CreateImportedRup(ctx context.Context, req CreateRupRequest) (*RupResponse, error)
	ParseRupImport(ctx context.Context, fileName string, content []byte, userID uuid.UUID) (*ParseRupImportResponse, error)
	ConfirmRupImport(ctx context.Context, userID uuid.UUID, req ConfirmRupImportRequest) (*RupResponse, error)
	GetRupByID(ctx context.Context, id uuid.UUID) (*RupResponse, error)
	GetLanguageGenerationStatus(ctx context.Context, id uuid.UUID) (*RupLanguageGenerationStatus, error)
	RegenerateLanguageGeneration(ctx context.Context, id uuid.UUID, sourceLanguage string) (*RupLanguageGenerationStatus, error)
	UpdateRupStatus(ctx context.Context, req UpdateRupStatusRequest) (*UpdateRupStatusResponse, error)
	GetRupSignatureArtifact(ctx context.Context, id uuid.UUID) (*RupSignatureArtifactResponse, error)
	UpdateRup(ctx context.Context, id uuid.UUID, req CreateRupRequest) (*RupResponse, error)
	DeleteRup(ctx context.Context, id uuid.UUID) error
	GetRupDownloadURL(ctx context.Context, id uuid.UUID, language string) (string, error)
	GetRupPaginated(ctx context.Context, currentPage int, pageSize int, search string, sort string, teacher pgtype.UUID, methodist pgtype.UUID, status []string, groupIDs []string, studyYear string) (*PaginatedRupsResponse, error)
	GetRupStudyYears(ctx context.Context) ([]string, error)
	GetRupReviewTeachers(ctx context.Context, search string) ([]RupReviewTeacherResponse, error)
	CountRups(ctx context.Context) (int64, error)
}

type PaginatedRupsResponse struct {
	Data []*ListAllRupsResponse `json:"data"`
	Meta PaginationMeta         `json:"meta"`
}

type RupReviewTeacherResponse struct {
	KeycloakID      uuid.UUID `json:"keycloakId"`
	FirstName       string    `json:"firstName"`
	LastName        string    `json:"lastName"`
	Username        string    `json:"username"`
	ReviewRupsCount int       `json:"reviewRupsCount"`
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
	DurationHours   int32                   `json:"durationHours"`
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
	Language        string                     `json:"language,omitempty"`
	Course          int32                      `json:"course"`
	StudyForm       string                     `json:"studyForm"`
	StudyYear       string                     `json:"studyYear"`
	Type            string                     `json:"type"`
	TotalHours      int32                      `json:"totalHours"`
	Contacts        []*helpers.UserResponse    `json:"contacts"`
	Group           *RupDocumentGroup          `json:"group"`
	ExplorationNote RupDocumentExplorationNote `json:"explorationNote"`
	Disciplines     []*RupDocumentDiscipline   `json:"disciplines"`
	VerificationURL string                     `json:"verificationUrl,omitempty"`
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
	Basis              string                 `json:"basis,omitempty"`
	Goals              string                 `json:"goals,omitempty"`
	Competencies       string                 `json:"competencies,omitempty"`
	Prerequisites      string                 `json:"prerequisites,omitempty"`
	Postrequisites     string                 `json:"postrequisites,omitempty"`
	InternetResources  []*RupDocumentResource `json:"internetResources"`
	TechnicalResources []*RupDocumentResource `json:"technicalResources"`
}

type RupDocumentResource struct {
	Name string `json:"name"`
	Link string `json:"link"`
}

type RupDocumentGroup struct {
	KeycloakID    uuid.UUID `json:"keycloakId"`
	Name          string    `json:"name"`
	Qualification string    `json:"qualification"`
	Specialty     string    `json:"specialty"`
}

type RupDocumentDiscipline struct {
	Name      string              `json:"name"`
	Semesters []*SemesterResponse `json:"semesters"`
	Topics    []*RupDocumentTopic `json:"topics"`
}

type RupDocumentTopic struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	Type            string    `json:"type"`
	TotalHours      int32     `json:"totalHours"`
	TheoryHours     int32     `json:"theoryHours"`
	PracticeHours   int32     `json:"practiceHours"`
	IndividualHours int32     `json:"individualHours"`
	SrspHours       int32     `json:"srspHours"`
	SrsHours        int32     `json:"srsHours"`
}

type DisciplineResponse struct {
	ID         uuid.UUID               `json:"id"`
	Name       localization.LocaleText `json:"name"`
	TotalHours int32                   `json:"totalHours"`
	Semesters  []*SemesterResponse     `json:"semesters"`
	Topics     []*TopicResponse        `json:"topics"`
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
	repo         repository.RupRepository
	cfg          *config.DocumentRenderConfig
	httpClient   *http.Client
	docRender    *DocumentRenderClient
	aiService    AIService
	translation  TranslationService
	fileStorage  FileStorage
	crypto       CryptoClient
	log          *logrus.Logger
	langGen      langGenStore
	importDrafts rupImportDraftStore
}

type UpdateRupStatusRequest struct {
	ID            uuid.UUID         `json:"id"`
	Status        string            `json:"status"`
	Reason        string            `json:"reason"`
	MethodistID   uuid.UUID         `json:"methodistId"`
	CorrelationID string            `json:"correlationId"`
	KeyID         string            `json:"keyId"`
	UserID        string            `json:"userId"`
	Password      string            `json:"password"`
	Confirmed     bool              `json:"confirmed"`
	Signature     string            `json:"signature"`
	SignerName    string            `json:"signerName"`
	SignerRole    string            `json:"signerRole"`
	Kripto        *KriptoKeyPayload `json:"kripto"`
}

type KriptoEncryptedPrivateKey struct {
	Type       string `json:"type,omitempty"`
	Version    int    `json:"version,omitempty"`
	Cipher     string `json:"cipher"`
	KDF        string `json:"kdf"`
	Hash       string `json:"hash"`
	Iterations int    `json:"iterations"`
	Salt       string `json:"salt"`
	Nonce      string `json:"nonce"`
	Value      string `json:"value"`
	Encoding   string `json:"encoding,omitempty"`
}

type KriptoKeyPayload struct {
	Format              string                    `json:"format"`
	Version             int                       `json:"version"`
	Purpose             string                    `json:"purpose,omitempty"`
	KeyID               string                    `json:"keyId"`
	UserID              string                    `json:"userId"`
	Algorithm           string                    `json:"algorithm"`
	DeviceName          string                    `json:"deviceName,omitempty"`
	CreatedAt           string                    `json:"createdAt,omitempty"`
	PublicKey           string                    `json:"publicKey"`
	EncryptedPrivateKey KriptoEncryptedPrivateKey `json:"encryptedPrivateKey"`
	Comment             any                       `json:"comment,omitempty"`
}

type RupSignatureArtifactResponse struct {
	ID              uuid.UUID `json:"id"`
	RupID           uuid.UUID `json:"rupId"`
	DocumentID      string    `json:"documentId"`
	DocumentVersion uuid.UUID `json:"documentVersion"`
	DocumentHash    string    `json:"documentHash"`
	KeyID           uuid.UUID `json:"keyId"`
	UserID          uuid.UUID `json:"userId"`
	Signature       string    `json:"signature"`
	SignerName      string    `json:"signerName"`
	SignerRole      string    `json:"signerRole"`
	SignatureID     string    `json:"signatureId"`
	VerificationURL string    `json:"verificationUrl"`
	QRSvg           string    `json:"qrSvg"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type UpdateRupStatusResponse struct {
	Message  string                        `json:"message"`
	Artifact *RupSignatureArtifactResponse `json:"artifact,omitempty"`
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
	translationService TranslationService,
	fileStorage FileStorage,
	cryptoClient CryptoClient,
	rdb *redis.Client,
	log *logrus.Logger,
) RupService {
	if log == nil {
		log = logrus.New()
	}

	return &rupService{
		repo:         repo,
		cfg:          cfg,
		httpClient:   httpClient,
		docRender:    NewDocumentRenderClient(httpClient, cfg.ApiKey),
		aiService:    aiService,
		translation:  translationService,
		fileStorage:  fileStorage,
		crypto:       cryptoClient,
		log:          log,
		langGen:      newRedisLangGenStore(rdb),
		importDrafts: newRedisRupImportDraftStore(rdb),
	}
}

func (s *rupService) CreateRup(ctx context.Context, req CreateRupRequest) (*RupResponse, error) {
	return s.createRup(ctx, req, true)
}

func (s *rupService) createRup(ctx context.Context, req CreateRupRequest, startLanguageGeneration bool) (*RupResponse, error) {
	req.Type = normalizeRupTypeValue(req.Type)

	// Валидация (вне транзакции — только чтение)
	if err := s.validateCreateRupRequest(ctx, req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	totalHours := calculateRupTotalHours(req.Disciplines)

	// Все мутирующие операции — внутри одной транзакции
	var rup *storage.Rup
	if err := s.repo.WithTransaction(ctx, func(txRepo repository.RupRepository) error {
		explorationNoteID, err := s.createExplorationNoteInRepo(ctx, txRepo, req.ExplorationNote)
		if err != nil {
			return fmt.Errorf("create exploration note: %w", err)
		}

		disciplineIDs, err := s.createDisciplinesInRepo(ctx, txRepo, req.Disciplines)
		if err != nil {
			return fmt.Errorf("create disciplines: %w", err)
		}

		params := s.convertToCreateParams(req, explorationNoteID, disciplineIDs, totalHours)
		rup, err = txRepo.CreateRup(ctx, params)
		if err != nil {
			return fmt.Errorf("create rup: %w", err)
		}
		return nil
	}); err != nil {
		return nil, err
	}

	// Сборка полного ответа (вне транзакции — только чтение)
	response, err := s.buildRupResponse(ctx, *rup)
	if err != nil {
		return nil, fmt.Errorf("build response: %w", err)
	}

	// Запуск фоновой генерации второго языка
	sourceLanguage := normalizeBackendLanguage(req.SourceLanguage)
	targetLanguage := oppositeBackendLanguage(sourceLanguage)
	if startLanguageGeneration && sourceLanguage != "" && targetLanguage != "" && s.translation != nil {
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
	status, exists, err := s.langGen.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return &status, nil
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
	if s.translation == nil {
		return nil, &HTTPStatusError{
			StatusCode: http.StatusBadGateway,
			Message:    "translation service is not configured",
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

func (s *rupService) UpdateRupStatus(ctx context.Context, req UpdateRupStatusRequest) (*UpdateRupStatusResponse, error) {
	var rupStatus storage.RupsStatus
	var approvalArtifact *RupSignatureArtifactResponse
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
		return nil, fmt.Errorf("invalid status: %s", req.Status)
	}

	if rupStatus == storage.RupsStatusAPPROVED {
		if s.crypto == nil {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadGateway,
				Message:    "kripto client is not configured",
			}
		}
		if strings.TrimSpace(req.KeyID) == "" {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    "key_id is required for approved status",
			}
		}
		if strings.TrimSpace(req.UserID) == "" {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    "user_id is required for approved status",
			}
		}

		startedAt := time.Now()
		validationResp, err := s.crypto.ValidateKeyOwnership(ctx, ValidateKeyOwnershipRequest{
			KeyID:    req.KeyID,
			UserID:   req.UserID,
			Password: req.Password,
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
					return nil, &HTTPStatusError{StatusCode: httpErr.StatusCode, Message: "kripto authorization failed"}
				} else if httpErr.StatusCode >= 500 {
					return nil, &HTTPStatusError{StatusCode: http.StatusBadGateway, Message: "kripto temporary error"}
				} else {
					return nil, &HTTPStatusError{StatusCode: http.StatusBadRequest, Message: httpErr.Error()}
				}
			} else {
				s.log.WithFields(logrus.Fields{
					"correlation_id": req.CorrelationID,
					"key_id":         req.KeyID,
					"user_id":        req.UserID,
					"latency_ms":     latency.Milliseconds(),
				}).WithError(err).Error("kripto validate key network error")
				return nil, &HTTPStatusError{StatusCode: http.StatusBadGateway, Message: "kripto request failed"}
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
		} else {
			rupStatus = storage.RupsStatusREJECTED
			req.Reason = "Ключ не прошел проверку"
		}

		if rupStatus == storage.RupsStatusAPPROVED {
			rup, err := s.GetRupByID(ctx, req.ID)
			if err != nil {
				return nil, err
			}

			if len(rup.Groups) == 0 {
				return nil, fmt.Errorf("rup has no groups")
			}

			approvalArtifact, err = s.registerApprovalArtifact(ctx, req, rup, req.SignerName, req.SignerRole)
			if err != nil {
				return nil, err
			}

			for _, group := range rup.Groups {
				if group == nil {
					continue
				}

				fileBytes, err := s.generateViaPythonForGroup(ctx, rup, group, "ru", approvalArtifact.VerificationURL)
				if err != nil {
					return nil, err
				}

				reader := bytes.NewReader(fileBytes)
				creationTime := time.Now().UTC().Format("20060102_150405")
				objectName := fmt.Sprintf(
					"rups/%s/%s_%s.docx",
					req.ID.String(),
					localeTextByLanguage(rup.Name, "ru"),
					creationTime,
				)

				if err := s.fileStorage.UploadFile(
					ctx,
					objectName,
					reader,
					int64(len(fileBytes)),
				); err != nil {
					return nil, err
				}
			}
		}
	}

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
		return nil, err
	}

	if err := s.repo.WithTransaction(ctx, func(txRepo repository.RupRepository) error {
		if err := txRepo.UpdateRupStatus(ctx, req.ID, rupStatus, reasonText, methodistUUID); err != nil {
			return err
		}

		if approvalArtifact != nil {
			artifact := toRupSignatureArtifactRepository(approvalArtifact)
			if artifact == nil {
				return fmt.Errorf("approval artifact is nil")
			}
			if _, err := txRepo.CreateRupSignatureArtifact(ctx, *artifact); err != nil {
				return err
			}
		}

		return nil
	}); err != nil {
		return nil, err
	}

	response := &UpdateRupStatusResponse{Message: "RUP status updated successfully"}
	if approvalArtifact != nil {
		response.Artifact = approvalArtifact
	}

	return response, nil
}

func (s *rupService) UpdateRup(ctx context.Context, id uuid.UUID, req CreateRupRequest) (*RupResponse, error) {
	// 1. Проверяем что RUP существует (вне транзакции — только чтение)
	existingRup, err := s.repo.GetRupByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("rup not found: %w", err)
	}

	req.Type = normalizeRupTypeValue(req.Type)

	// 2. Валидация (вне транзакции — только чтение)
	if err := s.validateCreateRupRequest(ctx, req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	totalHours := calculateRupTotalHours(req.Disciplines)

	// 3. Все мутирующие операции — внутри одной транзакции
	var updatedRup *storage.Rup
	if err := s.repo.WithTransaction(ctx, func(txRepo repository.RupRepository) error {
		explorationNoteID, err := s.createExplorationNoteInRepo(ctx, txRepo, req.ExplorationNote)
		if err != nil {
			return fmt.Errorf("create exploration note: %w", err)
		}

		disciplineIDs, err := s.createDisciplinesInRepo(ctx, txRepo, req.Disciplines)
		if err != nil {
			return fmt.Errorf("create disciplines: %w", err)
		}

		params := s.convertToUpdateParams(id, req, existingRup.Status, existingRup.Teacher, explorationNoteID, disciplineIDs, totalHours)
		updatedRup, err = txRepo.UpdateRup(ctx, params)
		if err != nil {
			return fmt.Errorf("update rup: %w", err)
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return s.buildRupResponse(ctx, *updatedRup)
}

func (s *rupService) generateViaPythonForGroup(ctx context.Context, rup *RupResponse, group *GroupResponse, language string, verificationURL string) ([]byte, error) {
	if rup == nil {
		return nil, fmt.Errorf("rup is nil")
	}
	if group == nil {
		return nil, fmt.Errorf("group is nil")
	}

	// 1. строим payload для конкретной группы
	payload := buildPayload(rup, group, language, verificationURL)

	// 2. JSON
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	// 3. HTTP -> Python (with redirect-safe POST retry)
	endpoint := strings.TrimRight(s.cfg.Url, "/") + "/generate-rup"
	resp, err := s.docRender.PostJSON(ctx, endpoint, body)
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

func buildPayload(rup *RupResponse, group *GroupResponse, language string, verificationURL string) RupDocumentPayload {
	selectedLanguage := normalizeBackendLanguage(language)
	if selectedLanguage == "" {
		selectedLanguage = "ru"
	}

	// ---------- GROUP ----------
	selectedGroup := RupDocumentGroup{}
	if group != nil {
		selectedGroup = RupDocumentGroup{
			Name:          group.Name,
			Specialty:     localeTextByLanguage(group.Specialty, selectedLanguage),
			Qualification: localeTextByLanguage(group.Qualification, selectedLanguage),
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
	disciplines := make([]*RupDocumentDiscipline, 0, len(rup.Disciplines))
	for _, d := range rup.Disciplines {

		semesters := []*SemesterResponse{}
		for _, s := range d.Semesters {
			semesters = append(semesters, &SemesterResponse{
				Semester:   s.Semester,
				TotalHours: s.TotalHours,
			})
		}

		topics := []*RupDocumentTopic{}
		for _, t := range d.Topics {
			topics = append(topics, &RupDocumentTopic{
				ID:              t.ID,
				Name:            localeTextByLanguage(t.Name, selectedLanguage),
				Type:            string(t.Type),
				TotalHours:      t.TotalHours,
				TheoryHours:     t.TheoryHours,
				PracticeHours:   t.PracticeHours,
				IndividualHours: t.IndividualHours,
				SrspHours:       t.SrspHours,
				SrsHours:        t.SrsHours,
			})
		}

		disciplines = append(disciplines, &RupDocumentDiscipline{
			Name:      localeTextByLanguage(d.Name, selectedLanguage),
			Semesters: semesters,
			Topics:    topics,
		})
	}

	// ---------- EXPLORATION NOTE ----------
	exploration := RupDocumentExplorationNote{}
	en := rup.ExplorationNote

	exploration.Basis = localePointerTextByLanguage(en.Basis, selectedLanguage)
	exploration.Goals = localePointerTextByLanguage(en.Goals, selectedLanguage)
	exploration.Competencies = localePointerTextByLanguage(en.Competencies, selectedLanguage)
	exploration.Prerequisites = localePointerTextByLanguage(en.Prerequisites, selectedLanguage)
	exploration.Postrequisites = localePointerTextByLanguage(en.Postrequisites, selectedLanguage)

	internet := []*RupDocumentResource{}
	for _, r := range en.InternetResources {
		internet = append(internet, &RupDocumentResource{
			Name: localeTextByLanguage(r.Name, selectedLanguage),
			Link: r.Link,
		})
	}

	technical := []*RupDocumentResource{}
	for _, r := range en.TechnicalResources {
		technical = append(technical, &RupDocumentResource{
			Name: localeTextByLanguage(r.Name, selectedLanguage),
			Link: r.Link,
		})
	}

	exploration.InternetResources = internet
	exploration.TechnicalResources = technical

	return RupDocumentPayload{
		ID:              rup.ID,
		Name:            localeTextByLanguage(rup.Name, selectedLanguage),
		Language:        selectedLanguage,
		Type:            rup.Type,
		StudyForm:       rup.StudyForm,
		StudyYear:       rup.StudyYear,
		Group:           &selectedGroup,
		Course:          rup.Course,
		TotalHours:      rup.TotalHours,
		Contacts:        contacts,
		Disciplines:     disciplines,
		ExplorationNote: exploration,
		VerificationURL: strings.TrimSpace(verificationURL),
	}
}

func (s *rupService) GetRupDownloadURL(ctx context.Context, id uuid.UUID, language string) (string, error) {
	selectedLanguage := normalizeBackendLanguage(language)
	if selectedLanguage == "" {
		selectedLanguage = "ru"
	}

	rup, err := s.GetRupByID(ctx, id)
	if err != nil {
		return "", err
	}
	if len(rup.Groups) == 0 {
		return "", fmt.Errorf("rup has no groups")
	}

	verificationURL := ""
	if artifact, artifactErr := s.repo.GetLatestRupSignatureArtifact(ctx, id); artifactErr == nil {
		verificationURL = strings.TrimSpace(artifact.VerificationURL)
	} else if !errors.Is(artifactErr, pgx.ErrNoRows) {
		return "", artifactErr
	}

	var latestObjectKey string
	for _, group := range rup.Groups {
		if group == nil {
			continue
		}

		fileBytes, err := s.generateViaPythonForGroup(ctx, rup, group, selectedLanguage, verificationURL)
		if err != nil {
			return "", err
		}

		creationTime := time.Now().UTC().Format("20060102_150405")
		objectName := fmt.Sprintf(
			"rups/%s/%s_%s_%s.docx",
			id.String(),
			localeTextByLanguage(rup.Name, selectedLanguage),
			selectedLanguage,
			creationTime,
		)

		if err := s.fileStorage.UploadFile(
			ctx,
			objectName,
			bytes.NewReader(fileBytes),
			int64(len(fileBytes)),
		); err != nil {
			return "", err
		}

		latestObjectKey = objectName
	}

	if latestObjectKey == "" {
		return "", fmt.Errorf("rup document not found for id %s", id.String())
	}

	return s.fileStorage.GetDownloadFileURL(ctx, latestObjectKey, 10*time.Minute)
}

func localeTextByLanguage(value localization.LocaleText, language string) string {
	if selected := localeValueByLanguage(value, language); selected != "" {
		return selected
	}

	if fallback := localeValueByLanguage(value, oppositeBackendLanguage(language)); fallback != "" {
		return fallback
	}

	if ru := strings.TrimSpace(value.Ru); ru != "" {
		return ru
	}

	return strings.TrimSpace(value.Kz)
}

func localePointerTextByLanguage(value *localization.LocaleText, language string) string {
	if value == nil {
		return ""
	}

	return localeTextByLanguage(*value, language)
}

func (s *rupService) DeleteRup(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteRup(ctx, id)
}

func (s *rupService) validateCreateRupRequest(ctx context.Context, req CreateRupRequest) error {
	normalizedRupType := normalizeRupTypeValue(req.Type)

	if req.Name.Ru == "" && req.Name.Kz == "" {
		return fmt.Errorf("name is required")
	}
	if req.StudyYear == "" {
		return fmt.Errorf("studyYear is required")
	}
	if req.Course < 1 || req.Course > 4 {
		return fmt.Errorf("course must be between 1 and 4")
	}
	if normalizedRupType != "PRACTICE" && normalizedRupType != "THEORY" {
		return fmt.Errorf("type must be PRACTICE or THEORY")
	}
	if req.StudyForm != "CORRESPONDENCE" && req.StudyForm != "FULL_TIME" {
		return fmt.Errorf("studyForm must be CORRESPONDENCE or FULL_TIME")
	}
	// Validate contacts exist
	for _, contactIDStr := range req.Contacts {
		contactID, err := uuid.Parse(contactIDStr)
		if err != nil {
			return fmt.Errorf("invalid contact ID format: %s", contactIDStr)
		}
		_, err = s.repo.GetUserByID(ctx, contactID)
		if err != nil {
			return fmt.Errorf("contact with ID %s does not exist", contactIDStr)
		}
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
		for _, topic := range disc.Topics {
			switch strings.ToUpper(strings.TrimSpace(topic.Type)) {
			case "PRACTICAL":
				if topic.DurationHours != 0 && topic.DurationHours != 2 {
					return fmt.Errorf("practical topic duration must be 2")
				}
			case "COMBINED", "SNZ", "SRSP":
				if topic.DurationHours != 0 && topic.DurationHours != 2 {
					return fmt.Errorf("%s topic duration must be 2", strings.ToLower(strings.TrimSpace(topic.Type)))
				}
			default:
				return fmt.Errorf("invalid topic type %q", topic.Type)
			}
		}
	}

	return nil
}

func normalizeRupTypeValue(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}

	normalizedUpper := strings.ToUpper(trimmed)
	switch normalizedUpper {
	case "PRACTICE", "PRACTICAL":
		return "PRACTICE"
	case "THEORY", "THEORETICAL", "COMBINED":
		return "THEORY"
	}

	normalizedLower := strings.ToLower(trimmed)
	switch {
	case strings.Contains(normalizedLower, "практ"),
		strings.Contains(normalizedLower, "производ"),
		strings.Contains(normalizedLower, "өндір"),
		strings.Contains(normalizedLower, "practice"):
		return "PRACTICE"
	case strings.Contains(normalizedLower, "теор"),
		strings.Contains(normalizedLower, "theory"):
		return "THEORY"
	default:
		return normalizedUpper
	}
}

// createExplorationNoteInRepo — tx-safe версия createExplorationNote, использует переданный repo
func (s *rupService) createExplorationNoteInRepo(ctx context.Context, repo repository.RupRepository, note *ExplorationNoteRequest) (*uuid.UUID, error) {
	if note == nil {
		return nil, nil
	}

	var internetResourceIDs []uuid.UUID
	for _, res := range note.InternetResources {
		params := storage.CreateRupResourceParams{
			Name: res.Name.ToJSONB(),
			Link: pgtype.Text{String: res.Link, Valid: res.Link != ""},
		}
		resource, err := repo.CreateResource(ctx, params)
		if err != nil {
			return nil, err
		}
		internetResourceIDs = append(internetResourceIDs, resource.ID)
	}

	var technicalResourceIDs []uuid.UUID
	for _, res := range note.TechnicalResources {
		params := storage.CreateRupResourceParams{
			Name: res.Name.ToJSONB(),
			Link: pgtype.Text{String: res.Link, Valid: res.Link != ""},
		}
		resource, err := repo.CreateResource(ctx, params)
		if err != nil {
			return nil, err
		}
		technicalResourceIDs = append(technicalResourceIDs, resource.ID)
	}

	enParams := storage.CreateRupExplorationNoteParams{
		Basis:              note.Basis.ToJSONB(),
		Goals:              note.Goals.ToJSONB(),
		Competencies:       note.Competencies.ToJSONB(),
		Prerequisites:      note.Prerequisites.ToJSONB(),
		Postrequisites:     note.Postrequisites.ToJSONB(),
		InternetResources:  internetResourceIDs,
		TechnicalResources: technicalResourceIDs,
	}
	explorationNote, err := repo.CreateExplorationNote(ctx, enParams)
	if err != nil {
		return nil, err
	}
	return &explorationNote.ID, nil
}

// createDisciplinesInRepo — tx-safe версия createDisciplines, использует переданный repo
func (s *rupService) createDisciplinesInRepo(ctx context.Context, repo repository.RupRepository, disciplines []*DisciplineRequest) ([]uuid.UUID, error) {
	var ids []uuid.UUID

	for _, disc := range disciplines {
		semesterIDs, err := s.createSemestersInRepo(ctx, repo, disc.Semesters)
		if err != nil {
			return nil, err
		}
		topicIDs, err := s.createTopicsInRepo(ctx, repo, disc.Topics)
		if err != nil {
			return nil, err
		}

		params := storage.CreateRupDisciplineParams{
			Name:       disc.Name.ToJSONB(),
			TotalHours: calculateDisciplineTotalHours(disc),
			Semesters:  semesterIDs,
			Topics:     topicIDs,
		}
		discipline, err := repo.CreateDiscipline(ctx, params)
		if err != nil {
			return nil, err
		}
		ids = append(ids, discipline.ID)
	}
	return ids, nil
}

func (s *rupService) createSemestersInRepo(ctx context.Context, repo repository.RupRepository, semesters []*SemesterRequest) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	for _, sem := range semesters {
		semester, err := repo.CreateSemester(ctx, storage.CreateDisciplineSemesterParams{
			Semester:   sem.Semester,
			TotalHours: sem.TotalHours,
		})
		if err != nil {
			return nil, err
		}
		ids = append(ids, semester.ID)
	}
	return ids, nil
}

func (s *rupService) createTopicsInRepo(ctx context.Context, repo repository.RupRepository, topics []*TopicRequest) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	for _, topic := range topics {
		topicType, err := parseRupTopicType(topic.Type)
		if err != nil {
			return nil, err
		}
		totalHours := calculateTopicTotalHours(topic)
		t, err := repo.CreateTopic(ctx, storage.CreateDisciplineTopicParams{
			Name:            topic.Name.ToJSONB(),
			Type:            topicType,
			TotalHours:      totalHours,
			TheoryHours:     topic.TheoryHours,
			PracticeHours:   topic.PracticeHours,
			IndividualHours: topic.IndividualHours,
			SrspHours:       topic.SrspHours,
			SrsHours:        topic.SrsHours,
		})
		if err != nil {
			return nil, err
		}
		ids = append(ids, t.ID)
	}
	return ids, nil
}

func calculateRupTotalHours(disciplines []*DisciplineRequest) int32 {
	var totalHours int32
	for _, discipline := range disciplines {
		totalHours += calculateDisciplineTotalHours(discipline)
	}
	return totalHours
}

func calculateDisciplineTotalHours(discipline *DisciplineRequest) int32 {
	if discipline == nil {
		return 0
	}

	var semesterHours int32
	for _, semester := range discipline.Semesters {
		semesterHours += semester.TotalHours
	}

	return semesterHours
}

func calculateTopicTotalHours(topic *TopicRequest) int32 {
	if topic == nil {
		return 0
	}

	return topic.TheoryHours + topic.PracticeHours + topic.IndividualHours + topic.SrspHours
}

func parseRupTopicType(value string) (storage.DisciplineTopicType, error) {
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "SNZ":
		return storage.DisciplineTopicTypeSNZ, nil
	case "PRACTICAL", "PRACTICE":
		return storage.DisciplineTopicTypePRACTICAL, nil
	case "COMBINED", "THEORY":
		return storage.DisciplineTopicTypeCOMBINED, nil
	case "SRSP":
		return storage.DisciplineTopicTypeSRSP, nil
	default:
		return "", fmt.Errorf("unsupported topic type: %s", value)
	}
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

		params := storage.CreateRupDisciplineParams{
			Name:       disc.Name.ToJSONB(),
			TotalHours: calculateDisciplineTotalHours(disc),
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
		topicType, err := parseRupTopicType(topic.Type)
		if err != nil {
			return nil, err
		}

		TotalHours := calculateTopicTotalHours(topic)

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
	// --- batch: contacts ---
	contacts := []*helpers.UserResponse{}
	if len(rup.Contacts) > 0 {
		users, err := s.repo.GetUsersByIDs(ctx, rup.Contacts)
		if err == nil {
			for _, u := range users {
				u := u
				contacts = append(contacts, helpers.ConvertToUserResponse(u))
			}
		}
	}

	// --- batch: groups ---
	groups := []*GroupResponse{}
	if len(rup.GroupIds) > 0 {
		groupIDs := make([]uuid.UUID, 0, len(rup.GroupIds))
		for _, s := range rup.GroupIds {
			if id, err := uuid.Parse(s); err == nil {
				groupIDs = append(groupIDs, id)
			}
		}
		if len(groupIDs) > 0 {
			dbGroups, err := s.repo.GetGroupsByIDs(ctx, groupIDs)
			if err == nil {
				for _, g := range dbGroups {
					g := g
					groups = append(groups, s.convertToGroupResponse(g))
				}
			}
		}
	}

	// --- methodist & teacher (одиночные запросы — оптимизировать нецелесообразно) ---
	var methodist *helpers.UserResponse
	if rup.Methodist.Valid {
		if u, err := s.repo.GetUserByID(ctx, rup.Methodist.Bytes); err == nil {
			methodist = helpers.ConvertToUserResponse(*u)
		}
	}

	var teacher *helpers.UserResponse
	if rup.Teacher.Valid {
		if u, err := s.repo.GetUserByID(ctx, rup.Teacher.Bytes); err == nil {
			teacher = helpers.ConvertToUserResponse(*u)
		}
	}

	// --- exploration note ---
	explorationNote := ExplorationNoteResponse{
		ID:                 uuid.Nil,
		Basis:              nil,
		Goals:              nil,
		Competencies:       nil,
		Prerequisites:      nil,
		Postrequisites:     nil,
		InternetResources:  []*ResourceResponse{},
		TechnicalResources: []*ResourceResponse{},
	}
	if rup.ExplorationNoteID.Valid {
		if note, err := s.repo.GetExplorationNoteByID(ctx, rup.ExplorationNoteID.Bytes); err == nil {
			explorationNote = s.convertToExplorationNoteResponseBatch(ctx, *note)
		}
	}

	// --- batch: disciplines ---
	disciplines := []*DisciplineResponse{}
	if len(rup.Disciplines) > 0 {
		dbDiscs, err := s.repo.GetDisciplinesByIDs(ctx, rup.Disciplines)
		if err == nil {
			// Собираем все ID семестров и топиков для единого batch-запроса
			var allSemIDs, allTopicIDs []uuid.UUID
			for _, d := range dbDiscs {
				allSemIDs = append(allSemIDs, d.Semesters...)
				allTopicIDs = append(allTopicIDs, d.Topics...)
			}

			semMap := map[uuid.UUID]storage.DisciplineSemester{}
			if len(allSemIDs) > 0 {
				sems, err := s.repo.GetSemestersByIDs(ctx, allSemIDs)
				if err == nil {
					for _, sem := range sems {
						semMap[sem.ID] = sem
					}
				}
			}

			topicMap := map[uuid.UUID]storage.DisciplineTopic{}
			if len(allTopicIDs) > 0 {
				topics, err := s.repo.GetTopicsByIDs(ctx, allTopicIDs)
				if err == nil {
					for _, t := range topics {
						topicMap[t.ID] = t
					}
				}
			}

			for _, disc := range dbDiscs {
				semesters := make([]*SemesterResponse, 0, len(disc.Semesters))
				for _, semID := range disc.Semesters {
					if sem, ok := semMap[semID]; ok {
						semesters = append(semesters, &SemesterResponse{
							ID:         sem.ID,
							Semester:   sem.Semester,
							TotalHours: sem.TotalHours,
						})
					}
				}
				topics := make([]*TopicResponse, 0, len(disc.Topics))
				for _, topicID := range disc.Topics {
					if t, ok := topicMap[topicID]; ok {
						topics = append(topics, s.convertToTopicResponse(t))
					}
				}
				disciplines = append(disciplines, &DisciplineResponse{
					ID:         disc.ID,
					Name:       localization.LocaleTextFromJSONB(disc.Name),
					TotalHours: disc.TotalHours,
					Semesters:  semesters,
					Topics:     topics,
				})
			}
		}
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
		Competencies:       localization.LocaleTextPtrFromJSONB(note.Competencies),
		Prerequisites:      localization.LocaleTextPtrFromJSONB(note.Prerequisites),
		Postrequisites:     localization.LocaleTextPtrFromJSONB(note.Postrequisites),
		InternetResources:  internetResources,
		TechnicalResources: technicalResources,
	}
}

// convertToTopicResponse — конвертирует storage.DisciplineTopic в TopicResponse
func (s *rupService) convertToTopicResponse(t storage.DisciplineTopic) *TopicResponse {
	return &TopicResponse{
		ID:              t.ID,
		Name:            localization.LocaleTextFromJSONB(t.Name),
		Type:            t.Type,
		LessonID:        helpers.PgUUIDToPtr(t.LessonID),
		TotalHours:      t.TotalHours,
		TheoryHours:     t.TheoryHours,
		PracticeHours:   t.PracticeHours,
		IndividualHours: t.IndividualHours,
		SrspHours:       t.SrspHours,
		SrsHours:        t.SrsHours,
	}
}

// convertToExplorationNoteResponseBatch — batch-версия: загружает все ресурсы одним запросом
func (s *rupService) convertToExplorationNoteResponseBatch(ctx context.Context, note storage.RupExplorationNote) ExplorationNoteResponse {
	allIDs := append(note.InternetResources, note.TechnicalResources...)
	resMap := map[uuid.UUID]storage.RupResource{}
	if len(allIDs) > 0 {
		resources, err := s.repo.GetResourcesByIDs(ctx, allIDs)
		if err == nil {
			for _, r := range resources {
				resMap[r.ID] = r
			}
		}
	}

	internetResources := make([]*ResourceResponse, 0, len(note.InternetResources))
	for _, id := range note.InternetResources {
		if r, ok := resMap[id]; ok {
			internetResources = append(internetResources, &ResourceResponse{
				ID:   r.ID,
				Name: localization.LocaleTextFromJSONB(r.Name),
				Link: r.Link.String,
				Type: "INTERNET",
			})
		}
	}

	technicalResources := make([]*ResourceResponse, 0, len(note.TechnicalResources))
	for _, id := range note.TechnicalResources {
		if r, ok := resMap[id]; ok {
			technicalResources = append(technicalResources, &ResourceResponse{
				ID:   r.ID,
				Name: localization.LocaleTextFromJSONB(r.Name),
				Link: r.Link.String,
				Type: "TECHNICAL",
			})
		}
	}

	return ExplorationNoteResponse{
		ID:                 note.ID,
		Basis:              localization.LocaleTextPtrFromJSONB(note.Basis),
		Goals:              localization.LocaleTextPtrFromJSONB(note.Goals),
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
	groupIDs []string,
	studyYear string,
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
	groupIDs = normalizeNonEmptyStrings(groupIDs)
	if len(groupIDs) == 0 {
		groupIDs = nil
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountRupsFiltered(
		ctx,
		search,
		teacher,
		methodist,
		status,
		groupIDs,
		studyYear,
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
		groupIDs,
		studyYear,
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

func (s *rupService) GetRupStudyYears(ctx context.Context) ([]string, error) {
	studyYears, err := s.repo.GetRupStudyYears(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]string, 0, len(studyYears))
	for _, studyYear := range studyYears {
		trimmed := strings.TrimSpace(studyYear)
		if trimmed == "" {
			continue
		}

		result = append(result, trimmed)
	}

	return result, nil
}

func (s *rupService) GetRupReviewTeachers(ctx context.Context, search string) ([]RupReviewTeacherResponse, error) {
	rows, err := s.repo.GetRupReviewTeachers(ctx, strings.TrimSpace(search))
	if err != nil {
		return nil, err
	}

	result := make([]RupReviewTeacherResponse, 0, len(rows))
	for _, row := range rows {
		result = append(result, RupReviewTeacherResponse{
			KeycloakID:      row.KeycloakID,
			FirstName:       strings.TrimSpace(row.FirstName),
			LastName:        strings.TrimSpace(row.LastName),
			Username:        strings.TrimSpace(row.Username),
			ReviewRupsCount: int(row.ReviewRupsCount),
		})
	}

	return result, nil
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
	// Используем background context — метод вызывается из фоновой горутины
	_ = s.langGen.Set(context.Background(), state)
}

func (s *rupService) isLanguageGenerationInProgress(rupID uuid.UUID) bool {
	status, exists, err := s.langGen.Get(context.Background(), rupID)
	if err != nil || !exists {
		return false
	}
	return status.Status == rupLanguageGenerationStatusQueued || status.Status == rupLanguageGenerationStatusRunning
}

func (s *rupService) resolveSourceLanguageForRegeneration(rupID uuid.UUID, sourceLanguage string) string {
	if normalized := normalizeBackendLanguage(sourceLanguage); normalized != "" {
		return normalized
	}

	if status, exists, err := s.langGen.Get(context.Background(), rupID); err == nil && exists {
		if normalized := normalizeBackendLanguage(status.SourceLanguage); normalized != "" {
			return normalized
		}
	}

	return "ru"
}

type rupLocaleTextTranslationRef struct {
	value *localization.LocaleText
}

func (s *rupService) translateLocaleTexts(
	ctx context.Context,
	refs []rupLocaleTextTranslationRef,
	sourceLanguage string,
	targetLanguage string,
	overwriteTarget bool,
) error {
	if len(refs) == 0 {
		return nil
	}
	if s.translation == nil {
		return fmt.Errorf("translation service is not configured")
	}

	type pendingTranslation struct {
		value      *localization.LocaleText
		sourceText string
	}

	pending := make([]pendingTranslation, 0, len(refs))
	for _, ref := range refs {
		if ref.value == nil {
			continue
		}

		sourceText := localeValueByLanguage(*ref.value, sourceLanguage)
		targetText := localeValueByLanguage(*ref.value, targetLanguage)
		if sourceText == "" {
			sourceText = strings.TrimSpace(ref.value.Ru)
			if sourceText == "" {
				sourceText = strings.TrimSpace(ref.value.Kz)
			}
		}

		if sourceText == "" || (!overwriteTarget && targetText != "") {
			continue
		}

		pending = append(pending, pendingTranslation{
			value:      ref.value,
			sourceText: sourceText,
		})
	}

	if len(pending) == 0 {
		return nil
	}

	texts := make([]string, 0, len(pending))
	for _, item := range pending {
		texts = append(texts, item.sourceText)
	}

	translatedTexts, err := s.translation.TranslateBatch(ctx, TranslateBatchRequest{
		Texts:          texts,
		SourceLanguage: sourceLanguage,
		TargetLanguage: targetLanguage,
		Domain:         "rup",
	})
	if err != nil {
		return err
	}
	if len(translatedTexts) != len(pending) {
		return fmt.Errorf("translation response count mismatch: got %d, want %d", len(translatedTexts), len(pending))
	}

	for i, translatedText := range translatedTexts {
		*pending[i].value = setLocaleValueByLanguage(*pending[i].value, targetLanguage, translatedText)
	}

	return nil
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
	coreRefs := []rupLocaleTextTranslationRef{{value: &updateReq.Name}}
	if updateReq.ExplorationNote != nil {
		coreRefs = append(
			coreRefs,
			rupLocaleTextTranslationRef{value: &updateReq.ExplorationNote.Prerequisites},
			rupLocaleTextTranslationRef{value: &updateReq.ExplorationNote.Postrequisites},
		)
	}
	if err := s.translateLocaleTexts(ctx, coreRefs, sourceLanguage, targetLanguage, overwriteTarget); err != nil {
		fail("translate_core", 2, err)
		return
	}

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "translate_exploration", 3, totalStages)
	if updateReq.ExplorationNote != nil {
		explorationRefs := []rupLocaleTextTranslationRef{
			{value: &updateReq.ExplorationNote.Basis},
			{value: &updateReq.ExplorationNote.Goals},
			{value: &updateReq.ExplorationNote.Competencies},
		}
		if err := s.translateLocaleTexts(ctx, explorationRefs, sourceLanguage, targetLanguage, overwriteTarget); err != nil {
			fail("translate_exploration", 3, err)
			return
		}
	}

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "translate_resources", 4, totalStages)
	if updateReq.ExplorationNote != nil {
		resourceRefs := make([]rupLocaleTextTranslationRef, 0, len(updateReq.ExplorationNote.InternetResources)+len(updateReq.ExplorationNote.TechnicalResources))
		for i := range updateReq.ExplorationNote.InternetResources {
			if updateReq.ExplorationNote.InternetResources[i] == nil {
				continue
			}
			resourceRefs = append(resourceRefs, rupLocaleTextTranslationRef{value: &updateReq.ExplorationNote.InternetResources[i].Name})
		}

		for i := range updateReq.ExplorationNote.TechnicalResources {
			if updateReq.ExplorationNote.TechnicalResources[i] == nil {
				continue
			}
			resourceRefs = append(resourceRefs, rupLocaleTextTranslationRef{value: &updateReq.ExplorationNote.TechnicalResources[i].Name})
		}

		if err := s.translateLocaleTexts(ctx, resourceRefs, sourceLanguage, targetLanguage, overwriteTarget); err != nil {
			fail("translate_resources", 4, err)
			return
		}
	}

	s.updateLanguageGenerationProgress(rupID, sourceLanguage, targetLanguage, "translate_disciplines_and_topics", 5, totalStages)
	disciplineRefs := make([]rupLocaleTextTranslationRef, 0)
	for i := range updateReq.Disciplines {
		if updateReq.Disciplines[i] == nil {
			continue
		}

		disciplineRefs = append(disciplineRefs, rupLocaleTextTranslationRef{value: &updateReq.Disciplines[i].Name})

		for j := range updateReq.Disciplines[i].Topics {
			if updateReq.Disciplines[i].Topics[j] == nil {
				continue
			}

			disciplineRefs = append(disciplineRefs, rupLocaleTextTranslationRef{value: &updateReq.Disciplines[i].Topics[j].Name})
		}
	}
	if err := s.translateLocaleTexts(ctx, disciplineRefs, sourceLanguage, targetLanguage, overwriteTarget); err != nil {
		fail("translate_disciplines_and_topics", 5, err)
		return
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
		Type:      normalizeRupTypeValue(rup.Type),
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
			Competencies:       localePointerOrEmpty(rup.ExplorationNote.Competencies),
			Prerequisites:      localePointerOrEmpty(rup.ExplorationNote.Prerequisites),
			Postrequisites:     localePointerOrEmpty(rup.ExplorationNote.Postrequisites),
			InternetResources:  internetResources,
			TechnicalResources: technicalResources,
		},
		Disciplines: disciplines,
	}
}
