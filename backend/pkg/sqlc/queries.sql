-- name: CreateUser :one
INSERT INTO
    users (
        keycloak_id,
        email,
        username,
        first_name,
        last_name,
        role,
        phone
    )
VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: GetUserByKeycloakID :one
SELECT * FROM users WHERE keycloak_id = $1;

-- name: UpdateUserProfile :exec
UPDATE users
SET
    email = $2,
    username = $3,
    first_name = $4,
    last_name = $5,
    phone = $6,
    role = $7,
    updated_at = NOW()
WHERE
    keycloak_id = $1;

-- name: UpdateUserRole :exec
UPDATE users
SET role = $2,
updated_at = NOW()
WHERE
    keycloak_id = $1;

-- name: UpdateUserPasswordChangedAt :exec
UPDATE users
SET
    password_changed_at = $2,
    updated_at = NOW()
WHERE
    keycloak_id = $1;

-- name: UpdateUserLastSeenAt :exec
UPDATE users
SET
    last_seen_at = $2,
    updated_at = NOW()
WHERE
    keycloak_id = $1;

-- name: DeleteUser :exec
DELETE FROM users WHERE keycloak_id = $1;

-- name: GetAllUsers :many
SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: GetUsersPaginated :many
SELECT *
FROM users
WHERE
    (
        $1 = '' OR
        (
            $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND keycloak_id = $1::uuid
        ) OR
        COALESCE(first_name, '') ILIKE '%' || $1 || '%' OR
        COALESCE(last_name, '') ILIKE '%' || $1 || '%' OR
        COALESCE(username) ILIKE '%' || $1 || '%' OR
        email ILIKE '%' || $1 || '%'
    )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetUsersRatingPaginated :many
SELECT *
FROM users
WHERE
    (
        $1 = '' OR
        (
            $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND keycloak_id = $1::uuid
        ) OR
        COALESCE(first_name, '') ILIKE '%' || $1 || '%' OR
        COALESCE(last_name, '') ILIKE '%' || $1 || '%' OR
        COALESCE(username, '') ILIKE '%' || $1 || '%' OR
        email ILIKE '%' || $1 || '%'
    )
ORDER BY total_points DESC, created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountUsersFiltered :one
SELECT COUNT(*)
FROM users
WHERE
    (
        $1 = '' OR
        (
            $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND keycloak_id = $1::uuid
        ) OR
        COALESCE(first_name, '') ILIKE '%' || $1 || '%' OR
        COALESCE(last_name, '') ILIKE '%' || $1 || '%' OR
        email ILIKE '%' || $1 || '%'
    );

-- name: CountUsers :one
SELECT COUNT(*) FROM users;

-- name: UpdateUserTotalPoints :exec
UPDATE users
SET
    total_points = total_points + $2
WHERE
    keycloak_id = $1;

-- name: CreateRupResource :one
INSERT INTO
    rup_resources (name, link)
VALUES ($1, $2) RETURNING *;

-- name: GetAllRupResources :many
SELECT * FROM rup_resources;

-- name: GetRupResourceByID :one
SELECT * FROM rup_resources WHERE id = $1;

-- name: UpdateRupResource :exec
UPDATE rup_resources
SET
    name = $2,
    link = $3,
    updated_at = NOW()
WHERE
    id = $1;

-- name: DeleteRupResource :exec
DELETE FROM rup_resources WHERE id = $1;

-- name: CreateRupExplorationNote :one
INSERT INTO
    rup_exploration_notes (
        basis,
        goals,
        summary,
        competencies,
        prerequisites,
        postrequisites,
        internet_resources,
        technical_resources
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
    ) RETURNING *;

-- name: GetRupExplorationNoteByID :one
SELECT
    id,
    basis,
    goals,
    summary,
    competencies,
    prerequisites,
    postrequisites,
    internet_resources,
    technical_resources
FROM rup_exploration_notes
WHERE
    id = $1;

-- name: CreateDisciplineSemester :one
INSERT INTO
    discipline_semesters (semester, total_hours)
VALUES ($1, $2) RETURNING *;

-- name: GetDisciplineSemesterByID :one
SELECT * FROM discipline_semesters WHERE id = $1;

