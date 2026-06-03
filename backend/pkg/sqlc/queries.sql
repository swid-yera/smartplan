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
FROM users u
WHERE
    (
        sqlc.arg('search') = '' OR
        (
            sqlc.arg('search') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND u.keycloak_id = sqlc.arg('search')::uuid
        ) OR
        COALESCE(u.first_name, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        COALESCE(u.last_name, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        COALESCE(u.username, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        u.email ILIKE '%' || sqlc.arg('search') || '%'
    )
    AND (
        sqlc.narg('department_id')::uuid IS NULL
        OR EXISTS (
            SELECT 1
            FROM departments d
            WHERE
                d.keycloak_id = sqlc.narg('department_id')::uuid
                AND u.keycloak_id = ANY(d.users)
        )
    )
ORDER BY
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'asc' THEN u.created_at END ASC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'asc' THEN u.keycloak_id END ASC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'desc' THEN u.created_at END DESC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'desc' THEN u.keycloak_id END DESC,
    u.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: GetUsersRatingPaginated :many
SELECT *
FROM users
WHERE
    total_points > 0
    AND
    (
        sqlc.arg('search') = '' OR
        (
            sqlc.arg('search') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND keycloak_id = sqlc.arg('search')::uuid
        ) OR
        COALESCE(first_name, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        COALESCE(last_name, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        COALESCE(username, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        email ILIKE '%' || sqlc.arg('search') || '%'
    )
ORDER BY
    total_points DESC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'asc' THEN created_at END ASC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'desc' THEN created_at END DESC,
    created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CountUsersRatingFiltered :one
SELECT COUNT(*)
FROM users
WHERE
    total_points > 0
    AND
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
    );

-- name: CountUsersFiltered :one
SELECT COUNT(*)
FROM users u
WHERE
    (
        sqlc.arg('search') = '' OR
        (
            sqlc.arg('search') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND u.keycloak_id = sqlc.arg('search')::uuid
        ) OR
        COALESCE(u.first_name, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        COALESCE(u.last_name, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        COALESCE(u.username, '') ILIKE '%' || sqlc.arg('search') || '%' OR
        u.email ILIKE '%' || sqlc.arg('search') || '%'
    )
    AND (
        sqlc.narg('department_id')::uuid IS NULL
        OR EXISTS (
            SELECT 1
            FROM departments d
            WHERE
                d.keycloak_id = sqlc.narg('department_id')::uuid
                AND u.keycloak_id = ANY(d.users)
        )
    );

-- name: UpsertDepartment :one
INSERT INTO
    departments (keycloak_id, name)
VALUES ($1, $2) ON CONFLICT (keycloak_id) DO
UPDATE
SET
    name = EXCLUDED.name RETURNING keycloak_id;

-- name: AddUserToDepartment :exec
UPDATE departments
SET
    users = CASE
        WHEN $2::uuid = ANY(users) THEN users
        ELSE array_append(users, $2::uuid)
    END
WHERE
    keycloak_id = $1;

-- name: RemoveUserFromAllDepartments :exec
UPDATE departments
SET
    users = array_remove(users, $1::uuid)
WHERE
    $1::uuid = ANY(users);

-- name: GetDepartmentsByUserID :many
SELECT * FROM departments WHERE $1::uuid = ANY(users);

-- name: GetAwardDepartmentsStats :many
SELECT
    d.keycloak_id,
    d.name,
    COALESCE(SUM(u.total_points), 0)::INT AS total_points,
    COALESCE(COUNT(u.keycloak_id), 0)::INT AS user_count
FROM departments d
LEFT JOIN LATERAL unnest(d.users) AS du(user_id) ON TRUE
LEFT JOIN users u ON u.keycloak_id = du.user_id
GROUP BY
    d.keycloak_id,
    d.name
ORDER BY d.keycloak_id;

-- name: CountUsers :one
SELECT COUNT(*) FROM users;

-- name: UpdateUserTotalPoints :exec
UPDATE users
SET
    total_points = total_points + $2
WHERE
    keycloak_id = $1;

-- name: CreateViolation :one
INSERT INTO
    violation (
        user_id,
        issued_by,
        note
    )
VALUES ($1, $2, $3) RETURNING *;

-- name: UpdateViolationByIDAndUserID :one
UPDATE violation
SET
    note = $3,
    updated_at = NOW()
WHERE
    id = $1
    AND user_id = $2 RETURNING *;

-- name: GetViolationByIDAndUserID :one
SELECT *
FROM violation
WHERE
    id = $1
    AND user_id = $2;

-- name: DeleteViolationByIDAndUserID :exec
DELETE FROM violation
WHERE
    id = $1
    AND user_id = $2;

-- name: GetViolationsByIDs :many
SELECT *
FROM violation
WHERE
    id = ANY(sqlc.arg('ids')::uuid[])
ORDER BY array_position(sqlc.arg('ids')::uuid[], id);

-- name: ApplyViolationToUser :one
UPDATE users
SET
    violation_ids = array_append(violation_ids, sqlc.arg('violation_id')::uuid),
    total_points = total_points - 10,
    violation = CASE
        WHEN COALESCE(cardinality(violation_ids), 0) + 1 >= 3 THEN 'SEVERE_REPRIMAND'::violation_enum
        WHEN COALESCE(cardinality(violation_ids), 0) + 1 = 2 THEN 'REBUKE'::violation_enum
        WHEN COALESCE(cardinality(violation_ids), 0) + 1 = 1 THEN 'REMARK'::violation_enum
        ELSE 'NONE'::violation_enum
    END,
    updated_at = NOW()
WHERE
    keycloak_id = sqlc.arg('keycloak_id') RETURNING *;

-- name: RemoveViolationFromUser :one
UPDATE users
SET
    violation_ids = array_remove(violation_ids, sqlc.arg('violation_id')::uuid),
    total_points = CASE
        WHEN sqlc.arg('violation_id')::uuid = ANY(violation_ids) THEN total_points + 10
        ELSE total_points
    END,
    violation = CASE
        WHEN COALESCE(cardinality(array_remove(violation_ids, sqlc.arg('violation_id')::uuid)), 0) >= 3 THEN 'SEVERE_REPRIMAND'::violation_enum
        WHEN COALESCE(cardinality(array_remove(violation_ids, sqlc.arg('violation_id')::uuid)), 0) = 2 THEN 'REBUKE'::violation_enum
        WHEN COALESCE(cardinality(array_remove(violation_ids, sqlc.arg('violation_id')::uuid)), 0) = 1 THEN 'REMARK'::violation_enum
        ELSE 'NONE'::violation_enum
    END,
    updated_at = NOW()
WHERE
    keycloak_id = sqlc.arg('keycloak_id') RETURNING *;

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
        $7
    ) RETURNING *;

-- name: GetRupExplorationNoteByID :one
SELECT
    id,
    basis,
    goals,
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
        sqlc.arg('search') = ''
        OR COALESCE(name->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(name->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR (
            sqlc.arg('search') ~* '^[0-9a-f-]{36}$'
            AND id = sqlc.arg('search')::uuid
        )
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
ORDER BY
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'asc' THEN status::text END ASC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'asc' THEN created_at END ASC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'desc' THEN status::text END DESC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'desc' THEN created_at END DESC,
    created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CountRupsFiltered :one
SELECT COUNT(*)
FROM rups
WHERE
    (
        sqlc.arg('search') = ''
        OR COALESCE(name->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(name->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR (
            sqlc.arg('search') ~* '^[0-9a-f-]{36}$'
            AND id = sqlc.arg('search')::uuid
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
        id,
        status,
        teacher,
        type,
        variant,
        criteria,
        bonus_criteria,
        category_id,
        field_values,
        total_points
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
        $10
    ) RETURNING *;

-- name: GetAllAwards :many
SELECT * FROM awards;

-- name: GetAwardsPaginated :many
SELECT * FROM awards
WHERE
    (
        sqlc.arg('search') = ''
        OR (
            sqlc.arg('search') ~* '^[0-9a-f-]{36}$'
            AND id = sqlc.arg('search')::uuid
        )
        OR status::text ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(reason::text, '') ILIKE '%' || sqlc.arg('search') || '%'
    )
    AND
    (
        sqlc.narg('teacher')::uuid IS NULL
        OR teacher = sqlc.narg('teacher')::uuid
    )
    AND (
        sqlc.narg('methodist')::uuid IS NULL
        OR methodist = sqlc.narg('methodist')::uuid
    )
    AND (
        sqlc.narg('category_ids')::uuid[] IS NULL
        OR category_id = ANY(sqlc.arg(category_ids)::uuid[])
    )
    AND (
        sqlc.narg('status')::text[] IS NULL
        OR status = ANY(sqlc.arg(status)::text[]::awards_status[])
    )
ORDER BY
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'asc' THEN status::text END ASC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'asc' THEN created_at END ASC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'desc' THEN status::text END DESC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'desc' THEN created_at END DESC,
    created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CountAwardsFiltered :one
SELECT COUNT(*)
FROM awards
WHERE
    (
        sqlc.arg('search') = ''
        OR (
            sqlc.arg('search') ~* '^[0-9a-f-]{36}$'
            AND id = sqlc.arg('search')::uuid
        )
        OR status::text ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(reason::text, '') ILIKE '%' || sqlc.arg('search') || '%'
    )
    AND
    (
        sqlc.narg('teacher')::uuid IS NULL
        OR teacher = sqlc.narg('teacher')::uuid
    )
    AND (
        sqlc.narg('methodist')::uuid IS NULL
        OR methodist = sqlc.narg('methodist')::uuid
    )
    AND (
        sqlc.narg('category_ids')::uuid[] IS NULL
        OR category_id = ANY(sqlc.arg(category_ids)::uuid[])
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
    updated_at = NOW()
WHERE
    id = $1 RETURNING *;

-- name: DeleteAward :exec
DELETE FROM awards WHERE id = $1;

-- name: CreatePenalty :one
INSERT INTO
    penalty (
        id,
        points,
        teacher,
        methodist,
        note
    )
VALUES ($1, $2, $3, $4, $5) RETURNING id;

-- name: GetPenaltiesByTeacherID :many
SELECT *
FROM penalty
WHERE
    teacher = $1
ORDER BY created_at DESC;

-- name: GetPenaltyByIDAndTeacherID :one
SELECT *
FROM penalty
WHERE
    id = $1
    AND teacher = $2;

-- name: DeletePenaltyByIDAndTeacherID :exec
DELETE FROM penalty
WHERE
    id = $1
    AND teacher = $2;

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
SELECT 
    id,
    name,
    icon,
    description
FROM award_categories
ORDER BY created_at DESC;

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
        plan_number,
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
        $12,
        $13
    ) RETURNING id;

-- name: UpdateLesson :exec
UPDATE lessons
SET
    rup_name = $2,
    discipline_name = $3,
    topic_name = $4,
    plan_number = $5,
    event_date = $6,
    group_id = $7,
    type = $8,
    goals = $9,
    tasks = $10,
    expected = $11,
    internet_resources = $12,
    technical_resources = $13,
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
        first_time,
        second_time,
        third_time,
        content
    )
VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;

-- name: UpdateLessonProgress :exec
UPDATE lesson_progress
SET
    name = $2,
    first_time = $3,
    second_time = $4,
    third_time = $5,
    content = $6
WHERE
    id = $1;

-- name: GetLessonProgressByID :one
SELECT * FROM lesson_progress WHERE id = $1;

-- name: GetLessonProgressByLessonID :many
SELECT *
FROM lesson_progress
WHERE
    lesson_id = $1
ORDER BY id ASC;

-- name: DeleteLessonProgress :exec
DELETE FROM lesson_progress WHERE id = $1;

-- name: GetLessonsByID :one
SELECT * FROM lessons WHERE id = $1;

-- name: GetLessons :many
SELECT
    l.id,
    l.rup_name,
    l.discipline_name,
    l.topic_name,
    l.plan_number,
    l.teacher,
    l.event_date,
    l.group_id,
    l.type,
    l.goals,
    l.tasks,
    l.expected,
    l.internet_resources,
    l.technical_resources,
    l.file_url,
    l.created_at,
    l.updated_at
FROM lessons l
LEFT JOIN groups g ON g.keycloak_id = l.group_id
WHERE
    (
        sqlc.arg('search') = ''
        OR COALESCE(l.rup_name->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.rup_name->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.discipline_name->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.discipline_name->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.topic_name->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.topic_name->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.goals->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.goals->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.tasks->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.tasks->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.expected->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.expected->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(g.name, '') ILIKE '%' || sqlc.arg('search') || '%'
    ) AND
    (
        sqlc.narg('teacher')::uuid IS NULL
        OR l.teacher = sqlc.narg('teacher')::uuid
    ) AND
    (
        sqlc.narg('id')::uuid IS NULL
        OR l.id = sqlc.narg('id')::uuid
    ) AND
    (
        sqlc.arg('lesson_type') = ''
        OR l.type = sqlc.arg('lesson_type')::enum_lesson_type
    ) AND
    (
        sqlc.arg('discipline') = ''
        OR COALESCE(l.discipline_name->>'ru', '') = sqlc.arg('discipline')
        OR COALESCE(l.discipline_name->>'kz', '') = sqlc.arg('discipline')
    ) AND
    (
        sqlc.arg('group_name') = ''
        OR COALESCE(g.name, '') = sqlc.arg('group_name')
    )
ORDER BY
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'asc' THEN l.created_at END ASC,
    CASE WHEN LOWER(sqlc.arg('sort')::text) = 'desc' THEN l.created_at END DESC,
    l.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: GetRecentLessonsByDiscipline :many
SELECT *
FROM lessons
WHERE
    (
        COALESCE(rup_name->>'ru', '') = $1::text
        OR COALESCE(rup_name->>'kz', '') = $1::text
    )
    AND (
        COALESCE(discipline_name->>'ru', '') = $2::text
        OR COALESCE(discipline_name->>'kz', '') = $2::text
    )
ORDER BY created_at DESC
LIMIT $3;

-- name: CountLessonsFiltered :one
SELECT COUNT(*)
FROM lessons l
LEFT JOIN groups g ON g.keycloak_id = l.group_id
WHERE
    (
        sqlc.arg('search') = ''
        OR COALESCE(l.rup_name->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.rup_name->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.discipline_name->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.discipline_name->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.topic_name->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.topic_name->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.goals->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.goals->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.tasks->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.tasks->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.expected->>'ru', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(l.expected->>'kz', '') ILIKE '%' || sqlc.arg('search') || '%'
        OR COALESCE(g.name, '') ILIKE '%' || sqlc.arg('search') || '%'
    )
    AND (
        sqlc.narg('teacher')::uuid IS NULL
        OR l.teacher = sqlc.narg('teacher')::uuid
    )
    AND (
        sqlc.narg('id')::uuid IS NULL
        OR l.id = sqlc.narg('id')::uuid
    )
    AND (
        sqlc.arg('lesson_type') = ''
        OR l.type = sqlc.arg('lesson_type')::enum_lesson_type
    )
    AND (
        sqlc.arg('discipline') = ''
        OR COALESCE(l.discipline_name->>'ru', '') = sqlc.arg('discipline')
        OR COALESCE(l.discipline_name->>'kz', '') = sqlc.arg('discipline')
    )
    AND (
        sqlc.arg('group_name') = ''
        OR COALESCE(g.name, '') = sqlc.arg('group_name')
    );
