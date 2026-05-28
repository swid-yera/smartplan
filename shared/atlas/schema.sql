-- =====================
-- ENUMS
-- =====================
CREATE TYPE rups_status AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');

CREATE TYPE study_form_enum AS ENUM ('CORRESPONDENCE', 'FULL_TIME');

CREATE TYPE rups_type_enum AS ENUM ('PRACTICE', 'THEORY');

CREATE TYPE discipline_topic_type AS ENUM ('SNZ', 'PRACTICAL', 'COMBINED');

CREATE TYPE awards_status AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');

CREATE TYPE violation_enum AS ENUM ('NONE', 'REMARK', 'REBUKE', 'SEVERE_REPRIMAND');

CREATE TYPE enum_criteria_method AS ENUM ('NORMAL', 'MEASURING');

CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'METHODIST');

CREATE TYPE enum_lesson_type AS ENUM ('PRACTICE', 'THEORY');

-- =====================
-- USERS
-- =====================


CREATE TABLE users (
    keycloak_id UUID PRIMARY KEY,

    email TEXT NOT NULL,
    username TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,

    role user_role NOT NULL,
    rups TEXT[],
    total_points INT NOT NULL DEFAULT 0,
    awards TEXT[],
    violation violation_enum NOT NULL DEFAULT 'NONE',
    violation_ids UUID[] NOT NULL DEFAULT '{}',

    password_changed_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE violation (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    issued_by UUID NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_violation_user FOREIGN KEY (user_id) REFERENCES users(keycloak_id) ON DELETE CASCADE,
    CONSTRAINT fk_violation_issued_by FOREIGN KEY (issued_by) REFERENCES users(keycloak_id)
);

-- =====================
-- DEPARTMENTS
-- =====================
CREATE TABLE departments (
    keycloak_id UUID PRIMARY KEY,
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    users UUID[] NOT NULL DEFAULT '{}',
    CONSTRAINT departments_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    )
);


-- =====================
-- RUP EXPLORATION NOTES
-- =====================
CREATE TABLE penalty (
    id UUID PRIMARY KEY,
    points int[],
    teacher UUID,
    methodist UUID,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_methodist FOREIGN KEY (methodist) REFERENCES users(keycloak_id),
    CONSTRAINT fk_teacher FOREIGN KEY (teacher) REFERENCES users(keycloak_id)
);

-- =====================
-- GROUPS
-- =====================
CREATE TABLE groups (
    keycloak_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    qualification JSONB,
    specialty JSONB,
    CONSTRAINT groups_qualification_locale_check CHECK (
        qualification IS NULL OR (qualification ? 'ru' AND qualification ? 'kz')
    ),
    CONSTRAINT groups_specialty_locale_check CHECK (
        specialty IS NULL OR (specialty ? 'ru' AND specialty ? 'kz')
    )
);

-- =====================
-- RUP RESOURCES
-- =====================
CREATE TABLE rup_resources (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    link TEXT
);

-- =====================
-- RUP EXPLORATION NOTES
-- =====================


CREATE TABLE rup_exploration_notes (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    basis JSONB,
    goals JSONB,
    summary JSONB,
    competencies JSONB,

    prerequisites JSONB,
    postrequisites JSONB,

    internet_resources UUID[],
    technical_resources UUID[],

    CONSTRAINT rup_exploration_notes_basis_locale_check CHECK (
        basis IS NULL OR (basis ? 'ru' AND basis ? 'kz')
    ),
    CONSTRAINT rup_exploration_notes_goals_locale_check CHECK (
        goals IS NULL OR (goals ? 'ru' AND goals ? 'kz')
    ),
    CONSTRAINT rup_exploration_notes_summary_locale_check CHECK (
        summary IS NULL OR (summary ? 'ru' AND summary ? 'kz')
    ),
    CONSTRAINT rup_exploration_notes_competencies_locale_check CHECK (
        competencies IS NULL OR (competencies ? 'ru' AND competencies ? 'kz')
    ),
    CONSTRAINT rup_exploration_notes_prerequisites_locale_check CHECK (
        prerequisites IS NULL OR (prerequisites ? 'ru' AND prerequisites ? 'kz')
    ),
    CONSTRAINT rup_exploration_notes_postrequisites_locale_check CHECK (
        postrequisites IS NULL OR (postrequisites ? 'ru' AND postrequisites ? 'kz')
    )
);

-- =====================
-- DISCIPLINE SEMESTERS
-- =====================
CREATE TABLE discipline_semesters (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    total_hours INT NOT NULL DEFAULT 0
);

-- =====================
-- DISCIPLINE TOPICS
-- =====================
CREATE TABLE discipline_topics (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    type discipline_topic_type NOT NULL,
    lesson_id UUID,
    total_hours INT NOT NULL DEFAULT 0,
    theory_hours INT NOT NULL DEFAULT 0,
    practice_hours INT NOT NULL DEFAULT 0,
    individual_hours INT NOT NULL DEFAULT 0,
    srsp_hours INT NOT NULL DEFAULT 0,
    srs_hours INT NOT NULL DEFAULT 0,
    CONSTRAINT discipline_topics_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    )
);

-- =====================
-- RUP DISCIPLINES
-- =====================


CREATE TABLE rup_disciplines (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    total_hours INT NOT NULL DEFAULT 0,

    semesters UUID[],
    topics UUID[],
    CONSTRAINT rup_disciplines_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    )
);

-- =====================
-- RUPS
-- =====================