-- name: CreateDisciplineTopic :one
INSERT INTO
    discipline_topics (
        name,
        type,
        total_hours,
        theory_hours,
        practice_hours,
        individual_hours,
        srsp_hours,
        srs_hours
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
    ) RETURNING *;

-- name: GetDisciplineTopicByID :one
SELECT * FROM discipline_topics WHERE id = $1;

-- name: GetDisciplineTopicByLessonID :one
SELECT * FROM discipline_topics WHERE lesson_id = $1;

-- name: GetAllDisciplineTopics :many
SELECT * FROM discipline_topics;

-- name: UpdateDisciplineTopic :exec
UPDATE discipline_topics
SET
    name = $2,
    type = $3,
    total_hours = $4,
    theory_hours = $5,
    practice_hours = $6,
    individual_hours = $7,
    srsp_hours = $8,
    srs_hours = $9
WHERE
    id = $1;

-- name: LinkLessonToDisciplineTopic :exec
UPDATE discipline_topics
SET
    lesson_id = $2
WHERE
    id = $1;

-- name: CreateRupDiscipline :one
INSERT INTO
    rup_disciplines (
        name,
        total_hours,
        semesters,
        topics
    )
VALUES ($1, $2, $3, $4) RETURNING *;

-- name: GetRupDisciplineByID :one
SELECT * FROM rup_disciplines WHERE id = $1;

-- name: GetRupDisciplineByTopicID :one
SELECT * FROM rup_disciplines WHERE $1::uuid = ANY(topics);

-- name: GetAllRupDisciplines :many
SELECT * FROM rup_disciplines;

-- name: CreateRups :one
INSERT INTO
    rups (
        name,
        status,
        course,
        study_form,
        study_year,
        type,
        contacts,
        group_ids,
        teacher,
        exploration_note_id,
        disciplines,
        total_hours
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
    ) RETURNING *;

-- name: GetAllRups :many
SELECT * FROM rups ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: GetRupsPaginated :many
SELECT *
FROM rups WHERE
    (
        $1 = ''
        OR name ILIKE '%' || $1 || '%'
    )
    AND (
        sqlc.narg('teacher')::uuid IS NULL
        OR sqlc.narg('teacher')::uuid = ANY(contacts)
    ) AND (
        sqlc.narg('methodist')::uuid IS NULL
        OR methodist = sqlc.narg('methodist')::uuid
    )AND (
        sqlc.narg('status')::text[] IS NULL
        OR status = ANY(sqlc.arg(status)::text[]::rups_status[])
    )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountRupsFiltered :one
SELECT COUNT(*)
FROM rups
WHERE
    (
        $1 = ''
        OR name ILIKE '%' || $1 || '%'
        OR (
            $1 ~* '^[0-9a-f-]{36}$'
            AND id = $1::uuid
        )
    )
    AND (
        sqlc.narg('teacher')::uuid IS NULL
        OR sqlc.narg('teacher')::uuid = ANY(contacts)
    )
    AND (
        sqlc.narg('methodist')::uuid IS NULL
        OR methodist = sqlc.narg('methodist')::uuid
    )
    AND (
        sqlc.narg('status')::text[] IS NULL
        OR status = ANY(sqlc.arg(status)::text[]::rups_status[])
    );

-- name: CountRups :one
SELECT COUNT(*) FROM rups;

-- name: GetRupsByID :one
SELECT * FROM rups WHERE id = $1;

-- name: GetRupByDisciplineID :one
SELECT * FROM rups WHERE $1::uuid = ANY(disciplines);

-- name: UpdateRup :exec
UPDATE rups
SET
    name = $2,
    course = $3,
    study_form = $4,
    study_year = $5,
    type = $6,
    contacts = $7,
    group_ids = $8,
    exploration_note_id = $9,
    disciplines = $10,
    total_hours = $11,
    updated_at = NOW()
WHERE
    id = $1;

-- name: UpdateRupsStatus :exec
UPDATE rups
SET
    status = $2,
    reason = $3,
    methodist = $4,
    updated_at = NOW()
WHERE
    id = $1;

-- name: GetRupsByMethodist :many
SELECT * FROM rups WHERE methodist = $1 ORDER BY created_at DESC;

-- name: GetRupsByTeacher :many
SELECT * FROM rups WHERE $1::uuid = ANY(contacts) ORDER BY created_at DESC;

-- name: DeleteRup :exec
DELETE FROM rups WHERE id = $1;

