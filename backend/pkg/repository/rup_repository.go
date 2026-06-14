package repository

import (
	"context"
	"fmt"
	"time"

	storage "eduplan/backend/pkg/sqlc/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type RupRepository interface {
	WithTransaction(ctx context.Context, fn func(txRepo RupRepository) error) error

	CreateRup(ctx context.Context, params storage.CreateRupsParams) (*storage.Rup, error)
	GetRupByID(ctx context.Context, id uuid.UUID) (*storage.Rup, error)
	UpdateRupStatus(ctx context.Context, id uuid.UUID, status storage.RupsStatus, reason pgtype.Text, methodistID pgtype.UUID) error
	UpdateRup(ctx context.Context, params storage.UpdateRupParams) (*storage.Rup, error)
	DeleteRup(ctx context.Context, id uuid.UUID) error
	CreateRupSignatureArtifact(ctx context.Context, artifact RupSignatureArtifact) (*RupSignatureArtifact, error)
	GetLatestRupSignatureArtifact(ctx context.Context, rupID uuid.UUID) (*RupSignatureArtifact, error)
	GetRupSignatureArtifactByUnique(ctx context.Context, rupID uuid.UUID, documentHash string, keyID uuid.UUID, userID uuid.UUID, signature string) (*RupSignatureArtifact, error)

	CreateExplorationNote(ctx context.Context, params storage.CreateRupExplorationNoteParams) (*storage.RupExplorationNote, error)
	CreateResource(ctx context.Context, params storage.CreateRupResourceParams) (*storage.RupResource, error)
	DeleteResource(ctx context.Context, id uuid.UUID) error
	CreateDiscipline(ctx context.Context, params storage.CreateRupDisciplineParams) (*storage.RupDiscipline, error)
	CreateSemester(ctx context.Context, params storage.CreateDisciplineSemesterParams) (*storage.DisciplineSemester, error)
	CreateTopic(ctx context.Context, params storage.CreateDisciplineTopicParams) (*storage.DisciplineTopic, error)

	GetUserByID(ctx context.Context, id uuid.UUID) (*storage.User, error)
	GetGroupByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.Group, error)
	GetExplorationNoteByID(ctx context.Context, id uuid.UUID) (*storage.RupExplorationNote, error)
	GetDisciplineByID(ctx context.Context, id uuid.UUID) (*storage.RupDiscipline, error)
	GetDisciplineByTopicID(ctx context.Context, topicID uuid.UUID) (*storage.RupDiscipline, error)
	GetResourceByID(ctx context.Context, id uuid.UUID) (*storage.RupResource, error)
	GetSemesterByID(ctx context.Context, id uuid.UUID) (*storage.DisciplineSemester, error)
	GetTopicByID(ctx context.Context, id uuid.UUID) (*storage.DisciplineTopic, error)
	GetTopicByLessonID(ctx context.Context, lessonID uuid.UUID) (*storage.DisciplineTopic, error)
	GetRupByDisciplineID(ctx context.Context, disciplineID uuid.UUID) (*storage.Rup, error)
	UpdateTopic(ctx context.Context, params storage.UpdateDisciplineTopicParams) error
	LinkLessonToTopic(ctx context.Context, topicID uuid.UUID, lessonID *uuid.UUID) error

	// Batch lookups — устраняют N+1
	GetUsersByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.User, error)
	GetResourcesByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.RupResource, error)
	GetDisciplinesByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.RupDiscipline, error)
	GetSemestersByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.DisciplineSemester, error)
	GetTopicsByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.DisciplineTopic, error)
	GetGroupsByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.Group, error)

	CountRupsFiltered(ctx context.Context, name string, teacher pgtype.UUID, methodist pgtype.UUID, status []string) (int64, error)
	GetRupsPaginated(ctx context.Context, limit int32, offset int32, search string, sort string, teacher pgtype.UUID, methodist pgtype.UUID, status []string) ([]storage.Rup, error)
	CountRups(ctx context.Context) (int64, error)
}

