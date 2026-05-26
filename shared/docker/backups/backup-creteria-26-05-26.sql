--
-- PostgreSQL database dump
--

\restrict 2qn6OefixPPiQnIrt75j3oyikIwjrlVwxa0a34WOvasfFupkdnB7kKwMOKtHPeT

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

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

--
-- Name: kz_only_text(text); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.kz_only_text(src text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT public.locale_only_text(src, 'kz')
$$;


ALTER FUNCTION public.kz_only_text(src text) OWNER TO admin;

--
-- Name: locale_only_text(text, text); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.locale_only_text(src text, lang text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    current_text text;
    next_text text;
BEGIN
    IF src IS NULL THEN
        RETURN NULL;
    END IF;

    current_text := btrim(src);

    LOOP
        IF lang = 'ru' THEN
            next_text := regexp_replace(
                current_text,
                '([^/;\n—()]+?)\s*/\s*([^/;\n—()]+)',
                '\2',
                'g'
            );
        ELSE
            next_text := regexp_replace(
                current_text,
                '([^/;\n—()]+?)\s*/\s*([^/;\n—()]+)',
                '\1',
                'g'
            );
        END IF;

        EXIT WHEN next_text = current_text;
        current_text := next_text;
    END LOOP;

    current_text := regexp_replace(current_text, '\s+', ' ', 'g');
    current_text := regexp_replace(current_text, '\s+([,.;:])', '\1', 'g');
    current_text := regexp_replace(current_text, '\s*—\s*', ' — ', 'g');

    RETURN btrim(current_text);
END
$$;


ALTER FUNCTION public.locale_only_text(src text, lang text) OWNER TO admin;

--
-- Name: ru_locale(text); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.ru_locale(src text) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT jsonb_build_object(
    'ru', COALESCE(public.ru_only_text(src), ''),
    'kz', COALESCE(public.kz_only_text(src), '')
)
$$;


ALTER FUNCTION public.ru_locale(src text) OWNER TO admin;

--
-- Name: ru_only_text(text); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.ru_only_text(src text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT public.locale_only_text(src, 'ru')
$$;


ALTER FUNCTION public.ru_only_text(src text) OWNER TO admin;

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
-- Name: lessons; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rup_name jsonb DEFAULT '{"kz": "", "ru": ""}'::jsonb NOT NULL,
    discipline_name jsonb,
    topic_name jsonb,
    plan_number integer NOT NULL,
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
-- Name: lessons_plan_number_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.lessons_plan_number_seq OWNED BY public.lessons.plan_number;


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
-- Name: lessons plan_number; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.lessons ALTER COLUMN plan_number SET DEFAULT nextval('public.lessons_plan_number_seq'::regclass);


--
-- Data for Name: atlas_schema_revisions; Type: TABLE DATA; Schema: atlas_schema_revisions; Owner: admin
--

COPY atlas_schema_revisions.atlas_schema_revisions (version, description, type, applied, total, executed_at, execution_time, error, error_stmt, hash, partial_hashes, operator_version) FROM stdin;
20260522113730		2	25	25	2026-05-25 09:27:25.448549+00	542422			ocwdL4NgAVNPWFLFSExsow4aF10erF6yM37JjRuz1wQ=	null	Atlas CLI v1.0.1-538fbdb-canary
20260525090000		2	2	2	2026-05-25 09:27:25.818787+00	540546			c5SWv20Pfj1afdDg+sxRuQY2wCOukWF0swzVC2x3R/g=	null	Atlas CLI v1.0.1-538fbdb-canary
\.


--
-- Data for Name: award_categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_categories (id, award_types, name, icon, description, created_at, updated_at) FROM stdin;
cced00d7-ee5f-48c9-8fd8-e885ad6bffcb	{155f99cb-ff4c-4e0f-8ee1-677e4b7c4f52}	{"kz": "Алғыс хаттар", "ru": "Благодарственные письма"}	handshake	{"kz": "", "ru": ""}	2026-05-25 11:53:07.09105+00	2026-05-25 11:53:07.09105+00
44444444-4444-4444-8444-444444444447	{29ff7f54-4af4-4537-a520-1b4931c01035}	{"kz": "Оқу-әдістемелік материалдар", "ru": "Учебно-методические материалы"}	book	{"kz": "", "ru": ""}	2026-05-20 12:42:03.004591+00	2026-05-25 11:57:06.557032+00
44444444-4444-4444-8444-444444444448	{769415c0-4041-4205-95cf-6c0059d5af30}	{"kz": "Сыныпты басқару/кураторлық", "ru": "Кураторство"}	graduation-cap	{"kz": "", "ru": ""}	2026-05-20 12:42:03.004591+00	2026-05-25 11:59:07.248284+00
44444444-4444-4444-8444-444444444441	{571d169a-e25b-4349-b65a-b56ca1aaa6b0,67f54cb3-903e-4945-b10d-4b65ce8b6cd7}	{"kz": "Білім сапасы", "ru": "Качество знаний"}	brain	{"kz": "Пәндер бойынша оқу үлгерімі мен білім сапасының көрсеткіштері", "ru": "Показатели успеваемости и качества знаний по дисциплинам"}	2026-05-20 12:42:03.004591+00	2026-05-25 11:16:21.718664+00
c871b6aa-ec1a-411a-aac5-da24fa217f35	{21c41e1d-c906-4212-8194-005a5ee16e12,6b8e7106-a4e9-4ee6-b7c0-a057e28ced2b,49b98075-79b8-4c1e-95d2-9f373a0a1210}	{"kz": "Жарыстар мен байқаулардың нәтижелері", "ru": "Результаты конкурсов и соревнований"}	award	{"kz": "", "ru": ""}	2026-05-25 11:27:35.302646+00	2026-05-25 11:27:35.302646+00
44444444-4444-4444-8444-444444444443	{cc112dd3-73fe-4eb1-8d2c-fa4dfa3f80ff,1392839e-d0ce-4d20-bb2a-42aba7eb797c}	{"kz": "Тәжірибе және өнімділік трансляциясы", "ru": "Трансляция практики и выступления"}	presentation	{"kz": "", "ru": ""}	2026-05-20 12:42:03.004591+00	2026-05-25 11:32:16.487078+00
44444444-4444-4444-8444-444444444445	{f1c11505-b54f-4037-8414-444417b1c5d5,a9d73920-e039-4662-8ccf-0d95a4fc4105}	{"kz": "Жарияланымдар", "ru": "Публикации"}	book-open	{"kz": "", "ru": ""}	2026-05-20 12:42:03.004591+00	2026-05-25 11:43:20.563956+00
44444444-4444-4444-8444-444444444446	{cfd0371e-6e3e-463a-bab8-64eef5d29ea5}	{"kz": "Участие в группах, проектах", "ru": "Участие в группах, проектах"}	users	{"kz": "Работа в комиссиях, группах и проектных командах", "ru": ""}	2026-05-20 12:42:03.004591+00	2026-05-25 11:46:52.712183+00
\.


--
-- Data for Name: award_category_fields; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_category_fields (id, category_id, key, label, type, required, placeholder, help_text, options, validation, sort_order, created_at, updated_at) FROM stdin;
04f53dd8-c65c-4ea5-b46d-84db3d926654	44444444-4444-4444-8444-444444444446	title	{"kz": "Жарияланым файлен тиркеңиз", "ru": "Наименование рабочей группы"}	text	t	{"kz": "Название проекта или комиссии", "ru": ""}	\N	[]	{"maxLength": 150, "minLength": 5}	1	2026-05-25 11:46:52.745254+00	2026-05-25 11:46:52.745254+00
e343d90b-8d66-44b4-8956-ae83be142f6b	44444444-4444-4444-8444-444444444446	event_date	{"kz": "Күн", "ru": "Дата"}	date	t	{"kz": "Выберите дату", "ru": "Выберите дату"}	\N	[]	{}	2	2026-05-25 11:46:52.755531+00	2026-05-25 11:46:52.755531+00
d30567c0-36a4-48e8-98f5-80c6b2679d2f	44444444-4444-4444-8444-444444444446	activity_type	{"kz": "Әрекет түрі", "ru": "Вид деятельности"}	text	t	\N	\N	[]	{"maxLength": 100, "minLength": 5}	3	2026-05-25 11:46:52.775427+00	2026-05-25 11:46:52.775427+00
d1fee6cf-abf5-4437-89b7-5687aef1d850	44444444-4444-4444-8444-444444444446	url	{"kz": "Материалға сілтеме", "ru": "Ccылка на материал"}	url	f	\N	\N	[]	{}	4	2026-05-25 11:46:52.784809+00	2026-05-25 11:46:52.784809+00
35502a6b-c6d2-4188-8b42-f81287f759a4	44444444-4444-4444-8444-444444444446	scan_file	{"kz": "Тапсырыс файлын сканерлеу", "ru": "Скан файла приказа"}	file	f	\N	\N	[]	{}	5	2026-05-25 11:46:52.794402+00	2026-05-25 11:46:52.794402+00
ae78d343-e831-4b49-8723-09c33c971c62	44444444-4444-4444-8444-444444444447	title	{"kz": "Материал атауы", "ru": "Название материала"}	text	t	{"kz": "Название разработки", "ru": "Название разработки"}	\N	[]	{"maxLength": 100, "minLength": 5}	1	2026-05-25 11:57:06.585681+00	2026-05-25 11:57:06.585681+00
8fc6ac54-4349-4348-9992-71282733912b	44444444-4444-4444-8444-444444444447	event_date	{"kz": "Жасалу күні", "ru": "Дата создания"}	date	t	{"kz": "Выберите дату", "ru": "Выберите дату"}	\N	[]	{}	2	2026-05-25 11:57:06.597826+00	2026-05-25 11:57:06.597826+00
cdc8fdce-b801-4678-8753-696c5c2602e5	44444444-4444-4444-8444-444444444447	book_number	{"kz": "Бірегей кітап басылымының нөмірі", "ru": "Уникальный номер книжного издания"}	text	t	\N	\N	[]	{"maxLength": 100, "minLength": 5}	3	2026-05-25 11:57:06.607879+00	2026-05-25 11:57:06.607879+00
eb3a9c3f-b15d-4f67-b7bc-183de52a7bdf	44444444-4444-4444-8444-444444444447	material_type	{"kz": "Материал түрі", "ru": "Тип материала"}	text	t	\N	\N	[]	{"maxLength": 100, "minLength": 5}	4	2026-05-25 11:57:06.616589+00	2026-05-25 11:57:06.616589+00
60da0f10-e6d2-4511-9510-13add60692d5	44444444-4444-4444-8444-444444444447	url	{"kz": "Материалға сілтеме", "ru": "Ссылка на материал"}	url	f	\N	\N	[]	{}	5	2026-05-25 11:57:06.628381+00	2026-05-25 11:57:06.628381+00
1dfa72d0-2fef-4200-9959-dd2985538029	44444444-4444-4444-8444-444444444447	scan_file	{"kz": "Тапсырыс файлын сканерлеу", "ru": "Скан файла приказа"}	file	f	\N	\N	[]	{"maxSizeMb": 75, "mimeTypes": ["application/pdf", "image/webp", "image/jpeg", "image/jpeg", "image/png", "text/csv", "text/plain", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/gif", "image/bmp", "image/svg+xml"], "extensions": ["pdf", "webp", "jpeg", "jpg", "png", "csv", "txt", "pptx", "ppt", "xlsx", "xls", "doc", "docx", "gif", "bmp", "svg"]}	6	2026-05-25 11:57:06.639785+00	2026-05-25 11:57:06.639785+00
f75bb38a-615e-41b3-acb5-fd479f224e00	44444444-4444-4444-8444-444444444447	extract	{"kz": "Хаттамадан үзінді", "ru": "Выписка из протокола"}	text	t	\N	\N	[]	{"maxLength": 100, "minLength": 5}	7	2026-05-25 11:57:06.649918+00	2026-05-25 11:57:06.649918+00
372ff0fb-4cf9-4da6-82e8-ba50364b65bc	44444444-4444-4444-8444-444444444447	material_recommended	{"kz": "Ұсынылған материал", "ru": "Материал рекомендован"}	text	t	\N	\N	[]	{"maxLength": 150, "minLength": 5}	8	2026-05-25 11:57:06.658546+00	2026-05-25 11:57:06.658546+00
8a0834bc-d3f3-48e5-bcb3-3ef663b68054	cced00d7-ee5f-48c9-8fd8-e885ad6bffcb	name	{"kz": "Ұсынған ұйымның атауы", "ru": "Наименование организации вручителя"}	text	f	\N	\N	[]	{"maxLength": 150, "minLength": 5}	1	2026-05-25 11:53:07.109666+00	2026-05-25 11:53:07.109666+00
e7551868-a889-4526-8efc-b4d5b3ea18a3	cced00d7-ee5f-48c9-8fd8-e885ad6bffcb	date	{"kz": "Жеткізу күні", "ru": "Дата вручения"}	date	f	\N	\N	[]	{}	2	2026-05-25 11:53:07.129735+00	2026-05-25 11:53:07.129735+00
f5cb19c7-e4ac-4172-86aa-fada56acf3c6	cced00d7-ee5f-48c9-8fd8-e885ad6bffcb	file	{"kz": "файл", "ru": "файл"}	file	f	\N	\N	[]	{"maxSizeMb": 20, "mimeTypes": ["application/pdf", "image/png", "image/jpeg", "image/jpeg", "image/webp"], "extensions": ["pdf", "png", "jpg", "jpeg", "webp"]}	3	2026-05-25 11:53:07.143785+00	2026-05-25 11:53:07.143785+00
4696f588-3543-4bc1-a7f9-713e6a97d5bb	44444444-4444-4444-8444-444444444448	year	{"kz": "Оқу жылы", "ru": "Учебный год"}	select	t	\N	\N	["2024-2025", "2025-2026"]	{}	1	2026-05-25 11:59:07.285081+00	2026-05-25 11:59:07.285081+00
44b7323a-bbe2-4680-a361-37112d91b07f	44444444-4444-4444-8444-444444444448	file	{"kz": "Тапсырыс файлы", "ru": "Файл приказа"}	file	f	\N	\N	[]	{"maxSizeMb": 20, "mimeTypes": ["application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/plain", "image/png", "text/csv", "image/jpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "application/msword", "image/webp", "image/gif", "image/bmp", "image/svg+xml"], "extensions": ["pdf", "pptx", "ppt", "xlsx", "xls", "txt", "png", "csv", "jpg", "docx", "jpeg", "doc", "webp", "gif", "bmp", "svg"]}	2	2026-05-25 11:59:07.295193+00	2026-05-25 11:59:07.295193+00
915ace46-bbdf-4549-a7f6-59ce5121a9af	44444444-4444-4444-8444-444444444448	url	{"kz": "Материалға сілтеме", "ru": "Ссылка на материал"}	url	f	\N	\N	[]	{}	3	2026-05-25 11:59:07.301895+00	2026-05-25 11:59:07.301895+00
6a7b0508-cf24-45c8-b185-5a4d251e4875	44444444-4444-4444-8444-444444444441	study_year	{"kz": "Оқу жылы", "ru": "Учебный год"}	select	t	{"kz": "Мысалы: 2025-2026 жж", "ru": "Например: 2025-2026"}	\N	["2024-2025", "2025-2026"]	{}	1	2026-05-25 11:16:21.745769+00	2026-05-25 11:16:21.745769+00
f91262c0-91a4-4636-9203-01da2a6a0919	44444444-4444-4444-8444-444444444441	performance_percent	{"kz": "Білім сапасы, %", "ru": "Качество знаний, %"}	number	t	{"kz": "Мысалы: 89", "ru": "Например: 89"}	{"kz": "Білім сапасын 0%-дан 100%-ға дейін пайызбен көрсетіңіз", "ru": "укажите качество знаний в процентах от 0% до 100%"}	[]	{"max": 100, "min": 0}	2	2026-05-25 11:16:21.756482+00	2026-05-25 11:16:21.756482+00
b13eb479-e606-407e-afef-edbcceb422c9	44444444-4444-4444-8444-444444444441	material_url	{"kz": "Материалға сілтеме", "ru": "Ссылка на материал"}	url	f	\N	\N	[]	{}	3	2026-05-25 11:16:21.765799+00	2026-05-25 11:16:21.765799+00
7a2ce85f-142f-4e59-8845-f1cc709d07b8	44444444-4444-4444-8444-444444444441	scan_file	{"kz": "Тапсырыс файлын сканерлеу", "ru": "Скан файла приказа"}	file	f	{"kz": "Тапсырыс файлын сканерлеу", "ru": "Скан файла приказа"}	\N	[]	{"maxSizeMb": 75, "mimeTypes": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/png", "image/jpeg", "image/jpeg", "image/webp"], "extensions": ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "webp"]}	4	2026-05-25 11:16:21.773259+00	2026-05-25 11:16:21.773259+00
6601974d-5c3e-40de-9366-793006747f06	c871b6aa-ec1a-411a-aac5-da24fa217f35	year	{"kz": "учебный год", "ru": "учебный год"}	select	f	\N	\N	["2024-2025", "2025-2026"]	{}	1	2026-05-25 11:27:35.318931+00	2026-05-25 11:27:35.318931+00
921a3994-ae3b-42f0-82be-882877631bf5	c871b6aa-ec1a-411a-aac5-da24fa217f35	name	{"kz": "жарыстың атауы", "ru": "наименование конкурса"}	text	f	\N	\N	[]	{"maxLength": 300, "minLength": 5}	2	2026-05-25 11:27:35.332168+00	2026-05-25 11:27:35.332168+00
0a685892-c04f-48f1-b138-be7a207913a9	c871b6aa-ec1a-411a-aac5-da24fa217f35	category	{"kz": "конкурсқа қатысушының санаты", "ru": "категория участника конкурса"}	select	f	\N	\N	["для педагогов", "для студентов"]	{}	3	2026-05-25 11:27:35.34093+00	2026-05-25 11:27:35.34093+00
01fa8b0b-012e-4377-858a-73f7938ea522	c871b6aa-ec1a-411a-aac5-da24fa217f35	fullName	{"kz": "Қатысушының толық аты-жөні", "ru": "ФИО участника"}	text	f	\N	\N	[]	{"maxLength": 100, "minLength": 5}	4	2026-05-25 11:27:35.357776+00	2026-05-25 11:27:35.357776+00
60e06a3d-0982-4a26-ade1-533e2fe94184	c871b6aa-ec1a-411a-aac5-da24fa217f35	file	{"kz": "сертификаты, дипломы, грамоты", "ru": "сертификаты, дипломы, грамоты"}	file	f	\N	\N	[]	{"maxSizeMb": 16, "mimeTypes": ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/png", "image/jpeg", "image/jpeg", "image/webp"], "extensions": ["pdf", "ppt", "pptx", "png", "jpg", "jpeg", "webp"]}	5	2026-05-25 11:27:35.369438+00	2026-05-25 11:27:35.369438+00
475d542f-9157-49dd-b8af-21be98c4bcca	44444444-4444-4444-8444-444444444443	translation_form	{"kz": "Трансляция формасы", "ru": "Форма трансляции"}	text	t	{"kz": "Например: Мастер-класс по Docker", "ru": "Например: Мастер-класс по Docker"}	\N	[]	{"maxLength": 100, "minLength": 5}	1	2026-05-25 11:32:16.517875+00	2026-05-25 11:32:16.517875+00
7f8c3836-831b-411a-9112-0f2724774527	44444444-4444-4444-8444-444444444443	event_date	{"kz": "Күн", "ru": "Дата проведения"}	date	t	{"kz": "Выберите дату", "ru": "Выберите дату"}	\N	[]	{}	2	2026-05-25 11:32:16.536385+00	2026-05-25 11:32:16.536385+00
0064a041-c075-4be6-9174-2251bcba692f	44444444-4444-4444-8444-444444444445	title	{"kz": "Жарияланым атауы", "ru": "Название публикации"}	text	t	{"kz": "Название статьи или материала", "ru": "Название статьи или материала"}	\N	[]	{}	1	2026-05-25 11:43:20.595375+00	2026-05-25 11:43:20.595375+00
938e6038-5ea4-46ea-8bb3-a236915764a1	44444444-4444-4444-8444-444444444445	event_date	{"kz": "Жарияланған күні", "ru": "Дата публикации"}	date	t	{"kz": "Выберите дату", "ru": "Выберите дату"}	\N	[]	{}	2	2026-05-25 11:43:20.603812+00	2026-05-25 11:43:20.603812+00
fe461428-a27e-44a8-a2a0-fea10773494d	44444444-4444-4444-8444-444444444445	study_year	{"kz": "Оқу жылы", "ru": "Учебный год"}	select	t	{"kz": "Например: 2025-2026", "ru": "Например: 2025-2026"}	\N	["2024-2025", "2025-2026"]	{}	3	2026-05-25 11:43:20.616748+00	2026-05-25 11:43:20.616748+00
fc662265-09a6-4f61-942d-a9b960b5a4ff	44444444-4444-4444-8444-444444444445	publication_number	{"kz": "Жарияланым нөмірі", "ru": "Номер публикации"}	text	t	{"kz": "Номер публикации", "ru": "Номер публикации"}	\N	[]	{}	4	2026-05-25 11:43:20.627485+00	2026-05-25 11:43:20.627485+00
b5fbee7d-7ecd-4d9f-9c80-64b02f86be17	44444444-4444-4444-8444-444444444445	proof_file	{"kz": "Жарияланым файлы", "ru": "Файл публикации"}	file	f	\N	{"kz": "PDF, DOCX, скриншот", "ru": "PDF, DOCX, скриншот"}	[]	{}	5	2026-05-25 11:43:20.637551+00	2026-05-25 11:43:20.637551+00
755f1df3-51c2-4a37-b81c-76285eb932b7	44444444-4444-4444-8444-444444444445	publication_place	{"kz": "Жарияланымға сілтеме", "ru": "Ссылка на публикацию"}	url	f	{"kz": "https://...", "ru": "https://..."}	\N	[]	{}	6	2026-05-25 11:43:20.645709+00	2026-05-25 11:43:20.645709+00
0f3ce435-366d-4914-907b-bae3deaa120f	44444444-4444-4444-8444-444444444445	level	{"kz": "Шығарылым", "ru": "Издание"}	text	t	{"kz": "Укажите издание", "ru": "Укажите издание"}	\N	[]	{"maxLength": 150, "minLength": 5}	7	2026-05-25 11:43:20.654342+00	2026-05-25 11:43:20.654342+00
d1131c83-4041-4f0d-95ce-28286f80cf7a	44444444-4444-4444-8444-444444444445	authors	{"kz": "Авторлар және бірлескен авторлар", "ru": "Авторство и соавторы"}	text	f	{"kz": "ФИО авторов", "ru": "ФИО авторов"}	\N	[]	{"maxLength": 300, "minLength": 5}	8	2026-05-25 11:43:20.662553+00	2026-05-25 11:43:20.662553+00
0525ca9a-1ef5-4a62-a13d-74a0673a23c8	44444444-4444-4444-8444-444444444445	name	{"kz": "Автордың толық аты-жөні (бірлескен автор)", "ru": "ФИО автора(соавтора)"}	text	t	{"kz": "Дополнительная информация", "ru": "Дополнительная информация"}	\N	[]	{"maxLength": 150, "minLength": 5}	9	2026-05-25 11:43:20.671164+00	2026-05-25 11:43:20.671164+00
bd007d63-2b0e-4450-b6e5-40c7b2457260	44444444-4444-4444-8444-444444444445	url	{"kz": "Материалға сілтеме беріңіз", "ru": "Укажите ссылку на материал"}	url	f	\N	\N	[]	{}	10	2026-05-25 11:43:20.679375+00	2026-05-25 11:43:20.679375+00
f5a238bd-1344-410a-ac6f-b6572edcca41	44444444-4444-4444-8444-444444444445	file	{"kz": "Жарияланым файлын тіркеңіз", "ru": "Прикрепите файл публикации"}	file	f	\N	\N	[]	{"maxSizeMb": 50, "mimeTypes": ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/svg+xml", "image/bmp", "image/gif", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain", "text/csv", "image/png", "image/jpeg", "image/jpeg", "image/webp"], "extensions": ["pdf", "docx", "doc", "xls", "xlsx", "svg", "bmp", "gif", "ppt", "pptx", "txt", "csv", "png", "jpg", "jpeg", "webp"]}	11	2026-05-25 11:43:20.687995+00	2026-05-25 11:43:20.687995+00
\.


--
-- Data for Name: award_type_criteria; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_type_criteria (id, name, points, method) FROM stdin;
639da9c7-fa6d-4998-82b7-edbffeacd5cf	{"kz": "ПОӘКМКД (теория және тәжірибетеория и практика)", "ru": "УМКД ( теория и практика)"}	{1,2,3}	MEASURING
7fb47243-2423-4d03-983c-a31452ccf2ea	{"kz": "ҰТО тест тапсырмаларын әзірлеу немесе сараптамадан өткізуРазработка или экспертиза тестовых заданий НЦТ", "ru": "Разработка или экспертиза тестовых заданий НЦТ"}	{10}	NORMAL
7949fddc-75d2-4b41-bb82-67c2dc671c22	{"kz": "Әдістемелік құралдарды құрастыруРазработка методических пособий — колледжішіліквнутриколледжный", "ru": "Разработка методических пособий — внутриколледжный"}	{10}	NORMAL
6d9f6738-14bc-4b3c-8070-3e1856444bfc	{"kz": "Әдістемелік құралдарды құрастыруРазработка методических пособий — қалалықгородской", "ru": "Разработка методических пособий — городской"}	{15}	NORMAL
f65d1a9a-c546-4ce8-b88f-0375667e7da0	{"kz": "Әдістемелік құралдарды құрастыруРазработка методических пособий — республикалықреспубликанский", "ru": "Разработка методических пособий — республиканский"}	{20}	NORMAL
7bd3128d-0bff-47d1-a3a3-19d8f90a735f	{"kz": "Білім беру бағдарламаларын құрастыруРазработка образовательных программ — колледжішіліквнутриколледжный", "ru": "Разработка образовательных программ — внутриколледжный"}	{10}	NORMAL
d2543007-1077-4335-a10e-f866fbd7b331	{"kz": "Білім беру бағдарламаларын құрастыруРазработка образовательных программ — қалалықгородской", "ru": "Разработка образовательных программ — городской"}	{15}	NORMAL
27905d14-4c4e-4dd2-ac3d-10770ff6e1d5	{"kz": "Білім беру бағдарламаларын құрастыруРазработка образовательных программ — республикалықреспубликанский", "ru": "Разработка образовательных программ — республиканский"}	{20}	NORMAL
70ecf794-d776-4842-9994-4dcb149f7306	{"kz": "Оқу құралы және оқулықУчебное пособие и учебники — колледжішіліквнутриколледжный", "ru": "Учебное пособие и учебники — внутриколледжный"}	{10}	NORMAL
d1266b7f-0f12-4167-a610-474badfcd6e1	{"kz": "Оқу құралы және оқулықУчебное пособие и учебники — қалалықгородской", "ru": "Учебное пособие и учебники — городской"}	{15}	NORMAL
f00a1242-7539-448e-928b-76c0328a73a5	{"kz": "Оқу құралы және оқулықУчебное пособие и учебники — республикалықреспубликанский", "ru": "Учебное пособие и учебники — республиканский"}	{20}	NORMAL
6a49355a-9a52-4603-b58a-d7e41f710017	{"kz": "Колледж ұсынған курстарКурсы по рекомендации колледжа", "ru": "Курсы по рекомендации колледжа"}	{3}	NORMAL
37bed84f-6737-47d2-b87f-fe452af78cee	{"kz": "Жетекші жеткізуші вендорлардың онлайн курстарыOnline-курсы ведущих вендоров", "ru": "Online-курсы ведущих вендоров"}	{5}	NORMAL
f0ec0010-fa44-4ecb-985d-d867b00aefc5	{"kz": "Кәсіби курстарПрофессиональные курсы", "ru": "Профессиональные курсы"}	{10}	NORMAL
79e2894f-5fc6-44ab-996d-5c3ef79421c9	{"kz": "Тағылымдамадан өтуСтажировка", "ru": "Стажировка"}	{15}	NORMAL
3fb68ced-600b-4f99-8b21-2d64f6ecadac	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқуВыступление с докладом — колледжішіліквнутриколледжный", "ru": "ғ Выступление с докладом — внутриколледжный"}	{3}	NORMAL
b0bbee70-da6e-40da-a82e-02883d3b1dd8	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқуВыступление с докладом — қалалықгородской", "ru": "ғ Выступление с докладом — городской"}	{3}	NORMAL
1d649de5-2fcf-49e7-9647-6e5e50a46228	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқуВыступление с докладом — республикалықреспубликанский", "ru": "ғ Выступление с докладом — республиканский"}	{5}	NORMAL
0ca580f4-5e06-4f30-8ba0-f5e7e8f999ed	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқуВыступление с докладом — халықаралықмеждународный", "ru": "ғ Выступление с докладом — международный"}	{10}	NORMAL
bc8da914-3923-45d8-8816-90d24c74331e	{"kz": "Педагогикалық оқудаПедагогические чтения — колледжішіліквнутриколледжный", "ru": "Педагогические чтения — внутриколледжный"}	{2}	NORMAL
dca716c2-c7c6-44ff-9c73-cd729b922778	{"kz": "Педагогикалық оқудаПедагогические чтения — қалалықгородской", "ru": "Педагогические чтения — городской"}	{3}	NORMAL
cb9f9528-644f-4de1-b658-7682e2c0efb3	{"kz": "Педагогикалық оқудаПедагогические чтения — республикалықреспубликанский", "ru": "Педагогические чтения — республиканский"}	{5}	NORMAL
bd2c992f-20ea-45ee-b3d5-3d324576edb9	{"kz": "Педагогикалық оқудаПедагогические чтения — халықаралықмеждународный", "ru": "Педагогические чтения — международный"}	{10}	NORMAL
ba6d61fe-7495-4da0-9697-3e0b213a09fc	{"kz": "Кәсіби конкурсқа қатысуУчастие в профессиональном конкурсе — қалалықгородской, жүлделі орынпризовое место", "ru": "Участие в профессиональном конкурсе — призовое место"}	{7}	MEASURING
705cbe86-0cb1-4ab6-9a0f-c7debfa8ade0	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалануИспользование интернет-сайтов и социальных сетей — колледжішіліквнутриколледжный", "ru": "Использование интернет-сайтов и социальных сетей — внутриколледжный"}	{3}	NORMAL
ac6b2fb7-5f72-4d6d-a589-6a1354379227	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалануИспользование интернет-сайтов и социальных сетей — қалалықгородской", "ru": "Использование интернет-сайтов и социальных сетей — городской"}	{3}	NORMAL
36e64dc9-90fd-4484-b52a-905f19362952	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалануИспользование интернет-сайтов и социальных сетей — республикалықреспубликанский", "ru": "Использование интернет-сайтов и социальных сетей — республиканский"}	{5}	NORMAL
6cd99e5c-d8d7-4a8e-a92e-85408ea98bec	{"kz": "Бөлім отырысында баяндамаВыступление с докладом на заседании отделения", "ru": "Выступление с докладом на заседании отделения"}	{2}	NORMAL
acf29256-e407-4a5a-bbef-4a6fec094f3c	{"kz": "Жас мамандар мектебінде қатысуУчастие в работе ШМП", "ru": "Участие в работе ШМП"}	{3}	NORMAL
505e6922-2aaf-4b36-ba34-a4ee30aaffa9	{"kz": "Педагогикалық кеңесте қатысуУчастие в педагогическом совете", "ru": "Участие в педагогическом совете"}	{5}	NORMAL
855e0a0d-d69c-4b2a-8e84-b997c9649f32	{"kz": "Әдістемелік кеңесте қатысуУчастие в методическом совете", "ru": "Участие в методическом совете"}	{5}	NORMAL
113c79b1-0e8c-41b1-b261-ac88418ef10e	{"kz": "Газет, журнал беттеріне мақала жариялауПубликация материалов в газетах, журналах — қалалықгородской", "ru": "Публикация материалов в газетах, журналах — городской"}	{2}	NORMAL
d574a7ad-2d7e-4e31-b1cc-a1bede0115d1	{"kz": "Газет, журнал беттеріне мақала жариялауПубликация материалов в газетах, журналах — республикалықреспубликанский", "ru": "Публикация материалов в газетах, журналах — республиканский"}	{3}	NORMAL
14891c75-bb53-43d8-aeae-073445e0c8cf	{"kz": "Газет, журнал беттеріне мақала жариялауПубликация материалов в газетах, журналах — халықаралықмеждународный", "ru": "Публикация материалов в газетах, журналах — международный"}	{5}	NORMAL
3a9ccd3d-ce1a-4210-828f-e0618a3803bf	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беруИнтервью для СМИ — қалалықгородской", "ru": "Интервью для СМИ — городской"}	{3}	NORMAL
5c660b60-b35a-49ff-8fb7-7f5f3feed3b5	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беруИнтервью для СМИ — республикалықреспубликанский", "ru": "Интервью для СМИ — республиканский"}	{5}	NORMAL
0bde55d9-982f-457c-bab6-683d1672ad07	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беруИнтервью для СМИ — халықаралықмеждународный", "ru": "Интервью для СМИ — международный"}	{7}	NORMAL
1414c62b-b5a4-46e5-9837-a8b6e5933470	{"kz": "Почетная грамота, грамота, благодарственное письмо педагога — колледжішіліквнутриколледжный", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — внутриколледжный"}	{2}	MEASURING
17116163-0863-47de-b324-16b381237b99	{"kz": "Почетная грамота, грамота, благодарственное письмо педагога — қалалықгородской", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — городской"}	{3}	MEASURING
bc06b16e-9e1d-40d4-b26c-d190e5f77f5c	{"kz": "Почетная грамота, грамота, благодарственное письмо педагога — республикалықреспубликанский", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — республиканский"}	{5}	MEASURING
e56219a4-d171-47c3-aa79-7df4f0bc178d	{"kz": "Почетная грамота, грамота, благодарственное письмо педагога — халықаралықмеждународный", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — международный"}	{10}	MEASURING
14de3e47-2f7a-4b21-912b-662b00152f4b	{"kz": "Кәсіби конкурсқа қатысуУчастие в профессиональном конкурсе — колледжішіліквнутриколледжный, қатысқаны үшінза участие", "ru": "Участие в профессиональном конкурсе — за участие"}	{2}	MEASURING
ed265ae3-d3f3-4e1b-9991-7551023b0d63	{"kz": "Кәсіби конкурсқа қатысуУчастие в профессиональном конкурсе — колледжішіліквнутриколледжный, жүлделі орынпризовое место", "ru": "Участие в профессиональном конкурсе — призовое место"}	{3}	MEASURING
39f7fd28-71df-422a-aeba-1bb5953d7cf4	{"kz": "Кәсіби конкурсқа қатысуУчастие в профессиональном конкурсе — қалалықгородской, қатысқаны үшінза участие", "ru": "Участие в профессиональном конкурсе — за участие"}	{5}	MEASURING
b1cd2a87-c266-4a76-8048-30d894efef7d	{"kz": "Қоғамдық іс-шараға қатыспауыНеучастие в общественном мероприятии", "ru": "Неучастие в общественном мероприятии"}	{-5}	NORMAL
2c231dd4-0610-4d92-90d5-603068ffd7eb	{"kz": "Кәсіби конкурсқа қатысуУчастие в профессиональном конкурсе — республикалықреспубликанский, қатысқаны үшінза участие", "ru": "Участие в профессиональном конкурсе — за участие"}	{10}	MEASURING
e1c558c5-89d9-47aa-babc-54fef45043f6	{"kz": "Кәсіби конкурсқа қатысуУчастие в профессиональном конкурсе — республикалықреспубликанский, жүлделі орынпризовое место", "ru": "Участие в профессиональном конкурсе — призовое место"}	{13}	MEASURING
b8a50b06-39e4-4a0b-8e4a-afe44a3e6fc3	{"kz": "Кәсіби конкурсқа қатысуУчастие в профессиональном конкурсе — халықаралықмеждународный, қатысқаны үшінза участие", "ru": "Участие в профессиональном конкурсе — за участие"}	{15}	MEASURING
4f9d594b-dea2-46f5-b13d-53d63cd270df	{"kz": "Кәсіби конкурсқа қатысуУчастие в профессиональном конкурсе — халықаралықмеждународный, жүлделі орынпризовое место", "ru": "Участие в профессиональном конкурсе — призовое место"}	{20}	MEASURING
f614ea13-c7c4-4e97-be30-e3f2d8adb306	{"kz": "WorldSkills чемпионатына қатысуУчастие в чемпионате WorldSkills — колледжішіліквнутриколледжный, қатысқаны үшінза участие", "ru": "Участие в чемпионате WorldSkills — за участие"}	{3}	NORMAL
7a2a2c38-f760-4064-b3ea-0fd86cec04ec	{"kz": "WorldSkills чемпионатына қатысуУчастие в чемпионате WorldSkills — колледжішіліквнутриколледжный, жүлделі орынпризовое место", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{5}	NORMAL
8588d1c1-6b2c-4640-8222-ec13942fb657	{"kz": "WorldSkills чемпионатына қатысуУчастие в чемпионате WorldSkills — аймақтықрегиональный, қатысқаны үшінза участие", "ru": "Участие в чемпионате WorldSkills — за участие"}	{7}	NORMAL
34093ee6-82ae-47cc-8902-75c02d63658e	{"kz": "WorldSkills чемпионатына қатысуУчастие в чемпионате WorldSkills — аймақтықрегиональный, жүлделі орынпризовое место", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{10}	NORMAL
59c6db2e-71ca-420f-b13c-f4014cb0cf7c	{"kz": "WorldSkills чемпионатына қатысуУчастие в чемпионате WorldSkills — ұлттықнациональный, қатысқаны үшінза участие", "ru": "Участие в чемпионате WorldSkills — за участие"}	{12}	NORMAL
d0d01793-bca4-4e78-8dc9-24b79f8a9f36	{"kz": "WorldSkills чемпионатына қатысуУчастие в чемпионате WorldSkills — ұлттықнациональный, жүлделі орынпризовое место", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{15}	NORMAL
cb00b063-b955-4f37-b684-cc82ea04866d	{"kz": "WorldSkills чемпионатына қатысуУчастие в чемпионате WorldSkills — халықаралықмеждународный, қатысқаны үшінза участие", "ru": "Участие в чемпионате WorldSkills — за участие"}	{15}	NORMAL
8fb706f5-cc3a-4f7f-860c-38465cd549e1	{"kz": "WorldSkills чемпионатына қатысуУчастие в чемпионате WorldSkills — халықаралықмеждународный, жүлделі орынпризовое место", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{20}	NORMAL
283ebcc1-c076-4d5e-991a-eda5ba2d0328	{"kz": "Ашық сабақ өткізуПроведение открытого урока — колледжішіліквнутриколледжный", "ru": "Проведение открытого урока — внутриколледжный"}	{5}	NORMAL
20e14862-30e0-412a-b7a8-67707543e882	{"kz": "Ашық сабақ өткізуПроведение открытого урока — қалалықгородской", "ru": "Проведение открытого урока — городской"}	{10}	NORMAL
bacc82f2-e69c-4ae3-b069-8b960a5504c5	{"kz": "Ашық сабақ өткізуПроведение открытого урока — республикалықреспубликанский", "ru": "Проведение открытого урока — республиканский"}	{15}	NORMAL
b535983b-4bf5-468b-970d-becf207b3940	{"kz": "Ашық сабақ өткізуПроведение открытого урока — халықаралықмеждународный", "ru": "Проведение открытого урока — международный"}	{20}	NORMAL
22a621ab-a192-4c1e-b31e-456ca89481a1	{"kz": "Әріптестердің сабағына қатысуПосещение уроков коллег — әр қатысқан сабақкаждый посещенный урок", "ru": "Посещение уроков коллег — каждый посещенный урок"}	{1}	MEASURING
74f5c3c2-ca39-4d85-99b9-c5a3c45ecbf0	{"kz": "Топ жетекшілігіКураторство", "ru": "Кураторство"}	{10}	NORMAL
c08c9f39-7997-4435-83ce-a7911d7ff860	{"kz": "Ашық тәрбие сағаттарыОткрытые воспитательные часы", "ru": "Открытые воспитательные часы"}	{10}	NORMAL
ccce52db-cbc3-4b02-afde-11cd79717c2b	{"kz": "Топтың ішкі тәртіп ережелерін сақтауыСоблюдение правил внутреннего распорядка группой", "ru": "Соблюдение правил внутреннего распорядка группой"}	{5}	NORMAL
d8857c30-5b6f-43e3-8b8f-51ef4483dfea	{"kz": "Топтың ішкі тәртіп ережелерін сақтамауыНесоблюдение правил внутреннего распорядка группой", "ru": "Несоблюдение правил внутреннего распорядка группой"}	{-5}	NORMAL
0774a4ff-a167-40a9-bf1c-c63701235682	{"kz": "Топтың қоғамдық жұмысқа белсене қатысуыАктивное участие группы в общественной работе", "ru": "Активное участие группы в общественной работе"}	{5}	NORMAL
bd058db8-29e5-486a-adb4-7978da355d36	{"kz": "қалалық - қатысқаны үшін", "ru": "городской - за участие"}	{5}	NORMAL
8c0ecf29-d56b-42d2-9961-d8b72ce640d2	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуыУчастие студентов в конкурсах совместно с руководителем группы — колледжішіліквнутриколледжный", "ru": "Участие студентов в конкурсах совместно с руководителем группы — внутриколледжный"}	{5}	NORMAL
78b2c4e2-cb12-4b87-9f32-b03fbce5c604	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуыУчастие студентов в конкурсах совместно с руководителем группы — қалалықгородской", "ru": "Участие студентов в конкурсах совместно с руководителем группы — городской"}	{10}	NORMAL
03bb9c28-6fec-44e7-ad8c-b1bc06fc379d	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуыУчастие студентов в конкурсах совместно с руководителем группы — республикалықреспубликанский", "ru": "Участие студентов в конкурсах совместно с руководителем группы — республиканский"}	{15}	NORMAL
4eef0ede-ebd7-4d79-8a00-da8b1d6f7d86	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуыУчастие студентов в конкурсах совместно с руководителем группы — халықаралықмеждународный", "ru": "Участие студентов в конкурсах совместно с руководителем группы — международный"}	{20}	NORMAL
6c834875-d192-4096-9430-ef1e7e7cc336	{"kz": "Сабақтан тыс ашық іс-шара өткізуПроведение открытого внеклассного мероприятия — колледжішіліквнутриколледжный", "ru": "Проведение открытого внеклассного мероприятия — внутриколледжный"}	{5}	MEASURING
18a974a6-d07e-4554-bbe8-2863fc9e103a	{"kz": "Сабақтан тыс ашық іс-шара өткізуПроведение открытого внеклассного мероприятия — қалалықгородской", "ru": "Проведение открытого внеклассного мероприятия — городской"}	{10}	MEASURING
86d1f51d-8376-4298-bd45-10357018164c	{"kz": "Сабақтан тыс ашық іс-шара өткізуПроведение открытого внеклассного мероприятия — республикалықреспубликанский", "ru": "Проведение открытого внеклассного мероприятия — республиканский"}	{15}	MEASURING
5f2efc32-2221-4032-8964-179e7be5a799	{"kz": "Сабақтан тыс ашық іс-шара өткізуПроведение открытого внеклассного мероприятия — халықаралықмеждународный", "ru": "Проведение открытого внеклассного мероприятия — международный"}	{20}	MEASURING
8b993be3-76fb-45e4-9c25-a9394ccbf290	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуыРуководство работой студентов и призовые места — колледжішіліквнутриколледжный", "ru": "Руководство работой студентов и призовые места — внутриколледжный"}	{5}	MEASURING
17a318d6-dbe6-4d62-90bb-3318bd744dde	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуыРуководство работой студентов и призовые места — қалалықгородской", "ru": "Руководство работой студентов и призовые места — городской"}	{10}	MEASURING
0d25e36c-70c4-4c58-9f60-43953be01bde	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуыРуководство работой студентов и призовые места — республикалықреспубликанский", "ru": "Руководство работой студентов и призовые места — республиканский"}	{15}	MEASURING
67dacb0c-4891-4e49-8722-0e965b0e6b40	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуыРуководство работой студентов и призовые места — халықаралықмеждународный", "ru": "Руководство работой студентов и призовые места — международный"}	{20}	MEASURING
30d22cb7-0281-4b0b-a7d3-280eea9229cf	{"kz": "Өндіріс орындарымен меморандум орнатуыЗаключение меморандума с предприятиями — Жеке кәсіпкерИндивидуальный предприниматель", "ru": "Заключение меморандума с предприятиями — Индивидуальный предприниматель"}	{5}	NORMAL
08a75692-f99c-43b7-9244-61440414279c	{"kz": "Өндіріс орындарымен меморандум орнатуыЗаключение меморандума с предприятиями — ЖШСТоварищество с ограниченной ответственностью", "ru": "Заключение меморандума с предприятиями — Товарищество с ограниченной ответственностью"}	{10}	NORMAL
4b44604a-ffdb-45f4-9084-f1f3c8072c7e	{"kz": "Өндіріс орындарымен меморандум орнатуыЗаключение меморандума с предприятиями — АҚАкционерное общество", "ru": "Заключение меморандума с предприятиями — Акционерное общество"}	{15}	NORMAL
3f7df369-945d-4304-9e1a-dadac2caf070	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саныКоличество школ, охваченных профориентационной работой — 1 мектеп1 школа", "ru": "Количество школ, охваченных профориентационной работой — 1 школа"}	{2}	NORMAL
0c716092-ff35-46b9-8f52-96accb2289ab	{"kz": "қалалық - жүлделі орын", "ru": "городской - за призовое место"}	{7}	NORMAL
d7020872-4b7d-47e5-ba23-3282fe63258a	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саныКоличество школ, охваченных профориентационной работой — 2 мектеп2 школы", "ru": "Количество школ, охваченных профориентационной работой — 2 школы"}	{3}	NORMAL
9eb0e6ba-3f47-4d87-89d4-d79875b56e3f	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саныКоличество школ, охваченных профориентационной работой — 3 мектеп және одан көп3 школы и более", "ru": "Количество школ, охваченных профориентационной работой — 3 школы и более"}	{5}	NORMAL
eaab6486-ca32-4fb8-905b-bc469d5a2895	{"kz": "Іс-шараларды медиялық сүйемелдеуМедийное сопровождение мероприятий: публикация в СМИ, YouTube, Instagram и т.д.", "ru": "Медийное сопровождение мероприятий: публикация в СМИ, YouTube, Instagram и т.д."}	{2}	NORMAL
885f6769-1bc8-42bd-808b-b3e446db7190	{"kz": "ЕскертуЗамечание", "ru": "Замечание"}	{-10}	NORMAL
898798e8-2987-49e6-af6b-de897a972b0b	{"kz": "СөгісВыговор", "ru": "Выговор"}	{-20}	NORMAL
128eb7c3-f996-41fd-9694-8fa87ed0976f	{"kz": "Қатаң сөгісСтрогий выговор", "ru": "Строгий выговор"}	{-30}	NORMAL
0ee1600f-10fd-4e4a-a2df-43433346a7cd	{"kz": "ПОӘКМКД (теория және тәжірибетеория и практика)", "ru": "УМКД ( теория и практика)"}	{1,2,3}	MEASURING
c020162e-be92-46d7-9090-0eafbc91cefc	{"kz": "ҰТО тест тапсырмаларын әзірлеу немесе сараптамадан өткізу", "ru": "Разработка или экспертиза тестовых заданий НЦТ"}	{10}	NORMAL
8fd6a02b-55b5-4a4a-a8bd-20a0c5954f63	{"kz": "Әдістемелік құралдарды құрастыру — колледжішілік", "ru": "Разработка методических пособий — внутриколледжный"}	{10}	NORMAL
71cb6fcd-cb70-4440-9e1c-c99afac8bafa	{"kz": "Әдістемелік құралдарды құрастыру — қалалық", "ru": "Разработка методических пособий — городской"}	{15}	NORMAL
62ea0709-1859-40cf-9566-fcf9d3d154ca	{"kz": "Әдістемелік құралдарды құрастыру — республикалық", "ru": "Разработка методических пособий — республиканский"}	{20}	NORMAL
faab429b-8a2d-4b14-b71f-c228da605a95	{"kz": "Білім беру бағдарламаларын құрастыру — колледжішілік", "ru": "Разработка образовательных программ — внутриколледжный"}	{10}	NORMAL
48bdfeac-1d19-4d39-b598-1a3e4acf162e	{"kz": "Білім беру бағдарламаларын құрастыру— қалалық", "ru": "Разработка образовательных программ — городской"}	{15}	NORMAL
0413d294-a689-4b75-9543-9e479266bd31	{"kz": "Білім беру бағдарламаларын құрастыру— республикалық", "ru": "Разработка образовательных программ — республиканский"}	{20}	NORMAL
04d165b7-b93a-4d48-9913-327a4fb4032c	{"kz": "Оқу құралы және оқулық — колледжішілік", "ru": "Учебное пособие и учебники — внутриколледжный"}	{10}	NORMAL
8360397b-5993-46c1-b9e4-c06194129c94	{"kz": "Оқу құралы және оқулық — қалалық", "ru": "Учебное пособие и учебники — городской"}	{15}	NORMAL
09257288-70ae-497f-9677-baaec29b5033	{"kz": "Оқу құралы және оқулық — республикалық", "ru": "Учебное пособие и учебники — республиканский"}	{20}	NORMAL
c00c8e0d-396e-400a-89eb-5dfb067e8a08	{"kz": "Колледж ұсынған курстар", "ru": "Курсы по рекомендации колледжа"}	{3}	NORMAL
7d557937-038e-4ad6-af91-28edc1695b22	{"kz": "Жетекші жеткізуші вендорлардың онлайн курстары", "ru": "Online-курсы ведущих вендоров"}	{5}	NORMAL
ce83b6d2-aa94-4204-bc1b-e6e43731627f	{"kz": "Кәсіби курстар", "ru": "Профессиональные курсы"}	{10}	NORMAL
3acfcf28-8576-4677-9d32-66106c3e8680	{"kz": "Тағылымдамадан өту", "ru": "Стажировка"}	{15}	NORMAL
5ea3e36a-bd4a-4861-9abf-6ddf4b3248df	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу", "ru": "ғ Выступление с докладом — внутриколледжный"}	{3}	NORMAL
d71104b3-4e32-4954-8232-fec383f20fd0	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу — қалалық", "ru": "ғ Выступление с докладом — городской"}	{3}	NORMAL
cb01f45d-5832-46c1-b844-479704455468	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу — республикалық", "ru": "ғ Выступление с докладом — республиканский"}	{5}	NORMAL
20398831-98fb-4863-bb2d-f160e991b049	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу — халықаралық", "ru": "ғ Выступление с докладом — международный"}	{10}	NORMAL
78dd4716-b4a9-4eba-a590-4979e287ffa0	{"kz": "Педагогикалық оқуда — колледжішілік", "ru": "Педагогические чтения — внутриколледжный"}	{2}	NORMAL
dc068ab7-4c76-4ef1-b8d2-4a5a09057e5c	{"kz": "Педагогикалық оқуда — қалалық", "ru": "Педагогические чтения — городской"}	{3}	NORMAL
1acb04cb-2613-4dc1-99ae-153525ad7e92	{"kz": "Педагогикалық оқуда — республикалық", "ru": "Педагогические чтения — республиканский"}	{5}	NORMAL
849690e6-bf20-43d9-81b9-478fdbf32176	{"kz": "Педагогикалық оқуда — халықаралық", "ru": "Педагогические чтения — международный"}	{10}	NORMAL
773ad48d-e934-4612-b4d9-87616a168b1a	{"kz": "3 мектеп", "ru": "3 школы и более"}	{5}	NORMAL
f1895709-f59a-4301-a17e-315fd37842c9	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану — колледжішілік", "ru": "Использование интернет-сайтов и социальных сетей — внутриколледжный"}	{3}	NORMAL
cbc5882e-8883-4f4f-84fc-9024bdda3bc8	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану — қалалық", "ru": "Использование интернет-сайтов и социальных сетей — городской"}	{3}	NORMAL
81b4d22b-d578-4fe6-a622-b322db755c5e	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану — республикалық", "ru": "Использование интернет-сайтов и социальных сетей — республиканский"}	{5}	NORMAL
9760abae-1489-434f-9668-c51d4913bbd4	{"kz": "Бөлім отырысында баяндама", "ru": "Выступление с докладом на заседании отделения"}	{2}	NORMAL
cad5f755-627c-4868-a452-1d05caa135ef	{"kz": "Жас мамандар мектебінде қатысу", "ru": "Участие в работе ШМП"}	{3}	NORMAL
da3775f0-6d08-4bb0-8c21-74a315ec4b48	{"kz": "Педагогикалық кеңесте қатысу", "ru": "Участие в педагогическом совете"}	{5}	NORMAL
019e532a-140b-489e-92b7-b8020c53b5d5	{"kz": "Әдістемелік кеңесте қатысу", "ru": "Участие в методическом совете"}	{5}	NORMAL
aec42060-9bcd-409f-85a2-7171a9f57a92	{"kz": "Газет, журнал беттеріне мақала жариялау — қалалық", "ru": "Публикация материалов в газетах, журналах — городской"}	{2}	NORMAL
09f84eab-8ca9-409a-8333-fa298687bf9e	{"kz": "Газет, журнал беттеріне мақала жариялау — республикалық", "ru": "Публикация материалов в газетах, журналах — республиканский"}	{3}	NORMAL
3acc5e16-ebf3-4fc3-9f27-adeca476abfb	{"kz": "Газет, журнал беттеріне мақала жариялау — халықаралық", "ru": "Публикация материалов в газетах, журналах — международный"}	{5}	NORMAL
24baf163-bda6-4b36-b375-621e13fd92dc	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беру — қалалық", "ru": "Интервью для СМИ — городской"}	{3}	NORMAL
8bb02fcb-d166-4bea-8cab-847da77711af	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беру — республикалық", "ru": "Интервью для СМИ — республиканский"}	{5}	NORMAL
72b5889c-bbe1-4ee3-9874-9beb04931a4d	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беру — халықаралық", "ru": "Интервью для СМИ — международный"}	{7}	NORMAL
cdb92250-26c5-426f-bd00-fe744b64eb03	{"kz": "Мұғалімнің Құрмет грамотасы, грамотасы, алғыс хаты — колледжішілік", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — внутриколледжный"}	{0,2}	MEASURING
abeb4f03-5a2c-4c32-9083-0ac8b2d98414	{"kz": "Мұғалімнің Құрмет грамотасы, грамотасы, алғыс хаты — қалалық", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — городской"}	{0,4}	MEASURING
10751f96-80a8-4fc7-adb6-8c7575c35247	{"kz": "Мұғалімнің Құрмет грамотасы, грамотасы, алғыс хаты — республикалық", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — республиканский"}	{0,2}	MEASURING
acd6339e-fa66-4835-9918-13700309d439	{"kz": "Мұғалімнің Құрмет грамотасы, грамотасы, алғыс хаты — халықаралық", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — международный"}	{0,10}	MEASURING
b381bbe5-5740-438d-ae9f-997217fa0791	{"kz": "Кәсіби конкурсқа қатысу — колледжішілік, қатысқаны үшінза", "ru": "Участие в профессиональном конкурсе — за участие"}	{2}	MEASURING
7d831d52-6b4d-4931-a53e-8d984bb56ed6	{"kz": "Кәсіби конкурсқа қатысу — колледжішілік, жүлделі орын", "ru": "Участие в профессиональном конкурсе — призовое место"}	{3}	MEASURING
67453126-1b07-4fb3-a3eb-9c5622c4ba9d	{"kz": "Кәсіби конкурсқа қатысу — қалалық, қатысқаны үшінза", "ru": "Участие в профессиональном конкурсе — за участие"}	{5}	MEASURING
e541d6fc-4b6b-4183-94f7-c7fda2dfa479	{"kz": "Кәсіби конкурсқа қатысу — қалалық, жүлделі орын", "ru": "Участие в профессиональном конкурсе — призовое место"}	{7}	MEASURING
ded68b5f-0795-4589-b7a5-5becdd7a1ecd	{"kz": "Кәсіби конкурсқа қатысу — республикалық, қатысқаны үшінза", "ru": "Участие в профессиональном конкурсе — за участие"}	{10}	MEASURING
07250fd4-fd5b-461c-989c-20a85b80fe16	{"kz": "Кәсіби конкурсқа қатысу — республикалық, жүлделі орын", "ru": "Участие в профессиональном конкурсе — призовое место"}	{13}	MEASURING
1873ca51-ddbf-4572-bf2d-9a4afcc1479b	{"kz": "Кәсіби конкурсқа қатысу — халықаралық, қатысқаны үшінза", "ru": "Участие в профессиональном конкурсе — за участие"}	{15}	MEASURING
fccae323-a76c-4ead-9cca-9ba8f8649bdb	{"kz": "Кәсіби конкурсқа қатысу — халықаралық, жүлделі орын", "ru": "Участие в профессиональном конкурсе — призовое место"}	{20}	MEASURING
393a497d-269f-42c6-b267-f2c20689e2ae	{"kz": "WorldSkills чемпионатына қатысу — колледжішілік, қатысқаны үшінза", "ru": "Участие в чемпионате WorldSkills — за участие"}	{3}	NORMAL
29c7d72d-bf47-4991-a841-3a452ec2a8e9	{"kz": "WorldSkills чемпионатына қатысу — колледжішілік, жүлделі орын", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{5}	NORMAL
88cb78a4-068e-4635-88d9-94137a43334c	{"kz": "WorldSkills чемпионатына қатысу — аймақтық, қатысқаны үшінза", "ru": "Участие в чемпионате WorldSkills — за участие"}	{7}	NORMAL
d6fa8126-8359-41ea-a9da-67d8706d6219	{"kz": "WorldSkills чемпионатына қатысу — аймақтықрегиональный, жүлделі орын", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{10}	NORMAL
caad9e66-185c-4ab4-8c1a-50f9911376be	{"kz": "WorldSkills чемпионатына қатысу — ұлттықнациональный, қатысқаны үшінза", "ru": "Участие в чемпионате WorldSkills — за участие"}	{12}	NORMAL
45cacf94-2b49-4ff5-ba24-abf438fc8bbd	{"kz": "WorldSkills чемпионатына қатысу — ұлттық, жүлделі орын", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{15}	NORMAL
73a3f05e-b68c-4952-bb62-7df7b627a1b7	{"kz": "WorldSkills чемпионатына қатысу — халықаралық, қатысқаны үшінза", "ru": "Участие в чемпионате WorldSkills — за участие"}	{15}	NORMAL
59473940-7561-415f-81ce-fdaa271cd185	{"kz": "WorldSkills чемпионатына қатысу — халықаралық, жүлделі орын", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{20}	NORMAL
ec743c61-9d81-4c51-8341-f7a3030edcef	{"kz": "Ашық сабақ өткізу — колледжішілік", "ru": "Проведение открытого урока — внутриколледжный"}	{5}	NORMAL
59a511bc-bf6f-4cbd-a415-d90ac0e42579	{"kz": "Ашық сабақ өткізу — қалалық", "ru": "Проведение открытого урока — городской"}	{10}	NORMAL
d957773d-7902-47cb-b6bc-a0c2156be31f	{"kz": "Ашық сабақ өткізу — республикалық", "ru": "Проведение открытого урока — республиканский"}	{15}	NORMAL
0ad69602-7fd5-4051-9243-262eda9c5d05	{"kz": "Ашық сабақ өткізу — халықаралық", "ru": "Проведение открытого урока — международный"}	{20}	NORMAL
dac7dfea-b29c-4d3f-bfb4-e3eac91bfe97	{"kz": "Әріптестердің сабағына қатысу — әр қатысқан сабақ", "ru": "Посещение уроков коллег — каждый посещенный урок"}	{1}	MEASURING
9b08f93d-e707-4697-81d4-9febf1d0b5a6	{"kz": "Топ жетекшілігі", "ru": "Кураторство"}	{10}	NORMAL
7d929709-6df3-4c97-abd4-f15802ec1261	{"kz": "Ашық тәрбие сағаттары", "ru": "Открытые воспитательные часы"}	{10}	NORMAL
1cbe764c-c698-4742-b117-e62810064660	{"kz": "Топтың ішкі тәртіп ережелерін сақтауы", "ru": "Соблюдение правил внутреннего распорядка группой"}	{5}	NORMAL
9aa21ec9-b1f0-4bdc-affd-144786b0aed1	{"kz": "Топтың ішкі тәртіп ережелерін сақтамауы", "ru": "Несоблюдение правил внутреннего распорядка группой"}	{5}	NORMAL
1efa3fe5-288c-4bbd-8a22-c257dce580c5	{"kz": "Топтың қоғамдық жұмысқа белсене қатысуы", "ru": "Активное участие группы в общественной работе"}	{5}	NORMAL
4cd0397e-d638-44fb-bb3b-8f2fa63f2c24	{"kz": "Қоғамдық іс-шараға қатыспауыНеучастие в общественном мероприятии", "ru": "Неучастие в общественном мероприятии"}	{5}	NORMAL
d5e99c44-08d5-43a8-a65a-1993a184c9cc	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуы — колледжішілік", "ru": "Участие студентов в конкурсах совместно с руководителем группы — внутриколледжный"}	{5}	NORMAL
6de619f9-7bc3-4670-a0ed-57b8209247e5	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуы — қалалық", "ru": "Участие студентов в конкурсах совместно с руководителем группы — городской"}	{10}	NORMAL
540d8471-2c82-49a8-a13c-84bd5577c5fa	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуы — республикалық", "ru": "Участие студентов в конкурсах совместно с руководителем группы — республиканский"}	{15}	NORMAL
690cc3ca-e9f7-47c8-94a1-d65c345b9348	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуы — халықаралық", "ru": "Участие студентов в конкурсах совместно с руководителем группы — международный"}	{20}	NORMAL
5de3c203-db24-4ba5-b2fb-3d064824c073	{"kz": "Сабақтан тыс ашық іс-шара өткізу — колледжішілік", "ru": "Проведение открытого внеклассного мероприятия — внутриколледжный"}	{5}	MEASURING
f84318ba-efd3-41c7-a6cf-05561ddbe085	{"kz": "Сабақтан тыс ашық іс-шара өткізу — қалалық", "ru": "Проведение открытого внеклассного мероприятия — городской"}	{10}	MEASURING
5be7f8c5-5883-459d-95cc-4a71bb3c6909	{"kz": "Сабақтан тыс ашық іс-шара өткізу — республикалық", "ru": "Проведение открытого внеклассного мероприятия — республиканский"}	{15}	MEASURING
66b94c8e-1962-4cd5-adfa-36a76f77192c	{"kz": "Сабақтан тыс ашық іс-шара өткізу — халықаралық", "ru": "Проведение открытого внеклассного мероприятия — международный"}	{20}	MEASURING
54927a51-d8d0-43e0-b12c-67b22c06687c	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — колледжішілік", "ru": "Руководство работой студентов и призовые места — внутриколледжный"}	{5}	MEASURING
acb5b62d-6c66-4268-9a4c-60269b0b2515	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — қалалық", "ru": "Руководство работой студентов и призовые места — городской"}	{10}	MEASURING
ee7e9637-e6fb-4136-9f38-be2cd224e205	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — республикалық", "ru": "Руководство работой студентов и призовые места — республиканский"}	{15}	MEASURING
c6bd88ed-dc29-4197-8dec-d161564d5cf4	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — халықаралық", "ru": "Руководство работой студентов и призовые места — международный"}	{20}	MEASURING
8b990e44-b78f-46e1-8f5b-ca9b0dd133bd	{"kz": "Өндіріс орындарымен меморандум орнатуы — Жеке кәсіпкер", "ru": "Заключение меморандума с предприятиями — Индивидуальный предприниматель"}	{5}	NORMAL
9757bfc1-1483-4ab7-8830-0c14b34ffcb1	{"kz": "Өндіріс орындарымен меморандум орнатуы — ЖШС", "ru": "Заключение меморандума с предприятиями — Товарищество с ограниченной ответственностью"}	{10}	NORMAL
6f2e6ede-d63b-4a99-99ed-e589d56cd7dd	{"kz": "Өндіріс орындарымен меморандум орнатуы — АҚ", "ru": "Заключение меморандума с предприятиями — Акционерное общество"}	{15}	NORMAL
5ef47696-a804-4949-af0c-00e9ef159f87	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны — 1 мектеп", "ru": "Количество школ, охваченных профориентационной работой — 1 школа"}	{2}	NORMAL
71368ae1-fcce-43ff-9f7b-8f816fe8067f	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны — 2 мектеп", "ru": "Количество школ, охваченных профориентационной работой — 2 школы"}	{3}	NORMAL
1dc3c8b6-d629-46fb-990d-eca5209997d7	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны — 3 мектеп және одан көп", "ru": "Количество школ, охваченных профориентационной работой — 3 школы и более"}	{5}	NORMAL
ca4b7cf9-c56c-4b46-b862-297e5cc2f0dc	{"kz": "Іс-шараларды медиялық сүйемелдеу: СМИ, YouTube, Instagram и т.д.", "ru": "Медийное сопровождение мероприятий: публикация в СМИ, YouTube, Instagram и т.д."}	{2}	NORMAL
10ba3520-f56b-4d47-983d-aa379f144f0c	{"kz": "ПОӘКМКД (теория және тәжірибетеория и практика)", "ru": "УМКД ( теория и практика)"}	{1,2,3}	MEASURING
455e5daa-ed45-4d53-b685-9531394b3799	{"kz": "ҰТО тест тапсырмаларын әзірлеу немесе сараптамадан өткізу", "ru": "Разработка или экспертиза тестовых заданий НЦТ"}	{10}	NORMAL
3a26da29-12e7-4878-a9cf-06be0d0a5087	{"kz": "Әдістемелік құралдарды құрастыру — колледжішілік", "ru": "Разработка методических пособий — внутриколледжный"}	{10}	NORMAL
0690903b-f1b5-4353-b7ab-750e8b32bd79	{"kz": "Әдістемелік құралдарды құрастыру — қалалық", "ru": "Разработка методических пособий — городской"}	{15}	NORMAL
be2b989f-d95f-47c0-a6c7-e69947c27244	{"kz": "Әдістемелік құралдарды құрастыру — республикалық", "ru": "Разработка методических пособий — республиканский"}	{20}	NORMAL
942944cb-34e7-4758-836b-b4eac0b9802e	{"kz": "Білім беру бағдарламаларын құрастыру — колледжішілік", "ru": "Разработка образовательных программ — внутриколледжный"}	{10}	NORMAL
c0ca2778-ab79-4d2a-b98d-6a3e7ccf7aee	{"kz": "Білім беру бағдарламаларын құрастыру— қалалық", "ru": "Разработка образовательных программ — городской"}	{15}	NORMAL
e0bf2f55-1c86-4fc8-a857-d997ae3f4431	{"kz": "Білім беру бағдарламаларын құрастыру— республикалық", "ru": "Разработка образовательных программ — республиканский"}	{20}	NORMAL
340744f9-d520-4d51-918e-a0b7d9c0ae15	{"kz": "Оқу құралы және оқулық — колледжішілік", "ru": "Учебное пособие и учебники — внутриколледжный"}	{10}	NORMAL
07e0aa61-0255-4bea-8caa-56d98f07cfbd	{"kz": "Оқу құралы және оқулық — қалалық", "ru": "Учебное пособие и учебники — городской"}	{15}	NORMAL
ba7a04b9-2bb4-407d-86d2-3e813b6d6712	{"kz": "Оқу құралы және оқулық — республикалық", "ru": "Учебное пособие и учебники — республиканский"}	{20}	NORMAL
00ce83e1-48d3-4da5-83d7-a5aa25f4f7e4	{"kz": "Колледж ұсынған курстар", "ru": "Курсы по рекомендации колледжа"}	{3}	NORMAL
4de3a488-5081-4df4-8afe-d30ce9580c14	{"kz": "Жетекші жеткізуші вендорлардың онлайн курстары", "ru": "Online-курсы ведущих вендоров"}	{5}	NORMAL
172c50cb-97c4-4e4a-b21d-82f4075a65b4	{"kz": "Кәсіби курстар", "ru": "Профессиональные курсы"}	{10}	NORMAL
b01bfe6b-03bc-4c9d-b5fb-95bb50c85d8b	{"kz": "Тағылымдамадан өту", "ru": "Стажировка"}	{15}	NORMAL
c9bab99d-2bde-47ee-847f-8cd2e783b757	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу", "ru": "ғ Выступление с докладом — внутриколледжный"}	{3}	NORMAL
e80efe42-57de-4994-bc21-63e0db9d5d55	{"kz": "республикалық - қатысқаны үшін", "ru": "республиканский - за участие"}	{10}	NORMAL
86d71fb2-1367-4d38-b4d5-40d3f6259746	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу — қалалық", "ru": "ғ Выступление с докладом — городской"}	{3}	NORMAL
c28e93a0-4c27-492f-bb71-b7c4ba9c7a54	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу — республикалық", "ru": "ғ Выступление с докладом — республиканский"}	{5}	NORMAL
82c8c5da-1673-4ab1-9e93-9fc66eafd199	{"kz": "Ғылымиылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу — халықаралық", "ru": "ғ Выступление с докладом — международный"}	{10}	NORMAL
38e58ee7-0757-4575-9898-f2eb42637073	{"kz": "Педагогикалық оқуда — колледжішілік", "ru": "Педагогические чтения — внутриколледжный"}	{2}	NORMAL
a562e7ea-b2e6-49e6-903d-63b1f55d5017	{"kz": "Педагогикалық оқуда — қалалық", "ru": "Педагогические чтения — городской"}	{3}	NORMAL
70438f32-0860-45db-82bd-25979eb47fb8	{"kz": "Педагогикалық оқуда — республикалық", "ru": "Педагогические чтения — республиканский"}	{5}	NORMAL
6fb5f98f-839c-4aca-919e-5b58768c9742	{"kz": "Педагогикалық оқуда — халықаралық", "ru": "Педагогические чтения — международный"}	{10}	NORMAL
76a87a29-dbd4-48fc-8de0-9d009ea89a71	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану — колледжішілік", "ru": "Использование интернет-сайтов и социальных сетей — внутриколледжный"}	{3}	NORMAL
7c260cb0-eeb1-45b3-9661-7c4b3c0badbd	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану — қалалық", "ru": "Использование интернет-сайтов и социальных сетей — городской"}	{3}	NORMAL
aaaf6f1f-91cd-4fe6-81ac-9bbf3b6b43f3	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану — республикалық", "ru": "Использование интернет-сайтов и социальных сетей — республиканский"}	{5}	NORMAL
0fc14b4a-27c1-48cf-9c3d-ad44a3fc9422	{"kz": "Бөлім отырысында баяндама", "ru": "Выступление с докладом на заседании отделения"}	{2}	NORMAL
1ea4c965-05b3-473f-96ea-9999fd1bde67	{"kz": "Жас мамандар мектебінде қатысу", "ru": "Участие в работе ШМП"}	{3}	NORMAL
08be8861-ea44-49a9-a89f-94bac13994c1	{"kz": "Педагогикалық кеңесте қатысу", "ru": "Участие в педагогическом совете"}	{5}	NORMAL
aeb517b1-d6c5-4fad-b3ea-f5871a10d6d0	{"kz": "Әдістемелік кеңесте қатысу", "ru": "Участие в методическом совете"}	{5}	NORMAL
3f74bcce-7e31-45ab-9b45-f9a37f7f3cd9	{"kz": "Газет, журнал беттеріне мақала жариялау — қалалық", "ru": "Публикация материалов в газетах, журналах — городской"}	{2}	NORMAL
2a174fce-b14e-4d2c-b8a8-6ac44ee015a1	{"kz": "Газет, журнал беттеріне мақала жариялау — республикалық", "ru": "Публикация материалов в газетах, журналах — республиканский"}	{3}	NORMAL
b88ae7e9-178d-4203-84a6-ab0f46ea5c6d	{"kz": "Газет, журнал беттеріне мақала жариялау — халықаралық", "ru": "Публикация материалов в газетах, журналах — международный"}	{5}	NORMAL
77ffc329-ffec-43cf-9455-d5664090f8c4	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беру — қалалық", "ru": "Интервью для СМИ — городской"}	{3}	NORMAL
e77f38de-fbe5-4395-a910-0aaf3e7c540a	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беру — республикалық", "ru": "Интервью для СМИ — республиканский"}	{5}	NORMAL
5560ee9f-2f4a-4967-b51a-4e17f6f876e9	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беру — халықаралық", "ru": "Интервью для СМИ — международный"}	{7}	NORMAL
241b1e94-e996-4c2b-bbb2-40a820de9e83	{"kz": "Мұғалімнің Құрмет грамотасы, грамотасы, алғыс хаты — колледжішілік", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — внутриколледжный"}	{0,2}	MEASURING
603b1d66-85eb-4d16-b465-e49e1e71ca15	{"kz": "Мұғалімнің Құрмет грамотасы, грамотасы, алғыс хаты — қалалық", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — городской"}	{0,4}	MEASURING
6835b845-bc20-4d41-8a09-43202a85a41b	{"kz": "Мұғалімнің Құрмет грамотасы, грамотасы, алғыс хаты — республикалық", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — республиканский"}	{0,2}	MEASURING
6a27e008-18fb-44bd-83e1-65e677bc80b5	{"kz": "Мұғалімнің Құрмет грамотасы, грамотасы, алғыс хаты — халықаралық", "ru": "Почетная грамота, грамота, благодарственное письмо педагога — международный"}	{0,10}	MEASURING
6c07b208-714a-4046-a943-34419c8c1eed	{"kz": "Кәсіби конкурсқа қатысу — колледжішілік, қатысқаны үшінза", "ru": "Участие в профессиональном конкурсе — за участие"}	{2}	MEASURING
ac52f163-fc5c-4126-9e6f-42ad053d3e07	{"kz": "Кәсіби конкурсқа қатысу — колледжішілік, жүлделі орын", "ru": "Участие в профессиональном конкурсе — призовое место"}	{3}	MEASURING
6eb36928-4325-40bf-8618-f0b4933c5501	{"kz": "1 мектеп", "ru": "1 школа"}	{2}	NORMAL
ad914334-6606-4860-9826-9a546f5cf1cc	{"kz": "Кәсіби конкурсқа қатысу — қалалық, қатысқаны үшінза", "ru": "Участие в профессиональном конкурсе — за участие"}	{5}	MEASURING
93f8c071-26a3-4a4d-a66d-a0e115371899	{"kz": "Кәсіби конкурсқа қатысу — қалалық, жүлделі орын", "ru": "Участие в профессиональном конкурсе — призовое место"}	{7}	MEASURING
c344fedb-940a-481a-930c-e261a9d2c54d	{"kz": "Кәсіби конкурсқа қатысу — республикалық, қатысқаны үшінза", "ru": "Участие в профессиональном конкурсе — за участие"}	{10}	MEASURING
c81d32f1-1b85-4aca-8b65-59abf22a0a1f	{"kz": "Кәсіби конкурсқа қатысу — республикалық, жүлделі орын", "ru": "Участие в профессиональном конкурсе — призовое место"}	{13}	MEASURING
74e95725-1dae-47cc-a0ca-8c5a3542cab8	{"kz": "Кәсіби конкурсқа қатысу — халықаралық, қатысқаны үшінза", "ru": "Участие в профессиональном конкурсе — за участие"}	{15}	MEASURING
790c08bb-11c5-4a7d-b973-a23d231952f0	{"kz": "Кәсіби конкурсқа қатысу — халықаралық, жүлделі орын", "ru": "Участие в профессиональном конкурсе — призовое место"}	{20}	MEASURING
51ac4ab0-643e-440d-b556-f7cd46f215b7	{"kz": "WorldSkills чемпионатына қатысу — колледжішілік, қатысқаны үшінза", "ru": "Участие в чемпионате WorldSkills — за участие"}	{3}	NORMAL
a716f95d-0136-4942-9885-1d6f153643bb	{"kz": "WorldSkills чемпионатына қатысу — колледжішілік, жүлделі орын", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{5}	NORMAL
52fef1e2-4661-4e64-a335-c86de330e17e	{"kz": "WorldSkills чемпионатына қатысу — аймақтық, қатысқаны үшінза", "ru": "Участие в чемпионате WorldSkills — за участие"}	{7}	NORMAL
20bcafcd-d540-413e-bd0d-62ceedb35556	{"kz": "WorldSkills чемпионатына қатысу — аймақтықрегиональный, жүлделі орын", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{10}	NORMAL
cf78e6d7-e4d3-4265-942d-6decef7525e0	{"kz": "WorldSkills чемпионатына қатысу — ұлттықнациональный, қатысқаны үшінза", "ru": "Участие в чемпионате WorldSkills — за участие"}	{12}	NORMAL
759012ab-3abb-4791-8341-2f7261c635f2	{"kz": "WorldSkills чемпионатына қатысу — ұлттық, жүлделі орын", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{15}	NORMAL
eced9a6c-2885-4b98-b7ad-bc58feeae89a	{"kz": "WorldSkills чемпионатына қатысу — халықаралық, қатысқаны үшінза", "ru": "Участие в чемпионате WorldSkills — за участие"}	{15}	NORMAL
2359b39b-abc2-4558-b00d-0db2e4e0789d	{"kz": "WorldSkills чемпионатына қатысу — халықаралық, жүлделі орын", "ru": "Участие в чемпионате WorldSkills — призовое место"}	{20}	NORMAL
8fe94533-e2f9-480f-985a-cfc0e2d2c196	{"kz": "Ашық сабақ өткізу — колледжішілік", "ru": "Проведение открытого урока — внутриколледжный"}	{5}	NORMAL
3609d68b-2156-450b-9eb7-6eca0d98430d	{"kz": "Ашық сабақ өткізу — қалалық", "ru": "Проведение открытого урока — городской"}	{10}	NORMAL
90b202e1-a75d-4f21-88cc-2b89f1f47482	{"kz": "Ашық сабақ өткізу — республикалық", "ru": "Проведение открытого урока — республиканский"}	{15}	NORMAL
7348acaa-864c-435e-8594-2676ccae25b2	{"kz": "Ашық сабақ өткізу — халықаралық", "ru": "Проведение открытого урока — международный"}	{20}	NORMAL
a2fe7574-4b92-43c5-a4f4-61ba268dea1c	{"kz": "Әріптестердің сабағына қатысу — әр қатысқан сабақ", "ru": "Посещение уроков коллег — каждый посещенный урок"}	{1}	MEASURING
1d0ee4e9-48f8-4c8b-bc7c-0a50115cf7ba	{"kz": "Топ жетекшілігі", "ru": "Кураторство"}	{10}	NORMAL
1e348f51-281b-4ce0-927e-e0e7e86e1296	{"kz": "Ашық тәрбие сағаттары", "ru": "Открытые воспитательные часы"}	{10}	NORMAL
2e309eae-b0c4-4366-be6d-e776b40d32b9	{"kz": "Топтың ішкі тәртіп ережелерін сақтауы", "ru": "Соблюдение правил внутреннего распорядка группой"}	{5}	NORMAL
dc6fce23-ca60-4e64-b6ab-cf30e02ce20e	{"kz": "Топтың ішкі тәртіп ережелерін сақтамауы", "ru": "Несоблюдение правил внутреннего распорядка группой"}	{5}	NORMAL
e6d0b1aa-ed05-4ad5-892a-fa59810d1e70	{"kz": "Топтың қоғамдық жұмысқа белсене қатысуы", "ru": "Активное участие группы в общественной работе"}	{5}	NORMAL
9db21e9f-778a-4e8f-974b-f6d7f96af8a0	{"kz": "Қоғамдық іс-шараға қатыспауыНеучастие в общественном мероприятии", "ru": "Неучастие в общественном мероприятии"}	{5}	NORMAL
46bf57fd-0c8b-4752-97c6-852ab6f3ee80	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуы — колледжішілік", "ru": "Участие студентов в конкурсах совместно с руководителем группы — внутриколледжный"}	{5}	NORMAL
df7c32c6-8ec1-47ef-a4c8-21c1b42a0289	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуы — қалалық", "ru": "Участие студентов в конкурсах совместно с руководителем группы — городской"}	{10}	NORMAL
5fae68f2-abc8-41bb-93ba-6adf4a0680bb	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуы — республикалық", "ru": "Участие студентов в конкурсах совместно с руководителем группы — республиканский"}	{15}	NORMAL
e7ddd8fa-1803-4589-8862-e89c83681a58	{"kz": "2 мектеп", "ru": "2 школы"}	{3}	NORMAL
cbad3aee-26ad-450b-ba1c-b09742f76d32	{"kz": "Студенттердің топ жетекшісімен бірге конкурстарға қатысуы — халықаралық", "ru": "Участие студентов в конкурсах совместно с руководителем группы — международный"}	{20}	NORMAL
c01c736b-1196-4faa-8c69-7965df415a8a	{"kz": "Сабақтан тыс ашық іс-шара өткізу — колледжішілік", "ru": "Проведение открытого внеклассного мероприятия — внутриколледжный"}	{5}	MEASURING
260368d4-889c-4064-846b-356a64177760	{"kz": "Сабақтан тыс ашық іс-шара өткізу — қалалық", "ru": "Проведение открытого внеклассного мероприятия — городской"}	{10}	MEASURING
fa350f7a-0a88-48de-935b-f27975f85314	{"kz": "Сабақтан тыс ашық іс-шара өткізу — республикалық", "ru": "Проведение открытого внеклассного мероприятия — республиканский"}	{15}	MEASURING
d0d8e916-afd8-4790-b6a9-204cb6e49e82	{"kz": "Сабақтан тыс ашық іс-шара өткізу — халықаралық", "ru": "Проведение открытого внеклассного мероприятия — международный"}	{20}	MEASURING
eecd6f52-ccc9-4967-9354-96e8c2a029fb	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — колледжішілік", "ru": "Руководство работой студентов и призовые места — внутриколледжный"}	{5}	MEASURING
35c83c34-424e-4e6e-a968-426ded8f1c2e	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — қалалық", "ru": "Руководство работой студентов и призовые места — городской"}	{10}	MEASURING
2684d6e3-92b9-417f-9c79-9ba960d3e835	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — республикалық", "ru": "Руководство работой студентов и призовые места — республиканский"}	{15}	MEASURING
0d7ee3cb-8141-4278-81ac-008e1f1293d9	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — халықаралық", "ru": "Руководство работой студентов и призовые места — международный"}	{20}	MEASURING
81964b37-8841-4e74-aea5-827419711c4d	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — колледжішілік", "ru": "Руководство работой студентов и призовые места — внутриколледжный"}	{5}	MEASURING
2866e892-04b7-49b8-92c5-bb92c7c84a33	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — қалалық", "ru": "Руководство работой студентов и призовые места — городской"}	{10}	MEASURING
788c04e6-372c-4422-849e-6619ab5db681	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — республикалық", "ru": "Руководство работой студентов и призовые места — республиканский"}	{15}	MEASURING
b0784a18-de37-49db-bd07-13f2d039d480	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы — халықаралық", "ru": "Руководство работой студентов и призовые места — международный"}	{20}	MEASURING
061cd35d-9d29-4e1c-b4a1-455c022e171f	{"kz": "Өндіріс орындарымен меморандум орнатуы — Жеке кәсіпкер", "ru": "Заключение меморандума с предприятиями — Индивидуальный предприниматель"}	{5}	NORMAL
e27a594f-9658-45e5-a4ed-51dee4d0357f	{"kz": "Өндіріс орындарымен меморандум орнатуы — ЖШС", "ru": "Заключение меморандума с предприятиями — Товарищество с ограниченной ответственностью"}	{10}	NORMAL
c7f10705-7455-41be-9d7a-7012778dd5e9	{"kz": "Өндіріс орындарымен меморандум орнатуы — АҚ", "ru": "Заключение меморандума с предприятиями — Акционерное общество"}	{15}	NORMAL
a36d4cba-3737-4d99-b7c4-ccb13e28178d	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны — 1 мектеп", "ru": "Количество школ, охваченных профориентационной работой — 1 школа"}	{2}	NORMAL
99d090de-5163-43bf-ae33-98a4a09c141c	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны — 2 мектеп", "ru": "Количество школ, охваченных профориентационной работой — 2 школы"}	{3}	NORMAL
01cec185-843a-4034-9eb3-663d81857f57	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны — 3 мектеп және одан көп", "ru": "Количество школ, охваченных профориентационной работой — 3 школы и более"}	{5}	NORMAL
c5e9700c-a3c8-4efc-a35c-eec1e889eeca	{"kz": "Іс-шараларды медиялық сүйемелдеу: СМИ, YouTube, Instagram и т.д.", "ru": "Медийное сопровождение мероприятий: публикация в СМИ, YouTube, Instagram и т.д."}	{2}	NORMAL
be8cfc82-26e3-4dd8-92a1-016fa94cb939	{"kz": "колледжішілік - қатысқаны үшін", "ru": "внутриколледжный - за участие"}	{2}	NORMAL
3d835f61-46a6-40e5-9e2c-9d16d914a889	{"kz": "колледжішілік - жүлделі орын", "ru": "внутриколледжный - за призовые места"}	{3}	NORMAL
b5cc2262-f1ff-4cbe-aa3e-bad36dabfbe7	{"kz": "республикалық - жүлделі орын", "ru": "республиканский - за призовое место"}	{13}	NORMAL
32a2fd0a-32c1-4c16-9fc0-f366ee5e8283	{"kz": "халықаралық - қатысқаны үшін", "ru": "международный - за участие"}	{15}	NORMAL
53de4d8c-f197-428d-95d1-2225b8af6234	{"kz": "халықаралық - жүлделі орын", "ru": "международный - за призовое"}	{20}	NORMAL
4ec019b3-f86d-4170-ab0e-912d269b2694	{"kz": "колледжішілік - қатысқаны үшін", "ru": "внутриколледжный - за участие"}	{3}	NORMAL
903162dc-1ca8-4e50-bcd9-1d11579d3cfc	{"kz": "колледжішілік - жүлделі орын", "ru": "внутриколледжный - за призовое место"}	{5}	NORMAL
9fa4475f-0d9c-421b-b63b-5938967bda1a	{"kz": "аймақтық - қатысқаны үшін", "ru": "региональный - за участие"}	{7}	NORMAL
848eb745-d829-480a-b7f7-71e34df3b82d	{"kz": "аймақтық - жүлделі орын", "ru": "региональный - за призовое место"}	{10}	NORMAL
7b15a1fd-5e4c-4855-b347-7c891b57f2cb	{"kz": "ұлттық - қатысқаны үшін", "ru": "национальный - за участие"}	{12}	NORMAL
2d3cb88f-6c69-4ebf-84df-20d804e59a5f	{"kz": "ұлттық - жүлделі орын", "ru": "национальный - за призовое место"}	{15}	NORMAL
ff2f2e7a-330d-402c-b290-5e433eefbeab	{"kz": "халықаралық - қатысқаны үшін", "ru": "международный - за участие"}	{15}	NORMAL
bfd0c43a-0c4f-4d9a-8b33-4451e172fdc5	{"kz": "халықаралық - жүлделі орын", "ru": "международный - за призовое место"}	{20}	NORMAL
f283a05f-2c1d-44fb-8f37-1a14184c96ae	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{5}	NORMAL
2b31f316-e0d5-4cfb-9bdf-3cf3c138a216	{"kz": "қалалық", "ru": "городской"}	{10}	NORMAL
56209e75-4128-47ea-9352-9c0d35237cf2	{"kz": "республикалық", "ru": "республиканский"}	{15}	NORMAL
f36d1aff-38f1-4c64-ba95-ead90a72ad03	{"kz": "халықаралық", "ru": "международный"}	{20}	NORMAL
6e8dfb51-d9cc-471a-a260-73366beb6082	{"kz": "УМКД (теория и практика)", "ru": "УМКД (теория и практика)"}	{1,3}	MEASURING
8f3a9882-18c6-4321-8373-4a54e33937d2	{"kz": "разработка или экспертиза тестовых заданий НЦТ", "ru": "разработка или экспертиза тестовых заданий НЦТ"}	{10}	NORMAL
5b0bf683-ebb7-4412-9467-b404fa2d7d28	{"kz": "", "ru": ""}	{0}	NORMAL
488e773a-b25f-43cf-89d8-80208366c190	{"kz": "", "ru": ""}	{0}	NORMAL
67fea61b-778d-45b0-b247-d2690d45fbdb	{"kz": "внутриколледжный", "ru": "внутриколледжный"}	{0}	NORMAL
d33f302b-cc56-4eba-a0a9-10f059a165ab	{"kz": "городской", "ru": "городской"}	{0}	NORMAL
c2b2a524-efc5-4b52-aac4-7bf11300a5b2	{"kz": "республиканский", "ru": "республиканский"}	{0}	NORMAL
170ef94e-b5b2-410c-85d1-2e98c6d4c535	{"kz": "УМКД (теория и практика)", "ru": "УМКД (теория и практика)"}	{1,3}	MEASURING
702c1fa7-e55b-400c-8c0b-806392d5c1d9	{"kz": "разработка или экспертиза тестовых заданий НЦТ", "ru": "разработка или экспертиза тестовых заданий НЦТ"}	{10}	NORMAL
6841577b-df68-4d34-959c-5828041700a2	{"kz": "", "ru": ""}	{0}	NORMAL
48f09c89-89eb-4acd-8ccf-5c8182512f08	{"kz": "", "ru": ""}	{0}	NORMAL
d6c5cff7-fa66-493b-9b2b-07ca7db47224	{"kz": "внутриколледжный", "ru": "внутриколледжный"}	{10}	NORMAL
b533767b-9136-4f33-babb-ecac6de33623	{"kz": "городской", "ru": "городской"}	{15}	NORMAL
6bacebde-15f2-4881-90e4-7137fa9da566	{"kz": "республиканский", "ru": "республиканский"}	{20}	NORMAL
e416cd74-e024-432e-a4b8-bd47d81dbc01	{"kz": "внутриколледжный", "ru": "внутриколледжный"}	{10}	NORMAL
136c909b-fadd-443b-9c0e-03806555bd8e	{"kz": "городской", "ru": "городской"}	{15}	NORMAL
e5133e52-3958-4da2-b521-d4a4d53d67de	{"kz": "республиканский", "ru": "республиканский"}	{20}	NORMAL
f824e396-c152-4532-98e8-fc2366739adc	{"kz": "внутриколледжный", "ru": "внутриколледжный"}	{10}	NORMAL
8f21ec17-959a-4d81-90eb-a4c83d46eafa	{"kz": "городской", "ru": "городской"}	{15}	NORMAL
8825ca06-5f0b-4a99-8a38-9d14e657732e	{"kz": "республиканский", "ru": "республиканский"}	{20}	NORMAL
94cfd782-c12a-4d66-93fd-6092e3786369	{"kz": "ПОӘК (теория және тәжірибе)", "ru": "УМКД (теория и практика)"}	{1,3}	MEASURING
24f16997-102c-47fc-8305-223892ef4e49	{"kz": "ҰТО тест тапсырмаларын әзірлеу немесе сараптамадан өткізу", "ru": "разработка или экспертиза тестовых заданий НЦТ"}	{10}	NORMAL
7960bdda-59cd-4302-a41c-91e1e7bebef9	{"kz": "", "ru": ""}	{0}	NORMAL
8346a350-9ef0-4ece-83f3-6b1ed53a7066	{"kz": "", "ru": ""}	{0}	NORMAL
43045e32-e92f-4ad3-8f54-b65df03719ac	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{10}	NORMAL
f60cfdef-6c49-4e10-829f-cd07fc4593f1	{"kz": "қалалық", "ru": "городской"}	{15}	NORMAL
e7bfd2db-0125-4103-b1bf-5b2df9a51fb2	{"kz": "республикалық", "ru": "республиканский"}	{20}	NORMAL
2f85ae53-ea1b-447d-bd61-8d81ae66c7a6	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{10}	NORMAL
52be573c-b6eb-4701-9c5e-0617216ff625	{"kz": "қалалық", "ru": "городской"}	{15}	NORMAL
451a3fd4-8ff0-4cd3-97f9-de6ea696c829	{"kz": "республикалық", "ru": "республиканский"}	{20}	NORMAL
ca6b6c73-7ea3-44e0-9b3b-f8d0f95d3286	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{10}	NORMAL
4ea79e6b-7c06-4c47-8f3f-81925b69737f	{"kz": "қалалық", "ru": "городской"}	{15}	NORMAL
2f417884-9dec-49d6-919e-dc30114e9a9a	{"kz": "республикалық", "ru": "республиканский"}	{20}	NORMAL
6d84d4bc-90f0-44ef-95cf-e820f1d7affd	{"kz": "Колледж ұсынған курстар", "ru": "Курсы по рекомендации колледжа"}	{3}	NORMAL
2c8fcc4e-47d2-4393-9f2b-0d2851a9763f	{"kz": "Жетекші жеткізуші вендорлардың онлайн курстары", "ru": "Online-курсы ведущих вендоров"}	{5}	NORMAL
5a22585d-9b35-485b-b8e4-2b76fd8725f0	{"kz": "Кәсіби курстар", "ru": "Профессиональные курсы"}	{10}	NORMAL
e0922012-d6e4-4e73-bf05-dcdffda32b1a	{"kz": "Тағылымдамадан өту", "ru": "Стажировка"}	{15}	NORMAL
a809de49-3615-451b-900b-811873ebd0a2	{"kz": "БАҚ-та, YouTube, Instagram және т.б. жариялау", "ru": "публикация в СМИ, YouTube, Instagram и т.д."}	{2}	NORMAL
1cb12a79-048b-47b5-98fa-554c6f0da073	{"kz": "Жеке кәсіпкер", "ru": "Индивидуальный предприниматель"}	{5}	NORMAL
69a8e650-f022-43a7-90c1-3d073dbe811d	{"kz": "Жауапкершілігі шектеулі серіктес", "ru": "Товарищество с ограниченной ответственностью"}	{10}	NORMAL
cc18e24a-9745-4f08-91c4-b11ba6ddc996	{"kz": "Акционерлік қоғам", "ru": "Акционерное общество"}	{15}	NORMAL
7d858cbb-dc78-4fc3-bfad-94efe1fb4f6e	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{3}	NORMAL
35b29bf2-1043-4a84-a965-28813f56f019	{"kz": "қалалық", "ru": "городской"}	{3}	NORMAL
75f18846-be68-4636-9b6e-7ae1c0302edb	{"kz": "республикалық", "ru": "республиканский"}	{5}	NORMAL
3f76bf6e-b3e1-46e7-8adb-7acecab1de35	{"kz": "халықаралық", "ru": "международный"}	{10}	NORMAL
1c055bc0-a030-4c1c-8cf9-4ac87c145c57	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{2}	NORMAL
50086dd1-63ae-4fbe-b968-85a60a00ca31	{"kz": "қалалық", "ru": "городской"}	{3}	NORMAL
7fd37758-4efd-45f1-ace6-39be2508120c	{"kz": "республикалық", "ru": "республиканский"}	{5}	NORMAL
205ef02d-f170-4714-912b-a68b8d9bf58f	{"kz": "халықаралық", "ru": "международный"}	{10}	NORMAL
be339484-c6fe-4bf6-8206-31c036d0cee8	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{3}	NORMAL
673c56c1-c1a5-4bc0-b9e7-1aa2b61dad58	{"kz": "қалалық", "ru": "городской"}	{3}	NORMAL
cdbe101b-112c-43b1-893a-06e3e393579c	{"kz": "республикалық", "ru": "республиканский"}	{5}	NORMAL
aba06ebd-4ffe-4529-90df-f4c7febb74d4	{"kz": "Бөлім отырысында баяндама", "ru": "выступление с докладом на заседении отделения"}	{2}	NORMAL
b1b28ed5-af2c-42b2-8e09-ee72a437cdf6	{"kz": "жас мамандар мектебінде", "ru": "участие в работе ШМП"}	{3}	NORMAL
16c2445a-f470-4efe-a88e-59118f4496f4	{"kz": "педагогикалық кеңесте", "ru": "педагогического совета"}	{5}	NORMAL
9567eae2-f736-43e5-88ae-b880dc9818ed	{"kz": "әдістемелік кеңесте", "ru": "методического совета"}	{5}	NORMAL
fcf55d6b-0385-4b54-ba99-578c6c80f881	{"kz": "қалалық", "ru": "городской"}	{2}	NORMAL
2a0c6d2b-1c5e-4f9c-ae4e-f5fd5965cef2	{"kz": "республикалық", "ru": "республиканский"}	{3}	NORMAL
2d794195-9a65-4955-83b6-f77f02d90120	{"kz": "халықаралық", "ru": "международный"}	{5}	NORMAL
13d349c7-5e6a-4798-b3ca-a52cde6660b8	{"kz": "қалалық", "ru": "городской"}	{3}	NORMAL
9f524cbe-421d-4633-847b-a38c53a2ffaa	{"kz": "республикалық", "ru": "республиканский"}	{5}	NORMAL
8583367b-aed1-46e1-a72b-2b264d930a76	{"kz": "халықаралық", "ru": "международный"}	{7}	NORMAL
5d8501ec-de0c-453f-be10-f14145aa5e61	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{0,2}	MEASURING
3a0897f9-1d8e-40c8-b698-8030c304ed3f	{"kz": "қалалық", "ru": "городской"}	{0,4}	MEASURING
2bb5d605-b5a6-4bcb-ac1c-2fc6bf803522	{"kz": "республикалық", "ru": "республиканский"}	{0,2}	MEASURING
de02729c-d5ad-4dc2-9ee9-9d7509c4a36b	{"kz": "халықаралық", "ru": "международный"}	{0,10}	MEASURING
fdf7fe05-f3ea-41c8-abc8-bf0eca8dec80	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{2}	NORMAL
08553acc-8398-4e0d-a854-bf189f3f3ec4	{"kz": "қалалық", "ru": "городской"}	{3}	NORMAL
9b01f786-f9d0-476c-acd2-748b7d21e54b	{"kz": "республикалық", "ru": "республиканский"}	{5}	NORMAL
7eeaa44c-90c4-4a3c-9115-a7d70a38b352	{"kz": "халықаралық", "ru": "международный"}	{10}	NORMAL
998272a9-9559-43e4-abf9-9102228e1545	{"kz": "Топ жетекшілігі", "ru": "Кураторство"}	{10}	NORMAL
552c0bf5-4ee0-45a3-a9a9-9f0a045f12a4	{"kz": "ашық тәрбие сағаттары", "ru": "открытые воспитательные часы"}	{10}	NORMAL
5224d42b-4261-46ad-bf8c-3d187cc8600f	{"kz": "топтың ішкі тәртіп ережелерін сақтауы", "ru": "соблюдение правил внутреннего распорядка группой"}	{5}	NORMAL
6568c7cd-f333-4611-9ecb-fd8d848e40df	{"kz": "топтың қоғамдық жұмысқа белсене қатысуы", "ru": "активное участие группы в общественной работе"}	{5}	NORMAL
e7aa8457-a8fb-48e8-9c04-a362cda01bc5	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{5}	NORMAL
c0ada7ab-e94d-4659-922e-0d60ed805181	{"kz": "қалалық", "ru": "городской"}	{10}	NORMAL
cc6e7393-8610-4cd7-8d9a-5d11aaf30e14	{"kz": "республикалық", "ru": "республиканский"}	{15}	NORMAL
157c52f1-bacc-4715-842a-6f036d6a9fb7	{"kz": "халықаралық", "ru": "международный"}	{20}	NORMAL
19fed14f-dbce-401a-b6c3-76e74b6081c5	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{5}	NORMAL
4a475be3-a9db-4c59-8ed8-8c84c27f1791	{"kz": "қалалық", "ru": "городской"}	{10}	NORMAL
dfce47eb-61ce-4864-91bb-ff0545695749	{"kz": "республикалық", "ru": "республиканский"}	{15}	NORMAL
1da7f999-a8c5-4386-bd69-b1dec1f9d0f4	{"kz": "халықаралық", "ru": "международный"}	{20}	NORMAL
c7dbd3aa-580f-4d9c-b5f4-a94833e29d53	{"kz": "колледжішілік", "ru": "внутриколледжный"}	{5}	NORMAL
fe363e6a-dda7-4c5a-b5f0-a9a2068d4c63	{"kz": "қалалық", "ru": "городской"}	{10}	NORMAL
2c15c516-1dab-4bee-bb7a-b32a0f943573	{"kz": "республикалық", "ru": "республиканский"}	{15}	NORMAL
842c753e-a225-4a47-b869-e07a592eb3a5	{"kz": "халықаралық", "ru": "международный"}	{20}	NORMAL
7acd2526-5b10-4bfd-98dc-5378d452e6b6	{"kz": "әр қатысқан сабақ", "ru": "каждый посещенный урок"}	{1}	NORMAL
\.


--
-- Data for Name: award_type_variants; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_type_variants (id, name, description, criteria, bonus_criteria) FROM stdin;
475f6d11-0b22-435b-a4d6-f8c3441c700e	{"kz": "1.1. Оқу-әдістемелік материалдарды құрастыруРазработка учебно-методических материалов", "ru": "Разработка учебно-методических материалов"}	{"kz": "Оценка разработки учебно-методических материалов.", "ru": "Оценка разработки учебно-методических материалов."}	{639da9c7-fa6d-4998-82b7-edbffeacd5cf}	{}
62846162-ae21-49c2-88d0-a53fe3f3b801	{"kz": "1.2. Авторлық жұмыстарАвторские работы", "ru": "Авторские работы"}	{"kz": "Оценка авторских работ, методических пособий, образовательных программ, учебных пособий и учебников.", "ru": "Оценка авторских работ, методических пособий, образовательных программ, учебных пособий и учебников."}	{7fb47243-2423-4d03-983c-a31452ccf2ea,7949fddc-75d2-4b41-bb82-67c2dc671c22,6d9f6738-14bc-4b3c-8070-3e1856444bfc,f65d1a9a-c546-4ce8-b88f-0375667e7da0,7bd3128d-0bff-47d1-a3a3-19d8f90a735f,d2543007-1077-4335-a10e-f866fbd7b331,27905d14-4c4e-4dd2-ac3d-10770ff6e1d5,70ecf794-d776-4842-9994-4dcb149f7306,d1266b7f-0f12-4167-a610-474badfcd6e1,f00a1242-7539-448e-928b-76c0328a73a5}	{}
9c16db1b-b4c5-4c66-8bb2-ab16a1876894	{"kz": "2.1. Біліктілікті арттыру курстарынан өтуПрохождение курсов повышения квалификации", "ru": "Прохождение курсов повышения квалификации"}	{"kz": "Оценка курсов повышения квалификации и стажировок.", "ru": "Оценка курсов повышения квалификации и стажировок."}	{6a49355a-9a52-4603-b58a-d7e41f710017,37bed84f-6737-47d2-b87f-fe452af78cee,f0ec0010-fa44-4ecb-985d-d867b00aefc5,79e2894f-5fc6-44ab-996d-5c3ef79421c9}	{}
c50c7546-4212-4718-9d0c-f14999cd8225	{"kz": "3.1. Педагогикалық озық іс-тәжірибелерінің нәтижелеріРезультаты передового педагогического опыта", "ru": "Результаты передового педагогического опыта"}	{"kz": "Доклады на семинарах, конференциях и педагогических чтениях.", "ru": "Доклады на семинарах, конференциях и педагогических чтениях."}	{3fb68ced-600b-4f99-8b21-2d64f6ecadac,b0bbee70-da6e-40da-a82e-02883d3b1dd8,1d649de5-2fcf-49e7-9647-6e5e50a46228,0ca580f4-5e06-4f30-8ba0-f5e7e8f999ed,bc8da914-3923-45d8-8816-90d24c74331e,dca716c2-c7c6-44ff-9c73-cd729b922778,cb9f9528-644f-4de1-b658-7682e2c0efb3,bd2c992f-20ea-45ee-b3d5-3d324576edb9}	{}
11bf9f18-c8b3-42e5-9209-d41fa85683c3	{"kz": "3.2. Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалануПрименение интернет-сайтов и социальных сетей", "ru": "Применение интернет-сайтов и социальных сетей"}	{"kz": "Видеоуроки, лайфхаки и материалы, загруженные в TikTok, Instagram, YouTube и другие площадки.", "ru": "Видеоуроки, лайфхаки и материалы, загруженные в TikTok, Instagram, YouTube и другие площадки."}	{705cbe86-0cb1-4ab6-9a0f-c7debfa8ade0,ac6b2fb7-5f72-4d6d-a589-6a1354379227,36e64dc9-90fd-4484-b52a-905f19362952}	{}
0661345f-2a13-4a22-b0b5-9e8aee10b6b5	{"kz": "3.3. Бөлім жұмысын белсенді атқаруыАктивное выполнение работы отделения", "ru": "Активное выполнение работы отделения"}	{"kz": "Активное участие в работе отделения, ШМП, педагогического и методического советов.", "ru": "Активное участие в работе отделения, ШМП, педагогического и методического советов."}	{6cd99e5c-d8d7-4a8e-a92e-85408ea98bec,acf29256-e407-4a5a-bbef-4a6fec094f3c,505e6922-2aaf-4b36-ba34-a4ee30aaffa9,855e0a0d-d69c-4b2a-8e84-b997c9649f32}	{}
778719e4-7bd2-4c0b-b3c0-a89b5df6fe2e	{"kz": "4.1. Газет, журнал беттеріне мақала жариялауПубликация материалов на страницах газет, журналов", "ru": "Публикация материалов на страницах газет, журналов"}	{"kz": "Публикации в печатных и электронных СМИ.", "ru": "Публикации в печатных и электронных СМИ."}	{113c79b1-0e8c-41b1-b261-ac88418ef10e,d574a7ad-2d7e-4e31-b1cc-a1bede0115d1,14891c75-bb53-43d8-aeae-073445e0c8cf}	{}
307b109a-5e6b-4b1a-bd94-e2c028a0e9e9	{"kz": "4.2. Бұқаралық ақпарат құралдарына сұхбат беруИнтервью для средств массовой информации", "ru": "Интервью для средств массовой информации"}	{"kz": "Интервью для средств массовой информации разных уровней.", "ru": "Интервью для средств массовой информации разных уровней."}	{3a9ccd3d-ce1a-4210-828f-e0618a3803bf,5c660b60-b35a-49ff-8fb7-7f5f3feed3b5,0bde55d9-982f-457c-bab6-683d1672ad07}	{}
1df709c4-9196-4f75-9da2-489650d00ad3	{"kz": "5.1. Педагогтардың құрмет грамотасы, мадақтама, алғыс хаттарыПочетная грамота, грамоты, благодарственные письма педагогов", "ru": "Почетная грамота, грамоты, благодарственные письма педагогов"}	{"kz": "Каждая грамоталагодарственное письмо умножается на балл соответствующего уровня.", "ru": "благодарственное письмо умножается на балл соответствующего уровня."}	{1414c62b-b5a4-46e5-9837-a8b6e5933470,17116163-0863-47de-b324-16b381237b99,bc06b16e-9e1d-40d4-b26c-d190e5f77f5c,e56219a4-d171-47c3-aa79-7df4f0bc178d}	{}
6cd7554a-6b25-405f-a8a7-4f28f4b502ec	{"kz": "6.1. Кәсіби конкурстарға қатысуУчастие в профессиональных конкурсах", "ru": "Участие в профессиональных конкурсах"}	{"kz": "Каждое мероприятие умножается на балл соответствующего уровня и результата.", "ru": "Каждое мероприятие умножается на балл соответствующего уровня и результата."}	{14de3e47-2f7a-4b21-912b-662b00152f4b,ed265ae3-d3f3-4e1b-9991-7551023b0d63,39f7fd28-71df-422a-aeba-1bb5953d7cf4,ba6d61fe-7495-4da0-9697-3e0b213a09fc,2c231dd4-0610-4d92-90d5-603068ffd7eb,e1c558c5-89d9-47aa-babc-54fef45043f6,b8a50b06-39e4-4a0b-8e4a-afe44a3e6fc3,4f9d594b-dea2-46f5-b13d-53d63cd270df}	{}
191b77af-4100-45f9-9804-35bd9c45dadb	{"kz": "7.1. Кәсіби шеберлік WorldSkills чемпионатына қатысуыУчастие в профессиональных чемпионатах WorldSkills", "ru": "Участие в профессиональных чемпионатах WorldSkills"}	{"kz": "Баллы для участия, призовых мест и ролей эксперта-компатриота, заместителя главного эксперта, главного эксперта.", "ru": "Баллы для участия, призовых мест и ролей эксперта-компатриота, заместителя главного эксперта, главного эксперта."}	{f614ea13-c7c4-4e97-be30-e3f2d8adb306,7a2a2c38-f760-4064-b3ea-0fd86cec04ec,8588d1c1-6b2c-4640-8222-ec13942fb657,34093ee6-82ae-47cc-8902-75c02d63658e,59c6db2e-71ca-420f-b13c-f4014cb0cf7c,d0d01793-bca4-4e78-8dc9-24b79f8a9f36,cb00b063-b955-4f37-b684-cc82ea04866d,8fb706f5-cc3a-4f7f-860c-38465cd549e1}	{}
a318065f-f5cb-4df4-86cb-f089d84b511b	{"kz": "8.1. Ашық сабақтар өткізуіПроведение открытого урока", "ru": "Проведение открытого урока"}	{"kz": "Открытые уроки с указанием применяемых методов и технологий обучения.", "ru": "Открытые уроки с указанием применяемых методов и технологий обучения."}	{283ebcc1-c076-4d5e-991a-eda5ba2d0328,20e14862-30e0-412a-b7a8-67707543e882,bacc82f2-e69c-4ae3-b069-8b960a5504c5,b535983b-4bf5-468b-970d-becf207b3940}	{}
a02e85f5-336a-4fee-93f9-4a99dcbf77bb	{"kz": "8.2. Әріптестердің сабағына қатысуПосещение уроков коллег", "ru": "Посещение уроков коллег"}	{"kz": "Каждый посещенный урок умножается на 1 балл. Основание: листы и журнал взаимопосещений.", "ru": "Каждый посещенный урок умножается на 1 балл. Основание: листы и журнал взаимопосещений."}	{22a621ab-a192-4c1e-b31e-456ca89481a1}	{}
ffac28f0-3ae0-4469-9b65-737c02f129c1	{"kz": "9.1. Топ жетекшілігіКураторство", "ru": "Кураторство"}	{"kz": "Качественное ведение работы руководства группой, воспитательные часы, дисциплина группы, общественная работа и участие студентов в конкурсах.", "ru": "Качественное ведение работы руководства группой, воспитательные часы, дисциплина группы, общественная работа и участие студентов в конкурсах."}	{74f5c3c2-ca39-4d85-99b9-c5a3c45ecbf0,c08c9f39-7997-4435-83ce-a7911d7ff860,ccce52db-cbc3-4b02-afde-11cd79717c2b,d8857c30-5b6f-43e3-8b8f-51ef4483dfea,0774a4ff-a167-40a9-bf1c-c63701235682,b1cd2a87-c266-4a76-8048-30d894efef7d,8c0ecf29-d56b-42d2-9961-d8b72ce640d2,78b2c4e2-cb12-4b87-9f32-b03fbce5c604,03bb9c28-6fec-44e7-ad8c-b1bc06fc379d,4eef0ede-ebd7-4d79-8a00-da8b1d6f7d86}	{}
f6d46f1b-d738-45a1-9dd3-e050ba69fbfb	{"kz": "9.2. Сабақтан тыс ашық іс-шаралар өткізуПроведение открытого внеклассного мероприятия", "ru": "Проведение открытого внеклассного мероприятия"}	{"kz": "Каждое внеклассное мероприятие умножается на балл соответствующего уровня.", "ru": "Каждое внеклассное мероприятие умножается на балл соответствующего уровня."}	{6c834875-d192-4096-9430-ef1e7e7cc336,18a974a6-d07e-4554-bbe8-2863fc9e103a,86d1f51d-8376-4298-bd45-10357018164c,5f2efc32-2221-4032-8964-179e7be5a799}	{}
d7c56069-1d39-4aab-a138-daa15b899a71	{"kz": "10.1. Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуыРуководство работой студентов и призовые места", "ru": "Руководство работой студентов и призовые места"}	{"kz": "Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия.", "ru": "Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия."}	{8b993be3-76fb-45e4-9c25-a9394ccbf290,17a318d6-dbe6-4d62-90bb-3318bd744dde,0d25e36c-70c4-4c58-9f60-43953be01bde,67dacb0c-4891-4e49-8722-0e965b0e6b40}	{}
df74ed52-6be7-4c03-9cd5-906b57e1506a	{"kz": "11.1. Өндірістік оқыту шеберлерінің өндіріс орындарымен меморандум орнатуыЗаключение меморандума с предприятиями мастерами производственного обучения", "ru": "Заключение меморандума с предприятиями мастерами производственного обучения"}	{"kz": "Оценка заключенных меморандумов с предприятиями по типу организации.", "ru": "Оценка заключенных меморандумов с предприятиями по типу организации."}	{30d22cb7-0281-4b0b-a7d3-280eea9229cf,08a75692-f99c-43b7-9244-61440414279c,4b44604a-ffdb-45f4-9084-f1f3c8072c7e}	{}
191da421-dfd2-4d3f-a698-a6bcd4350d4f	{"kz": "12.1. Мамандыққа баулу жұмысы арқылы қамтылған мектептер саныКоличество школ, охваченных профориентационной работой", "ru": "Количество школ, охваченных профориентационной работой"}	{"kz": "Оценка профориентационной работы и медийного сопровождения мероприятий.", "ru": "Оценка профориентационной работы и медийного сопровождения мероприятий."}	{3f7df369-945d-4304-9e1a-dadac2caf070,d7020872-4b7d-47e5-ba23-3282fe63258a,9eb0e6ba-3f47-4d87-89d4-d79875b56e3f,eaab6486-ca32-4fb8-905b-bc469d5a2895}	{}
f2fd6dcf-723b-4c07-ad3d-a9849eecdd8e	{"kz": "Еңбек шартының талаптарын бұзуНарушение условий трудового договора", "ru": "Нарушение условий трудового договора"}	{"kz": "При нарушении условий трудового договора вычитается от 10 до 30 баллов.", "ru": "При нарушении условий трудового договора вычитается от 10 до 30 баллов."}	{885f6769-1bc8-42bd-808b-b3e446db7190,898798e8-2987-49e6-af6b-de897a972b0b,128eb7c3-f996-41fd-9694-8fa87ed0976f}	{}
e769ebbd-aede-4508-8f13-0fb111eeff5d	{"kz": "1.1. Оқу-әдістемелік материалдарды құрастыруРазработка учебно-методических материалов", "ru": "Разработка учебно-методических материалов"}	{"kz": "Оценка разработки учебно-методических материалов.", "ru": "Оценка разработки учебно-методических материалов."}	{0ee1600f-10fd-4e4a-a2df-43433346a7cd}	\N
ecc64778-6081-4c13-a48c-9aec2939980c	{"kz": "1.2. Авторлық жұмыстар", "ru": "Авторские работы"}	{"kz": "Оценка авторских работ, методических пособий, образовательных программ, учебных пособий и учебников.", "ru": "Оценка авторских работ, методических пособий, образовательных программ, учебных пособий и учебников."}	{c020162e-be92-46d7-9090-0eafbc91cefc,8fd6a02b-55b5-4a4a-a8bd-20a0c5954f63,71cb6fcd-cb70-4440-9e1c-c99afac8bafa,62ea0709-1859-40cf-9566-fcf9d3d154ca,faab429b-8a2d-4b14-b71f-c228da605a95,48bdfeac-1d19-4d39-b598-1a3e4acf162e,0413d294-a689-4b75-9543-9e479266bd31,04d165b7-b93a-4d48-9913-327a4fb4032c,8360397b-5993-46c1-b9e4-c06194129c94,09257288-70ae-497f-9677-baaec29b5033}	\N
f9b6d5b3-35b1-4ad0-b81f-89744e2b3c53	{"kz": "2.1. Біліктілікті арттыру курстарынан өту", "ru": "Прохождение курсов повышения квалификации"}	{"kz": "Оценка курсов повышения квалификации и стажировок.", "ru": "Оценка курсов повышения квалификации и стажировок."}	{c00c8e0d-396e-400a-89eb-5dfb067e8a08,7d557937-038e-4ad6-af91-28edc1695b22,ce83b6d2-aa94-4204-bc1b-e6e43731627f,3acfcf28-8576-4677-9d32-66106c3e8680}	\N
b943b404-6d33-462c-8891-2e81e1a91dda	{"kz": "3.1. Педагогикалық озық іс-тәжірибелерінің нәтижелері", "ru": "Результаты передового педагогического опыта"}	{"kz": "Доклады на семинарах, конференциях и педагогических чтениях.", "ru": "Доклады на семинарах, конференциях и педагогических чтениях."}	{5ea3e36a-bd4a-4861-9abf-6ddf4b3248df,d71104b3-4e32-4954-8232-fec383f20fd0,cb01f45d-5832-46c1-b844-479704455468,20398831-98fb-4863-bb2d-f160e991b049,78dd4716-b4a9-4eba-a590-4979e287ffa0,dc068ab7-4c76-4ef1-b8d2-4a5a09057e5c,1acb04cb-2613-4dc1-99ae-153525ad7e92,849690e6-bf20-43d9-81b9-478fdbf32176}	\N
e45b121a-1087-4b0a-a570-e62aeafea8eb	{"kz": "3.2. Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану", "ru": "Применение интернет-сайтов и социальных сетей"}	{"kz": "Видеоуроки, лайфхаки и материалы, загруженные в TikTok, Instagram, YouTube и другие площадки.", "ru": "Видеоуроки, лайфхаки и материалы, загруженные в TikTok, Instagram, YouTube и другие площадки."}	{f1895709-f59a-4301-a17e-315fd37842c9,cbc5882e-8883-4f4f-84fc-9024bdda3bc8,81b4d22b-d578-4fe6-a622-b322db755c5e}	\N
028081d3-a036-4b46-a7fb-769e5b8bf538	{"kz": "3.3. Бөлім жұмысын белсенді атқаруы", "ru": "Активное выполнение работы отделения"}	{"kz": "Активное участие в работе отделения, ШМП, педагогического и методического советов.", "ru": "Активное участие в работе отделения, ШМП, педагогического и методического советов."}	{9760abae-1489-434f-9668-c51d4913bbd4,cad5f755-627c-4868-a452-1d05caa135ef,da3775f0-6d08-4bb0-8c21-74a315ec4b48,019e532a-140b-489e-92b7-b8020c53b5d5}	\N
f561cf5a-2507-4e28-81a0-c2e8ca88c394	{"kz": "4.1. Газет, журнал беттеріне мақала жариялау", "ru": "Публикация материалов на страницах газет, журналов"}	{"kz": "Публикации в печатных и электронных СМИ.", "ru": "Публикации в печатных и электронных СМИ."}	{aec42060-9bcd-409f-85a2-7171a9f57a92,09f84eab-8ca9-409a-8333-fa298687bf9e,3acc5e16-ebf3-4fc3-9f27-adeca476abfb}	\N
f27ac546-6983-405e-8619-98cdb11fcfaa	{"kz": "4.2. Бұқаралық ақпарат құралдарына сұхбат беру", "ru": "Интервью для средств массовой информации"}	{"kz": "Интервью для средств массовой информации разных уровней.", "ru": "Интервью для средств массовой информации разных уровней."}	{24baf163-bda6-4b36-b375-621e13fd92dc,8bb02fcb-d166-4bea-8cab-847da77711af,72b5889c-bbe1-4ee3-9874-9beb04931a4d}	\N
63b4cd05-6a6f-470a-90f0-fab2bf621126	{"kz": "5.1. Педагогтардың құрмет грамотасы, мадақтама, алғыс хаттары", "ru": "Почетная грамота, грамоты, благодарственные письма педагогов"}	{"kz": "Каждая грамоталагодарственное письмо умножается на балл соответствующего уровня.", "ru": "благодарственное письмо умножается на балл соответствующего уровня."}	{cdb92250-26c5-426f-bd00-fe744b64eb03,abeb4f03-5a2c-4c32-9083-0ac8b2d98414,10751f96-80a8-4fc7-adb6-8c7575c35247,acd6339e-fa66-4835-9918-13700309d439}	\N
ecd416bc-5e2c-4f42-9571-3660a8c8e887	{"kz": "6.1. Кәсіби конкурстарға қатысу", "ru": "Участие в профессиональных конкурсах"}	{"kz": "Каждое мероприятие умножается на балл соответствующего уровня и результата.", "ru": "Каждое мероприятие умножается на балл соответствующего уровня и результата."}	{b381bbe5-5740-438d-ae9f-997217fa0791,7d831d52-6b4d-4931-a53e-8d984bb56ed6,67453126-1b07-4fb3-a3eb-9c5622c4ba9d,e541d6fc-4b6b-4183-94f7-c7fda2dfa479,ded68b5f-0795-4589-b7a5-5becdd7a1ecd,07250fd4-fd5b-461c-989c-20a85b80fe16,1873ca51-ddbf-4572-bf2d-9a4afcc1479b,fccae323-a76c-4ead-9cca-9ba8f8649bdb}	\N
07f035a7-ac3d-4b03-8a6e-ab9f214b9370	{"kz": "7.1. Кәсіби шеберлік WorldSkills чемпионатына қатысуы", "ru": "Участие в профессиональных чемпионатах WorldSkills"}	{"kz": "Баллы для участия, призовых мест и ролей эксперта-компатриота, заместителя главного эксперта, главного эксперта.", "ru": "Баллы для участия, призовых мест и ролей эксперта-компатриота, заместителя главного эксперта, главного эксперта."}	{393a497d-269f-42c6-b267-f2c20689e2ae,29c7d72d-bf47-4991-a841-3a452ec2a8e9,88cb78a4-068e-4635-88d9-94137a43334c,d6fa8126-8359-41ea-a9da-67d8706d6219,caad9e66-185c-4ab4-8c1a-50f9911376be,45cacf94-2b49-4ff5-ba24-abf438fc8bbd,73a3f05e-b68c-4952-bb62-7df7b627a1b7,59473940-7561-415f-81ce-fdaa271cd185}	\N
67a1ad0b-db42-479c-994f-6c0c92a1b542	{"kz": "8.1. Ашық сабақтар өткізуі", "ru": "Проведение открытого урока"}	{"kz": "Открытые уроки с указанием применяемых методов и технологий обучения.", "ru": "Открытые уроки с указанием применяемых методов и технологий обучения."}	{ec743c61-9d81-4c51-8341-f7a3030edcef,59a511bc-bf6f-4cbd-a415-d90ac0e42579,d957773d-7902-47cb-b6bc-a0c2156be31f,0ad69602-7fd5-4051-9243-262eda9c5d05}	\N
13bc93b1-b0d1-4589-9374-22a4f795fc90	{"kz": "8.2. Әріптестердің сабағына қатысу", "ru": "Посещение уроков коллег"}	{"kz": "Каждый посещенный урок умножается на 1 балл. Основание: листы и журнал взаимопосещений.", "ru": "Каждый посещенный урок умножается на 1 балл. Основание: листы и журнал взаимопосещений."}	{dac7dfea-b29c-4d3f-bfb4-e3eac91bfe97}	\N
ac6dcd13-e66f-488f-a06e-9de4710f65e6	{"kz": "9.1. Топ жетекшілігі", "ru": "Кураторство"}	{"kz": "Качественное ведение работы руководства группой, воспитательные часы, дисциплина группы, общественная работа и участие студентов в конкурсах.", "ru": "Качественное ведение работы руководства группой, воспитательные часы, дисциплина группы, общественная работа и участие студентов в конкурсах."}	{9b08f93d-e707-4697-81d4-9febf1d0b5a6,7d929709-6df3-4c97-abd4-f15802ec1261,1cbe764c-c698-4742-b117-e62810064660,9aa21ec9-b1f0-4bdc-affd-144786b0aed1,1efa3fe5-288c-4bbd-8a22-c257dce580c5,4cd0397e-d638-44fb-bb3b-8f2fa63f2c24,d5e99c44-08d5-43a8-a65a-1993a184c9cc,6de619f9-7bc3-4670-a0ed-57b8209247e5,540d8471-2c82-49a8-a13c-84bd5577c5fa,690cc3ca-e9f7-47c8-94a1-d65c345b9348}	\N
8adb9e63-acef-4d71-9dcb-473fcbc3f3c5	{"kz": "9.2. Сабақтан тыс ашық іс-шаралар өткізу", "ru": "Проведение открытого внеклассного мероприятия"}	{"kz": "Каждое внеклассное мероприятие умножается на балл соответствующего уровня.", "ru": "Каждое внеклассное мероприятие умножается на балл соответствующего уровня."}	{5de3c203-db24-4ba5-b2fb-3d064824c073,f84318ba-efd3-41c7-a6cf-05561ddbe085,5be7f8c5-5883-459d-95cc-4a71bb3c6909,66b94c8e-1962-4cd5-adfa-36a76f77192c}	\N
41fab191-3a91-4086-9bcf-0c110a500b7c	{"kz": "Ашық сабақтар өткізуі", "ru": "Проведение открытого урока"}	\N	{c7dbd3aa-580f-4d9c-b5f4-a94833e29d53,fe363e6a-dda7-4c5a-b5f0-a9a2068d4c63,2c15c516-1dab-4bee-bb7a-b32a0f943573,842c753e-a225-4a47-b869-e07a592eb3a5}	\N
e285159c-117d-46c4-9bc3-360d1ac80a6f	{"kz": "10.1. Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы", "ru": "Руководство работой студентов и призовые места"}	{"kz": "Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия.", "ru": "Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия."}	{54927a51-d8d0-43e0-b12c-67b22c06687c,acb5b62d-6c66-4268-9a4c-60269b0b2515,ee7e9637-e6fb-4136-9f38-be2cd224e205,c6bd88ed-dc29-4197-8dec-d161564d5cf4}	\N
bab32134-7cee-4328-9680-a9e11f2b3bd3	{"kz": "11.1. Өндірістік оқыту шеберлерінің өндіріс орындарымен меморандум орнатуы", "ru": "Заключение меморандума с предприятиями мастерами производственного обучения"}	{"kz": "Оценка заключенных меморандумов с предприятиями по типу организации.", "ru": "Оценка заключенных меморандумов с предприятиями по типу организации."}	{8b990e44-b78f-46e1-8f5b-ca9b0dd133bd,9757bfc1-1483-4ab7-8830-0c14b34ffcb1,6f2e6ede-d63b-4a99-99ed-e589d56cd7dd}	\N
414e308c-f189-4e77-b035-e634f52ee643	{"kz": "12.1. Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны", "ru": "Количество школ, охваченных профориентационной работой"}	{"kz": "Оценка профориентационной работы и медийного сопровождения мероприятий.", "ru": "Оценка профориентационной работы и медийного сопровождения мероприятий."}	{5ef47696-a804-4949-af0c-00e9ef159f87,71368ae1-fcce-43ff-9f7b-8f816fe8067f,1dc3c8b6-d629-46fb-990d-eca5209997d7,ca4b7cf9-c56c-4b46-b862-297e5cc2f0dc}	\N
31ed677d-044e-4d43-8d9e-f89a01c10cd3	{"kz": "Оқу-әдістемелік материалдарды құрастыру", "ru": "Разработка учебно-методических материалов"}	{"kz": "Оценка разработки учебно-методических материалов.", "ru": "Оценка разработки учебно-методических материалов."}	{10ba3520-f56b-4d47-983d-aa379f144f0c}	\N
7a99facf-7011-4597-a095-e06b4286d38b	{"kz": "Авторлық жұмыстар", "ru": "Авторские работы"}	{"kz": "Оценка авторских работ, методических пособий, образовательных программ, учебных пособий и учебников.", "ru": "Оценка авторских работ, методических пособий, образовательных программ, учебных пособий и учебников."}	{455e5daa-ed45-4d53-b685-9531394b3799,3a26da29-12e7-4878-a9cf-06be0d0a5087,0690903b-f1b5-4353-b7ab-750e8b32bd79,be2b989f-d95f-47c0-a6c7-e69947c27244,942944cb-34e7-4758-836b-b4eac0b9802e,c0ca2778-ab79-4d2a-b98d-6a3e7ccf7aee,e0bf2f55-1c86-4fc8-a857-d997ae3f4431,340744f9-d520-4d51-918e-a0b7d9c0ae15,07e0aa61-0255-4bea-8caa-56d98f07cfbd,ba7a04b9-2bb4-407d-86d2-3e813b6d6712}	\N
d5548edc-5c46-4de8-8872-d3b289cda06e	{"kz": "Біліктілікті арттыру курстарынан өту", "ru": "Прохождение курсов повышения квалификации"}	{"kz": "Оценка курсов повышения квалификации и стажировок.", "ru": "Оценка курсов повышения квалификации и стажировок."}	{00ce83e1-48d3-4da5-83d7-a5aa25f4f7e4,4de3a488-5081-4df4-8afe-d30ce9580c14,172c50cb-97c4-4e4a-b21d-82f4075a65b4,b01bfe6b-03bc-4c9d-b5fb-95bb50c85d8b}	\N
658ffa6c-12ce-46dd-a481-d78032b9e6f7	{"kz": "Педагогикалық озық іс-тәжірибелерінің нәтижелері", "ru": "Результаты передового педагогического опыта"}	{"kz": "Доклады на семинарах, конференциях и педагогических чтениях.", "ru": "Доклады на семинарах, конференциях и педагогических чтениях."}	{c9bab99d-2bde-47ee-847f-8cd2e783b757,86d71fb2-1367-4d38-b4d5-40d3f6259746,c28e93a0-4c27-492f-bb71-b7c4ba9c7a54,82c8c5da-1673-4ab1-9e93-9fc66eafd199,38e58ee7-0757-4575-9898-f2eb42637073,a562e7ea-b2e6-49e6-903d-63b1f55d5017,70438f32-0860-45db-82bd-25979eb47fb8,6fb5f98f-839c-4aca-919e-5b58768c9742}	\N
faa3c175-1515-4195-8cd3-556db3eb228d	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану", "ru": "Применение интернет-сайтов и социальных сетей"}	{"kz": "Видеоуроки, лайфхаки и материалы, загруженные в TikTok, Instagram, YouTube и другие площадки.", "ru": "Видеоуроки, лайфхаки и материалы, загруженные в TikTok, Instagram, YouTube и другие площадки."}	{76a87a29-dbd4-48fc-8de0-9d009ea89a71,7c260cb0-eeb1-45b3-9661-7c4b3c0badbd,aaaf6f1f-91cd-4fe6-81ac-9bbf3b6b43f3}	\N
69ffa70a-18be-477f-9998-71d0ebff7463	{"kz": "Бөлім жұмысын белсенді атқаруы", "ru": "Активное выполнение работы отделения"}	{"kz": "Активное участие в работе отделения, ШМП, педагогического и методического советов.", "ru": "Активное участие в работе отделения, ШМП, педагогического и методического советов."}	{0fc14b4a-27c1-48cf-9c3d-ad44a3fc9422,1ea4c965-05b3-473f-96ea-9999fd1bde67,08be8861-ea44-49a9-a89f-94bac13994c1,aeb517b1-d6c5-4fad-b3ea-f5871a10d6d0}	\N
3d288b25-4bde-480f-9a7f-8068b48c54aa	{"kz": "Газет, журнал беттеріне мақала жариялау", "ru": "Публикация материалов на страницах газет, журналов"}	{"kz": "Публикации в печатных и электронных СМИ.", "ru": "Публикации в печатных и электронных СМИ."}	{3f74bcce-7e31-45ab-9b45-f9a37f7f3cd9,2a174fce-b14e-4d2c-b8a8-6ac44ee015a1,b88ae7e9-178d-4203-84a6-ab0f46ea5c6d}	\N
39f03bf0-12c2-498e-ba35-da675483bccf	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беру", "ru": "Интервью для средств массовой информации"}	{"kz": "Интервью для средств массовой информации разных уровней.", "ru": "Интервью для средств массовой информации разных уровней."}	{77ffc329-ffec-43cf-9455-d5664090f8c4,e77f38de-fbe5-4395-a910-0aaf3e7c540a,5560ee9f-2f4a-4967-b51a-4e17f6f876e9}	\N
002cd74f-fd51-40f6-a4a1-78445727c4b4	{"kz": "Педагогтардың құрмет грамотасы, мадақтама, алғыс хаттары", "ru": "Почетная грамота, грамоты, благодарственные письма педагогов"}	{"kz": "Каждая грамоталагодарственное письмо умножается на балл соответствующего уровня.", "ru": "благодарственное письмо умножается на балл соответствующего уровня."}	{241b1e94-e996-4c2b-bbb2-40a820de9e83,603b1d66-85eb-4d16-b465-e49e1e71ca15,6835b845-bc20-4d41-8a09-43202a85a41b,6a27e008-18fb-44bd-83e1-65e677bc80b5}	\N
95e3c021-62cd-41ac-a9a2-376139f0ffba	{"kz": "Біліктілікті арттыру курстарынан өту", "ru": "Прохождение курсов повышения квалификации"}	\N	{6d84d4bc-90f0-44ef-95cf-e820f1d7affd,2c8fcc4e-47d2-4393-9f2b-0d2851a9763f,5a22585d-9b35-485b-b8e4-2b76fd8725f0,e0922012-d6e4-4e73-bf05-dcdffda32b1a}	\N
fbdc70fc-d0e0-485c-8a47-d36e3ff0ba36	{"kz": "Кәсіби конкурстарға қатысу", "ru": "Участие в профессиональных конкурсах"}	{"kz": "Каждое мероприятие умножается на балл соответствующего уровня и результата.", "ru": "Каждое мероприятие умножается на балл соответствующего уровня и результата."}	{6c07b208-714a-4046-a943-34419c8c1eed,ac52f163-fc5c-4126-9e6f-42ad053d3e07,ad914334-6606-4860-9826-9a546f5cf1cc,93f8c071-26a3-4a4d-a66d-a0e115371899,c344fedb-940a-481a-930c-e261a9d2c54d,c81d32f1-1b85-4aca-8b65-59abf22a0a1f,74e95725-1dae-47cc-a0ca-8c5a3542cab8,790c08bb-11c5-4a7d-b973-a23d231952f0}	\N
c860bc23-967d-4715-b1b7-7e8254ad88ee	{"kz": "Кәсіби шеберлік WorldSkills чемпионатына қатысуы", "ru": "Участие в профессиональных чемпионатах WorldSkills"}	{"kz": "Баллы для участия, призовых мест и ролей эксперта-компатриота, заместителя главного эксперта, главного эксперта.", "ru": "Баллы для участия, призовых мест и ролей эксперта-компатриота, заместителя главного эксперта, главного эксперта."}	{51ac4ab0-643e-440d-b556-f7cd46f215b7,a716f95d-0136-4942-9885-1d6f153643bb,52fef1e2-4661-4e64-a335-c86de330e17e,20bcafcd-d540-413e-bd0d-62ceedb35556,cf78e6d7-e4d3-4265-942d-6decef7525e0,759012ab-3abb-4791-8341-2f7261c635f2,eced9a6c-2885-4b98-b7ad-bc58feeae89a,2359b39b-abc2-4558-b00d-0db2e4e0789d}	\N
9a906e0b-d615-4ec3-889b-2ef6c57d235b	{"kz": "Ашық сабақтар өткізуі", "ru": "Проведение открытого урока"}	{"kz": "Открытые уроки с указанием применяемых методов и технологий обучения.", "ru": "Открытые уроки с указанием применяемых методов и технологий обучения."}	{8fe94533-e2f9-480f-985a-cfc0e2d2c196,3609d68b-2156-450b-9eb7-6eca0d98430d,90b202e1-a75d-4f21-88cc-2b89f1f47482,7348acaa-864c-435e-8594-2676ccae25b2}	\N
ae7b2455-246d-4212-b4ac-2fb08211a9fb	{"kz": "Әріптестердің сабағына қатысу", "ru": "Посещение уроков коллег"}	{"kz": "Каждый посещенный урок умножается на 1 балл. Основание: листы и журнал взаимопосещений.", "ru": "Каждый посещенный урок умножается на 1 балл. Основание: листы и журнал взаимопосещений."}	{a2fe7574-4b92-43c5-a4f4-61ba268dea1c}	\N
d87d9cb9-5bb3-4f2f-83e6-9813719c5389	{"kz": "Топ жетекшілігі", "ru": "Кураторство"}	{"kz": "Качественное ведение работы руководства группой, воспитательные часы, дисциплина группы, общественная работа и участие студентов в конкурсах.", "ru": "Качественное ведение работы руководства группой, воспитательные часы, дисциплина группы, общественная работа и участие студентов в конкурсах."}	{1d0ee4e9-48f8-4c8b-bc7c-0a50115cf7ba,1e348f51-281b-4ce0-927e-e0e7e86e1296,2e309eae-b0c4-4366-be6d-e776b40d32b9,dc6fce23-ca60-4e64-b6ab-cf30e02ce20e,e6d0b1aa-ed05-4ad5-892a-fa59810d1e70,9db21e9f-778a-4e8f-974b-f6d7f96af8a0,46bf57fd-0c8b-4752-97c6-852ab6f3ee80,df7c32c6-8ec1-47ef-a4c8-21c1b42a0289,5fae68f2-abc8-41bb-93ba-6adf4a0680bb,cbad3aee-26ad-450b-ba1c-b09742f76d32}	\N
ba6ab104-9885-4fe8-b880-fa52c81b93f4	{"kz": "Сабақтан тыс ашық іс-шаралар өткізу", "ru": "Проведение открытого внеклассного мероприятия"}	{"kz": "Каждое внеклассное мероприятие умножается на балл соответствующего уровня.", "ru": "Каждое внеклассное мероприятие умножается на балл соответствующего уровня."}	{c01c736b-1196-4faa-8c69-7965df415a8a,260368d4-889c-4064-846b-356a64177760,fa350f7a-0a88-48de-935b-f27975f85314,d0d8e916-afd8-4790-b6a9-204cb6e49e82}	\N
cf293f1a-921f-4f63-951a-5e49c3999f48	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы", "ru": "Руководство работой студентов и призовые места"}	{"kz": "Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия.", "ru": "Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия."}	{eecd6f52-ccc9-4967-9354-96e8c2a029fb,35c83c34-424e-4e6e-a968-426ded8f1c2e,2684d6e3-92b9-417f-9c79-9ba960d3e835,0d7ee3cb-8141-4278-81ac-008e1f1293d9}	\N
6d808405-2597-49b0-9861-ddb1ce80e24b	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы", "ru": "Руководство работой студентов и призовые места"}	{"kz": "Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия.", "ru": "Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия."}	{81964b37-8841-4e74-aea5-827419711c4d,2866e892-04b7-49b8-92c5-bb92c7c84a33,788c04e6-372c-4422-849e-6619ab5db681,b0784a18-de37-49db-bd07-13f2d039d480}	\N
1e7228b5-52fd-4979-8999-1a1c4564a1b3	{"kz": "Өндірістік оқыту шеберлерінің өндіріс орындарымен меморандум орнатуы", "ru": "Заключение меморандума с предприятиями мастерами производственного обучения"}	{"kz": "Оценка заключенных меморандумов с предприятиями по типу организации.", "ru": "Оценка заключенных меморандумов с предприятиями по типу организации."}	{061cd35d-9d29-4e1c-b4a1-455c022e171f,e27a594f-9658-45e5-a4ed-51dee4d0357f,c7f10705-7455-41be-9d7a-7012778dd5e9}	\N
7115d916-0909-407a-b473-2a7e05dac8f4	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны", "ru": "Количество школ, охваченных профориентационной работой"}	{"kz": "Оценка профориентационной работы и медийного сопровождения мероприятий.", "ru": "Оценка профориентационной работы и медийного сопровождения мероприятий."}	{a36d4cba-3737-4d99-b7c4-ccb13e28178d,99d090de-5163-43bf-ae33-98a4a09c141c,01cec185-843a-4034-9eb3-663d81857f57,c5e9700c-a3c8-4efc-a35c-eec1e889eeca}	\N
2dc635d3-b2e5-4fd4-9c58-5c6f78e40de1	{"kz": "Кәсіби конкурстарға қатысу", "ru": "Участие в профессиональных конкурсах"}	\N	{be8cfc82-26e3-4dd8-92a1-016fa94cb939,3d835f61-46a6-40e5-9e2c-9d16d914a889,bd058db8-29e5-486a-adb4-7978da355d36,0c716092-ff35-46b9-8f52-96accb2289ab,e80efe42-57de-4994-bc21-63e0db9d5d55,b5cc2262-f1ff-4cbe-aa3e-bad36dabfbe7,32a2fd0a-32c1-4c16-9fc0-f366ee5e8283,53de4d8c-f197-428d-95d1-2225b8af6234}	\N
5d9f63ba-5d16-42d9-9abb-b3a5e4ae94c0	{"kz": "Кәсіби шеберлік WorldSkills чемпионатына қатысуы", "ru": "Участие в профессиональных чемпионатах WorldSkills"}	\N	{4ec019b3-f86d-4170-ab0e-912d269b2694,903162dc-1ca8-4e50-bcd9-1d11579d3cfc,9fa4475f-0d9c-421b-b63b-5938967bda1a,848eb745-d829-480a-b7f7-71e34df3b82d,7b15a1fd-5e4c-4855-b347-7c891b57f2cb,2d3cb88f-6c69-4ebf-84df-20d804e59a5f,ff2f2e7a-330d-402c-b290-5e433eefbeab,bfd0c43a-0c4f-4d9a-8b33-4451e172fdc5}	\N
49e1f44f-fb63-43e0-bd70-abf69b012301	{"kz": "Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы", "ru": "Руководство олимпиады, творческой и научно-исследовательской работой студентов и призовые места"}	\N	{f283a05f-2c1d-44fb-8f37-1a14184c96ae,2b31f316-e0d5-4cfb-9bdf-3cf3c138a216,56209e75-4128-47ea-9352-9c0d35237cf2,f36d1aff-38f1-4c64-ba95-ead90a72ad03}	\N
9d6899dc-d5b5-448f-be6c-c84a8bf98c2a	{"kz": "Разработка учебно-методических материалов", "ru": "Разработка учебно-методических материалов"}	\N	{6e8dfb51-d9cc-471a-a260-73366beb6082}	\N
bab94a49-be5f-4104-9ff6-826445d0a98c	{"kz": "Авторские работы", "ru": "Авторские работы"}	\N	{8f3a9882-18c6-4321-8373-4a54e33937d2,5b0bf683-ebb7-4412-9467-b404fa2d7d28,488e773a-b25f-43cf-89d8-80208366c190}	\N
6248d2fc-a5af-4fe0-a7a2-513206e95b1f	{"kz": "разработка методических пособий", "ru": "разработка методических пособий"}	\N	{67fea61b-778d-45b0-b247-d2690d45fbdb,d33f302b-cc56-4eba-a0a9-10f059a165ab,c2b2a524-efc5-4b52-aac4-7bf11300a5b2}	\N
c2a690bd-0bae-4082-a2cb-680d1ac1836d	{"kz": "Разработка учебно-методических материалов", "ru": "Разработка учебно-методических материалов"}	\N	{170ef94e-b5b2-410c-85d1-2e98c6d4c535}	\N
caf40511-6425-45c9-b888-767f34506f15	{"kz": "Авторские работы", "ru": "Авторские работы"}	\N	{702c1fa7-e55b-400c-8c0b-806392d5c1d9,6841577b-df68-4d34-959c-5828041700a2,48f09c89-89eb-4acd-8ccf-5c8182512f08}	\N
42a34b44-1269-40c8-9b10-0dec9dcca4b4	{"kz": "разработка методических пособий", "ru": "разработка методических пособий"}	\N	{d6c5cff7-fa66-493b-9b2b-07ca7db47224,b533767b-9136-4f33-babb-ecac6de33623,6bacebde-15f2-4881-90e4-7137fa9da566}	\N
2bc89641-38cd-42d8-a6e0-b80e9b2d581f	{"kz": "разработка образовательных программ", "ru": "разработка образовательных программ"}	\N	{e416cd74-e024-432e-a4b8-bd47d81dbc01,136c909b-fadd-443b-9c0e-03806555bd8e,e5133e52-3958-4da2-b521-d4a4d53d67de}	\N
f4e43411-69a6-43cf-9d4f-cc98f1cd14ef	{"kz": "учебное пособие и учебники", "ru": "учебное пособие и учебники"}	\N	{f824e396-c152-4532-98e8-fc2366739adc,8f21ec17-959a-4d81-90eb-a4c83d46eafa,8825ca06-5f0b-4a99-8a38-9d14e657732e}	\N
98869738-992e-43a0-a9e0-d10a76216fcf	{"kz": "Оқу-әдістемелік материалдарды құрастыру", "ru": "Разработка учебно-методических материалов"}	\N	{94cfd782-c12a-4d66-93fd-6092e3786369}	\N
5c02940b-50ae-42b6-a574-c131ce09a81f	{"kz": "Авторлық жұмыстар", "ru": "Авторские работы"}	\N	{24f16997-102c-47fc-8305-223892ef4e49,7960bdda-59cd-4302-a41c-91e1e7bebef9,8346a350-9ef0-4ece-83f3-6b1ed53a7066}	\N
4ad77d33-540c-480a-a1e6-4d937cdee5e8	{"kz": "Әдістемелік құралдарды құрастыру", "ru": "разработка методических пособий"}	\N	{43045e32-e92f-4ad3-8f54-b65df03719ac,f60cfdef-6c49-4e10-829f-cd07fc4593f1,e7bfd2db-0125-4103-b1bf-5b2df9a51fb2}	\N
5514be23-50b4-4f1c-a3a7-96674421872d	{"kz": "Білім беру бағдарламаларын құрастыру", "ru": "разработка образовательных программ"}	\N	{2f85ae53-ea1b-447d-bd61-8d81ae66c7a6,52be573c-b6eb-4701-9c5e-0617216ff625,451a3fd4-8ff0-4cd3-97f9-de6ea696c829}	\N
89875a08-8240-4ced-a711-eae8ee1fbb91	{"kz": "оқу құралы және оқулық", "ru": "учебное пособие и учебники"}	\N	{ca6b6c73-7ea3-44e0-9b3b-f8d0f95d3286,4ea79e6b-7c06-4c47-8f3f-81925b69737f,2f417884-9dec-49d6-919e-dc30114e9a9a}	\N
8d5baaff-9a78-45e1-84f3-1b6081ad04fe	{"kz": "Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны", "ru": "Количество школ, охваченных профориентационной работой"}	\N	{6eb36928-4325-40bf-8618-f0b4933c5501,e7ddd8fa-1803-4589-8862-e89c83681a58,773ad48d-e934-4612-b4d9-87616a168b1a}	\N
afa4e577-81b0-46d4-9b0e-1f301fbf8ff1	{"kz": "Іс-шараларды медиялық сүйемелдеу", "ru": "Медийное сопровождение мероприятий"}	\N	{a809de49-3615-451b-900b-811873ebd0a2}	\N
7557766e-d525-4cd7-ba2c-6f66cac4fbc4	{"kz": "Өндірістік оқыту шеберлерінің өндіріс орындарымен меморандум орнатуы", "ru": "Заключение меморандума с предприятиями мастерами производственного обучения"}	\N	{1cb12a79-048b-47b5-98fa-554c6f0da073,69a8e650-f022-43a7-90c1-3d073dbe811d,cc18e24a-9745-4f08-91c4-b11ba6ddc996}	\N
d294a780-be4e-4535-b533-5898e29311df	{"kz": "ғылыми, ғылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу", "ru": "выступление с докладом в научных, научно-практических семинарах и конференциях"}	\N	{7d858cbb-dc78-4fc3-bfad-94efe1fb4f6e,35b29bf2-1043-4a84-a965-28813f56f019,75f18846-be68-4636-9b6e-7ae1c0302edb,3f76bf6e-b3e1-46e7-8adb-7acecab1de35}	\N
82545f16-abaa-4e24-8931-81c824f74483	{"kz": "педагогикалық оқуда", "ru": "педчтениях"}	\N	{1c055bc0-a030-4c1c-8cf9-4ac87c145c57,50086dd1-63ae-4fbe-b968-85a60a00ca31,7fd37758-4efd-45f1-ace6-39be2508120c,205ef02d-f170-4714-912b-a68b8d9bf58f}	\N
05c0eee0-d7ca-4cc3-b56b-676bc9d06e71	{"kz": "Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану", "ru": "Применение интернет сайтов и социальных сетей в целях распростронения педагогического опыта"}	\N	{be339484-c6fe-4bf6-8206-31c036d0cee8,673c56c1-c1a5-4bc0-b9e7-1aa2b61dad58,cdbe101b-112c-43b1-893a-06e3e393579c}	\N
82ff97ff-be68-4186-8c1e-7c925936c58c	{"kz": "Бөлім жұмысын белсенді атқаруы", "ru": "активное выполнение работы отделения"}	\N	{aba06ebd-4ffe-4529-90df-f4c7febb74d4,b1b28ed5-af2c-42b2-8e09-ee72a437cdf6,16c2445a-f470-4efe-a88e-59118f4496f4,9567eae2-f736-43e5-88ae-b880dc9818ed}	\N
1aeb92b1-58b0-43f8-8d5d-203027b2135c	{"kz": "Газет, журнал беттеріне мақала жариялау", "ru": "Публикация материалов на страницах газет, журналов"}	\N	{fcf55d6b-0385-4b54-ba99-578c6c80f881,2a0c6d2b-1c5e-4f9c-ae4e-f5fd5965cef2,2d794195-9a65-4955-83b6-f77f02d90120}	\N
4956d7f5-1dd0-4651-83cf-4fff257d4a6c	{"kz": "Бұқаралық ақпарат құралдарына сұхбат беру", "ru": "Интервью для средств массовой информации"}	\N	{13d349c7-5e6a-4798-b3ca-a52cde6660b8,9f524cbe-421d-4633-847b-a38c53a2ffaa,8583367b-aed1-46e1-a72b-2b264d930a76}	\N
ee98880f-7db4-4330-8e96-baa1f18661fe	{"kz": "Педагогтардың құрмет грамотасы, мадақтама, алғыс хаттары", "ru": "Почетная грамота, грамоты, благодарственные письма педагогов"}	\N	{5d8501ec-de0c-453f-be10-f14145aa5e61,3a0897f9-1d8e-40c8-b698-8030c304ed3f,2bb5d605-b5a6-4bcb-ac1c-2fc6bf803522,de02729c-d5ad-4dc2-9ee9-9d7509c4a36b}	\N
8ae2f290-2a0c-41d2-99cf-ab7a378d8d18	{"kz": "Педагогтардың құрмет грамотасы, мадақтама, алғыс хаттары", "ru": "Почетная грамота, грамоты, благодарственные письма педагогов"}	\N	{fdf7fe05-f3ea-41c8-abc8-bf0eca8dec80,08553acc-8398-4e0d-a854-bf189f3f3ec4,9b01f786-f9d0-476c-acd2-748b7d21e54b,7eeaa44c-90c4-4a3c-9115-a7d70a38b352}	\N
d14b2689-4ee7-4162-9b84-56997bb0ba89	{"kz": "Топ жетекшілігі жұмысын сапалы жүргізуі", "ru": "Качественное ведение работы руководства группой"}	\N	{998272a9-9559-43e4-abf9-9102228e1545,552c0bf5-4ee0-45a3-a9a9-9f0a045f12a4,5224d42b-4261-46ad-bf8c-3d187cc8600f,6568c7cd-f333-4611-9ecb-fd8d848e40df}	\N
051994d5-4fb3-4612-84b2-b4ecbfa51a6f	{"kz": "Әріптестердің сабағына қатысу", "ru": "Посещение уроков коллег"}	\N	{7acd2526-5b10-4bfd-98dc-5378d452e6b6}	\N
f140f8aa-280b-4f67-b69d-dee2b07ae74f	{"kz": "Студенттердің  топ жетекшісімен бірге конкурстарға қатысуы", "ru": "Участие студентов в конкурсах совместно с руководителем группы"}	\N	{e7aa8457-a8fb-48e8-9c04-a362cda01bc5,c0ada7ab-e94d-4659-922e-0d60ed805181,cc6e7393-8610-4cd7-8d9a-5d11aaf30e14,157c52f1-bacc-4715-842a-6f036d6a9fb7}	\N
e9082802-df57-441e-8382-97b3a6e3a3f6	{"kz": "Сабақтан тыс ашық іс-шаралар өткізу", "ru": "Проведение открытого внеклассного мероприятия"}	\N	{19fed14f-dbce-401a-b6c3-76e74b6081c5,4a475be3-a9db-4c59-8ed8-8c84c27f1791,dfce47eb-61ce-4864-91bb-ff0545695749,1da7f999-a8c5-4386-bd69-b1dec1f9d0f4}	\N
\.


--
-- Data for Name: award_types; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_types (id, name, variants) FROM stdin;
769415c0-4041-4205-95cf-6c0059d5af30	{"kz": "Тәрбие жұмысы", "ru": "Воспитательная работа"}	{d14b2689-4ee7-4162-9b84-56997bb0ba89,f140f8aa-280b-4f67-b69d-dee2b07ae74f,e9082802-df57-441e-8382-97b3a6e3a3f6}
29ff7f54-4af4-4537-a520-1b4931c01035	{"kz": "Әдістемелік материалдарды, оқу бағдарламаларын, оқу құралдарын әзірлеу және жариялау", "ru": "Подготовка и опубликование методических материалов, учебных программ, учебных пособий."}	{98869738-992e-43a0-a9e0-d10a76216fcf,5c02940b-50ae-42b6-a574-c131ce09a81f,4ad77d33-540c-480a-a1e6-4d937cdee5e8,5514be23-50b4-4f1c-a3a7-96674421872d,89875a08-8240-4ced-a711-eae8ee1fbb91}
571d169a-e25b-4349-b65a-b56ca1aaa6b0	{"kz": "Ашық сабақтар өткізуі", "ru": "Открытые уроки"}	{41fab191-3a91-4086-9bcf-0c110a500b7c,051994d5-4fb3-4612-84b2-b4ecbfa51a6f}
49b98075-79b8-4c1e-95d2-9f373a0a1210	{"kz": "Педагогтердің байқауларға және кәсіби шеберлік конкурстарына қатысуы", "ru": "Участие педагогов в конкурсах, в конкурсах профессионального мастерства"}	{2dc635d3-b2e5-4fd4-9c58-5c6f78e40de1}
21c41e1d-c906-4212-8194-005a5ee16e12	{"kz": "WorldSkills кәсіби шеберлік чемпионатына қатысу және оны ілгерілету", "ru": "Участие и продвижение чемпионата профессионального мастерства WorldSkills"}	{5d9f63ba-5d16-42d9-9abb-b3a5e4ae94c0}
6b8e7106-a4e9-4ee6-b7c0-a057e28ced2b	{"kz": "Студенттердің ғылыми жетекшінің жетекшілігімен конференциялар мен олимпиадалардағы, спорттық іс-шаралардағы жетістіктері", "ru": "Достижение студентов под руководством руководителя в конференциях и олимпиадах, спортивных мероприятиях"}	{49e1f44f-fb63-43e0-bd70-abf69b012301}
67f54cb3-903e-4945-b10d-4b65ce8b6cd7	{"kz": "Біліктілікті арттыру курстарынан және тағылымдамадан өту", "ru": "Прохождение курсов повышения квалификации и стажировка"}	{95e3c021-62cd-41ac-a9a2-376139f0ffba}
a9d73920-e039-4662-8ccf-0d95a4fc4105	{"kz": "Колледжтің имиджін насихаттау мақсатында кәсіби бағдар беру жұмысын ілгерілету", "ru": "Продвижение профориентационной работы, в целях популиризации имиджа колледжа"}	{8d5baaff-9a78-45e1-84f3-1b6081ad04fe,afa4e577-81b0-46d4-9b0e-1f301fbf8ff1}
cfd0371e-6e3e-463a-bab8-64eef5d29ea5	{"kz": "Оқу-өндірістік жұмысқа қатысу", "ru": "Участие в учебно-производственной работе"}	{7557766e-d525-4cd7-ba2c-6f66cac4fbc4}
1392839e-d0ce-4d20-bb2a-42aba7eb797c	{"kz": "Педагогикалық озық іс-тәжірибелерінің нәтижелері", "ru": "Результаты передового педагогического опыта"}	{d294a780-be4e-4535-b533-5898e29311df,82545f16-abaa-4e24-8931-81c824f74483}
cc112dd3-73fe-4eb1-8d2c-fa4dfa3f80ff	{"kz": "Ғылыми-практикалық және әдістемелік конференциялар, семинарлар мен іс-шараларда сөз сөйлеу", "ru": "Выступление в научно-практических и методических конференциях, семинарах, мероприятиях"}	{05c0eee0-d7ca-4cc3-b56b-676bc9d06e71,82ff97ff-be68-4186-8c1e-7c925936c58c}
f1c11505-b54f-4037-8414-444417b1c5d5	{"kz": "Бұқаралық ақпарат құралдары", "ru": "СМИ"}	{1aeb92b1-58b0-43f8-8d5d-203027b2135c,4956d7f5-1dd0-4651-83cf-4fff257d4a6c}
155f99cb-ff4c-4e0f-8ee1-677e4b7c4f52	{"kz": "Алғыс хаттар, мадақтамалар және құрмет грамоталары", "ru": "Благодарственные письма, похвальные листы и почётные грамоты"}	{8ae2f290-2a0c-41d2-99cf-ab7a378d8d18}
\.


--
-- Data for Name: awards; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.awards (id, status, reason, methodist, teacher, total_points, type, variant, criteria, bonus_criteria, category_id, field_values, created_at, updated_at) FROM stdin;
07197626-c23c-49c3-9d3f-a3bccab92c31	APPROVED		f387d51c-6df1-421f-b38b-a97140998177	39613932-39f1-438f-ba3b-7191d41865d2	10	769415c0-4041-4205-95cf-6c0059d5af30	f140f8aa-280b-4f67-b69d-dee2b07ae74f	c0ada7ab-e94d-4659-922e-0d60ed805181	\N	44444444-4444-4444-8444-444444444448	{"url": "https://eduplan.aspc.kz", "file": "awards/39613932-39f1-438f-ba3b-7191d41865d2/file/f31d40c1-b879-4dbe-b1c5-4e9a0aa0b9da_Характеристика Агапитов Е.А (2).docx", "year": "2025-2026"}	2026-05-25 12:00:52.804501+00	2026-05-25 12:01:27.24281+00
3ffecb6e-fc21-4616-9bdf-6431e6dfda1f	APPROVED		f387d51c-6df1-421f-b38b-a97140998177	e7e9d327-b17a-4db3-9944-6476d76c1272	10	29ff7f54-4af4-4537-a520-1b4931c01035	5c02940b-50ae-42b6-a574-c131ce09a81f	24f16997-102c-47fc-8305-223892ef4e49	\N	44444444-4444-4444-8444-444444444447	{"url": "https://eduplan.aspc.kz", "title": "sdfgsdfg", "extract": "sdfgsdfg", "scan_file": "", "event_date": "2026-05-11", "book_number": "sdfgsdfg", "material_type": "sdfgsdfg", "material_recommended": "sdfgsdfg"}	2026-05-25 12:03:14.269275+00	2026-05-25 12:03:26.454527+00
1f84f068-a127-4a34-b86a-3feea2901d72	APPROVED		40b8c58d-439e-4d87-b58f-6969c1c5cccc	b1364b94-09d2-4b83-b22b-1915ec3ae469	5	6b8e7106-a4e9-4ee6-b7c0-a057e28ced2b	49e1f44f-fb63-43e0-bd70-abf69b012301	f283a05f-2c1d-44fb-8f37-1a14184c96ae	\N	c871b6aa-ec1a-411a-aac5-da24fa217f35	{"file": "awards/b1364b94-09d2-4b83-b22b-1915ec3ae469/file/6cce872f-3969-4f93-8368-d6d04ecd7bc0_1.png", "name": "Robocup", "year": "2024-2025", "category": "для студентов", "fullName": "Саин Батырхан"}	2026-05-25 12:24:22.235036+00	2026-05-25 12:31:03.079951+00
aa531c71-39bc-4463-a9fc-e351b8a2a67f	APPROVED		40b8c58d-439e-4d87-b58f-6969c1c5cccc	53100286-5247-459c-b87a-e74b8cf22ed0	2	155f99cb-ff4c-4e0f-8ee1-677e4b7c4f52	8ae2f290-2a0c-41d2-99cf-ab7a378d8d18	fdf7fe05-f3ea-41c8-abc8-bf0eca8dec80	\N	cced00d7-ee5f-48c9-8fd8-e885ad6bffcb	{"date": "2026-05-06", "file": "awards/53100286-5247-459c-b87a-e74b8cf22ed0/file/81257c66-3f84-42e8-9d2a-5925c4105900_output.webp", "name": "Министерство просвещения "}	2026-05-25 12:18:35.887177+00	2026-05-25 12:31:22.735963+00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.departments (keycloak_id, name, users) FROM stdin;
ec824a1c-cbd0-4cc6-8da2-bbc1916d982c	{"kz": "«Бағдарламалық қамтамасыз ету» бөлімі", "ru": "Отделение «Программное обеспечение»"}	{39613932-39f1-438f-ba3b-7191d41865d2}
6e8a5547-660c-4cf4-bccf-583e34542238	{"kz": "«Ақпараттық қауіпсіздік бағдарламалық жасақтамасы және жүйелері» бөлімі", "ru": "Отделение «Программное обеспечение и системы информационной безопасности»"}	{e7e9d327-b17a-4db3-9944-6476d76c1272}
7f36c848-9abc-4622-9620-2a77e54129ed	{"kz": "«Компьютерлік технологиялар және ақпараттық желілер» бөлімі", "ru": "Отделение «Вычислительная техника и информационные сети»"}	{53100286-5247-459c-b87a-e74b8cf22ed0}
e0e2ec05-01ff-4629-a64b-0ebe8dffb247	{"kz": "«Ақпараттық жүйелер» бөлімі", "ru": "Отделение «Информационные системы»"}	{b1364b94-09d2-4b83-b22b-1915ec3ae469}
\.


--
-- Data for Name: discipline_semesters; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.discipline_semesters (id, semester, total_hours) FROM stdin;
2c102c78-c6a1-4015-a659-6c0fc92f78dd	1	4
bf170aee-7dbe-469c-ac35-c552e5a50341	2	4
954c3a41-1f18-48ca-8306-7c624ec71858	3	0
a897b49a-8a21-4024-ae14-3ed8c4d500c4	4	0
2727609f-62f7-475c-8689-4f2f4c683f66	5	0
f29e55c2-884e-4b99-9b74-f90dbc1ae9e8	6	0
30044c88-2bd2-45e6-ae90-2c9686df498d	7	0
7b3f351a-8b7a-426d-9fbc-3234c6e1ab41	8	0
\.


--
-- Data for Name: discipline_topics; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.discipline_topics (id, name, type, lesson_id, total_hours, theory_hours, practice_hours, individual_hours, srsp_hours, srs_hours) FROM stdin;
78c78428-fc32-421d-a5bc-5befa181668a	{"kz": "Объясняет основные концепции программирования на Python", "ru": "Объясняет основные концепции программирования на Python"}	COMBINED	\N	2	2	0	0	0	0
dc601ef5-9300-4acb-ad44-1edcf6329257	{"kz": "Разрабатывает простые программы с использованием функций Python", "ru": "Разрабатывает простые программы с использованием функций Python"}	COMBINED	\N	2	2	0	0	0	0
a819c36b-629d-43b5-b437-1a57bfed963a	{"kz": "Реализовывает условные конструкции и циклы в Python", "ru": "Реализовывает условные конструкции и циклы в Python"}	PRACTICAL	\N	2	0	2	0	0	0
8e432c38-68db-4ca6-a3eb-5e602934371c	{"kz": "Применяет базовые структуры данных Python (списки, кортежи, словари)", "ru": "Применяет базовые структуры данных Python (списки, кортежи, словари)"}	PRACTICAL	c8cec635-aa93-4648-9a6a-f23b9090190e	2	0	2	0	0	0
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.groups (keycloak_id, name, qualification, specialty) FROM stdin;
8b7e56e6-fc1a-4cc6-a795-f66c5d268229	Test-ednev-group	\N	\N
e6eff862-03f0-4852-821c-a190f83420d5	WEB25-А	{"kz": "3W06130102 \\"Web-дизайнер\\"", "ru": "3W06130102 \\"Web-дизайнер\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
4cadb558-be47-4ca5-b45c-7d5d94bf6366	WEB25-Б	{"kz": "3W06130102 \\"Web-дизайнер\\"", "ru": "3W06130102 \\"Web-дизайнер\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
ca2eec3f-8ab4-41f1-8a13-2210240296f9	ИС22-А	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
273aa813-7f5d-4c63-9bde-c8ba5643cf7c	ИС22-Б	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
2e25f729-2552-4c19-b1f4-66f4da78995e	ИС23-А	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
6435262a-2e4e-4901-9408-e99b63b87ab4	ИС23-Б	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
cba2cc54-6dd5-47ed-ba00-997e0a216fb7	ИС24	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
9c55597a-0c49-4853-879e-7eff13c70934	ИС25-А	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
af1cabf9-1e1c-4735-a3be-cdf264a3fe36	ИС25-Б	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
c98fddb4-9d8b-4f02-be13-7ef297279171	ОП24-А	{"kz": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\"", "ru": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
1f50b039-a7e0-4d0c-80db-531cdf3ff64f	ОП24-Б	{"kz": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\"", "ru": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
637ae75c-ea8b-4ba9-b937-a7c7d8f13d00	П22-А	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
615a632b-52e3-4981-8154-6a274e32e137	П22-Б	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
a0b37d63-2233-49fa-b427-e3a7a5a23c43	П22-В	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
822d3bb4-4370-4728-afd7-56dfff4ce4ee	П22-Г	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
b20b8e4a-2e3a-454e-8bad-ef9f722d798a	П22-Д	{"kz": "4S06130103 \\"Разработчик программного обеспечения", "ru": "4S06130103 \\"Разработчик программного обеспечения"}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
0062438c-39d3-4f1c-be6f-8651652f931a	П22-ЕК	{"kz": "4S06130103 \\"Разработчик программного обеспечения", "ru": "4S06130103 \\"Разработчик программного обеспечения"}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
0f6986f1-a950-40c1-ac1e-87e72225b44e	П22-ЖК	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
0aa8c842-4a36-443a-a8c4-c30349a73ee2	П22-ЗК	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
a0aefbb0-5576-4496-baac-b9680c3765d6	П22-ИК	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
838b6665-805b-4635-84f2-b84beea4d5f9	П23-3С	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
31ee78b8-abb4-4269-8d72-9b76802157aa	П23-А	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
7970a724-19e4-476f-a74d-c9efd2c80afa	П23-Б	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
e2c5b0dd-12cf-4d94-a06a-534a5a351479	П23-В	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
d0a4ad94-922f-4442-86e6-af5ea4cca674	П23-Г	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
fa0b764a-90ca-45a5-b012-d7ea166fc7a5	П23-Д	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
f38cb698-2e0d-4d76-92b2-df9d8f77722b	П23-Е	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
1a21de7e-2601-406f-8d46-66ce950e9cd7	П23-ЖК	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
620aa0f9-616c-404c-8139-24f2354088d9	П24-2С	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
f292f86b-7475-4784-95fb-a2da2fa1a2c1	П24-А	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
49f52724-960f-494a-8497-b6db3e8ad433	П24-Б	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
01510e61-0c7d-4d71-a1f8-9b35c6540607	П24-В	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
db6258a6-8106-493c-b09e-cc60289f76ed	П24-Г	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
760a6096-7577-4198-bd82-c380b920bf76	П24-Д	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
44666e40-2cb5-4621-9630-8b727f5a3556	П24-ЖК	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
6ff7e6c7-aa04-4262-a400-d34edfceea92	П25-1С	{"kz": "4S06130105 \\"Техник информационных систем\\"", "ru": "4S06130105 \\"Техник информационных систем\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
3edeab81-7b4a-4845-9744-8120cebe1afb	П25-А	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
9b098cf8-b7c1-44f5-922b-665711b922f8	П25-Б	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
466ceedd-1d36-444f-9696-265c225ce0c0	П25-В	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
de7e617e-f1bd-4136-a76f-876a2387073a	П25-Г	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
b537f6aa-8baf-4fec-8307-2ba7a6361633	П25-ДК	{"kz": "4S06130103 \\"Разработчик программного обеспечения\\"", "ru": "4S06130103 \\"Разработчик программного обеспечения\\""}	{"kz": "06130100 \\"Программное обеспечение\\"", "ru": "06130100 \\"Программное обеспечение\\""}
b32c7cbb-14c9-4f76-8767-d3b062130430	РЭТ22	{"kz": "4S07140905 \\"Техник мультимедийных и цифровых систем\\"", "ru": "4S07140905 \\"Техник мультимедийных и цифровых систем\\""}	{"kz": "07140900 \\"Радиотехника, электроника и телекоммуникации\\"", "ru": "07140900 \\"Радиотехника, электроника и телекоммуникации\\""}
ae1c35dc-92c8-4fda-8a17-50f743d91ab1	РЭТ23	{"kz": "4S07140905 \\"Техник мультимедийных и цифровых систем\\"", "ru": "4S07140905 \\"Техник мультимедийных и цифровых систем\\""}	{"kz": "07140900 \\"Радиотехника, электроника и телекоммуникации\\"", "ru": "07140900 \\"Радиотехника, электроника и телекоммуникации\\""}
ede3e4c3-b6af-4afb-b1cf-9cc0f77bda00	РЭТ24	{"kz": "4S07140905 \\"Техник мультимедийных и цифровых систем\\"", "ru": "4S07140905 \\"Техник мультимедийных и цифровых систем\\""}	{"kz": "07140900 \\"Радиотехника, электроника и телекоммуникации\\"", "ru": "07140900 \\"Радиотехника, электроника и телекоммуникации\\""}
b8a1cec0-02c9-40b7-8259-a02802a86cf9	РЭТ25	{"kz": "4S07140902 \\"Техник телекоммуникационных систем связи\\"", "ru": "4S07140902 \\"Техник телекоммуникационных систем связи\\""}	{"kz": "07140900 \\"Радиотехника, электроника и телекоммуникации\\"", "ru": "07140900 \\"Радиотехника, электроника и телекоммуникации\\""}
75e27058-209f-4a98-b766-b24621d6d09b	С25	{"kz": "3W07140901 \\"Электромонтажник-накладчик телекоммуникационного оборудования и каналов связи\\"", "ru": "3W07140901 \\"Электромонтажник-накладчик телекоммуникационного оборудования и каналов связи\\""}	{"kz": "07140900 \\"Радиотехника, электроника и телекоммуникации\\"", "ru": "07140900 \\"Радиотехника, электроника и телекоммуникации\\""}
d3bf7a16-5778-443c-b6c1-af12d7c3f013	Т22-А	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
61f729f4-32c5-4dde-a12f-8eb90e18eab1	Т22-Б	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
65fc15fb-5ab1-4295-9e27-399c6f8960c4	Т23-А	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
b252af6e-c1bd-49a7-aea2-d7d1e08e00b7	Т23-Б	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
2f03e505-b72f-406c-aabf-3197a1ac0073	Т23-В	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
edc49d4e-e1ca-4e58-bdc5-a2166a464a44	Т24	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
df78fca4-5436-4101-9796-3f3786ce2b08	Т25	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
8521526c-cb69-46ce-9588-0b6a23d3a77b	Т25-1	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
4eef5c48-7a57-4c39-959c-7dcbd96ed7bf	Т25-4В	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
0df6145c-bf76-42c0-8dd9-237e4b1af427	Т25-4Г	{"kz": "4S06120102 \\"Техник сетевого и системного администрирования\\"", "ru": "4S06120102 \\"Техник сетевого и системного администрирования\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети'\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети'\\""}
3edb761e-00a3-4213-a6fe-58bfd295604b	ТЗИ22	{"kz": "4S06120202 \\"Техник по информационной безопасности\\"", "ru": "4S06120202 \\"Техник по информационной безопасности\\""}	{"kz": "06120200 \\"Системы информационной безопасности\\"", "ru": "06120200 \\"Системы информационной безопасности\\""}
92ad65eb-80f8-4b80-813b-fc3229a20f06	ТЗИ24	{"kz": "4S06120202 \\"Техник по информационной безопасности\\"", "ru": "4S06120202 \\"Техник по информационной безопасности\\""}	{"kz": "06120200 \\"Системы информационной безопасности\\"", "ru": "06120200 \\"Системы информационной безопасности\\""}
05622ecb-80fa-412d-b2ef-f2ab077bc733	ТЗИ25	{"kz": "4S06120202 \\"Техник по информационной безопасности\\"", "ru": "4S06120202 \\"Техник по информационной безопасности\\""}	{"kz": "06120200 \\"Системы информационной безопасности\\"", "ru": "06120200 \\"Системы информационной безопасности\\""}
cb61cf1f-1dd0-4be0-af31-76e25275ad8e	ТМ22	{"kz": "4S07151102 \\"Техник-механик\\"", "ru": "4S07151102 \\"Техник-механик\\""}	{"kz": "07151100 \\"Эксплуатация и техническое обслуживание машин и оборудования\\"", "ru": "07151100 \\"Эксплуатация и техническое обслуживание машин и оборудования\\""}
748d32a1-9abe-4a76-9b82-59169b1695aa	ТМ23	{"kz": "4S07151102 \\"Техник-механик\\"", "ru": "4S07151102 \\"Техник-механик\\""}	{"kz": "07151100 \\"Эксплуатация и техническое обслуживание машин и оборудования\\"", "ru": "07151100 \\"Эксплуатация и техническое обслуживание машин и оборудования\\""}
51889c72-412e-4297-b4ea-b5b2bf908642	ТМ25	{"kz": "4S07151102 \\"Техник-механик\\"", "ru": "4S07151102 \\"Техник-механик\\""}	{"kz": "07151100 \\"Эксплуатация и техническое обслуживание машин и оборудования\\"", "ru": "07151100 \\"Эксплуатация и техническое обслуживание машин и оборудования\\""}
bfb73da8-2ef8-4dba-b3ae-7b7f8c47e21f	ЭВМ23-А	{"kz": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\"", "ru": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети\\""}
4126bd33-9b50-41fe-a29a-23f85bd0a3a2	ЭВМ23-Б	{"kz": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\"", "ru": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети\\""}
7eae6ae6-56dd-4246-b88b-51035b482d59	ЭВМ23-В	{"kz": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\"", "ru": "3W06120101 \\"Оператор компьютерного аппаратного обеспечения\\""}	{"kz": "06120100 \\"Вычислительная техника и информационные сети\\"", "ru": "06120100 \\"Вычислительная техника и информационные сети\\""}
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.lesson_progress (id, lesson_id, name, first_time, second_time, third_time, content) FROM stdin;
383acd4a-d35d-4fff-b0ac-f9316b3cb448	c8cec635-aa93-4648-9a6a-f23b9090190e	{"kz": "Введение и мотивация", "ru": "Введение и мотивация"}	{10}	{15}	{10}	{"Приветствие студентов, проверка присутствующих.","Озвучивание темы и целей практического занятия.","Краткое обсуждение важности структур данных в программировании на примерах из реальной жизни.","Актуализация знаний о предыдущих темах (если применимо)."}
905e841e-ec56-4c4f-a34d-9b6c2502ebf9	c8cec635-aa93-4648-9a6a-f23b9090190e	{"kz": "Изучение и применение списков", "ru": "Изучение и применение списков"}	{20}	{25}	{20}	{"Объяснение концепции списков в Python: создание, доступ к элементам, изменение, добавление, удаление.","Демонстрация основных методов списков (append, insert, remove, pop, len, index).","Решение практических задач: составление списка покупок, хранение результатов измерений.","Индивидуальное выполнение мини-заданий студентами под контролем преподавателя."}
5969a83b-5eb1-470c-b5a1-ed834cf769fa	c8cec635-aa93-4648-9a6a-f23b9090190e	{"kz": "Работа с кортежами", "ru": "Работа с кортежами"}	{15}	{15}	{20}	{"Объяснение особенностей кортежей: неизменяемость, создание, доступ.","Сравнение списков и кортежей, определение сценариев использования кортежей.","Примеры использования: хранение координат, неизменяемых настроек.","Практическое задание: создание кортежа с данными студента."}
276b2ca6-8d9c-4e4d-973c-3b430a047afa	c8cec635-aa93-4648-9a6a-f23b9090190e	{"kz": "Использование словарей", "ru": "Использование словарей"}	{25}	{20}	{25}	{"Объяснение структуры словарей: пары ключ-значение, создание, доступ.","Демонстрация операций: добавление, изменение, удаление элементов, получение ключей/значений.","Решение практических задач: создание телефонной книги, хранение информации о пользователях.","Практическое задание: разработка простого словаря для учета успеваемости."}
c2fd0be7-5a26-4927-b6d3-db4b824ba2db	c8cec635-aa93-4648-9a6a-f23b9090190e	{"kz": "Закрепление материала и подведение итогов", "ru": "Закрепление материала и подведение итогов"}	{20}	{15}	{15}	{"Обсуждение возникших вопросов и сложностей.","Решение комплексной задачи, требующей применения всех трех структур данных.","Краткое повторение основных моментов занятия.","Оценка работы студентов, объявление домашнего задания (при наличии).","Анонс следующей темы (если применимо)."}
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.lessons (id, rup_name, discipline_name, topic_name, plan_number, teacher, event_date, group_id, type, goals, tasks, expected, internet_resources, technical_resources, file_url, created_at, updated_at) FROM stdin;
c8cec635-aa93-4648-9a6a-f23b9090190e	{"kz": "питон", "ru": "питон"}	{"kz": "РО1.1 Основы программирования на Python", "ru": "РО1.1 Основы программирования на Python"}	{"kz": "Применяет базовые структуры данных Python (списки, кортежи, словари)", "ru": "Применяет базовые структуры данных Python (списки, кортежи, словари)"}	47	46313143-eadb-4798-b7f5-2fa97869e716	2026-05-20 10:31:40.785724+00	de7e617e-f1bd-4136-a76f-876a2387073a	PRACTICE	{"kz": "Сформировать у студентов понимание и навыки применения базовых структур данных Python: списков, кортежей и словарей, для решения практических задач программирования.", "ru": "Сформировать у студентов понимание и навыки применения базовых структур данных Python: списков, кортежей и словарей, для решения практических задач программирования."}	{"kz": "Научить студентов создавать, изменять и использовать списки, кортежи и словари в Python. Развить умение выбирать подходящую структуру данных для конкретной задачи. Ознакомить с основными операциями над списками, кортежами и словарями. Способствовать формированию алгоритмического мышления при работе с данными.", "ru": "Научить студентов создавать, изменять и использовать списки, кортежи и словари в Python. Развить умение выбирать подходящую структуру данных для конкретной задачи. Ознакомить с основными операциями над списками, кортежами и словарями. Способствовать формированию алгоритмического мышления при работе с данными."}	{"kz": "Студенты будут уверенно использовать списки, кортежи и словари в своих программах на Python. Смогут самостоятельно выбирать и применять эти структуры данных для эффективного решения поставленных задач. Будут способны анализировать и модифицировать существующий код, содержащий данные структуры.", "ru": "Студенты будут уверенно использовать списки, кортежи и словари в своих программах на Python. Смогут самостоятельно выбирать и применять эти структуры данных для эффективного решения поставленных задач. Будут способны анализировать и модифицировать существующий код, содержащий данные структуры."}	{f57e041b-bac2-4262-aa9e-ff6de82335b6,5c86b995-5cf2-4a5f-ae0a-f19af8fe7a73,8b1a900a-5789-407c-83d5-c07eb19f0467,3c6e2735-7b03-40af-8d6a-676f571256e0,da82eac6-0794-45aa-b7f2-9a47a8c48307}	{ec02d1b1-62b7-423e-bda9-9e711956177c,0f5c93b3-6082-4a9e-8406-b01fa7005709,8535eb6b-470d-4b01-a4f4-45764d17aba3,b6e668c7-f626-4a63-9e39-d9fb2e59dce5}	lessons/c8cec635-aa93-4648-9a6a-f23b9090190e/Применяет_базовые_структуры_данных_Python__списки__кортежи__словари_20260520_103140_c8cec635.docx	2026-05-20 10:31:40.786204+00	2026-05-20 10:31:41.157997+00
\.


--
-- Data for Name: rup_disciplines; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_disciplines (id, name, total_hours, semesters, topics) FROM stdin;
a3f0ff5f-14a5-429b-82fb-cfe959a471cc	{"kz": "РО1.1 Основы программирования на Python", "ru": "РО1.1 Основы программирования на Python"}	8	{2c102c78-c6a1-4015-a659-6c0fc92f78dd,bf170aee-7dbe-469c-ac35-c552e5a50341,954c3a41-1f18-48ca-8306-7c624ec71858,a897b49a-8a21-4024-ae14-3ed8c4d500c4,2727609f-62f7-475c-8689-4f2f4c683f66,f29e55c2-884e-4b99-9b74-f90dbc1ae9e8,30044c88-2bd2-45e6-ae90-2c9686df498d,7b3f351a-8b7a-426d-9fbc-3234c6e1ab41}	{78c78428-fc32-421d-a5bc-5befa181668a,dc601ef5-9300-4acb-ad44-1edcf6329257,8e432c38-68db-4ca6-a3eb-5e602934371c,a819c36b-629d-43b5-b437-1a57bfed963a}
\.


--
-- Data for Name: rup_exploration_notes; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_exploration_notes (id, basis, goals, summary, competencies, prerequisites, postrequisites, internet_resources, technical_resources) FROM stdin;
33ba1128-0c22-4a26-a592-d0635f1c7abe	{"kz": "крутой питон курс", "ru": "крутой питон курс"}	{"kz": "выучить питон", "ru": "выучить питон"}	\N	{"kz": "питон", "ru": "питон"}	{"kz": "ничего", "ru": "ничего"}	{"kz": "крутой питон программист", "ru": "крутой питон программист"}	\N	\N
\.


--
-- Data for Name: rup_resources; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_resources (id, name, link) FROM stdin;
f57e041b-bac2-4262-aa9e-ff6de82335b6	Официальная документация Python по типам данных	https://docs.python.org/3/tutorial/datastructures.html
5c86b995-5cf2-4a5f-ae0a-f19af8fe7a73	Руководство по спискам в Python	https://www.w3schools.com/python/python_lists.asp
8b1a900a-5789-407c-83d5-c07eb19f0467	Уроки по кортежам в Python	https://www.w3schools.com/python/python_tuples.asp
3c6e2735-7b03-40af-8d6a-676f571256e0	Работа со словарями в Python	https://www.w3schools.com/python/python_dictionaries.asp
da82eac6-0794-45aa-b7f2-9a47a8c48307	Практические примеры использования структур данных Python	https://realpython.com/python-data-structures/
ec02d1b1-62b7-423e-bda9-9e711956177c	Компьютер с установленной ОС (Windows, macOS, Linux)	\N
0f5c93b3-6082-4a9e-8406-b01fa7005709	Среда разработки Python (например, PyCharm Community Edition, VS Code с расширением Python)	\N
8535eb6b-470d-4b01-a4f4-45764d17aba3	Установленная версия Python 3	\N
b6e668c7-f626-4a63-9e39-d9fb2e59dce5	Доступ к сети Интернет	\N
\.


--
-- Data for Name: rups; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rups (id, name, status, reason, course, study_form, study_year, type, total_hours, contacts, group_ids, methodist, teacher, exploration_note_id, disciplines, created_at, updated_at) FROM stdin;
6412d85e-bcff-4f1a-9f1b-cd87e7ddf861	{"kz": "питон", "ru": "питон"}	APPROVED	\N	1	FULL_TIME	2025-2026	THEORY	8	{46313143-eadb-4798-b7f5-2fa97869e716}	{de7e617e-f1bd-4136-a76f-876a2387073a}	46313143-eadb-4798-b7f5-2fa97869e716	46313143-eadb-4798-b7f5-2fa97869e716	33ba1128-0c22-4a26-a592-d0635f1c7abe	{a3f0ff5f-14a5-429b-82fb-cfe959a471cc}	2026-05-20 10:30:06.941322+00	2026-05-20 10:30:28.29285+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (keycloak_id, email, username, first_name, last_name, phone, role, rups, total_points, awards, violation, password_changed_at, last_seen_at, created_at, updated_at) FROM stdin;
46313143-eadb-4798-b7f5-2fa97869e716		kpopov27	Кирилл	Попов		ADMIN	\N	0	\N	NONE	\N	\N	2026-05-20 10:27:46.972872+00	2026-05-21 14:25:47.434576+00
f2546909-a510-49e7-9185-bd576e76784c	just.sain29@gmail.com	just-sain	Батыр	Саин	+77777777777	ADMIN	\N	0	\N	NONE	\N	\N	2026-05-25 10:41:24.364108+00	2026-05-25 10:41:24.364108+00
39613932-39f1-438f-ba3b-7191d41865d2	duisekeyevb@gmail.com	duisekeyevb	Бекжан	Дүйсекеев	+77755187663	TEACHER	\N	10	\N	NONE	\N	\N	2026-05-25 12:00:25.621281+00	2026-05-25 12:00:25.621281+00
e7e9d327-b17a-4db3-9944-6476d76c1272	ssauleb@mail.ru	ssauleb	Сауле	Сейсекулова	+77004040022	TEACHER	\N	10	\N	NONE	\N	\N	2026-05-25 12:02:23.953786+00	2026-05-25 12:02:23.953786+00
40b8c58d-439e-4d87-b58f-6969c1c5cccc		teachertest2		teachertest		METHODIST	\N	0	\N	NONE	\N	\N	2026-05-25 12:19:20.972074+00	2026-05-25 12:19:20.972074+00
b1364b94-09d2-4b83-b22b-1915ec3ae469	saliha_2015@mail.ru	saliha_2015	Салиха	Бердибаева	+77477203835	TEACHER	\N	5	\N	NONE	\N	\N	2026-05-25 12:15:38.29177+00	2026-05-25 12:15:38.29177+00
53100286-5247-459c-b87a-e74b8cf22ed0	shyray.mukasheva@bk.ru	shyray.mukasheva	Мұқашева	Шырай	+77478813685	TEACHER	\N	2	\N	NONE	\N	\N	2026-05-25 12:14:47.623506+00	2026-05-25 12:14:47.623506+00
f387d51c-6df1-421f-b38b-a97140998177	gimussumig@gmail.com	koki	Артур	Ионов		ADMIN	\N	0	\N	NONE	\N	\N	2026-05-25 09:27:47.041188+00	2026-05-25 12:39:20.435037+00
c69c3e8c-00bd-4acb-aa8f-28d20f240313	raviltasbulat@gmail.com	famint	Равиль	Тасбулат		ADMIN	\N	0	\N	NONE	\N	\N	2026-05-26 02:28:10.963432+00	2026-05-26 02:28:10.963432+00
3a0f5061-b5cb-42c5-94df-0cadc97a0f4a	admin@aspc.kz	stiks	Александр	Проскурин	101	ADMIN	\N	0	\N	NONE	\N	\N	2026-05-26 07:47:49.227667+00	2026-05-26 07:47:49.227667+00
\.


--
-- Name: lessons_plan_number_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.lessons_plan_number_seq', 47, true);


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
-- PostgreSQL database dump complete
--

\unrestrict 2qn6OefixPPiQnIrt75j3oyikIwjrlVwxa0a34WOvasfFupkdnB7kKwMOKtHPeT