-- name: CreateAward :one
INSERT INTO
    awards (
        status,
        teacher,
        type,
        variant,
        criteria,
        bonus_criteria,
        category_id,
        field_values,
        total_points,
        text,
        files,
        links
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
    ) RETURNING *;

-- name: GetAllAwards :many
SELECT * FROM awards;

-- name: GetAwardsPaginated :many
SELECT * FROM awards
WHERE
    (
        sqlc.narg('teacher')::uuid IS NULL
        OR teacher = sqlc.narg('teacher')::uuid
    )
    AND (
        sqlc.narg('methodist')::uuid IS NULL
        OR methodist = sqlc.narg('methodist')::uuid
    )
    AND (
        sqlc.narg('status')::text[] IS NULL
        OR status = ANY(sqlc.arg(status)::text[]::awards_status[])
    )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountAwardsFiltered :one
SELECT COUNT(*)
FROM awards
WHERE
    (
        sqlc.narg('teacher')::uuid IS NULL
        OR teacher = sqlc.narg('teacher')::uuid
    )
    AND (
        sqlc.narg('methodist')::uuid IS NULL
        OR methodist = sqlc.narg('methodist')::uuid
    )
    AND (
        sqlc.narg('status')::text[] IS NULL
        OR status = ANY(sqlc.arg(status)::text[]::awards_status[])
    );

-- name: CountAwards :one
SELECT COUNT(*) FROM awards;

-- name: GetAwardByID :one
SELECT * FROM awards WHERE id = $1;

-- name: UpdateAwardStatus :exec
UPDATE awards
SET
    status = $2,
    reason = $3,
    methodist = $4,
    total_points = $5,
    updated_at = NOW()
WHERE
    id = $1;

-- name: UpdateAward :one
UPDATE awards
SET
    reason = $2,
    type = $3,
    variant = $4,
    criteria = $5,
    bonus_criteria = $6,
    category_id = $7,
    field_values = $8,
    total_points = $9,
    text = $10,
    files = $11,
    links = $12,
    updated_at = NOW()
WHERE
    id = $1 RETURNING *;

-- name: DeleteAward :exec
DELETE FROM awards WHERE id = $1;

-- name: CreateAwardType :one
INSERT INTO
    award_types (name, variants)
VALUES ($1, $2) RETURNING *;

-- name: GetAwardTypeByID :one
SELECT * FROM award_types WHERE id = $1;

-- name: GetAllAwardTypes :many
SELECT * FROM award_types;

-- name: UpdateAwardType :exec
UPDATE award_types
SET
    name = $2,
    variants = $3
WHERE
    id = $1 RETURNING *;

-- name: DeleteAwardType :exec
DELETE FROM award_types WHERE id = $1;

-- name: CreateAwardTypesVariant :one
INSERT INTO
    award_type_variants (
        name,
        description,
        criteria,
        bonus_criteria
    )
VALUES ($1, $2, $3, $4) RETURNING *;

-- name: GetAwardTypeVariantByID :one
SELECT * FROM award_type_variants WHERE id = $1;

-- name: GetAllAwardTypeVariants :many
SELECT * FROM award_type_variants;

-- name: CreateAwardTypeCriteria :one
INSERT INTO
    award_type_criteria (name, points, method)
VALUES ($1, $2, $3) RETURNING *;

-- name: GetAwardTypeCriteriaByID :one
SELECT * FROM award_type_criteria WHERE id = $1;

-- name: GetAllAwardTypeCriteria :many
SELECT * FROM award_type_criteria;

-- name: UpdateAwardTypeVariants :one
UPDATE award_types SET variants = $2 WHERE id = $1 RETURNING *;