type RupSignatureArtifact struct {
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

type RupPostgres struct {
	queries *storage.Queries
	db      storage.DBTX
	pool    interface {
		Begin(ctx context.Context) (pgx.Tx, error)
	}
}

func NewRupPostgres(queries *storage.Queries, pool ...storage.DBTX) *RupPostgres {
	r := &RupPostgres{queries: queries}
	if len(pool) > 0 {
		r.db = pool[0]
		if p, ok := pool[0].(interface {
			Begin(ctx context.Context) (pgx.Tx, error)
		}); ok {
			r.pool = p
		}
	}
	return r
}

// WithTransaction выполняет fn внутри одной транзакции.
// При ошибке делает rollback, при успехе — commit.
func (r *RupPostgres) WithTransaction(ctx context.Context, fn func(txRepo RupRepository) error) error {
	if r.pool == nil {
		return fmt.Errorf("transaction support not configured: pool is nil")
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}

	txRepo := &RupPostgres{queries: r.queries.WithTx(tx)}
	if r.db != nil {
		txRepo.db = tx
	}

	if err = fn(txRepo); err != nil {
		_ = tx.Rollback(ctx)
		return err
	}

	return tx.Commit(ctx)
}

func (r *RupPostgres) CreateRup(ctx context.Context, params storage.CreateRupsParams) (*storage.Rup, error) {
	rup, err := r.queries.CreateRups(ctx, params)
	if err != nil {
		return nil, err
	}
	return &rup, nil
}

func (r *RupPostgres) GetRupByID(ctx context.Context, id uuid.UUID) (*storage.Rup, error) {
	rup, err := r.queries.GetRupsByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &rup, nil
}

func (r *RupPostgres) GetAllRups(ctx context.Context, limit int32, offset int32) ([]storage.Rup, error) {
	return r.queries.GetAllRups(ctx, storage.GetAllRupsParams{
		Limit:  limit,
		Offset: offset,
	})
}

func (r *RupPostgres) UpdateRupStatus(ctx context.Context, id uuid.UUID, status storage.RupsStatus, reason pgtype.Text, methodistID pgtype.UUID) error {
	return r.queries.UpdateRupsStatus(ctx, storage.UpdateRupsStatusParams{
		ID:        id,
		Status:    status,
		Reason:    reason,
		Methodist: methodistID,
	})
}

func (r *RupPostgres) UpdateRup(ctx context.Context, params storage.UpdateRupParams) (*storage.Rup, error) {
	err := r.queries.UpdateRup(ctx, params)
	if err != nil {
		return nil, err
	}
	rup, err := r.queries.GetRupsByID(ctx, params.ID)
	return &rup, nil
}

func (r *RupPostgres) GetRupsByMethodist(ctx context.Context, methodist pgtype.UUID) ([]storage.Rup, error) {
	return r.queries.GetRupsByMethodist(ctx, methodist)
}

func (r *RupPostgres) GetRupsByTeacher(ctx context.Context, teacher pgtype.UUID) ([]storage.Rup, error) {
	if !teacher.Valid {
		return []storage.Rup{}, nil
	}
	return r.queries.GetRupsByTeacher(ctx, teacher.Bytes)
}

func (r *RupPostgres) DeleteRup(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteRup(ctx, id)
}

func (r *RupPostgres) CreateRupSignatureArtifact(ctx context.Context, artifact RupSignatureArtifact) (*RupSignatureArtifact, error) {
	if r.db == nil {
		return nil, fmt.Errorf("signature artifact db is not configured")
	}

	query := `
		INSERT INTO rup_signature_artifacts (
			rup_id,
			document_id,
			document_version,
			document_hash,
			key_id,
			user_id,
			signature,
			signer_name,
			signer_role,
			signature_id,
			verification_url,
			qr_svg
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		ON CONFLICT (rup_id, document_hash, key_id, user_id, signature)
		DO UPDATE SET
			updated_at = NOW()
		RETURNING id, rup_id, document_id, document_version, document_hash, key_id, user_id, signature, signer_name, signer_role, signature_id, verification_url, qr_svg, created_at, updated_at
	`

	row := r.db.QueryRow(ctx, query,
		artifact.RupID,
		artifact.DocumentID,
		artifact.DocumentVersion,
		artifact.DocumentHash,
		artifact.KeyID,
		artifact.UserID,
		artifact.Signature,
		artifact.SignerName,
		artifact.SignerRole,
		artifact.SignatureID,
		artifact.VerificationURL,
		artifact.QRSvg,
	)

	return scanRupSignatureArtifact(row)
}

func (r *RupPostgres) GetLatestRupSignatureArtifact(ctx context.Context, rupID uuid.UUID) (*RupSignatureArtifact, error) {
	if r.db == nil {
		return nil, fmt.Errorf("signature artifact db is not configured")
	}

	row := r.db.QueryRow(ctx, `
		SELECT id, rup_id, document_id, document_version, document_hash, key_id, user_id, signature, signer_name, signer_role, signature_id, verification_url, qr_svg, created_at, updated_at
		FROM rup_signature_artifacts
		WHERE rup_id = $1
		ORDER BY created_at DESC, document_version DESC
		LIMIT 1
	`, rupID)

	return scanRupSignatureArtifact(row)
}

func (r *RupPostgres) GetRupSignatureArtifactByUnique(ctx context.Context, rupID uuid.UUID, documentHash string, keyID uuid.UUID, userID uuid.UUID, signature string) (*RupSignatureArtifact, error) {
	if r.db == nil {
		return nil, fmt.Errorf("signature artifact db is not configured")
	}

	row := r.db.QueryRow(ctx, `
		SELECT id, rup_id, document_id, document_version, document_hash, key_id, user_id, signature, signer_name, signer_role, signature_id, verification_url, qr_svg, created_at, updated_at
		FROM rup_signature_artifacts
		WHERE rup_id = $1 AND document_hash = $2 AND key_id = $3 AND user_id = $4 AND signature = $5
		LIMIT 1
	`, rupID, documentHash, keyID, userID, signature)

	return scanRupSignatureArtifact(row)
}

func (r *RupPostgres) CreateExplorationNote(ctx context.Context, params storage.CreateRupExplorationNoteParams) (*storage.RupExplorationNote, error) {
	note, err := r.queries.CreateRupExplorationNote(ctx, params)
	if err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *RupPostgres) CreateResource(ctx context.Context, params storage.CreateRupResourceParams) (*storage.RupResource, error) {
	resource, err := r.queries.CreateRupResource(ctx, params)
	if err != nil {
		return nil, err
	}
	return &resource, nil
}

func (r *RupPostgres) DeleteResource(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteRupResource(ctx, id)
}

func (r *RupPostgres) CreateDiscipline(ctx context.Context, params storage.CreateRupDisciplineParams) (*storage.RupDiscipline, error) {
	discipline, err := r.queries.CreateRupDiscipline(ctx, params)
	if err != nil {
		return nil, err
	}
	return &discipline, nil
}

func (r *RupPostgres) CreateSemester(ctx context.Context, params storage.CreateDisciplineSemesterParams) (*storage.DisciplineSemester, error) {
	semester, err := r.queries.CreateDisciplineSemester(ctx, params)
	if err != nil {
		return nil, err
	}
	return &semester, nil
}

func (r *RupPostgres) CreateTopic(ctx context.Context, params storage.CreateDisciplineTopicParams) (*storage.DisciplineTopic, error) {
	topic, err := r.queries.CreateDisciplineTopic(ctx, params)
	if err != nil {
		return nil, err
	}
	return &topic, nil
}

func (r *RupPostgres) GetUserByID(ctx context.Context, id uuid.UUID) (*storage.User, error) {
	user, err := r.queries.GetUserByKeycloakID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *RupPostgres) GetGroupByKeycloakID(ctx context.Context, keycloakID uuid.UUID) (*storage.Group, error) {
	group, err := r.queries.GetGroupByKeycloakID(ctx, keycloakID)
	if err != nil {
		return nil, err
	}
	return &group, nil
}

func (r *RupPostgres) GetExplorationNoteByID(ctx context.Context, id uuid.UUID) (*storage.RupExplorationNote, error) {
	note, err := r.queries.GetRupExplorationNoteByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *RupPostgres) GetDisciplineByID(ctx context.Context, id uuid.UUID) (*storage.RupDiscipline, error) {
	discipline, err := r.queries.GetRupDisciplineByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &discipline, nil
}

func scanRupSignatureArtifact(row interface {
	Scan(dest ...any) error
}) (*RupSignatureArtifact, error) {
	var artifact RupSignatureArtifact
	if err := row.Scan(
		&artifact.ID,
		&artifact.RupID,
		&artifact.DocumentID,
		&artifact.DocumentVersion,
		&artifact.DocumentHash,
		&artifact.KeyID,
		&artifact.UserID,
		&artifact.Signature,
		&artifact.SignerName,
		&artifact.SignerRole,
		&artifact.SignatureID,
		&artifact.VerificationURL,
		&artifact.QRSvg,
		&artifact.CreatedAt,
		&artifact.UpdatedAt,
	); err != nil {
		return nil, err
	}

	return &artifact, nil
}

func (r *RupPostgres) GetDisciplineByTopicID(ctx context.Context, topicID uuid.UUID) (*storage.RupDiscipline, error) {
	discipline, err := r.queries.GetRupDisciplineByTopicID(ctx, topicID)
	if err != nil {
		return nil, err
	}
	return &discipline, nil
}

func (r *RupPostgres) GetResourceByID(ctx context.Context, id uuid.UUID) (*storage.RupResource, error) {
	resource, err := r.queries.GetRupResourceByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &resource, nil
}

func (r *RupPostgres) GetSemesterByID(ctx context.Context, id uuid.UUID) (*storage.DisciplineSemester, error) {
	semester, err := r.queries.GetDisciplineSemesterByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &semester, nil
}

func (r *RupPostgres) GetTopicByID(ctx context.Context, id uuid.UUID) (*storage.DisciplineTopic, error) {
	topic, err := r.queries.GetDisciplineTopicByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &topic, nil
}

func (r *RupPostgres) GetTopicByLessonID(ctx context.Context, lessonID uuid.UUID) (*storage.DisciplineTopic, error) {
	topic, err := r.queries.GetDisciplineTopicByLessonID(ctx, pgtype.UUID{
		Bytes: lessonID,
		Valid: true,
	})
	if err != nil {
		return nil, err
	}
	return &topic, nil
}

func (r *RupPostgres) GetRupByDisciplineID(ctx context.Context, disciplineID uuid.UUID) (*storage.Rup, error) {
	rup, err := r.queries.GetRupByDisciplineID(ctx, disciplineID)
	if err != nil {
		return nil, err
	}
	return &rup, nil
}

func (r *RupPostgres) UpdateTopic(ctx context.Context, params storage.UpdateDisciplineTopicParams) error {
	return r.queries.UpdateDisciplineTopic(ctx, params)
}

func (r *RupPostgres) LinkLessonToTopic(ctx context.Context, topicID uuid.UUID, lessonID *uuid.UUID) error {
	var lessonUUID pgtype.UUID
	if lessonID != nil {
		lessonUUID = pgtype.UUID{Bytes: *lessonID, Valid: true}
	}

	return r.queries.LinkLessonToDisciplineTopic(ctx, storage.LinkLessonToDisciplineTopicParams{
		ID:       topicID,
		LessonID: lessonUUID,
	})
}

func (r *RupPostgres) CountRups(ctx context.Context) (int64, error) {
	return r.queries.CountRups(ctx)
}

func (r *RupPostgres) GetRupsPaginated(ctx context.Context, limit int32, offset int32, search string, sort string, teacher pgtype.UUID, methodist pgtype.UUID, status []string) ([]storage.Rup, error) {
	return r.queries.GetRupsPaginated(ctx, storage.GetRupsPaginatedParams{
		Search:    search,
		Status:    status,
		Sort:      sort,
		Offset:    offset,
		Limit:     limit,
		Teacher:   teacher,
		Methodist: methodist,
	})
}

func (r *RupPostgres) CountRupsFiltered(ctx context.Context, search string, teacher pgtype.UUID, methodist pgtype.UUID, status []string) (int64, error) {
	return r.queries.CountRupsFiltered(ctx, storage.CountRupsFilteredParams{
		Search:    search,
		Status:    status,
		Teacher:   teacher,
		Methodist: methodist,
	})
}

// GetUsersByIDs — batch загрузка пользователей по списку ID
func (r *RupPostgres) GetUsersByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.User, error) {
	return r.queries.GetUsersByIDs(ctx, ids)
}

// GetResourcesByIDs — batch загрузка ресурсов по списку ID
func (r *RupPostgres) GetResourcesByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.RupResource, error) {
	return r.queries.GetResourcesByIDs(ctx, ids)
}

// GetDisciplinesByIDs — batch загрузка дисциплин по списку ID
func (r *RupPostgres) GetDisciplinesByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.RupDiscipline, error) {
	return r.queries.GetDisciplinesByIDs(ctx, ids)
}

// GetSemestersByIDs — batch загрузка семестров по списку ID
func (r *RupPostgres) GetSemestersByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.DisciplineSemester, error) {
	return r.queries.GetSemestersByIDs(ctx, ids)
}

// GetTopicsByIDs — batch загрузка топиков по списку ID
func (r *RupPostgres) GetTopicsByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.DisciplineTopic, error) {
	return r.queries.GetTopicsByIDs(ctx, ids)
}

// GetGroupsByIDs — batch загрузка групп по списку ID
func (r *RupPostgres) GetGroupsByIDs(ctx context.Context, ids []uuid.UUID) ([]storage.Group, error) {
	return r.queries.GetGroupsByIDs(ctx, ids)
}
