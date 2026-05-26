--
-- PostgreSQL database dump
--

\restrict RZ8PdudwE4biWmBOfsTNcXDnmTzG9xwesjDw7VUTM0v88Az5bicaAP41BxPztMO

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: atlas_schema_revisions; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA atlas_schema_revisions;


ALTER SCHEMA atlas_schema_revisions OWNER TO admin;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO admin;

--
-- Name: awards_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.awards_status AS ENUM (
    'DRAFT',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.awards_status OWNER TO admin;

--
-- Name: discipline_topic_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.discipline_topic_type AS ENUM (
    'SNZ',
    'PRACTICAL',
    'COMBINED'
);


ALTER TYPE public.discipline_topic_type OWNER TO admin;

--
-- Name: enum_criteria_method; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.enum_criteria_method AS ENUM (
    'NORMAL',
    'MEASURING'
);


ALTER TYPE public.enum_criteria_method OWNER TO admin;

--
-- Name: enum_lesson_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.enum_lesson_type AS ENUM (
    'PRACTICE',
    'THEORY'
);


ALTER TYPE public.enum_lesson_type OWNER TO admin;

--
-- Name: rups_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.rups_status AS ENUM (
    'DRAFT',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.rups_status OWNER TO admin;

--
-- Name: rups_type_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.rups_type_enum AS ENUM (
    'PRACTICE',
    'THEORY'
);


ALTER TYPE public.rups_type_enum OWNER TO admin;

--
-- Name: study_form_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.study_form_enum AS ENUM (
    'CORRESPONDENCE',
    'FULL_TIME'
);


ALTER TYPE public.study_form_enum OWNER TO admin;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'TEACHER',
    'METHODIST'
);


ALTER TYPE public.user_role OWNER TO admin;

--
-- Name: violation_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.violation_enum AS ENUM (
    'NONE',
    'REMARK',
    'REBUKE',
    'SEVERE_REPRIMAND'
);


ALTER TYPE public.violation_enum OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: atlas_schema_revisions; Type: TABLE; Schema: atlas_schema_revisions; Owner: admin
--

CREATE TABLE atlas_schema_revisions.atlas_schema_revisions (
    version character varying NOT NULL,
    description character varying NOT NULL,
    type bigint DEFAULT 2 NOT NULL,
    applied bigint DEFAULT 0 NOT NULL,
    total bigint DEFAULT 0 NOT NULL,
    executed_at timestamp with time zone NOT NULL,
    execution_time bigint NOT NULL,
    error text,
    error_stmt text,
    hash character varying NOT NULL,
    partial_hashes jsonb,
    operator_version character varying NOT NULL
);


ALTER TABLE atlas_schema_revisions.atlas_schema_revisions OWNER TO admin;

--
-- Name: award_categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    award_types uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    icon text,
    description jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT award_categories_description_locale_check CHECK (((description ? 'ru'::text) AND (description ? 'kz'::text))),
    CONSTRAINT award_categories_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.award_categories OWNER TO admin;

--
-- Name: award_category_fields; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_category_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    key text NOT NULL,
    label jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    type text NOT NULL,
    required boolean DEFAULT false NOT NULL,
    placeholder jsonb,
    help_text jsonb,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    validation jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT award_category_fields_help_text_locale_check CHECK (((help_text IS NULL) OR ((help_text ? 'ru'::text) AND (help_text ? 'kz'::text)))),
    CONSTRAINT award_category_fields_label_locale_check CHECK (((label ? 'ru'::text) AND (label ? 'kz'::text))),
    CONSTRAINT award_category_fields_placeholder_locale_check CHECK (((placeholder IS NULL) OR ((placeholder ? 'ru'::text) AND (placeholder ? 'kz'::text))))
);


ALTER TABLE public.award_category_fields OWNER TO admin;

--
-- Name: award_type_criteria; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_type_criteria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    points integer[],
    method public.enum_criteria_method NOT NULL,
    CONSTRAINT award_type_criteria_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.award_type_criteria OWNER TO admin;

--
-- Name: award_type_variants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_type_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    description jsonb,
    criteria uuid[],
    bonus_criteria uuid[],
    CONSTRAINT award_type_variants_description_locale_check CHECK (((description IS NULL) OR ((description ? 'ru'::text) AND (description ? 'kz'::text)))),
    CONSTRAINT award_type_variants_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.award_type_variants OWNER TO admin;

--
-- Name: award_types; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    variants uuid[],
    CONSTRAINT award_types_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.award_types OWNER TO admin;

