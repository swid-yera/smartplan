package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"time"

	"eduplan/backend/config"
	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type RupService interface {
	CreateRup(ctx context.Context, req CreateRupRequest) (*RupResponse, error)
	GetRupByID(ctx context.Context, id uuid.UUID) (*RupResponse, error)
	GetAllRups(ctx context.Context, limit int32, offset int32) ([]*ListAllRupsResponse, error)
	UpdateRupStatus(ctx context.Context, id uuid.UUID, status string, reason string, methodistID uuid.UUID) error
	UpdateRup(ctx context.Context, id uuid.UUID, req CreateRupRequest) (*RupResponse, error)
	GetRupsByMethodist(ctx context.Context, methodistID uuid.UUID) ([]*RupResponse, error)
	GetRupsByTeacher(ctx context.Context, teacherID uuid.UUID) ([]*RupResponse, error)
	DeleteRup(ctx context.Context, id uuid.UUID) error
	GetRupDownloadURL(ctx context.Context, id uuid.UUID) (string, error)
	GetRupPaginated(ctx context.Context, currentPage int, pageSize int, search string) (*PaginatedRupsResponse, error)
	CountRups(ctx context.Context) (int64, error)
}

type PaginatedRupsResponse struct {
	Data []*ListAllRupsResponse `json:"data"`
	Meta PaginationMeta         `json:"meta"`
}

type CreateRupRequest struct {
	Name            string                  `json:"name"`
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

type Rup struct {
	Name            string                  `json:"name"`
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
	Basis              string             `json:"basis"`
	Goals              string             `json:"goals"`
	Summary            string             `json:"summary"`
	Competencies       string             `json:"competencies"`
	Prerequisites      string             `json:"prerequisites"`
	Postrequisites     string             `json:"postrequisites"`
	InternetResources  []*ResourceRequest `json:"internetResources"`
	TechnicalResources []*ResourceRequest `json:"technicalResources"`
}

type ResourceRequest struct {
	Name string `json:"name"`
	Link string `json:"link"`
}

type DisciplineRequest struct {
	Name      string             `json:"name"`
	Semesters []*SemesterRequest `json:"semesters"`
	Topics    []*TopicRequest    `json:"topics"`
}

type SemesterRequest struct {
	Semester   int32 `json:"semester"`
	TotalHours int32 `json:"totalHours"`
}

type TopicRequest struct {
	Name            string `json:"name"`
	Type            string `json:"type"`
	TheoryHours     int32  `json:"theoryHours"`
	PracticeHours   int32  `json:"practiceHours"`
	IndividualHours int32  `json:"individualHours"`
	SrspHours       int32  `json:"srspHours"`
	SrsHours        int32  `json:"srsHours"`
}

type RupResponse struct {
	ID              uuid.UUID               `json:"id"`
	Name            string                  `json:"name"`
	Status          string                  `json:"status"`
	Reason          string                  `json:"reason"`
	Course          int32                   `json:"course"`
	StudyForm       string                  `json:"studyForm"`
	StudyYear       string                  `json:"studyYear"`
	Type            string                  `json:"type"`
	TotalHours      int32                   `json:"totalHours"`
	Contacts        []*UserResponse         `json:"contacts"`
	Groups          []*GroupResponse        `json:"groups"`
	Methodist       *UserResponse           `json:"methodist"`
	Teacher         *UserResponse           `json:"teacher"`
	ExplorationNote ExplorationNoteResponse `json:"explorationNote"`
	Disciplines     []*DisciplineResponse   `json:"disciplines"`
	CreatedAt       time.Time               `json:"createdAt"`
	UpdatedAt       time.Time               `json:"updatedAt"`
}

type RupDocumentPayload struct {
	ID              uuid.UUID               `json:"id"`
	Name            string                  `json:"name"`
	Course          int32                   `json:"course"`
	StudyForm       string                  `json:"studyForm"`
	StudyYear       string                  `json:"studyYear"`
	Type            string                  `json:"type"`
	TotalHours      int32                   `json:"totalHours"`
	Contacts        []*UserResponse         `json:"contacts"`
	Group           *GroupResponse          `json:"group"`
	ExplorationNote ExplorationNoteResponse `json:"explorationNote"`
	Disciplines     []*DisciplineResponse   `json:"disciplines"`
}

type ListAllRupsResponse struct {
	ID         uuid.UUID        `json:"id"`
	Name       string           `json:"name"`
	Status     string           `json:"status"`
	Reason     string           `json:"reason"`
	Course     int32            `json:"course"`
	StudyForm  string           `json:"studyForm"`
	StudyYear  string           `json:"studyYear"`
	Type       string           `json:"type"`
	TotalHours int32            `json:"totalHours"`
	Groups     []*GroupResponse `json:"groups"`
	Methodist  *UserResponse    `json:"methodist"`
	Teacher    *UserResponse    `json:"teacher"`
	CreatedAt  time.Time        `json:"createdAt"`
	UpdatedAt  time.Time        `json:"updatedAt"`
}

type GroupResponse struct {
	KeycloakID    uuid.UUID `json:"keycloakId"`
	Name          string    `json:"name"`
	Qualification string    `json:"qualification"`
	Specialty     string    `json:"specialty"`
}

type ExplorationNoteResponse struct {
	ID                 uuid.UUID           `json:"id"`
	Basis              string              `json:"basis"`
	Goals              string              `json:"goals"`
	Summary            string              `json:"summary"`
	Competencies       string              `json:"competencies"`
	Prerequisites      string              `json:"prerequisites"`
	Postrequisites     string              `json:"postrequisites"`
	InternetResources  []*ResourceResponse `json:"internetResources"`
	TechnicalResources []*ResourceResponse `json:"technicalResources"`
}

type ResourceResponse struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Link string    `json:"link"`
	Type string    `json:"type"`
}

