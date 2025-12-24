-- name: CreateUser :one
INSERT INTO users (
    keycloak_id,
    email,
    username,
    first_name,
    last_name,
    roles
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: GetUserByKeycloakID :one
SELECT *
FROM users
WHERE keycloak_id = $1;


-- name: UpdateUserProfile :exec
UPDATE users
SET
    email = $2,
    username = $3,
    first_name = $4,
    last_name = $5,
    updated_at = NOW()
WHERE keycloak_id = $1;


-- name: UpdateUserRoles :exec
UPDATE users
SET
    roles = $2,
    updated_at = NOW()
WHERE keycloak_id = $1;


-- name: UpdateUserPasswordChangedAt :exec
UPDATE users
SET
    password_changed_at = $2,
    updated_at = NOW()
WHERE keycloak_id = $1;


-- name: UpdateUserLastSeenAt :exec
UPDATE users
SET
    last_seen_at = $2,
    updated_at = NOW()
WHERE keycloak_id = $1;


-- name: DeleteUser :exec
DELETE FROM users
WHERE keycloak_id = $1;


-- name: GetAllUsers :many
SELECT *
FROM users
ORDER BY created_at DESC;


-- name: CreateRupResource :one
INSERT INTO rup_resources (
    name,
    link
) VALUES (
    $1, $2
)
RETURNING *;

-- name: GetAllRupResources :many
SELECT *
FROM rup_resources;

-- name: GetRupResourceByID :one
SELECT *
FROM rup_resources
WHERE id = $1;

-- name: UpdateRupResource :exec
UPDATE rup_resources
SET
    name = $2,
    link = $3,
    updated_at = NOW()
WHERE id = $1;

-- name: DeleteRupResource :exec
DELETE FROM rup_resources
WHERE id = $1;

-- name: CreateRupExplorationNote :one
INSERT INTO rup_exploration_notes (
    basis,
    goals,
    summary,
    competencies,
    prerequisites,
    postrequisites,
    internet_resources_id,
    technical_resources_id
) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8
)
RETURNING *;

-- name: GetRupExplorationNoteByID :one
SELECT *
FROM rup_exploration_notes
WHERE id = $1;

-- name: CreateDisciplineSemester :one
INSERT INTO discipline_semesters (
    semester,
    total_hours
) VALUES (
    $1, $2
)
RETURNING *;

-- name: GetDisciplineSemesterByID :one
SELECT *
FROM discipline_semesters
WHERE id = $1;

-- name: CreateDisciplineTopic :one
INSERT INTO discipline_topics (
    name,
    type,
    total_hours,
    theory_hours,
    practice_hours,
    individual_hours,
    srsp_hours,
    srs_hours
) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8
)
RETURNING *;

-- name: GetDisciplineTopicByID :one
SELECT *
FROM discipline_topics
WHERE id = $1;

-- name: GetAllDisciplineTopics :many
SELECT *
FROM discipline_topics;

-- name: CreateRupDiscipline :one
INSERT INTO rup_disciplines (
    name,
    code,
    total_hours,
    semesters,
    topics
) VALUES (
    $1,$2,$3,$4,$5
)
RETURNING *;

-- name: GetRupDisciplineByID :one
SELECT *
FROM rup_disciplines
WHERE id = $1;

-- name: GetAllRupDisciplines :many
SELECT *
FROM rup_disciplines;

-- name: CreateRups :one
INSERT INTO rups (
    name,
    code,
    status,
    course,
    study_form,
    study_year,
    type,
    contacts,
    group_ids,
    methodist,
    teacher,
    exploration_note_id,
    disciplines
) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
)
RETURNING *;

-- name: GetAllRups :many
SELECT *
FROM rups
ORDER BY created_at DESC;


-- name: GetRupsByID :one
SELECT *
FROM rups
WHERE id = $1;


-- name: UpdateRupsStatus :exec
UPDATE rups
SET
    status = $2,
    reason = $3,
    updated_at = NOW()
WHERE id = $1;


-- name: GetRupsByMethodist :many
SELECT *
FROM rups
WHERE methodist = $1
ORDER BY created_at DESC;

-- name: CreateAward :one
INSERT INTO awards (
    status,
    methodist,
    violation,
    type,
    text
) VALUES (
    $1,$2,$3,$4,$5
)
RETURNING *;


-- name: GetAwardByID :one
SELECT *
FROM awards
WHERE id = $1;


-- name: UpdateAwardStatus :exec
UPDATE awards
SET
    status = $2,
    reason = $3,
    updated_at = NOW()
WHERE id = $1;

-- name: CreateAwardType :one
INSERT INTO award_types (
    name,
    variants
) VALUES (
    $1,$2
)
RETURNING *;


-- name: GetAllAwardTypes :many
SELECT *
FROM award_types;

-- name: GetGroupByKeycloakID :one
SELECT keycloak_id, name, qualification, specialty
FROM groups
WHERE keycloak_id = $1;

-- name: DeleteRup :exec
DELETE FROM rups
WHERE id = $1;
