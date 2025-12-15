package repository

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"rup_database/internal/models"
)

type ObjectRepository interface {
	Create(ctx context.Context, input models.InnerCreateObjectDTO) (*models.Object, error)
	GetByID(ctx context.Context, id string) (*models.Object, error)
	List(ctx context.Context) ([]*models.Object, error)
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
        INSERT INTO objects (title, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, title, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
    `

	obj := &models.Object{}
	var title, year, typ, course, studyForm, explorationNote, goals, prerequisites, postrequisites, groupID, contacts, internetResources, technicalResources, rupType, disciplines interface{}
	if len(input.Title) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Title, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		title = temp
	}
	if len(input.Year) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Year, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		year = temp
	}
	if len(input.Type) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Type, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		typ = temp
	}
	if len(input.Course) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Course, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		course = temp
	}
	if len(input.StudyForm) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.StudyForm, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		studyForm = temp
	}
	if len(input.ExplorationNote) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.ExplorationNote, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		explorationNote = temp
	}
	if len(input.Goals) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Goals, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		goals = temp
	}
	if len(input.Prerequisites) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Prerequisites, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		prerequisites = temp
	}
	if len(input.Postrequisites) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Postrequisites, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		postrequisites = temp
	}
	if len(input.GroupID) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.GroupID, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		groupID = temp
	}
	if len(input.Contacts) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Contacts, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		contacts = temp
	}
	if len(input.InternetResources) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.InternetResources, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		internetResources = temp
	}
	if len(input.TechnicalResources) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.TechnicalResources, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		technicalResources = temp
	}
	if len(input.RupType) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.RupType, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		rupType = temp
	}
	if len(input.Disciplines) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Disciplines, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		disciplines = temp
	}

	// Marshal non-string fields to JSON strings for DB storage
	fieldsToMarshal := []*interface{}{&title, &year, &typ, &course, &studyForm, &explorationNote, &goals, &prerequisites, &postrequisites, &rupType, &groupID, &contacts, &internetResources, &technicalResources, &disciplines}
	for _, field := range fieldsToMarshal {
		if *field != nil {
			// Always marshal the field to a JSON string for DB storage.
			bytes, _ := json.Marshal(*field)
			*field = string(bytes)
		}
	}

	err := r.db.QueryRowContext(ctx, query, title, year, typ, course, studyForm, explorationNote, goals, prerequisites, postrequisites, groupID, contacts, internetResources, technicalResources, rupType, disciplines).
		Scan(&obj.ID, &obj.Title, &obj.Year, &obj.Type, &obj.Course, &obj.StudyForm, &obj.ExplorationNote, &obj.Goals, &obj.Prerequisites, &obj.Postrequisites, &obj.GroupID, &obj.Contacts, &obj.InternetResources, &obj.TechnicalResources, &obj.RupType, &obj.Disciplines, &obj.CreatedAt, &obj.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return scanAndUnmarshalObject(obj)
}

func (r *ObjectRepo) GetByID(ctx context.Context, id string) (*models.Object, error) {
	query := `
        SELECT id, title, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
        FROM objects
        WHERE id = $1
    `
	obj := &models.Object{}
	err := r.db.QueryRowContext(ctx, query, id).
		Scan(&obj.ID, &obj.Title, &obj.Year, &obj.Type, &obj.Course, &obj.StudyForm, &obj.ExplorationNote, &obj.Goals, &obj.Prerequisites, &obj.Postrequisites, &obj.GroupID, &obj.Contacts, &obj.InternetResources, &obj.TechnicalResources, &obj.RupType, &obj.Disciplines, &obj.CreatedAt, &obj.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return scanAndUnmarshalObject(obj)
}

func (r *ObjectRepo) List(ctx context.Context) ([]*models.Object, error) {
	query := `
        SELECT id, title, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
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
		obj := &models.Object{}
		err := rows.Scan(&obj.ID, &obj.Title, &obj.Year, &obj.Type, &obj.Course, &obj.StudyForm, &obj.ExplorationNote, &obj.Goals, &obj.Prerequisites, &obj.Postrequisites, &obj.GroupID, &obj.Contacts, &obj.InternetResources, &obj.TechnicalResources, &obj.RupType, &obj.Disciplines, &obj.CreatedAt, &obj.UpdatedAt)
		if err != nil {
			return nil, err
		}

		processedObj, err := scanAndUnmarshalObject(obj)
		if err != nil {
			// Decide how to handle error: log it, skip the item, or stop and return error
			continue
		}

		list = append(list, processedObj)
	}

	return list, nil
}

