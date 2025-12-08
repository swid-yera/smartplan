-- name: GetStudyPlans :many
SELECT * FROM study_plans ORDER BY created_at DESC;

-- name: GetStudyPlan :one
SELECT * FROM study_plans WHERE id = $1;

-- name: CreateStudyPlan :one
INSERT INTO study_plans (op_id, code, study_year, semesters, weeks_count_by_semester, study_days_by_week, total_hours, creator_kc_id, status, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateStudyPlan :one
UPDATE study_plans SET op_id = $2, code = $3, study_year = $4, semesters = $5, weeks_count_by_semester = $6, study_days_by_week = $7, total_hours = $8, creator_kc_id = $9, status = $10, metadata = $11, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteStudyPlan :exec
DELETE FROM study_plans WHERE id = $1;
