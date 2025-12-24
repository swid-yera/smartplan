package service

import (
	"context"
	"fmt"

	"eduplan/backend/pkg/repository"
	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type RupService interface {
	CreateRup(ctx context.Context, req CreateRupRequest) (*storage.Rup, error)
	GetRupByID(ctx context.Context, id uuid.UUID) (*storage.Rup, error)
	GetAllRups(ctx context.Context) ([]storage.Rup, error)
	UpdateRupStatus(ctx context.Context, id uuid.UUID, status string, reason string) error
	GetRupsByMethodist(ctx context.Context, methodistID uuid.UUID) ([]storage.Rup, error)
	DeleteRup(ctx context.Context, id uuid.UUID) error
}

type CreateRupRequest struct {
	Name      string `json:"name"`
	Code      string `json:"code"`
	Type      string `json:"type"`
	StudyYear string `json:"studyYear"`
	Course    int32  `json:"course"`
	StudyForm string `json:"studyForm"`
	Methodist string `json:"methodist"`
	Teacher   string `json:"teacher"`
}

type rupService struct {
	repo repository.RupRepository
}

func NewRupService(repo repository.RupRepository) RupService {
	return &rupService{repo: repo}
}

func (s *rupService) CreateRup(ctx context.Context, req CreateRupRequest) (*storage.Rup, error) {
	// Валидация
	if err := s.validateCreateRupRequest(req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Преобразование в параметры для repository
	params := s.convertToCreateParams(req)

	// Создание RUP
	rup, err := s.repo.CreateRup(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create rup failed: %w", err)
	}

	return rup, nil
}

func (s *rupService) GetRupByID(ctx context.Context, id uuid.UUID) (*storage.Rup, error) {
	return s.repo.GetRupByID(ctx, id)
}

func (s *rupService) GetAllRups(ctx context.Context) ([]storage.Rup, error) {
	return s.repo.GetAllRups(ctx)
}

func (s *rupService) UpdateRupStatus(ctx context.Context, id uuid.UUID, status string, reason string) error {
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

	var reasonText pgtype.Text
	if reason != "" {
		reasonText = pgtype.Text{String: reason, Valid: true}
	}

	return s.repo.UpdateRupStatus(ctx, id, rupStatus, reasonText)
}

func (s *rupService) GetRupsByMethodist(ctx context.Context, methodistID uuid.UUID) ([]storage.Rup, error) {
	methodistUUID := pgtype.UUID{Bytes: methodistID, Valid: true}
	return s.repo.GetRupsByMethodist(ctx, methodistUUID)
}

func (s *rupService) DeleteRup(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteRup(ctx, id)
}

func (s *rupService) validateCreateRupRequest(req CreateRupRequest) error {
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
	return nil
}

func (s *rupService) convertToCreateParams(req CreateRupRequest) storage.CreateRupsParams {
	var methodistUUID pgtype.UUID
	var teacherUUID pgtype.UUID

	if req.Methodist != "" {
		if id, err := uuid.Parse(req.Methodist); err == nil {
			methodistUUID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}

	if req.Teacher != "" {
		if id, err := uuid.Parse(req.Teacher); err == nil {
			teacherUUID = pgtype.UUID{Bytes: id, Valid: true}
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
		Name:      req.Name,
		Status:    storage.RupsStatusDRAFT,
		Course:    req.Course,
		StudyForm: studyForm,
		StudyYear: req.StudyYear,
		Type:      rupType,
		Methodist: methodistUUID,
		Teacher:   teacherUUID,
	}
}