func (r *ObjectRepo) Update(ctx context.Context, input models.InnerUpdateObjectDTO) (*models.Object, error) {
	query := `
        UPDATE objects
        SET title = $1, year = $2, type = $3, course = $4, study_form = $5, exploration_note = $6, goals = $7, prerequisites = $8, postrequisites = $9, group_id = $10, contacts = $11, internet_resources = $12, technical_resources = $13, rup_type = $14, disciplines = $15, updated_at = NOW()
        WHERE id = $16
        RETURNING id, title, year, type, course, study_form, exploration_note, goals, prerequisites, postrequisites, group_id, contacts, internet_resources, technical_resources, rup_type, disciplines, created_at, updated_at
    `

	obj := &models.Object{}
	var id, title, year, typ, course, studyForm, explorationNote, goals, prerequisites, postrequisites, groupID, contacts, internetResources, technicalResources, rupType, disciplines interface{}
	if len(input.ID) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.ID, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		id = temp
	}
	if len(input.Title) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Title, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		title = temp
	}
	if len(input.Year) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Year, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		year = temp
	}
	if len(input.Type) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Type, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		typ = temp
	}
	if len(input.Course) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Course, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		course = temp
	}
	if len(input.StudyForm) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.StudyForm, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		studyForm = temp
	}
	if len(input.ExplorationNote) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.ExplorationNote, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		explorationNote = temp
	}
	if len(input.Goals) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Goals, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		goals = temp
	}
	if len(input.Prerequisites) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Prerequisites, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		prerequisites = temp
	}
	if len(input.Postrequisites) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Postrequisites, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		postrequisites = temp
	}
	if len(input.GroupID) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.GroupID, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		groupID = temp
	}
	if len(input.Contacts) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Contacts, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		contacts = temp
	}
	if len(input.InternetResources) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.InternetResources, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		internetResources = temp
	}
	if len(input.TechnicalResources) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.TechnicalResources, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		technicalResources = temp
	}
	if len(input.RupType) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.RupType, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		rupType = temp
	}
	if len(input.Disciplines) > 0 {
		var temp interface{}
		if err := json.Unmarshal(input.Disciplines, &temp); err == nil {
			if s, ok := temp.(string); ok {
				if decoded, err2 := base64.StdEncoding.DecodeString(s); err2 == nil {
					json.Unmarshal(decoded, &temp)
				}
			}
		}
		disciplines = temp
	}

	// Marshal non-string fields to JSON strings for DB storage
	fieldsToMarshal := []*interface{}{&title, &year, &typ, &course, &studyForm, &explorationNote, &goals, &prerequisites, &postrequisites, &rupType, &groupID, &contacts, &internetResources, &technicalResources, &disciplines}
	for _, field := range fieldsToMarshal {
		if *field != nil {
			// Always marshal the field to a JSON string for DB storage.
			bytes, _ := json.Marshal(*field)
			*field = string(bytes)
		}
	}

	err := r.db.QueryRowContext(ctx, query, title, year, typ, course, studyForm, explorationNote, goals, prerequisites, postrequisites, groupID, contacts, internetResources, technicalResources, rupType, disciplines, id).
		Scan(&obj.ID, &obj.Title, &obj.Year, &obj.Type, &obj.Course, &obj.StudyForm, &obj.ExplorationNote, &obj.Goals, &obj.Prerequisites, &obj.Postrequisites, &obj.GroupID, &obj.Contacts, &obj.InternetResources, &obj.TechnicalResources, &obj.RupType, &obj.Disciplines, &obj.CreatedAt, &obj.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return scanAndUnmarshalObject(obj)
}

func (r *ObjectRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM objects WHERE id = $1`, id)
	return err
}

// scanAndUnmarshalObject takes a scanned object and decodes its fields.
func scanAndUnmarshalObject(obj *models.Object) (*models.Object, error) {
	// List of all fields that are stored as JSON strings.
	fieldsToUnmarshal := []*interface{}{
		&obj.Title, &obj.Year, &obj.Type, &obj.Course, &obj.StudyForm,
		&obj.ExplorationNote, &obj.Goals, &obj.Prerequisites, &obj.Postrequisites,
		&obj.GroupID, &obj.Contacts, &obj.InternetResources, &obj.TechnicalResources,
		&obj.RupType, &obj.Disciplines,
	}

	for _, field := range fieldsToUnmarshal {
		if *field != nil {
			if s, ok := (*field).(string); ok {
				var v interface{}
				json.Unmarshal([]byte(s), &v)
				*field = v
			}
		}
	}
	return obj, nil
}