type DisciplineResponse struct {
	ID         uuid.UUID           `json:"id"`
	Name       string              `json:"name"`
	TotalHours int32               `json:"totalHours"`
	Semesters  []*SemesterResponse `json:"semesters"`
	Topics     []*TopicResponse    `json:"topics"`
	CreatedAt  time.Time           `json:"createdAt"`
	UpdatedAt  time.Time           `json:"updatedAt"`
}

type SemesterResponse struct {
	ID         uuid.UUID `json:"id"`
	Semester   int32     `json:"semester"`
	TotalHours int32     `json:"totalHours"`
}

type TopicResponse struct {
	ID              uuid.UUID                   `json:"id"`
	Name            string                      `json:"name"`
	Type            storage.DisciplineTopicType `json:"type"`
	TotalHours      int32                       `json:"totalHours"`
	TheoryHours     int32                       `json:"theoryHours"`
	PracticeHours   int32                       `json:"practiceHours"`
	IndividualHours int32                       `json:"individualHours"`
	SrspHours       int32                       `json:"srspHours"`
	SrsHours        int32                       `json:"srsHours"`
}

type rupService struct {
	repo        repository.RupRepository
	cfg         *config.DocumentRenderConfig
	httpClient  *http.Client
	fileStorage FileStorage
}

type GetRupsInput struct {
	Search string
	Page   int
	Limit  int

	UserID uuid.UUID
	Role   string // teacher | methodist | admin
}

