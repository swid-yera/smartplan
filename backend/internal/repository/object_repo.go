package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"rup_database/internal/models"
)

type ObjectRepository interface {
	Create(ctx context.Context, input models.InnerCreateObjectDTO) (*models.Object, error)
	GetByID(ctx context.Context, id string) (*models.Object, error)
	List(ctx context.Context) ([]*models.Object, error)
	GetByStatus(ctx context.Context, status string) ([]*models.Object, error)
	Update(ctx context.Context, input models.InnerUpdateObjectDTO) (*models.Object, error)
	Delete(ctx context.Context, id string) error
}

type ObjectRepo struct {
	db *sql.DB
}

func NewObjectRepo(db *sql.DB) *ObjectRepo {
	return &ObjectRepo{db: db}
}

func (r *ObjectRepo) Create(ctx context.Context, input models.InnerCreateObjectDTO) (*models.Object, error) {
	query := `
	       INSERT INTO objects (title, status, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines)
	       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	       RETURNING id, title, status, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
	   `

	params := []interface{}{
		rawToJSONParam(input.Title),
		rawToJSONParam(input.Status),
		rawToJSONParam(input.Year),
		rawToJSONParam(input.Type),
		rawToJSONParam(input.Course),
		rawToJSONParam(input.StudyForm),
		rawToJSONParam(input.ExplorationNote),
		rawToJSONParam(input.Goals),
		rawToJSONParam(input.Prerequisites),
		rawToJSONParam(input.Postrequisites),
		rawToJSONParam(input.GroupID),
		rawToJSONParam(input.Contacts),
		rawToJSONParam(input.InternetResources),
		rawToJSONParam(input.TechnicalResources),
		rawToJSONParam(input.RupType),
		rawToJSONParam(input.Disciplines),
	}

	return scanObject(r.db.QueryRowContext(ctx, query, params...))
}

func (r *ObjectRepo) GetByID(ctx context.Context, id string) (*models.Object, error) {
	query := `
	       SELECT id, title, status, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
	       FROM objects
	       WHERE id = $1
	   `
	return scanObject(r.db.QueryRowContext(ctx, query, id))
}

func (r *ObjectRepo) List(ctx context.Context) ([]*models.Object, error) {
	query := `
	       SELECT id, title, status, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
	       FROM objects
	       ORDER BY created_at DESC
	   `

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []*models.Object{}
	for rows.Next() {
		obj, err := scanObject(rows)
		if err != nil {
			return nil, err
		}

		list = append(list, obj)
	}

	return list, rows.Err()
}

func (r *ObjectRepo) GetByStatus(ctx context.Context, status string) ([]*models.Object, error) {
	query := `
	       SELECT id, title, status, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
	       FROM objects
	       WHERE status = $1
	       ORDER BY created_at DESC
	   `

	param := rawToJSONParam(json.RawMessage(`"` + status + `"`))
	rows, err := r.db.QueryContext(ctx, query, param)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []*models.Object{}
	for rows.Next() {
		obj, err := scanObject(rows)
		if err != nil {
			return nil, err
		}

		list = append(list, obj)
	}

	return list, rows.Err()
}

func (r *ObjectRepo) Update(ctx context.Context, input models.InnerUpdateObjectDTO) (*models.Object, error) {
	query := `
	       UPDATE objects
	       SET title = $1, status = $2, year = $3, type = $4, course = $5, study_form = $6, exploration_note = $7, goals = $8, prerequisites = $9, postrequisites = $10, group_id = $11, contacts = $12, internet_resources = $13, technical_resources = $14, rup_type = $15, disciplines = $16, updated_at = NOW()
	       WHERE id = $17
	       RETURNING id, title, status, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
	   `

	id, err := rawID(input.ID)
	if err != nil {
		return nil, err
	}

	params := []interface{}{
		rawToJSONParam(input.Title),
		rawToJSONParam(input.Status),
		rawToJSONParam(input.Year),
		rawToJSONParam(input.Type),
		rawToJSONParam(input.Course),
		rawToJSONParam(input.StudyForm),
		rawToJSONParam(input.ExplorationNote),
		rawToJSONParam(input.Goals),
		rawToJSONParam(input.Prerequisites),
		rawToJSONParam(input.Postrequisites),
		rawToJSONParam(input.GroupID),
		rawToJSONParam(input.Contacts),
		rawToJSONParam(input.InternetResources),
		rawToJSONParam(input.TechnicalResources),
		rawToJSONParam(input.RupType),
		rawToJSONParam(input.Disciplines),
		id,
	}

	return scanObject(r.db.QueryRowContext(ctx, query, params...))
}

func (r *ObjectRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM objects WHERE id = $1`, id)
	return err
}

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func rawToJSONParam(raw json.RawMessage) interface{} {
	if len(raw) == 0 {
		return nil
	}
	return string(raw)
}

func rawID(raw json.RawMessage) (string, error) {
	if len(raw) == 0 {
		return "", errors.New("id is required")
	}

	var id string
	if err := json.Unmarshal(raw, &id); err != nil {
		return "", err
	}

	return id, nil
}

// scanObject reads DB jsonb fields as raw bytes, unmarshals them back into interfaces, and returns a ready Object.
func scanObject(scanner rowScanner) (*models.Object, error) {
	obj := &models.Object{}
	var title, status, year, typ, course, studyForm, explorationNote, goals, prerequisites, postrequisites, groupID, contacts, internetResources, technicalResources, rupType, disciplines []byte

	if err := scanner.Scan(&obj.ID, &title, &status, &year, &typ, &course, &studyForm, &explorationNote, &goals, &prerequisites, &postrequisites, &groupID, &contacts, &internetResources, &technicalResources, &rupType, &disciplines, &obj.CreatedAt, &obj.UpdatedAt); err != nil {
		return nil, err
	}

	obj.Title = unmarshalJSONField(title)
	obj.Status = unmarshalJSONField(status)
	obj.Year = unmarshalJSONField(year)
	obj.Type = unmarshalJSONField(typ)
	obj.Course = unmarshalJSONField(course)
	obj.StudyForm = unmarshalJSONField(studyForm)
	obj.ExplorationNote = unmarshalJSONField(explorationNote)
	obj.Goals = unmarshalJSONField(goals)
	obj.Prerequisites = unmarshalJSONField(prerequisites)
	obj.Postrequisites = unmarshalJSONField(postrequisites)
	obj.GroupID = unmarshalJSONField(groupID)
	obj.Contacts = unmarshalJSONField(contacts)
	obj.InternetResources = unmarshalJSONField(internetResources)
	obj.TechnicalResources = unmarshalJSONField(technicalResources)
	obj.RupType = unmarshalJSONField(rupType)
	obj.Disciplines = unmarshalJSONField(disciplines)

	return obj, nil
}

func unmarshalJSONField(raw []byte) interface{} {
	if len(raw) == 0 {
		return nil
	}

	var v interface{}
	if err := json.Unmarshal(raw, &v); err != nil {
		// If unmarshalling fails, return the raw string to aid debugging instead of hiding the value.
		return string(raw)
	}

	return v
}