--
-- Name: awards; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status public.awards_status NOT NULL,
    reason text,
    methodist uuid,
    teacher uuid,
    total_points integer DEFAULT 0 NOT NULL,
    type uuid,
    variant uuid,
    criteria uuid,
    bonus_criteria uuid,
    category_id uuid,
    field_values jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.awards OWNER TO admin;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.departments (
    keycloak_id uuid NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    users uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    CONSTRAINT departments_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.departments OWNER TO admin;

--
-- Name: discipline_semesters; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discipline_semesters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    semester integer NOT NULL,
    total_hours integer DEFAULT 0 NOT NULL,
    CONSTRAINT discipline_semesters_semester_check CHECK (((semester >= 1) AND (semester <= 8)))
);


ALTER TABLE public.discipline_semesters OWNER TO admin;

--
-- Name: discipline_topics; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discipline_topics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    type public.discipline_topic_type NOT NULL,
    lesson_id uuid,
    total_hours integer DEFAULT 0 NOT NULL,
    theory_hours integer DEFAULT 0 NOT NULL,
    practice_hours integer DEFAULT 0 NOT NULL,
    individual_hours integer DEFAULT 0 NOT NULL,
    srsp_hours integer DEFAULT 0 NOT NULL,
    srs_hours integer DEFAULT 0 NOT NULL,
    CONSTRAINT discipline_topics_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.discipline_topics OWNER TO admin;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.groups (
    keycloak_id uuid NOT NULL,
    name text NOT NULL,
    qualification jsonb,
    specialty jsonb,
    CONSTRAINT groups_qualification_locale_check CHECK (((qualification IS NULL) OR ((qualification ? 'ru'::text) AND (qualification ? 'kz'::text)))),
    CONSTRAINT groups_specialty_locale_check CHECK (((specialty IS NULL) OR ((specialty ? 'ru'::text) AND (specialty ? 'kz'::text))))
);


ALTER TABLE public.groups OWNER TO admin;

--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.lesson_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    first_time integer[] NOT NULL,
    second_time integer[] NOT NULL,
    third_time integer[] NOT NULL,
    content text[],
    CONSTRAINT lesson_progress_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.lesson_progress OWNER TO admin;

--
-- Name: lessons_plan_number_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.lessons_plan_number_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lessons_plan_number_seq OWNER TO admin;

--
-- Name: lessons; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rup_name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    discipline_name jsonb,
    topic_name jsonb,
    plan_number integer DEFAULT nextval('public.lessons_plan_number_seq'::regclass) NOT NULL,
    teacher uuid NOT NULL,
    event_date timestamp with time zone,
    group_id uuid NOT NULL,
    type public.enum_lesson_type NOT NULL,
    goals jsonb,
    tasks jsonb,
    expected jsonb,
    internet_resources uuid[],
    technical_resources uuid[],
    file_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lessons_discipline_name_locale_check CHECK (((discipline_name IS NULL) OR ((discipline_name ? 'ru'::text) AND (discipline_name ? 'kz'::text)))),
    CONSTRAINT lessons_expected_locale_check CHECK (((expected IS NULL) OR ((expected ? 'ru'::text) AND (expected ? 'kz'::text)))),
    CONSTRAINT lessons_goals_locale_check CHECK (((goals IS NULL) OR ((goals ? 'ru'::text) AND (goals ? 'kz'::text)))),
    CONSTRAINT lessons_rup_name_locale_check CHECK (((rup_name ? 'ru'::text) AND (rup_name ? 'kz'::text))),
    CONSTRAINT lessons_tasks_locale_check CHECK (((tasks IS NULL) OR ((tasks ? 'ru'::text) AND (tasks ? 'kz'::text)))),
    CONSTRAINT lessons_topic_name_locale_check CHECK (((topic_name IS NULL) OR ((topic_name ? 'ru'::text) AND (topic_name ? 'kz'::text))))
);


ALTER TABLE public.lessons OWNER TO admin;

--
-- Name: rup_disciplines; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rup_disciplines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    total_hours integer DEFAULT 0 NOT NULL,
    semesters uuid[],
    topics uuid[],
    CONSTRAINT rup_disciplines_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.rup_disciplines OWNER TO admin;