CREATE TABLE rups (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    status rups_status NOT NULL,
    reason TEXT,
    course INT NOT NULL CHECK (course BETWEEN 1 AND 4),
    study_form study_form_enum NOT NULL,
    study_year TEXT NOT NULL,
    type rups_type_enum NOT NULL,
    total_hours INT NOT NULL DEFAULT 0,

    contacts UUID[],
    group_ids TEXT[],
    methodist UUID,
    teacher UUID,

    exploration_note_id UUID REFERENCES rup_exploration_notes(id),
    disciplines UUID[],

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT rups_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    ),
    CONSTRAINT fk_methodist FOREIGN KEY (methodist) REFERENCES users(keycloak_id),
    CONSTRAINT fk_teacher FOREIGN KEY (teacher) REFERENCES users(keycloak_id)
);

-- =====================
-- AWARD TYPE CRITERIA
-- =====================
CREATE TABLE award_type_criteria (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    points INT[],
    method enum_criteria_method NOT NULL,
    CONSTRAINT award_type_criteria_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    )
);

-- =====================
-- AWARD TYPE VARIANTS
-- =====================
CREATE TABLE award_type_variants (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    description JSONB,
    criteria UUID[],
    bonus_criteria UUID[],
    CONSTRAINT award_type_variants_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    ),
    CONSTRAINT award_type_variants_description_locale_check CHECK (
        description IS NULL OR (description ? 'ru' AND description ? 'kz')
    )
);

-- =====================
-- AWARD TYPES
-- =====================
CREATE TABLE award_types (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    variants UUID[],
    CONSTRAINT award_types_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    )
);

-- =====================
-- AWARD CATEGORIES
-- =====================
CREATE TABLE award_categories (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    award_types UUID[] NOT NULL DEFAULT '{}',
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    icon TEXT,
    description JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT award_categories_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    ),
    CONSTRAINT award_categories_description_locale_check CHECK (
        description ? 'ru' AND description ? 'kz'
    )
);

-- =====================
-- AWARD CATEGORY FIELDS
-- =====================
CREATE TABLE award_category_fields (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES award_categories(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    type TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    placeholder JSONB,
    help_text JSONB,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT award_category_fields_label_locale_check CHECK (
        label ? 'ru' AND label ? 'kz'
    ),
    CONSTRAINT award_category_fields_placeholder_locale_check CHECK (
        placeholder IS NULL OR (placeholder ? 'ru' AND placeholder ? 'kz')
    ),
    CONSTRAINT award_category_fields_help_text_locale_check CHECK (
        help_text IS NULL OR (help_text ? 'ru' AND help_text ? 'kz')
    ),
    UNIQUE (category_id, key)
);

-- =====================
-- AWARDS
-- =====================


CREATE TABLE awards (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
	status awards_status NOT NULL,
	reason TEXT,
	methodist UUID,
	teacher UUID,


    total_points INT NOT NULL DEFAULT 0,
    type UUID,
    variant UUID,
    criteria UUID,
    bonus_criteria UUID,
    category_id UUID,
    field_values JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_award_methodist FOREIGN KEY (methodist) REFERENCES users(keycloak_id),
    CONSTRAINT fk_award_category FOREIGN KEY (category_id) REFERENCES award_categories(id) ON DELETE RESTRICT
);

-- =====================
-- LESSON
-- =====================

CREATE SEQUENCE lessons_plan_number_seq
    AS INTEGER
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    CACHE 1;

CREATE TABLE lessons (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    rup_name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    discipline_name JSONB,
    topic_name JSONB,
    plan_number INT NOT NULL DEFAULT nextval('lessons_plan_number_seq'::regclass),
    teacher UUID NOT NULL,
    event_date TIMESTAMPTZ,
    group_id UUID NOT NULL,
    type enum_lesson_type NOT NULL,
    goals JSONB,
    tasks JSONB,
    expected JSONB,
    internet_resources UUID[],
    technical_resources UUID[],
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lessons_rup_name_locale_check CHECK (
        rup_name ? 'ru' AND rup_name ? 'kz'
    ),
    CONSTRAINT lessons_discipline_name_locale_check CHECK (
        discipline_name IS NULL OR (discipline_name ? 'ru' AND discipline_name ? 'kz')
    ),
    CONSTRAINT lessons_topic_name_locale_check CHECK (
        topic_name IS NULL OR (topic_name ? 'ru' AND topic_name ? 'kz')
    ),
    CONSTRAINT lessons_goals_locale_check CHECK (
        goals IS NULL OR (goals ? 'ru' AND goals ? 'kz')
    ),
    CONSTRAINT lessons_tasks_locale_check CHECK (
        tasks IS NULL OR (tasks ? 'ru' AND tasks ? 'kz')
    ),
    CONSTRAINT lessons_expected_locale_check CHECK (
        expected IS NULL OR (expected ? 'ru' AND expected ? 'kz')
    ),
    CONSTRAINT fk_lesson_teacher FOREIGN KEY (teacher) REFERENCES users(keycloak_id),
    CONSTRAINT fk_lesson_groups FOREIGN KEY (group_id) REFERENCES groups(keycloak_id)
);

-- =====================
-- LESSON PRACTICE
-- =====================

CREATE TABLE lesson_progress(
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL,
    name JSONB NOT NULL DEFAULT '{"ru": "", "kz": ""}'::jsonb,
    first_time INT[] NOT NULL,
    second_time INT[] NOT NULL,
    third_time INT[] NOT NULL,
    content TEXT[],
    CONSTRAINT lesson_progress_name_locale_check CHECK (
        name ? 'ru' AND name ? 'kz'
    ),
    CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
