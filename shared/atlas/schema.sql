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

    password_changed_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- GROUPS
-- =====================
CREATE TABLE groups (
    keycloak_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    qualification TEXT,
    specialty TEXT
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
    basis TEXT,
    goals TEXT,
    summary TEXT,
    competencies TEXT,

    prerequisites TEXT,
    postrequisites TEXT,

    internet_resources UUID[],
    technical_resources UUID[]
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
    name TEXT NOT NULL,
    type discipline_topic_type NOT NULL,
    lesson_id UUID,
    total_hours INT NOT NULL DEFAULT 0,
    theory_hours INT NOT NULL DEFAULT 0,
    practice_hours INT NOT NULL DEFAULT 0,
    individual_hours INT NOT NULL DEFAULT 0,
    srsp_hours INT NOT NULL DEFAULT 0,
    srs_hours INT NOT NULL DEFAULT 0
);

-- =====================
-- RUP DISCIPLINES
-- =====================


CREATE TABLE rup_disciplines (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    total_hours INT NOT NULL DEFAULT 0,

    semesters UUID[],
    topics UUID[]
);

-- =====================
-- RUPS
-- =====================


CREATE TABLE rups (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
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

    CONSTRAINT fk_methodist FOREIGN KEY (methodist) REFERENCES users(keycloak_id),
    CONSTRAINT fk_teacher FOREIGN KEY (teacher) REFERENCES users(keycloak_id)
);

-- =====================
-- AWARD TYPE CRITERIA
-- =====================
CREATE TABLE award_type_criteria (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    points INT[],
    method enum_criteria_method NOT NULL
);

-- =====================
-- AWARD TYPE VARIANTS
-- =====================
CREATE TABLE award_type_variants (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    criteria UUID[],
    bonus_criteria UUID[]
);

-- =====================
-- AWARD TYPES
-- =====================
CREATE TABLE award_types (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    variants UUID[]
);

-- =====================
-- AWARD CATEGORIES
-- =====================
CREATE TABLE award_categories (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    award_types UUID[] NOT NULL DEFAULT '{}',
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- AWARD CATEGORY FIELDS
-- =====================
CREATE TABLE award_category_fields (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES award_categories(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    placeholder TEXT,
    help_text TEXT,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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

CREATE TABLE lessons (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    rup_name TEXT NOT NULL,
    discipline_name TEXT,
    topic_name TEXT,
    teacher UUID NOT NULL,
    event_date TIMESTAMPTZ,
    group_id UUID NOT NULL,
    type enum_lesson_type NOT NULL,
    goals TEXT,
    tasks TEXT,
    expected TEXT,
    internet_resources UUID[],
    technical_resources UUID[],
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_lesson_teacher FOREIGN KEY (teacher) REFERENCES users(keycloak_id),
    CONSTRAINT fk_lesson_groups FOREIGN KEY (group_id) REFERENCES groups(keycloak_id)
);

-- =====================
-- LESSON PRACTICE
-- =====================

CREATE TABLE lesson_progress(
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL,
    name TEXT NOT NULL,
    start_minute INT[] NOT NULL,
    end_minute INT[] NOT NULL,
    content TEXT[],
    CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