--
-- Name: rup_exploration_notes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rup_exploration_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basis jsonb,
    goals jsonb,
    summary jsonb,
    competencies jsonb,
    prerequisites jsonb,
    postrequisites jsonb,
    internet_resources uuid[],
    technical_resources uuid[],
    CONSTRAINT rup_exploration_notes_basis_locale_check CHECK (((basis IS NULL) OR ((basis ? 'ru'::text) AND (basis ? 'kz'::text)))),
    CONSTRAINT rup_exploration_notes_competencies_locale_check CHECK (((competencies IS NULL) OR ((competencies ? 'ru'::text) AND (competencies ? 'kz'::text)))),
    CONSTRAINT rup_exploration_notes_goals_locale_check CHECK (((goals IS NULL) OR ((goals ? 'ru'::text) AND (goals ? 'kz'::text)))),
    CONSTRAINT rup_exploration_notes_postrequisites_locale_check CHECK (((postrequisites IS NULL) OR ((postrequisites ? 'ru'::text) AND (postrequisites ? 'kz'::text)))),
    CONSTRAINT rup_exploration_notes_prerequisites_locale_check CHECK (((prerequisites IS NULL) OR ((prerequisites ? 'ru'::text) AND (prerequisites ? 'kz'::text)))),
    CONSTRAINT rup_exploration_notes_summary_locale_check CHECK (((summary IS NULL) OR ((summary ? 'ru'::text) AND (summary ? 'kz'::text))))
);


ALTER TABLE public.rup_exploration_notes OWNER TO admin;

--
-- Name: rup_resources; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rup_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    link text
);


ALTER TABLE public.rup_resources OWNER TO admin;

--
-- Name: rups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    status public.rups_status NOT NULL,
    reason text,
    course integer NOT NULL,
    study_form public.study_form_enum NOT NULL,
    study_year text NOT NULL,
    type public.rups_type_enum NOT NULL,
    total_hours integer DEFAULT 0 NOT NULL,
    contacts uuid[],
    group_ids text[],
    methodist uuid,
    teacher uuid,
    exploration_note_id uuid,
    disciplines uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rups_course_check CHECK (((course >= 1) AND (course <= 4))),
    CONSTRAINT rups_name_locale_check CHECK (((name ? 'ru'::text) AND (name ? 'kz'::text)))
);


ALTER TABLE public.rups OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    keycloak_id uuid NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    first_name text,
    last_name text,
    phone text,
    role public.user_role NOT NULL,
    rups text[],
    total_points integer DEFAULT 0 NOT NULL,
    awards text[],
    violation public.violation_enum DEFAULT 'NONE'::public.violation_enum NOT NULL,
    password_changed_at timestamp with time zone,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO admin;

--
-- Data for Name: atlas_schema_revisions; Type: TABLE DATA; Schema: atlas_schema_revisions; Owner: admin
--

COPY atlas_schema_revisions.atlas_schema_revisions (version, description, type, applied, total, executed_at, execution_time, error, error_stmt, hash, partial_hashes, operator_version) FROM stdin;
20260526110938		2	27	27	2026-05-26 11:09:45.337951+00	3497000			dZNeaaky0FMlezk191xnOJbUXBGDwTxZd6kIBkuDfT4=	null	Atlas CLI v1.2.1-e3beb27-canary
\.