-- name: CreateAwardCategoryField :one
INSERT INTO
    award_category_fields (
        category_id,
        key,
        label,
        type,
        required,
        placeholder,
        help_text,
        options,
        validation,
        sort_order
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;

-- name: GetAwardCategoryFieldsByCategoryID :many
SELECT *
FROM award_category_fields
WHERE category_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: DeleteAwardCategoryFieldsByCategoryID :exec
DELETE FROM award_category_fields WHERE category_id = $1;

-- name: CreateAwardCategory :one
INSERT INTO
    award_categories (award_types, name, icon, description)
VALUES ($1, $2, $3, $4) RETURNING *;

-- name: GetAwardCategoryByID :one
SELECT * FROM award_categories WHERE id = $1;

-- name: GetAllAwardCategories :many
SELECT * FROM award_categories ORDER BY created_at DESC;

-- name: UpdateAwardCategory :one
UPDATE award_categories
SET
    award_types = $2,
    name = $3,
    icon = $4,
    description = $5,
    updated_at = NOW()
WHERE
    id = $1 RETURNING *;

-- name: DeleteAwardCategory :exec
DELETE FROM award_categories WHERE id = $1;

-- name: GetGroupByKeycloakID :one
SELECT
    keycloak_id,
    name,
    qualification,
    specialty
FROM groups
WHERE
    keycloak_id = $1;

-- name: CreateGroup :one
INSERT INTO
    groups (
        keycloak_id,
        name,
        qualification,
        specialty
    )
VALUES ($1, $2, $3, $4) RETURNING keycloak_id,
    name,
    qualification,
    specialty;

-- name: GetAllGroups :many
SELECT * FROM groups ORDER BY name;

-- name: UpsertGroup :one
INSERT INTO
    groups (
        keycloak_id,
        name,
        qualification,
        specialty
    )
VALUES ($1, $2, $3, $4) ON CONFLICT (keycloak_id) DO
UPDATE
SET
    name = EXCLUDED.name,
    qualification = EXCLUDED.qualification,
    specialty = EXCLUDED.specialty RETURNING keycloak_id;

-- name: DeleteGroupsNotInKeycloak :exec
DELETE FROM groups
WHERE keycloak_id NOT IN (
    SELECT unnest($1::uuid[])
);

-- name: CreateLessons :one
INSERT INTO
    lessons (
        rup_name,
        discipline_name,
        topic_name,
        teacher,
        event_date,
        group_id,
        type,
        goals,
        tasks,
        expected,
        internet_resources,
        technical_resources
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
    ) RETURNING id;

-- name: UpdateLesson :exec
UPDATE lessons
SET
    rup_name = $2,
    discipline_name = $3,
    topic_name = $4,
    event_date = $5,
    group_id = $6,
    type = $7,
    goals = $8,
    tasks = $9,
    expected = $10,
    internet_resources = $11,
    technical_resources = $12,
    updated_at = NOW()
WHERE
    id = $1;

-- name: UpdateLessonFileURL :exec
UPDATE lessons
SET
    file_url = $2,
    updated_at = NOW()
WHERE
    id = $1;

-- name: DeleteLesson :exec
DELETE FROM lessons WHERE id = $1;

-- name: CreateLessonProgress :one
INSERT INTO
    lesson_progress (
        lesson_id,
        name,
        start_minute,
        end_minute,
        content
    )
VALUES ($1, $2, $3, $4, $5) RETURNING id;

-- name: UpdateLessonProgress :exec
UPDATE lesson_progress
SET
    name = $2,
    start_minute = $3,
    end_minute = $4,
    content = $5
WHERE
    id = $1;

-- name: GetLessonProgressByID :one
SELECT * FROM lesson_progress WHERE id = $1;

-- name: GetLessonProgressByLessonID :many
SELECT *
FROM lesson_progress
WHERE
    lesson_id = $1
ORDER BY name ASC;

-- name: DeleteLessonProgress :exec
DELETE FROM lesson_progress WHERE id = $1;

-- name: GetLessonsByID :one
SELECT * FROM lessons WHERE id = $1;

-- name: GetLessons :many
SELECT * FROM lessons
WHERE
    (
        sqlc.narg('teacher')::uuid IS NULL
        OR teacher = sqlc.narg('teacher')::uuid
    ) AND
    (
        sqlc.narg('id')::uuid IS NULL
        OR id = sqlc.narg('id')::uuid
    )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetRecentLessonsByDiscipline :many
SELECT *
FROM lessons
WHERE
    rup_name = $1
    AND discipline_name = $2
ORDER BY created_at DESC
LIMIT $3;

-- name: CountLessonsFiltered :one
SELECT COUNT(*)
FROM lessons
WHERE
    (
        sqlc.narg('teacher')::uuid IS NULL
        OR teacher = sqlc.narg('teacher')::uuid
    )
    AND (
        sqlc.narg('id')::uuid IS NULL
        OR id = sqlc.narg('id')
    );