func NewRupService(repo repository.RupRepository, cfg *config.DocumentRenderConfig, httpClient *http.Client, fileStorage FileStorage) RupService {
	return &rupService{
		repo:        repo,
		cfg:         cfg,
		httpClient:  httpClient,
		fileStorage: fileStorage,
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

	return response, nil
}

func (s *rupService) GetRupByID(ctx context.Context, id uuid.UUID) (*RupResponse, error) {
	rup, err := s.repo.GetRupByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return s.buildRupResponse(ctx, *rup)
}

func (s *rupService) GetAllRups(ctx context.Context, limit int32, offset int32) ([]*ListAllRupsResponse, error) {
	rups, err := s.repo.GetAllRups(ctx, limit, offset)
	if err != nil {
		return nil, err
	}

	responses := make([]*ListAllRupsResponse, 0, len(rups))

	for _, rup := range rups {
		resp, err := s.buildListAllRupsResponse(ctx, rup)
		if err != nil {
			continue
		}
		responses = append(responses, resp)
	}

	return responses, nil
}

func (s *rupService) UpdateRupStatus(
	ctx context.Context,
	id uuid.UUID,
	status string,
	reason string,
	methodistID uuid.UUID,
) error {

	var rupStatus storage.RupsStatus
	switch status {
	case "DRAFT":
		rupStatus = storage.RupsStatusDRAFT
	case "IN_REVIEW":
		rupStatus = storage.RupsStatusINREVIEW
	case "APPROVED":
		rupStatus = storage.RupsStatusAPPROVED
	case "REJECTED":
		rupStatus = storage.RupsStatusREJECTED
	default:
		return fmt.Errorf("invalid status: %s", status)
	}

	// 1. если APPROVED — генерируем документ
	if rupStatus == storage.RupsStatusAPPROVED {
		fileBytes, err := s.generateViaPython(ctx, id)
		if err != nil {
			return err
		}

		reader := bytes.NewReader(fileBytes)

		objectName := fmt.Sprintf("rups/%s/document.docx", id.String())

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

	// 3. reason
	var reasonText pgtype.Text
	if reason != "" {
		reasonText = pgtype.Text{String: reason, Valid: true}
	}

	methodistUUID := pgtype.UUID{
		Bytes: methodistID,
		Valid: methodistID != uuid.Nil,
	}
	_, err := s.repo.GetUserByID(ctx, methodistID)
	if err != nil {
		return err
	}

	// 4. обновляем статус в БД
	return s.repo.UpdateRupStatus(ctx, id, rupStatus, reasonText, methodistUUID)
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
	params := s.convertToUpdateParams(id, req, existingRup.Status, explorationNoteID, disciplineIDs, totalHours)

	// 5. Update RUP
	updatedRup, err := s.repo.UpdateRup(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("update rup failed: %w", err)
	}

	return s.buildRupResponse(ctx, *updatedRup)
}

func (s *rupService) generateViaPython(ctx context.Context, id uuid.UUID) ([]byte, error) {

	// 1. забираем ВСЮ модель из БД
	rup, err := s.GetRupByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// 2. строим payload
	payload := buildPayload(rup)

	// 3. JSON
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	// 4. HTTP → Python
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		s.cfg.Url+"/generate-rup",
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Request-ID", uuid.NewString())

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("python error: %s", string(errBody))
	}

	// 5. читаем файл
	fileBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return fileBytes, nil
}

func buildPayload(rup *RupResponse) RupDocumentPayload {

	// ---------- GROUP (один!) ----------
	group := GroupResponse{}
	if len(rup.Groups) > 0 {
		group = GroupResponse{
			Name:          rup.Groups[0].Name,
			Specialty:     rup.Groups[0].Specialty,
			Qualification: rup.Groups[0].Qualification,
			KeycloakID:    rup.Groups[0].KeycloakID,
		}
	}

	// ---------- CONTACTS ----------
	contacts := []*UserResponse{}
	for _, c := range rup.Contacts {
		contacts = append(contacts, &UserResponse{
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
	exploration := ExplorationNoteResponse{}
	en := rup.ExplorationNote

	exploration.Basis = en.Basis
	exploration.Goals = en.Goals
	exploration.Competencies = en.Competencies
	exploration.Prerequisites = en.Prerequisites
	exploration.Postrequisites = en.Postrequisites

	internet := []*ResourceResponse{}
	for _, r := range en.InternetResources {
		internet = append(internet, &ResourceResponse{
			Name: r.Name,
			Link: r.Link,
		})
	}

	technical := []*ResourceResponse{}
	for _, r := range en.TechnicalResources {
		technical = append(technical, &ResourceResponse{
			Name: r.Name,
			Link: r.Link,
		})
	}

	exploration.InternetResources = internet
	exploration.TechnicalResources = technical

	return RupDocumentPayload{
		ID:              rup.ID,
		Name:            rup.Name,
		Type:            rup.Type,
		StudyForm:       rup.StudyForm,
		StudyYear:       rup.StudyYear,
		Group:           &group,
		Course:          rup.Course,
		TotalHours:      rup.TotalHours,
		Contacts:        contacts,
		Disciplines:     disciplines,
		ExplorationNote: exploration,
	}
}

func (s *rupService) GetRupDownloadURL(ctx context.Context, id uuid.UUID) (string, error) {

	objectName := fmt.Sprintf(
		"rups/%s/document.docx",
		id.String(),
	)

	return s.fileStorage.GetDownloadFileURL(
		ctx,
		objectName,
		10*time.Minute,
	)
}

func (s *rupService) GetRupsByMethodist(ctx context.Context, methodistID uuid.UUID) ([]*RupResponse, error) {
	methodistUUID := pgtype.UUID{Bytes: methodistID, Valid: true}
	rups, err := s.repo.GetRupsByMethodist(ctx, methodistUUID)
	if err != nil {
		return nil, err
	}

	// if empty, len will be 0, json return [] not null
	responses := make([]*RupResponse, 0, len(rups))

	for _, rup := range rups {
		response, err := s.buildRupResponse(ctx, rup)
		if err != nil {
			continue // Skip failed conversions
		}
		responses = append(responses, response)
	}

	return responses, nil
}

func (s *rupService) GetRupsByTeacher(ctx context.Context, teacherID uuid.UUID) ([]*RupResponse, error) {
	teacherUUID := pgtype.UUID{Bytes: teacherID, Valid: true}
	rups, err := s.repo.GetRupsByTeacher(ctx, teacherUUID)
	if err != nil {
		return nil, err
	}

	// if empty, len will be 0, json return [] not null
	responses := make([]*RupResponse, 0, len(rups))

	for _, rup := range rups {
		response, err := s.buildRupResponse(ctx, rup)
		if err != nil {
			continue // Skip failed conversions
		}
		responses = append(responses, response)
	}

	return responses, nil
}

func (s *rupService) DeleteRup(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteRup(ctx, id)
}

func (s *rupService) validateCreateRupRequest(ctx context.Context, req CreateRupRequest) error {
	fmt.Printf("Validating request: contacts=%v, groups=%v\n", req.Contacts, req.Groups)
	if req.Name == "" {
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

	var contacts []uuid.UUID
	for _, contactStr := range req.Contacts {
		if id, err := uuid.Parse(contactStr); err == nil {
			contacts = append(contacts, id)
		}
	}

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
		Name:              req.Name,
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

func (s *rupService) convertToUpdateParams(id uuid.UUID, req CreateRupRequest, status storage.RupsStatus, explorationNoteID *uuid.UUID, disciplineIDs []uuid.UUID, totalHours int32) storage.UpdateRupParams {
	var explorationNoteUUID pgtype.UUID

	if explorationNoteID != nil {
		explorationNoteUUID = pgtype.UUID{Bytes: *explorationNoteID, Valid: true}
	}

	var contacts []uuid.UUID
	for _, contactStr := range req.Contacts {
		if uid, err := uuid.Parse(contactStr); err == nil {
			contacts = append(contacts, uid)
		}
	}

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
		Name:              req.Name,
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

func (s *rupService) createExplorationNote(ctx context.Context, note *ExplorationNoteRequest) (*uuid.UUID, error) {
	if note == nil {
		return nil, nil
	}

	// Create internet resources
	var internetResourceIDs []uuid.UUID
	for _, res := range note.InternetResources {
		params := storage.CreateRupResourceParams{
			Name: res.Name,
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
			Name: res.Name,
			Link: pgtype.Text{String: res.Link, Valid: res.Link != ""},
		}
		resource, err := s.repo.CreateResource(ctx, params)
		if err != nil {
			return nil, err
		}
		technicalResourceIDs = append(technicalResourceIDs, resource.ID)
	}

	params := storage.CreateRupExplorationNoteParams{
		Basis:              pgtype.Text{String: note.Basis, Valid: note.Basis != ""},
		Goals:              pgtype.Text{String: note.Goals, Valid: note.Goals != ""},
		Summary:            pgtype.Text{String: note.Summary, Valid: note.Summary != ""},
		Competencies:       pgtype.Text{String: note.Competencies, Valid: note.Competencies != ""},
		Prerequisites:      pgtype.Text{String: note.Prerequisites, Valid: note.Prerequisites != ""},
		Postrequisites:     pgtype.Text{String: note.Postrequisites, Valid: note.Postrequisites != ""},
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
			Name:       disc.Name,
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

		TotalHours := topic.TheoryHours + topic.PracticeHours + topic.IndividualHours + topic.SrspHours + topic.SrsHours

		params := storage.CreateDisciplineTopicParams{
			Name:            topic.Name,
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
	var methodist *UserResponse
	if rup.Methodist.Valid {
		user, err := s.repo.GetUserByID(ctx, rup.Methodist.Bytes)
		if err == nil {
			methodist = convertToUserResponse(*user)
		}
	}

	// Get teacher
	var teacher *UserResponse
	if rup.Teacher.Valid {
		user, err := s.repo.GetUserByID(ctx, rup.Teacher.Bytes)
		if err == nil {
			teacher = convertToUserResponse(*user)
		}
	}

	return &ListAllRupsResponse{
		ID:         rup.ID,
		Name:       rup.Name,
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
	contacts := []*UserResponse{}
	for _, contactID := range rup.Contacts {
		user, err := s.repo.GetUserByID(ctx, contactID)
		if err != nil {
			continue // Skip if not found
		}
		contacts = append(contacts, convertToUserResponse(*user))
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
	var methodist *UserResponse
	if rup.Methodist.Valid {
		user, err := s.repo.GetUserByID(ctx, rup.Methodist.Bytes)
		if err == nil {
			methodist = convertToUserResponse(*user)
		}
	}

	// Get teacher
	var teacher *UserResponse
	if rup.Teacher.Valid {
		user, err := s.repo.GetUserByID(ctx, rup.Teacher.Bytes)
		if err == nil {
			teacher = convertToUserResponse(*user)
		}
	}

	// Get exploration note
	explorationNote := ExplorationNoteResponse{
		ID:                 uuid.Nil,
		Basis:              "",
		Goals:              "",
		Summary:            "",
		Competencies:       "",
		Prerequisites:      "",
		Postrequisites:     "",
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
		Name:            rup.Name,
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
		Qualification: group.Qualification.String,
		Specialty:     group.Specialty.String,
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
			Name: res.Name,
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
			Name: res.Name,
			Link: res.Link.String,
			Type: "TECHNICAL",
		})
	}

	return ExplorationNoteResponse{
		ID:                 note.ID,
		Basis:              note.Basis.String,
		Goals:              note.Goals.String,
		Summary:            note.Summary.String,
		Competencies:       note.Competencies.String,
		Prerequisites:      note.Prerequisites.String,
		Postrequisites:     note.Postrequisites.String,
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
			Name:            topic.Name,
			Type:            topic.Type,
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
		Name:       disc.Name,
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
) (*PaginatedRupsResponse, error) {

	if currentPage < 1 {
		currentPage = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (currentPage - 1) * pageSize

	total, err := s.repo.CountRupsFiltered(ctx, search)
	if err != nil {
		return nil, err
	}

	dbRups, err := s.repo.GetRupsPaginated(
		ctx,
		int32(pageSize),
		int32(offset),
		search,
	)
	if err != nil {
		return nil, err
	}

	rups := make([]*ListAllRupsResponse, 0, len(dbRups))
	for _, rup := range dbRups {

		resp, err := s.buildListAllRupsResponse(ctx, rup)
		if err != nil {
			continue
		}

		rups = append(rups, resp)
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