--
-- Data for Name: award_categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_categories (id, award_types, name, icon, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: award_category_fields; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_category_fields (id, category_id, key, label, type, required, placeholder, help_text, options, validation, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: award_type_criteria; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_type_criteria (id, name, points, method) FROM stdin;
\.


--
-- Data for Name: award_type_variants; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_type_variants (id, name, description, criteria, bonus_criteria) FROM stdin;
\.


--
-- Data for Name: award_types; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_types (id, name, variants) FROM stdin;
\.


--
-- Data for Name: awards; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.awards (id, status, reason, methodist, teacher, total_points, type, variant, criteria, bonus_criteria, category_id, field_values, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.departments (keycloak_id, name, users) FROM stdin;
\.


--
-- Data for Name: discipline_semesters; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.discipline_semesters (id, semester, total_hours) FROM stdin;
\.


--
-- Data for Name: discipline_topics; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.discipline_topics (id, name, type, lesson_id, total_hours, theory_hours, practice_hours, individual_hours, srsp_hours, srs_hours) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.groups (keycloak_id, name, qualification, specialty) FROM stdin;
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.lesson_progress (id, lesson_id, name, first_time, second_time, third_time, content) FROM stdin;
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.lessons (id, rup_name, discipline_name, topic_name, plan_number, teacher, event_date, group_id, type, goals, tasks, expected, internet_resources, technical_resources, file_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rup_disciplines; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_disciplines (id, name, total_hours, semesters, topics) FROM stdin;
\.


--
-- Data for Name: rup_exploration_notes; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_exploration_notes (id, basis, goals, summary, competencies, prerequisites, postrequisites, internet_resources, technical_resources) FROM stdin;
\.


--
-- Data for Name: rup_resources; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_resources (id, name, link) FROM stdin;
\.


--
-- Data for Name: rups; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rups (id, name, status, reason, course, study_form, study_year, type, total_hours, contacts, group_ids, methodist, teacher, exploration_note_id, disciplines, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (keycloak_id, email, username, first_name, last_name, phone, role, rups, total_points, awards, violation, password_changed_at, last_seen_at, created_at, updated_at) FROM stdin;
\.


--
-- Name: lessons_plan_number_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.lessons_plan_number_seq', 1, false);


--
-- Name: atlas_schema_revisions atlas_schema_revisions_pkey; Type: CONSTRAINT; Schema: atlas_schema_revisions; Owner: admin
--

ALTER TABLE ONLY atlas_schema_revisions.atlas_schema_revisions
    ADD CONSTRAINT atlas_schema_revisions_pkey PRIMARY KEY (version);


--
-- Name: award_categories award_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.award_categories
    ADD CONSTRAINT award_categories_pkey PRIMARY KEY (id);


--
-- Name: award_category_fields award_category_fields_category_id_key_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.award_category_fields
    ADD CONSTRAINT award_category_fields_category_id_key_key UNIQUE (category_id, key);


--
-- Name: award_category_fields award_category_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.award_category_fields
    ADD CONSTRAINT award_category_fields_pkey PRIMARY KEY (id);


--
-- Name: award_type_criteria award_type_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.award_type_criteria
    ADD CONSTRAINT award_type_criteria_pkey PRIMARY KEY (id);


--
-- Name: award_type_variants award_type_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.award_type_variants
    ADD CONSTRAINT award_type_variants_pkey PRIMARY KEY (id);


--
-- Name: award_types award_types_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.award_types
    ADD CONSTRAINT award_types_pkey PRIMARY KEY (id);


--
-- Name: awards awards_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.awards
    ADD CONSTRAINT awards_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (keycloak_id);


--
-- Name: discipline_semesters discipline_semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discipline_semesters
    ADD CONSTRAINT discipline_semesters_pkey PRIMARY KEY (id);


--
-- Name: discipline_topics discipline_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discipline_topics
    ADD CONSTRAINT discipline_topics_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (keycloak_id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: rup_disciplines rup_disciplines_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rup_disciplines
    ADD CONSTRAINT rup_disciplines_pkey PRIMARY KEY (id);


--
-- Name: rup_exploration_notes rup_exploration_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rup_exploration_notes
    ADD CONSTRAINT rup_exploration_notes_pkey PRIMARY KEY (id);


--
-- Name: rup_resources rup_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rup_resources
    ADD CONSTRAINT rup_resources_pkey PRIMARY KEY (id);


--
-- Name: rups rups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rups
    ADD CONSTRAINT rups_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (keycloak_id);


--
-- Name: award_category_fields award_category_fields_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.award_category_fields
    ADD CONSTRAINT award_category_fields_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.award_categories(id) ON DELETE CASCADE;


--
-- Name: awards fk_award_category; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.awards
    ADD CONSTRAINT fk_award_category FOREIGN KEY (category_id) REFERENCES public.award_categories(id) ON DELETE RESTRICT;


--
-- Name: awards fk_award_methodist; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.awards
    ADD CONSTRAINT fk_award_methodist FOREIGN KEY (methodist) REFERENCES public.users(keycloak_id);


--
-- Name: lessons fk_lesson_groups; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT fk_lesson_groups FOREIGN KEY (group_id) REFERENCES public.groups(keycloak_id);


--
-- Name: lesson_progress fk_lesson_progress_lesson; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- Name: lessons fk_lesson_teacher; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT fk_lesson_teacher FOREIGN KEY (teacher) REFERENCES public.users(keycloak_id);


--
-- Name: rups fk_methodist; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rups
    ADD CONSTRAINT fk_methodist FOREIGN KEY (methodist) REFERENCES public.users(keycloak_id);


--
-- Name: rups fk_teacher; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rups
    ADD CONSTRAINT fk_teacher FOREIGN KEY (teacher) REFERENCES public.users(keycloak_id);


--
-- Name: rups rups_exploration_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rups
    ADD CONSTRAINT rups_exploration_note_id_fkey FOREIGN KEY (exploration_note_id) REFERENCES public.rup_exploration_notes(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict RZ8PdudwE4biWmBOfsTNcXDnmTzG9xwesjDw7VUTM0v88Az5bicaAP41BxPztMO

