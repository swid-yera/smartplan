--
-- PostgreSQL database dump
--

\restrict hhDAvnaGKleUw64VGYHw64SXx6EYAhdgkI5yMaljNIcVzaG13Y8LOLJmSTQp4H6

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO admin;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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
    name text NOT NULL,
    icon text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.award_categories OWNER TO admin;

--
-- Name: award_category_fields; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_category_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    required boolean DEFAULT false NOT NULL,
    placeholder text,
    help_text text,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    validation jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.award_category_fields OWNER TO admin;

--
-- Name: award_type_criteria; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_type_criteria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    points integer[],
    method public.enum_criteria_method NOT NULL
);


ALTER TABLE public.award_type_criteria OWNER TO admin;

--
-- Name: award_type_variants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_type_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    criteria uuid[],
    bonus_criteria uuid[]
);


ALTER TABLE public.award_type_variants OWNER TO admin;

--
-- Name: award_types; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.award_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    variants uuid[]
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    variant uuid,
    criteria uuid,
    bonus_criteria uuid,
    category_id uuid,
    field_values jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.awards OWNER TO admin;

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
    name text NOT NULL,
    type public.discipline_topic_type NOT NULL,
    total_hours integer DEFAULT 0 NOT NULL,
    theory_hours integer DEFAULT 0 NOT NULL,
    practice_hours integer DEFAULT 0 NOT NULL,
    individual_hours integer DEFAULT 0 NOT NULL,
    srsp_hours integer DEFAULT 0 NOT NULL,
    srs_hours integer DEFAULT 0 NOT NULL,
    lesson_id uuid
);


ALTER TABLE public.discipline_topics OWNER TO admin;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.groups (
    keycloak_id uuid NOT NULL,
    name text NOT NULL,
    qualification text,
    specialty text
);


ALTER TABLE public.groups OWNER TO admin;

--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.lesson_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    name text NOT NULL,
    first_time integer[] NOT NULL,
    second_time integer[] NOT NULL,
    content text[],
    third_time integer[] NOT NULL
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
    rup_name text NOT NULL,
    discipline_name text,
    topic_name text,
    teacher uuid NOT NULL,
    event_date timestamp with time zone,
    group_id uuid NOT NULL,
    type public.enum_lesson_type NOT NULL,
    goals text,
    tasks text,
    expected text,
    internet_resources uuid[],
    technical_resources uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    file_url text,
    plan_number integer DEFAULT nextval('public.lessons_plan_number_seq'::regclass) NOT NULL
);


ALTER TABLE public.lessons OWNER TO admin;

--
-- Name: rup_approve_challenges; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rup_approve_challenges (
    challenge text NOT NULL,
    rup_id uuid NOT NULL,
    key_id text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rup_approve_challenges OWNER TO admin;

--
-- Name: rup_disciplines; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rup_disciplines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    total_hours integer DEFAULT 0 NOT NULL,
    semesters uuid[],
    topics uuid[]
);


ALTER TABLE public.rup_disciplines OWNER TO admin;

--
-- Name: rup_exploration_notes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rup_exploration_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basis text,
    goals text,
    summary text,
    competencies text,
    prerequisites text,
    postrequisites text,
    internet_resources uuid[],
    technical_resources uuid[]
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
    name text NOT NULL,
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
    CONSTRAINT rups_course_check CHECK (((course >= 1) AND (course <= 4)))
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
20260518091630		2	3	3	2026-05-20 10:27:16.155855+00	2075400			oJQ9vhpw0AcP4QFwdS8gntFt7QJc5HY6A0SLlXOonJg=	null	Atlas CLI v1.0.1-03cd806-canary
20260119094407		2	1	1	2026-05-20 10:27:14.116639+00	2245100			jbgqVJYSaZFnszKO4RQ9F58/kAi/+TEJtNmt2iPzB6Q=	null	Atlas CLI v1.0.1-03cd806-canary
20260119082723		2	20	20	2026-05-20 10:27:13.640418+00	1563000			E9otq3u1wVHLQtDuNijuCejM3SMgkTf/TISayUaxnFI=	null	Atlas CLI v1.0.1-03cd806-canary
20260119134802		2	2	2	2026-05-20 10:27:14.214758+00	1576400			icq25vhFU2f/UvXko2TxWPyHhnBGibKY514PmFgHnkI=	null	Atlas CLI v1.0.1-03cd806-canary
20260119083027		2	2	2	2026-05-20 10:27:14.018847+00	2685600			ZcB2KIl6dTKT7Szzv/0y5JRScW5XueaUqOnpDgx1+lI=	null	Atlas CLI v1.0.1-03cd806-canary
20260518145113		2	1	1	2026-05-20 10:27:16.788894+00	1586400			/pFXPtYZNHQ09j/wTmCxgzxLiuIANslEsjLD/dVnAr8=	null	Atlas CLI v1.0.1-03cd806-canary
20260121033543		2	1	1	2026-05-20 10:27:14.297962+00	1586800			wlTGRNPaiAcY9fMBhmuXupLKiAdAzZlcxLFQY9a1sxM=	null	Atlas CLI v1.0.1-03cd806-canary
20260122052237		2	1	1	2026-05-20 10:27:14.384701+00	2207400			+c96xlTijLZwM1lC3m3b0nttKSVZYq2PlZ44Lt15iNc=	null	Atlas CLI v1.0.1-03cd806-canary
20260122082143		2	1	1	2026-05-20 10:27:14.488149+00	1578000			00l2GWiI71Ceu1CvNQrOYx/rzflAjyeP+w54Wd7h6XQ=	null	Atlas CLI v1.0.1-03cd806-canary
20260519144311		2	3	3	2026-05-20 10:27:16.809884+00	1730000			A7fFarL4nOiPWor7y7gQbWiq4AlVsktgLNzcBJooNKQ=	null	Atlas CLI v1.0.1-03cd806-canary
20260122185957		2	3	3	2026-05-20 10:27:14.721146+00	1549300			CbgX2dB2faM8yzq+BFVG+ykzR4Lww7kR56vqNBWk3c4=	null	Atlas CLI v1.0.1-03cd806-canary
20260123003834		2	1	1	2026-05-20 10:27:15.379656+00	1759300			chMElAWyhf79hy1QIT7ejsC0k+XodtSJas3+UtwclAY=	null	Atlas CLI v1.0.1-03cd806-canary
20260518103000		2	8	8	2026-05-20 10:27:16.330736+00	3190000			6VsBxOeaQxFVxClgBLVe/91CJk2wvfmUP0HrPOAcd7c=	null	Atlas CLI v1.0.1-03cd806-canary
20260127122605		2	1	1	2026-05-20 10:27:15.78294+00	3870900			/488CXNTxCYtVpX5Xge06rJdRsZA507sIOp/STmmPDQ=	null	Atlas CLI v1.0.1-03cd806-canary
20260422100803		2	2	2	2026-05-20 10:27:15.942855+00	1601100			7YqcX1BHxw/xFChiyu6B8STkX/wKjXfHznVD2NHSO4g=	null	Atlas CLI v1.0.1-03cd806-canary
20260518120000		2	1	1	2026-05-20 10:27:16.653768+00	1837100			WYuXTPijrZd19oOEtLKR+1f/XDrk9uACiO5jczUMGnA=	null	Atlas CLI v1.0.1-03cd806-canary
20260520150000		2	5	5	2026-05-20 10:27:16.843393+00	1581300			f+5Yw22q0R1k11HVvBCulZBgpKO5GQKsYCyOU2LTQPQ=	null	Atlas CLI v1.0.1-03cd806-canary
20260520153000		2	1	1	2026-05-20 10:27:17.000235+00	1595500			NzsP9HAb8uEQ+qPeDRUxH++CLOBUMoUVowr0WrTallE=	null	Atlas CLI v1.0.1-03cd806-canary
\.


--
-- Data for Name: award_categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_categories (id, award_types, name, icon, description, created_at, updated_at) FROM stdin;
44444444-4444-4444-8444-444444444441	{}	Качество знаний	brain	Показатели успеваемости и качества знаний по дисциплинам	2026-05-20 12:42:03.004591+00	2026-05-20 13:02:57.021428+00
44444444-4444-4444-8444-444444444442	{}	Результаты конкурсов и соревнований	award	Награды, дипломы, сертификаты и иные достижения	2026-05-20 12:42:03.004591+00	2026-05-20 13:21:36.906382+00
44444444-4444-4444-8444-444444444443	{}	Трансляция практики	presentation	Передача педагогического опыта через мастер-классы и семинары	2026-05-20 12:42:03.004591+00	2026-05-20 13:24:48.089632+00
44444444-4444-4444-8444-444444444444	{}	Выступления	mic	Доклады, презентации и сообщения на мероприятиях	2026-05-20 12:42:03.004591+00	2026-05-20 13:35:11.359999+00
44444444-4444-4444-8444-444444444445	{}	Публикации	book-open	Статьи, методические материалы, тезисы и сборники	2026-05-20 12:42:03.004591+00	2026-05-21 13:24:26.111693+00
44444444-4444-4444-8444-444444444446	{}	Участие в группах, проектах	users	Работа в комиссиях, группах и проектных командах	2026-05-20 12:42:03.004591+00	2026-05-21 13:29:35.084075+00
44444444-4444-4444-8444-444444444447	{}	Учебно-методические материалы	folder-open	Разработанные учебные и методические материалы	2026-05-20 12:42:03.004591+00	2026-05-21 13:38:33.373487+00
44444444-4444-4444-8444-444444444448	{}	Классное руководство / кураторство	graduation-cap	Кураторская и воспитательная работа с группой	2026-05-20 12:42:03.004591+00	2026-05-21 13:43:17.795283+00
\.


--
-- Data for Name: award_category_fields; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_category_fields (id, key, label, type, required, placeholder, help_text, options, validation, sort_order, created_at, updated_at, category_id) FROM stdin;
6705ce81-a679-4b45-aa0a-538b0724a657	title	Название публикации	text	t	Название статьи или материала	\N	[]	{}	1	2026-05-21 13:24:26.147558+00	2026-05-21 13:24:26.147558+00	44444444-4444-4444-8444-444444444445
ac3241db-81db-4838-be00-3e64b14a3c65	event_date	Дата публикации	date	t	Выберите дату	\N	[]	{}	2	2026-05-21 13:24:26.162835+00	2026-05-21 13:24:26.162835+00	44444444-4444-4444-8444-444444444445
80dd32b8-3bd7-4493-96bd-46117124931f	study_year	Учебный год	text	t	Например: 2025-2026	\N	[]	{}	3	2026-05-21 13:24:26.171227+00	2026-05-21 13:24:26.171227+00	44444444-4444-4444-8444-444444444445
5678f957-296b-4e9f-b7ad-ca94dc7ec807	publication_number	Номер публикации	text	t	Номер публикации	\N	[]	{}	4	2026-05-21 13:24:26.175834+00	2026-05-21 13:24:26.175834+00	44444444-4444-4444-8444-444444444445
c05ad62b-fc24-4577-951c-a51dbb747e8e	proof_file	Файл публикации	file	t	\N	PDF, DOCX, скриншот	[]	{}	5	2026-05-21 13:24:26.182217+00	2026-05-21 13:24:26.182217+00	44444444-4444-4444-8444-444444444445
86bf84f5-0419-42f3-b2a0-2a1338ea6325	publication_place	Ссылка на публикацию	url	t	https://...	\N	[]	{}	6	2026-05-21 13:24:26.187799+00	2026-05-21 13:24:26.187799+00	44444444-4444-4444-8444-444444444445
7ea148ba-ba7f-4c92-a6e3-a6511cf337fe	level	Издание	select	t	Укажите издание	\N	["Колледж", "Город", "Республика", "Международный"]	{}	7	2026-05-21 13:24:26.192593+00	2026-05-21 13:24:26.192593+00	44444444-4444-4444-8444-444444444445
c49206d8-9ec8-45f3-a716-ea883f580630	authors	Автор / соавторы	text	f	ФИО авторов	\N	[]	{}	8	2026-05-21 13:24:26.197845+00	2026-05-21 13:24:26.197845+00	44444444-4444-4444-8444-444444444445
aae62787-52e6-4c5a-a20e-485fb7d5ec14	organization	Организация образования	select	t	Укажите организацию образования	\N	[]	{}	9	2026-05-21 13:24:26.204432+00	2026-05-21 13:24:26.204432+00	44444444-4444-4444-8444-444444444445
79619d91-649b-449c-92fb-91c3d5e9130c	name	ФИО автора(соавтора)	text	t	Дополнительная информация	\N	[]	{}	10	2026-05-21 13:24:26.209188+00	2026-05-21 13:24:26.209188+00	44444444-4444-4444-8444-444444444445
39aa154b-56ae-45f7-9e7d-ea0479e6cb42	job_title	Должность	text	t	\N	\N	[]	{}	11	2026-05-21 13:24:26.213604+00	2026-05-21 13:24:26.213604+00	44444444-4444-4444-8444-444444444445
81d090e3-5031-44fe-b055-570c0561dffa	year	Учебный год	select	t	\N	\N	[]	{}	1	2026-05-21 13:43:17.805671+00	2026-05-21 13:43:17.805671+00	44444444-4444-4444-8444-444444444448
799d33c6-7343-4d3c-909a-6872b4ecb350	organization	Организация	text	t	\N	\N	[]	{}	2	2026-05-21 13:43:17.811375+00	2026-05-21 13:43:17.811375+00	44444444-4444-4444-8444-444444444448
82b72def-40ee-4c2d-a6c9-d67767c71848	file	Файл приказа	file	t	\N	\N	[]	{}	3	2026-05-21 13:43:17.816577+00	2026-05-21 13:43:17.816577+00	44444444-4444-4444-8444-444444444448
5c5c8b48-3027-4749-bb15-a37900419cab	url	Ссылка на материал	url	t	\N	\N	[]	{}	4	2026-05-21 13:43:17.822183+00	2026-05-21 13:43:17.822183+00	44444444-4444-4444-8444-444444444448
33def821-1942-4721-8ccc-0c19afb868b7	teacher	Педагог	text	t	\N	\N	[]	{}	5	2026-05-21 13:43:17.826872+00	2026-05-21 13:43:17.826872+00	44444444-4444-4444-8444-444444444448
d838e3fc-ff0d-46c7-b4ab-75d33a1e435a	title	Название группы / проекта	text	t	Название проекта или комиссии	\N	[]	{}	1	2026-05-21 13:29:35.094024+00	2026-05-21 13:29:35.094024+00	44444444-4444-4444-8444-444444444446
20f66c00-f9dd-49a7-acaf-d70f784a9ac3	event_date	Дата	date	t	Выберите дату	\N	[]	{}	2	2026-05-21 13:29:35.099264+00	2026-05-21 13:29:35.099264+00	44444444-4444-4444-8444-444444444446
e49c17c4-23c5-4eda-b89d-9518465837a2	level	Уровень участия	select	t	\N	\N	[]	{}	3	2026-05-21 13:29:35.103701+00	2026-05-21 13:29:35.103701+00	44444444-4444-4444-8444-444444444446
b44956bd-f3fd-4b90-8180-a181697ce584	activity_type	Вид деятельности	select	t	\N	\N	[]	{}	4	2026-05-21 13:29:35.108214+00	2026-05-21 13:29:35.108214+00	44444444-4444-4444-8444-444444444446
f1885637-9814-4d54-b5d7-17f7b55ab046	url	Ccылка на материал	url	t	\N	\N	[]	{}	5	2026-05-21 13:29:35.114296+00	2026-05-21 13:29:35.114296+00	44444444-4444-4444-8444-444444444446
2e20347b-352d-459a-b19a-6087510b6ce7	scan_file	Скан файла приказа	file	t	\N	\N	[]	{}	6	2026-05-21 13:29:35.118898+00	2026-05-21 13:29:35.118898+00	44444444-4444-4444-8444-444444444446
b520f7f6-bf79-476d-aa56-d323604ea20b	title	Название материала	text	t	Название разработки	\N	[]	{}	1	2026-05-21 13:38:33.385682+00	2026-05-21 13:38:33.385682+00	44444444-4444-4444-8444-444444444447
3fe7151a-0ce1-4d4c-b3f1-fa5dbe1f9775	event_date	Дата создания	date	t	Выберите дату	\N	[]	{}	2	2026-05-21 13:38:33.391101+00	2026-05-21 13:38:33.391101+00	44444444-4444-4444-8444-444444444447
d486df0b-347b-421b-9003-b9f90572b119	book_number	Уникальный номер книжного издания	text	t	\N	\N	[]	{}	3	2026-05-21 13:38:33.395188+00	2026-05-21 13:38:33.395188+00	44444444-4444-4444-8444-444444444447
262e0147-faf3-4d69-97d5-34ae6bf9d14d	material_type	Тип материала	text	t	\N	\N	[]	{}	4	2026-05-21 13:38:33.399389+00	2026-05-21 13:38:33.399389+00	44444444-4444-4444-8444-444444444447
f8cf7f77-8700-4793-b729-7b40273eafaa	url	Ссылка на материал	url	t	\N	\N	[]	{}	5	2026-05-21 13:38:33.404732+00	2026-05-21 13:38:33.404732+00	44444444-4444-4444-8444-444444444447
2de503de-0aba-401c-b355-4e46c8c0fc66	scan_file	Скан файла приказа	file	t	\N	\N	[]	{}	6	2026-05-21 13:38:33.409201+00	2026-05-21 13:38:33.409201+00	44444444-4444-4444-8444-444444444447
f7a4f8ee-aead-48fb-845a-94dec67188e5	extract	Выписка из протокола	select	t	\N	\N	[]	{}	7	2026-05-21 13:38:33.41408+00	2026-05-21 13:38:33.41408+00	44444444-4444-4444-8444-444444444447
9639518e-461d-47e7-a94e-d847b6864be9	organization	Организация образования	select	t	\N	\N	[]	{}	8	2026-05-21 13:38:33.418481+00	2026-05-21 13:38:33.418481+00	44444444-4444-4444-8444-444444444447
2243697e-2258-4c9f-b3e2-47657b4bbe4f	title	Название организации обучения	text	t	Название организации	\N	[]	{}	1	2026-05-20 13:02:57.031679+00	2026-05-20 13:02:57.031679+00	44444444-4444-4444-8444-444444444441
0495b3c2-032a-4b51-85be-b3d41b3762ea	name	ФИО	text	t	ФИО преподователя	\N	[]	{}	2	2026-05-20 13:02:57.036787+00	2026-05-20 13:02:57.036787+00	44444444-4444-4444-8444-444444444441
0ea87466-d425-4a14-95a0-06563c10426f	study_year	Учебный год	text	t	Например: 2025-2026	\N	[]	{}	3	2026-05-20 13:02:57.041721+00	2026-05-20 13:02:57.041721+00	44444444-4444-4444-8444-444444444441
b8e44bab-ec77-4fd5-a26e-a4168950bf89	specification	Должность - специализация	text	t	Должность - специализация преподователя	\N	[]	{}	4	2026-05-20 13:02:57.045892+00	2026-05-20 13:02:57.045892+00	44444444-4444-4444-8444-444444444441
bf0eeb2c-4dc9-4181-ac28-7aa1bda545da	performance_percent	Качество знаний, %	number	t	Например: 89	\N	[]	{}	5	2026-05-20 13:02:57.050652+00	2026-05-20 13:02:57.050652+00	44444444-4444-4444-8444-444444444441
feb6e345-87a1-4df4-b587-a4fa51f2876e	knowledge_quality_percent	Качество знаний, %	number	f	Например: 76	\N	[]	{}	6	2026-05-20 13:02:57.055267+00	2026-05-20 13:02:57.055267+00	44444444-4444-4444-8444-444444444441
bf63b3e5-7060-45cd-8e54-cdf6d2855df7	material_url	Ссылка на материал	url	f	\N	\N	[]	{}	7	2026-05-20 13:02:57.059367+00	2026-05-20 13:02:57.059367+00	44444444-4444-4444-8444-444444444441
4ffe1b36-260b-4725-9548-a6560cdc1a2a	scan_file	Скан файла приказа	file	f	Скан файла приказа	\N	[]	{}	8	2026-05-20 13:02:57.063581+00	2026-05-20 13:02:57.063581+00	44444444-4444-4444-8444-444444444441
888fb716-c28c-4240-9a36-89681dd9fb42	source	Источник конкурса	select	t	Например: Республиканский	\N	[]	{}	1	2026-05-20 13:21:36.922352+00	2026-05-20 13:21:36.922352+00	44444444-4444-4444-8444-444444444442
51c43a46-5b34-42c8-93ef-a95078187b71	study_year	Учебный год	text	t	Например: 2025-2026	\N	[]	{}	2	2026-05-20 13:21:36.928095+00	2026-05-20 13:21:36.928095+00	44444444-4444-4444-8444-444444444442
a4ad7c23-48bd-410a-8cbf-8889e4b7594f	level	Уровень участия	select	t	Уровень участия	\N	[]	{}	3	2026-05-20 13:21:36.932377+00	2026-05-20 13:21:36.932377+00	44444444-4444-4444-8444-444444444442
7f84fc27-55ca-482d-a6b4-2581dacb33cc	competition_name	Наименование конкурса	text	f	Наименование конкурса	\N	["Грамота", "Диплом", "Сертификат", "Благодарность"]	{}	4	2026-05-20 13:21:36.937289+00	2026-05-20 13:21:36.937289+00	44444444-4444-4444-8444-444444444442
e4b7e4e0-3329-4c8f-8b7f-edf308f69931	participant_category	Категория участника конкурса	text	f	Категория участника конкурса	\N	[]	{}	5	2026-05-20 13:21:36.943599+00	2026-05-20 13:21:36.943599+00	44444444-4444-4444-8444-444444444442
c88554cb-17a4-4b55-93e2-b1adf9a864b8	translation_form	Форма трансляции	select	t	Например: Мастер-класс по Docker	\N	[]	{}	1	2026-05-20 13:24:48.098767+00	2026-05-20 13:24:48.098767+00	44444444-4444-4444-8444-444444444443
5d27ea97-b3ba-4b43-8d14-7cf3a7ec55b9	event_date	Дата проведения	date	t	Выберите дату	\N	[]	{}	2	2026-05-20 13:24:48.103412+00	2026-05-20 13:24:48.103412+00	44444444-4444-4444-8444-444444444443
e0c26ea4-86d6-4257-b588-02a6054c24bf	level	Уровень участия	select	t	Уровень участия	\N	[]	{}	3	2026-05-20 13:24:48.107976+00	2026-05-20 13:24:48.107976+00	44444444-4444-4444-8444-444444444443
9f16113d-4194-47ca-8a87-4842be20a1a8	regions	Регионы	select	t	Регионы	\N	[]	{}	4	2026-05-20 13:24:48.112679+00	2026-05-20 13:24:48.112679+00	44444444-4444-4444-8444-444444444443
f988e688-c12a-433a-97c8-ef4b4ca33e4f	title	Тема выступления	text	t	Название доклада	\N	[]	{}	1	2026-05-20 13:35:11.372343+00	2026-05-20 13:35:11.372343+00	44444444-4444-4444-8444-444444444444
193d6f1c-6510-4992-adfb-2f34b15c1d53	event_date	Дата выступления	date	t	Выберите дату	\N	[]	{}	2	2026-05-20 13:35:11.377696+00	2026-05-20 13:35:11.377696+00	44444444-4444-4444-8444-444444444444
01a2b7fa-9517-4400-97fb-b536f00fd14a	level	Уровень участия	select	t	Выберите уровень	\N	["Колледж", "Город", "Область", "Республика"]	{}	3	2026-05-20 13:35:11.382379+00	2026-05-20 13:35:11.382379+00	44444444-4444-4444-8444-444444444444
91136705-2386-41b9-a01d-802c409a14c1	organization	Организация образования	select	t	Организация образования	\N	[]	{}	4	2026-05-20 13:35:11.387958+00	2026-05-20 13:35:11.387958+00	44444444-4444-4444-8444-444444444444
874c69f0-b578-4452-a280-1d29a0788bc8	name	ФИО	text	f	ФИО	\N	[]	{}	5	2026-05-20 13:35:11.39302+00	2026-05-20 13:35:11.39302+00	44444444-4444-4444-8444-444444444444
1098c646-e194-4da1-916e-b8fbfd014f60	Job title	Должность	text	t	\N	\N	[]	{}	6	2026-05-20 13:35:11.397748+00	2026-05-20 13:35:11.397748+00	44444444-4444-4444-8444-444444444444
7d14220e-724e-4ab2-b70a-1960576b7a34	name	ФИО	text	t	\N	\N	[]	{}	9	2026-05-21 13:38:33.423383+00	2026-05-21 13:38:33.423383+00	44444444-4444-4444-8444-444444444447
43b33d29-3bc7-4ea1-8a26-f0fd992de610	scan_file	Скан файла приказа	file	t	\N	\N	[]	{}	7	2026-05-20 13:35:11.403728+00	2026-05-20 13:35:11.403728+00	44444444-4444-4444-8444-444444444444
e3060767-5042-41dd-ac44-33a711416b15	performance_url	Ccылка на выступление	url	f	\N	\N	[]	{}	8	2026-05-20 13:35:11.415738+00	2026-05-20 13:35:11.415738+00	44444444-4444-4444-8444-444444444444
d1c29dbf-a78d-406c-9eb6-87d9fb8b5126	job_title	Должность	text	t	\N	\N	[]	{}	10	2026-05-21 13:38:33.427811+00	2026-05-21 13:38:33.427811+00	44444444-4444-4444-8444-444444444447
684f5e91-3a22-4419-a9e1-83905ce44c50	material_recommended	Материал рекомендован	text	t	\N	\N	[]	{}	11	2026-05-21 13:38:33.432219+00	2026-05-21 13:38:33.432219+00	44444444-4444-4444-8444-444444444447
\.


--
-- Data for Name: award_type_criteria; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_type_criteria (id, name, points, method) FROM stdin;
639da9c7-fa6d-4998-82b7-edbffeacd5cf	ПОӘК/УМКД (теория және тәжірибе / теория и практика)	{1,2,3}	MEASURING
7fb47243-2423-4d03-983c-a31452ccf2ea	ҰТО тест тапсырмаларын әзірлеу немесе сараптамадан өткізу / Разработка или экспертиза тестовых заданий НЦТ	{10}	NORMAL
7949fddc-75d2-4b41-bb82-67c2dc671c22	Әдістемелік құралдарды құрастыру / Разработка методических пособий — колледжішілік / внутриколледжный	{10}	NORMAL
6d9f6738-14bc-4b3c-8070-3e1856444bfc	Әдістемелік құралдарды құрастыру / Разработка методических пособий — қалалық / городской	{15}	NORMAL
f65d1a9a-c546-4ce8-b88f-0375667e7da0	Әдістемелік құралдарды құрастыру / Разработка методических пособий — республикалық / республиканский	{20}	NORMAL
7bd3128d-0bff-47d1-a3a3-19d8f90a735f	Білім беру бағдарламаларын құрастыру / Разработка образовательных программ — колледжішілік / внутриколледжный	{10}	NORMAL
d2543007-1077-4335-a10e-f866fbd7b331	Білім беру бағдарламаларын құрастыру / Разработка образовательных программ — қалалық / городской	{15}	NORMAL
27905d14-4c4e-4dd2-ac3d-10770ff6e1d5	Білім беру бағдарламаларын құрастыру / Разработка образовательных программ — республикалық / республиканский	{20}	NORMAL
70ecf794-d776-4842-9994-4dcb149f7306	Оқу құралы және оқулық / Учебное пособие и учебники — колледжішілік / внутриколледжный	{10}	NORMAL
d1266b7f-0f12-4167-a610-474badfcd6e1	Оқу құралы және оқулық / Учебное пособие и учебники — қалалық / городской	{15}	NORMAL
f00a1242-7539-448e-928b-76c0328a73a5	Оқу құралы және оқулық / Учебное пособие и учебники — республикалық / республиканский	{20}	NORMAL
6a49355a-9a52-4603-b58a-d7e41f710017	Колледж ұсынған курстар / Курсы по рекомендации колледжа	{3}	NORMAL
37bed84f-6737-47d2-b87f-fe452af78cee	Жетекші жеткізуші вендорлардың онлайн курстары / Online-курсы ведущих вендоров	{5}	NORMAL
f0ec0010-fa44-4ecb-985d-d867b00aefc5	Кәсіби курстар / Профессиональные курсы	{10}	NORMAL
79e2894f-5fc6-44ab-996d-5c3ef79421c9	Тағылымдамадан өту / Стажировка	{15}	NORMAL
3fb68ced-600b-4f99-8b21-2d64f6ecadac	Ғылыми/ғылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу / Выступление с докладом — колледжішілік / внутриколледжный	{3}	NORMAL
b0bbee70-da6e-40da-a82e-02883d3b1dd8	Ғылыми/ғылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу / Выступление с докладом — қалалық / городской	{3}	NORMAL
1d649de5-2fcf-49e7-9647-6e5e50a46228	Ғылыми/ғылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу / Выступление с докладом — республикалық / республиканский	{5}	NORMAL
0ca580f4-5e06-4f30-8ba0-f5e7e8f999ed	Ғылыми/ғылыми-тәжірибелік семинарлар және конференцияларда баяндама оқу / Выступление с докладом — халықаралық / международный	{10}	NORMAL
bc8da914-3923-45d8-8816-90d24c74331e	Педагогикалық оқуда / Педагогические чтения — колледжішілік / внутриколледжный	{2}	NORMAL
dca716c2-c7c6-44ff-9c73-cd729b922778	Педагогикалық оқуда / Педагогические чтения — қалалық / городской	{3}	NORMAL
cb9f9528-644f-4de1-b658-7682e2c0efb3	Педагогикалық оқуда / Педагогические чтения — республикалық / республиканский	{5}	NORMAL
bd2c992f-20ea-45ee-b3d5-3d324576edb9	Педагогикалық оқуда / Педагогические чтения — халықаралық / международный	{10}	NORMAL
705cbe86-0cb1-4ab6-9a0f-c7debfa8ade0	Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану / Использование интернет-сайтов и социальных сетей — колледжішілік / внутриколледжный	{3}	NORMAL
ac6b2fb7-5f72-4d6d-a589-6a1354379227	Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану / Использование интернет-сайтов и социальных сетей — қалалық / городской	{3}	NORMAL
36e64dc9-90fd-4484-b52a-905f19362952	Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану / Использование интернет-сайтов и социальных сетей — республикалық / республиканский	{5}	NORMAL
6cd99e5c-d8d7-4a8e-a92e-85408ea98bec	Бөлім отырысында баяндама / Выступление с докладом на заседании отделения	{2}	NORMAL
acf29256-e407-4a5a-bbef-4a6fec094f3c	Жас мамандар мектебінде қатысу / Участие в работе ШМП	{3}	NORMAL
505e6922-2aaf-4b36-ba34-a4ee30aaffa9	Педагогикалық кеңесте қатысу / Участие в педагогическом совете	{5}	NORMAL
855e0a0d-d69c-4b2a-8e84-b997c9649f32	Әдістемелік кеңесте қатысу / Участие в методическом совете	{5}	NORMAL
113c79b1-0e8c-41b1-b261-ac88418ef10e	Газет, журнал беттеріне мақала жариялау / Публикация материалов в газетах, журналах — қалалық / городской	{2}	NORMAL
d574a7ad-2d7e-4e31-b1cc-a1bede0115d1	Газет, журнал беттеріне мақала жариялау / Публикация материалов в газетах, журналах — республикалық / республиканский	{3}	NORMAL
14891c75-bb53-43d8-aeae-073445e0c8cf	Газет, журнал беттеріне мақала жариялау / Публикация материалов в газетах, журналах — халықаралық / международный	{5}	NORMAL
3a9ccd3d-ce1a-4210-828f-e0618a3803bf	Бұқаралық ақпарат құралдарына сұхбат беру / Интервью для СМИ — қалалық / городской	{3}	NORMAL
5c660b60-b35a-49ff-8fb7-7f5f3feed3b5	Бұқаралық ақпарат құралдарына сұхбат беру / Интервью для СМИ — республикалық / республиканский	{5}	NORMAL
0bde55d9-982f-457c-bab6-683d1672ad07	Бұқаралық ақпарат құралдарына сұхбат беру / Интервью для СМИ — халықаралық / международный	{7}	NORMAL
1414c62b-b5a4-46e5-9837-a8b6e5933470	Почетная грамота, грамота, благодарственное письмо педагога — колледжішілік / внутриколледжный	{2}	MEASURING
17116163-0863-47de-b324-16b381237b99	Почетная грамота, грамота, благодарственное письмо педагога — қалалық / городской	{3}	MEASURING
bc06b16e-9e1d-40d4-b26c-d190e5f77f5c	Почетная грамота, грамота, благодарственное письмо педагога — республикалық / республиканский	{5}	MEASURING
e56219a4-d171-47c3-aa79-7df4f0bc178d	Почетная грамота, грамота, благодарственное письмо педагога — халықаралық / международный	{10}	MEASURING
14de3e47-2f7a-4b21-912b-662b00152f4b	Кәсіби конкурсқа қатысу / Участие в профессиональном конкурсе — колледжішілік / внутриколледжный, қатысқаны үшін / за участие	{2}	MEASURING
ed265ae3-d3f3-4e1b-9991-7551023b0d63	Кәсіби конкурсқа қатысу / Участие в профессиональном конкурсе — колледжішілік / внутриколледжный, жүлделі орын / призовое место	{3}	MEASURING
39f7fd28-71df-422a-aeba-1bb5953d7cf4	Кәсіби конкурсқа қатысу / Участие в профессиональном конкурсе — қалалық / городской, қатысқаны үшін / за участие	{5}	MEASURING
ba6d61fe-7495-4da0-9697-3e0b213a09fc	Кәсіби конкурсқа қатысу / Участие в профессиональном конкурсе — қалалық / городской, жүлделі орын / призовое место	{7}	MEASURING
2c231dd4-0610-4d92-90d5-603068ffd7eb	Кәсіби конкурсқа қатысу / Участие в профессиональном конкурсе — республикалық / республиканский, қатысқаны үшін / за участие	{10}	MEASURING
e1c558c5-89d9-47aa-babc-54fef45043f6	Кәсіби конкурсқа қатысу / Участие в профессиональном конкурсе — республикалық / республиканский, жүлделі орын / призовое место	{13}	MEASURING
b8a50b06-39e4-4a0b-8e4a-afe44a3e6fc3	Кәсіби конкурсқа қатысу / Участие в профессиональном конкурсе — халықаралық / международный, қатысқаны үшін / за участие	{15}	MEASURING
4f9d594b-dea2-46f5-b13d-53d63cd270df	Кәсіби конкурсқа қатысу / Участие в профессиональном конкурсе — халықаралық / международный, жүлделі орын / призовое место	{20}	MEASURING
f614ea13-c7c4-4e97-be30-e3f2d8adb306	WorldSkills чемпионатына қатысу / Участие в чемпионате WorldSkills — колледжішілік / внутриколледжный, қатысқаны үшін / за участие	{3}	NORMAL
7a2a2c38-f760-4064-b3ea-0fd86cec04ec	WorldSkills чемпионатына қатысу / Участие в чемпионате WorldSkills — колледжішілік / внутриколледжный, жүлделі орын / призовое место	{5}	NORMAL
8588d1c1-6b2c-4640-8222-ec13942fb657	WorldSkills чемпионатына қатысу / Участие в чемпионате WorldSkills — аймақтық / региональный, қатысқаны үшін / за участие	{7}	NORMAL
34093ee6-82ae-47cc-8902-75c02d63658e	WorldSkills чемпионатына қатысу / Участие в чемпионате WorldSkills — аймақтық / региональный, жүлделі орын / призовое место	{10}	NORMAL
59c6db2e-71ca-420f-b13c-f4014cb0cf7c	WorldSkills чемпионатына қатысу / Участие в чемпионате WorldSkills — ұлттық / национальный, қатысқаны үшін / за участие	{12}	NORMAL
d0d01793-bca4-4e78-8dc9-24b79f8a9f36	WorldSkills чемпионатына қатысу / Участие в чемпионате WorldSkills — ұлттық / национальный, жүлделі орын / призовое место	{15}	NORMAL
cb00b063-b955-4f37-b684-cc82ea04866d	WorldSkills чемпионатына қатысу / Участие в чемпионате WorldSkills — халықаралық / международный, қатысқаны үшін / за участие	{15}	NORMAL
8fb706f5-cc3a-4f7f-860c-38465cd549e1	WorldSkills чемпионатына қатысу / Участие в чемпионате WorldSkills — халықаралық / международный, жүлделі орын / призовое место	{20}	NORMAL
283ebcc1-c076-4d5e-991a-eda5ba2d0328	Ашық сабақ өткізу / Проведение открытого урока — колледжішілік / внутриколледжный	{5}	NORMAL
20e14862-30e0-412a-b7a8-67707543e882	Ашық сабақ өткізу / Проведение открытого урока — қалалық / городской	{10}	NORMAL
bacc82f2-e69c-4ae3-b069-8b960a5504c5	Ашық сабақ өткізу / Проведение открытого урока — республикалық / республиканский	{15}	NORMAL
b535983b-4bf5-468b-970d-becf207b3940	Ашық сабақ өткізу / Проведение открытого урока — халықаралық / международный	{20}	NORMAL
22a621ab-a192-4c1e-b31e-456ca89481a1	Әріптестердің сабағына қатысу / Посещение уроков коллег — әр қатысқан сабақ / каждый посещенный урок	{1}	MEASURING
74f5c3c2-ca39-4d85-99b9-c5a3c45ecbf0	Топ жетекшілігі / Кураторство	{10}	NORMAL
c08c9f39-7997-4435-83ce-a7911d7ff860	Ашық тәрбие сағаттары / Открытые воспитательные часы	{10}	NORMAL
ccce52db-cbc3-4b02-afde-11cd79717c2b	Топтың ішкі тәртіп ережелерін сақтауы / Соблюдение правил внутреннего распорядка группой	{5}	NORMAL
d8857c30-5b6f-43e3-8b8f-51ef4483dfea	Топтың ішкі тәртіп ережелерін сақтамауы / Несоблюдение правил внутреннего распорядка группой	{-5}	NORMAL
0774a4ff-a167-40a9-bf1c-c63701235682	Топтың қоғамдық жұмысқа белсене қатысуы / Активное участие группы в общественной работе	{5}	NORMAL
b1cd2a87-c266-4a76-8048-30d894efef7d	Қоғамдық іс-шараға қатыспауы / Неучастие в общественном мероприятии	{-5}	NORMAL
8c0ecf29-d56b-42d2-9961-d8b72ce640d2	Студенттердің топ жетекшісімен бірге конкурстарға қатысуы / Участие студентов в конкурсах совместно с руководителем группы — колледжішілік / внутриколледжный	{5}	NORMAL
78b2c4e2-cb12-4b87-9f32-b03fbce5c604	Студенттердің топ жетекшісімен бірге конкурстарға қатысуы / Участие студентов в конкурсах совместно с руководителем группы — қалалық / городской	{10}	NORMAL
03bb9c28-6fec-44e7-ad8c-b1bc06fc379d	Студенттердің топ жетекшісімен бірге конкурстарға қатысуы / Участие студентов в конкурсах совместно с руководителем группы — республикалық / республиканский	{15}	NORMAL
4eef0ede-ebd7-4d79-8a00-da8b1d6f7d86	Студенттердің топ жетекшісімен бірге конкурстарға қатысуы / Участие студентов в конкурсах совместно с руководителем группы — халықаралық / международный	{20}	NORMAL
6c834875-d192-4096-9430-ef1e7e7cc336	Сабақтан тыс ашық іс-шара өткізу / Проведение открытого внеклассного мероприятия — колледжішілік / внутриколледжный	{5}	MEASURING
18a974a6-d07e-4554-bbe8-2863fc9e103a	Сабақтан тыс ашық іс-шара өткізу / Проведение открытого внеклассного мероприятия — қалалық / городской	{10}	MEASURING
86d1f51d-8376-4298-bd45-10357018164c	Сабақтан тыс ашық іс-шара өткізу / Проведение открытого внеклассного мероприятия — республикалық / республиканский	{15}	MEASURING
5f2efc32-2221-4032-8964-179e7be5a799	Сабақтан тыс ашық іс-шара өткізу / Проведение открытого внеклассного мероприятия — халықаралық / международный	{20}	MEASURING
8b993be3-76fb-45e4-9c25-a9394ccbf290	Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы / Руководство работой студентов и призовые места — колледжішілік / внутриколледжный	{5}	MEASURING
17a318d6-dbe6-4d62-90bb-3318bd744dde	Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы / Руководство работой студентов и призовые места — қалалық / городской	{10}	MEASURING
0d25e36c-70c4-4c58-9f60-43953be01bde	Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы / Руководство работой студентов и призовые места — республикалық / республиканский	{15}	MEASURING
67dacb0c-4891-4e49-8722-0e965b0e6b40	Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы / Руководство работой студентов и призовые места — халықаралық / международный	{20}	MEASURING
30d22cb7-0281-4b0b-a7d3-280eea9229cf	Өндіріс орындарымен меморандум орнатуы / Заключение меморандума с предприятиями — Жеке кәсіпкер / Индивидуальный предприниматель	{5}	NORMAL
08a75692-f99c-43b7-9244-61440414279c	Өндіріс орындарымен меморандум орнатуы / Заключение меморандума с предприятиями — ЖШС / Товарищество с ограниченной ответственностью	{10}	NORMAL
4b44604a-ffdb-45f4-9084-f1f3c8072c7e	Өндіріс орындарымен меморандум орнатуы / Заключение меморандума с предприятиями — АҚ / Акционерное общество	{15}	NORMAL
3f7df369-945d-4304-9e1a-dadac2caf070	Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны / Количество школ, охваченных профориентационной работой — 1 мектеп / 1 школа	{2}	NORMAL
d7020872-4b7d-47e5-ba23-3282fe63258a	Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны / Количество школ, охваченных профориентационной работой — 2 мектеп / 2 школы	{3}	NORMAL
9eb0e6ba-3f47-4d87-89d4-d79875b56e3f	Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны / Количество школ, охваченных профориентационной работой — 3 мектеп және одан көп / 3 школы и более	{5}	NORMAL
eaab6486-ca32-4fb8-905b-bc469d5a2895	Іс-шараларды медиялық сүйемелдеу / Медийное сопровождение мероприятий: публикация в СМИ, YouTube, Instagram и т.д.	{2}	NORMAL
885f6769-1bc8-42bd-808b-b3e446db7190	Ескерту / Замечание	{-10}	NORMAL
898798e8-2987-49e6-af6b-de897a972b0b	Сөгіс / Выговор	{-20}	NORMAL
128eb7c3-f996-41fd-9694-8fa87ed0976f	Қатаң сөгіс / Строгий выговор	{-30}	NORMAL
\.


--
-- Data for Name: award_type_variants; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_type_variants (id, name, description, criteria, bonus_criteria) FROM stdin;
475f6d11-0b22-435b-a4d6-f8c3441c700e	1.1. Оқу-әдістемелік материалдарды құрастыру / Разработка учебно-методических материалов	Оценка разработки учебно-методических материалов.	{639da9c7-fa6d-4998-82b7-edbffeacd5cf}	{}
62846162-ae21-49c2-88d0-a53fe3f3b801	1.2. Авторлық жұмыстар / Авторские работы	Оценка авторских работ, методических пособий, образовательных программ, учебных пособий и учебников.	{7fb47243-2423-4d03-983c-a31452ccf2ea,7949fddc-75d2-4b41-bb82-67c2dc671c22,6d9f6738-14bc-4b3c-8070-3e1856444bfc,f65d1a9a-c546-4ce8-b88f-0375667e7da0,7bd3128d-0bff-47d1-a3a3-19d8f90a735f,d2543007-1077-4335-a10e-f866fbd7b331,27905d14-4c4e-4dd2-ac3d-10770ff6e1d5,70ecf794-d776-4842-9994-4dcb149f7306,d1266b7f-0f12-4167-a610-474badfcd6e1,f00a1242-7539-448e-928b-76c0328a73a5}	{}
9c16db1b-b4c5-4c66-8bb2-ab16a1876894	2.1. Біліктілікті арттыру курстарынан өту / Прохождение курсов повышения квалификации	Оценка курсов повышения квалификации и стажировок.	{6a49355a-9a52-4603-b58a-d7e41f710017,37bed84f-6737-47d2-b87f-fe452af78cee,f0ec0010-fa44-4ecb-985d-d867b00aefc5,79e2894f-5fc6-44ab-996d-5c3ef79421c9}	{}
c50c7546-4212-4718-9d0c-f14999cd8225	3.1. Педагогикалық озық іс-тәжірибелерінің нәтижелері / Результаты передового педагогического опыта	Доклады на семинарах, конференциях и педагогических чтениях.	{3fb68ced-600b-4f99-8b21-2d64f6ecadac,b0bbee70-da6e-40da-a82e-02883d3b1dd8,1d649de5-2fcf-49e7-9647-6e5e50a46228,0ca580f4-5e06-4f30-8ba0-f5e7e8f999ed,bc8da914-3923-45d8-8816-90d24c74331e,dca716c2-c7c6-44ff-9c73-cd729b922778,cb9f9528-644f-4de1-b658-7682e2c0efb3,bd2c992f-20ea-45ee-b3d5-3d324576edb9}	{}
11bf9f18-c8b3-42e5-9209-d41fa85683c3	3.2. Педагогикалық тәжірибені тарату мақсатында интернет сайттары мен әлеуметтік желілерді пайдалану / Применение интернет-сайтов и социальных сетей	Видеоуроки, лайфхаки и материалы, загруженные в TikTok, Instagram, YouTube и другие площадки.	{705cbe86-0cb1-4ab6-9a0f-c7debfa8ade0,ac6b2fb7-5f72-4d6d-a589-6a1354379227,36e64dc9-90fd-4484-b52a-905f19362952}	{}
0661345f-2a13-4a22-b0b5-9e8aee10b6b5	3.3. Бөлім жұмысын белсенді атқаруы / Активное выполнение работы отделения	Активное участие в работе отделения, ШМП, педагогического и методического советов.	{6cd99e5c-d8d7-4a8e-a92e-85408ea98bec,acf29256-e407-4a5a-bbef-4a6fec094f3c,505e6922-2aaf-4b36-ba34-a4ee30aaffa9,855e0a0d-d69c-4b2a-8e84-b997c9649f32}	{}
778719e4-7bd2-4c0b-b3c0-a89b5df6fe2e	4.1. Газет, журнал беттеріне мақала жариялау / Публикация материалов на страницах газет, журналов	Публикации в печатных и электронных СМИ.	{113c79b1-0e8c-41b1-b261-ac88418ef10e,d574a7ad-2d7e-4e31-b1cc-a1bede0115d1,14891c75-bb53-43d8-aeae-073445e0c8cf}	{}
307b109a-5e6b-4b1a-bd94-e2c028a0e9e9	4.2. Бұқаралық ақпарат құралдарына сұхбат беру / Интервью для средств массовой информации	Интервью для средств массовой информации разных уровней.	{3a9ccd3d-ce1a-4210-828f-e0618a3803bf,5c660b60-b35a-49ff-8fb7-7f5f3feed3b5,0bde55d9-982f-457c-bab6-683d1672ad07}	{}
1df709c4-9196-4f75-9da2-489650d00ad3	5.1. Педагогтардың құрмет грамотасы, мадақтама, алғыс хаттары / Почетная грамота, грамоты, благодарственные письма педагогов	Каждая грамота/благодарственное письмо умножается на балл соответствующего уровня.	{1414c62b-b5a4-46e5-9837-a8b6e5933470,17116163-0863-47de-b324-16b381237b99,bc06b16e-9e1d-40d4-b26c-d190e5f77f5c,e56219a4-d171-47c3-aa79-7df4f0bc178d}	{}
6cd7554a-6b25-405f-a8a7-4f28f4b502ec	6.1. Кәсіби конкурстарға қатысу / Участие в профессиональных конкурсах	Каждое мероприятие умножается на балл соответствующего уровня и результата.	{14de3e47-2f7a-4b21-912b-662b00152f4b,ed265ae3-d3f3-4e1b-9991-7551023b0d63,39f7fd28-71df-422a-aeba-1bb5953d7cf4,ba6d61fe-7495-4da0-9697-3e0b213a09fc,2c231dd4-0610-4d92-90d5-603068ffd7eb,e1c558c5-89d9-47aa-babc-54fef45043f6,b8a50b06-39e4-4a0b-8e4a-afe44a3e6fc3,4f9d594b-dea2-46f5-b13d-53d63cd270df}	{}
191b77af-4100-45f9-9804-35bd9c45dadb	7.1. Кәсіби шеберлік WorldSkills чемпионатына қатысуы / Участие в профессиональных чемпионатах WorldSkills	Баллы для участия, призовых мест и ролей эксперта-компатриота, заместителя главного эксперта, главного эксперта.	{f614ea13-c7c4-4e97-be30-e3f2d8adb306,7a2a2c38-f760-4064-b3ea-0fd86cec04ec,8588d1c1-6b2c-4640-8222-ec13942fb657,34093ee6-82ae-47cc-8902-75c02d63658e,59c6db2e-71ca-420f-b13c-f4014cb0cf7c,d0d01793-bca4-4e78-8dc9-24b79f8a9f36,cb00b063-b955-4f37-b684-cc82ea04866d,8fb706f5-cc3a-4f7f-860c-38465cd549e1}	{}
a318065f-f5cb-4df4-86cb-f089d84b511b	8.1. Ашық сабақтар өткізуі / Проведение открытого урока	Открытые уроки с указанием применяемых методов и технологий обучения.	{283ebcc1-c076-4d5e-991a-eda5ba2d0328,20e14862-30e0-412a-b7a8-67707543e882,bacc82f2-e69c-4ae3-b069-8b960a5504c5,b535983b-4bf5-468b-970d-becf207b3940}	{}
a02e85f5-336a-4fee-93f9-4a99dcbf77bb	8.2. Әріптестердің сабағына қатысу / Посещение уроков коллег	Каждый посещенный урок умножается на 1 балл. Основание: листы и журнал взаимопосещений.	{22a621ab-a192-4c1e-b31e-456ca89481a1}	{}
ffac28f0-3ae0-4469-9b65-737c02f129c1	9.1. Топ жетекшілігі / Кураторство	Качественное ведение работы руководства группой, воспитательные часы, дисциплина группы, общественная работа и участие студентов в конкурсах.	{74f5c3c2-ca39-4d85-99b9-c5a3c45ecbf0,c08c9f39-7997-4435-83ce-a7911d7ff860,ccce52db-cbc3-4b02-afde-11cd79717c2b,d8857c30-5b6f-43e3-8b8f-51ef4483dfea,0774a4ff-a167-40a9-bf1c-c63701235682,b1cd2a87-c266-4a76-8048-30d894efef7d,8c0ecf29-d56b-42d2-9961-d8b72ce640d2,78b2c4e2-cb12-4b87-9f32-b03fbce5c604,03bb9c28-6fec-44e7-ad8c-b1bc06fc379d,4eef0ede-ebd7-4d79-8a00-da8b1d6f7d86}	{}
f6d46f1b-d738-45a1-9dd3-e050ba69fbfb	9.2. Сабақтан тыс ашық іс-шаралар өткізу / Проведение открытого внеклассного мероприятия	Каждое внеклассное мероприятие умножается на балл соответствующего уровня.	{6c834875-d192-4096-9430-ef1e7e7cc336,18a974a6-d07e-4554-bbe8-2863fc9e103a,86d1f51d-8376-4298-bd45-10357018164c,5f2efc32-2221-4032-8964-179e7be5a799}	{}
d7c56069-1d39-4aab-a138-daa15b899a71	10.1. Студенттердің олимпиада, шығармашылық және ғылыми-зерттеу жұмыстарына жетекшілік және жүлделі орындарға ие болуы / Руководство работой студентов и призовые места	Каждое мероприятие умножается на балл соответствующего уровня: олимпиады, конкурсы, конференции, спортивные мероприятия.	{8b993be3-76fb-45e4-9c25-a9394ccbf290,17a318d6-dbe6-4d62-90bb-3318bd744dde,0d25e36c-70c4-4c58-9f60-43953be01bde,67dacb0c-4891-4e49-8722-0e965b0e6b40}	{}
df74ed52-6be7-4c03-9cd5-906b57e1506a	11.1. Өндірістік оқыту шеберлерінің өндіріс орындарымен меморандум орнатуы / Заключение меморандума с предприятиями мастерами производственного обучения	Оценка заключенных меморандумов с предприятиями по типу организации.	{30d22cb7-0281-4b0b-a7d3-280eea9229cf,08a75692-f99c-43b7-9244-61440414279c,4b44604a-ffdb-45f4-9084-f1f3c8072c7e}	{}
191da421-dfd2-4d3f-a698-a6bcd4350d4f	12.1. Мамандыққа баулу жұмысы арқылы қамтылған мектептер саны / Количество школ, охваченных профориентационной работой	Оценка профориентационной работы и медийного сопровождения мероприятий.	{3f7df369-945d-4304-9e1a-dadac2caf070,d7020872-4b7d-47e5-ba23-3282fe63258a,9eb0e6ba-3f47-4d87-89d4-d79875b56e3f,eaab6486-ca32-4fb8-905b-bc469d5a2895}	{}
f2fd6dcf-723b-4c07-ad3d-a9849eecdd8e	Еңбек шартының талаптарын бұзу / Нарушение условий трудового договора	При нарушении условий трудового договора вычитается от 10 до 30 баллов.	{885f6769-1bc8-42bd-808b-b3e446db7190,898798e8-2987-49e6-af6b-de897a972b0b,128eb7c3-f996-41fd-9694-8fa87ed0976f}	{}
\.


--
-- Data for Name: award_types; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.award_types (id, name, variants) FROM stdin;
21bc6259-5e89-4d40-ace1-f8428f3971c9	1. Әдістемелік материалдарды, оқу бағдарламаларын, оқу құралдарын әзірлеу және жариялау / Подготовка и опубликование методических материалов, учебных программ, учебных пособий	{475f6d11-0b22-435b-a4d6-f8c3441c700e,62846162-ae21-49c2-88d0-a53fe3f3b801}
67f54cb3-903e-4945-b10d-4b65ce8b6cd7	2. Біліктілікті арттыру курстарынан және тағылымдамадан өту / Прохождение курсов повышения квалификации и стажировка	{9c16db1b-b4c5-4c66-8bb2-ab16a1876894}
567648cc-ef48-43a2-a3c8-a398b6522374	3. Ғылыми-практикалық және әдістемелік конференциялар, семинарлар мен іс-шараларда сөз сөйлеу / Выступление в научно-практических и методических конференциях, семинарах, мероприятиях	{c50c7546-4212-4718-9d0c-f14999cd8225,11bf9f18-c8b3-42e5-9209-d41fa85683c3,0661345f-2a13-4a22-b0b5-9e8aee10b6b5}
f1c11505-b54f-4037-8414-444417b1c5d5	4. Бұқаралық ақпарат құралдары / СМИ	{778719e4-7bd2-4c0b-b3c0-a89b5df6fe2e,307b109a-5e6b-4b1a-bd94-e2c028a0e9e9}
155f99cb-ff4c-4e0f-8ee1-677e4b7c4f52	5. Алғыс хаттар, мадақтамалар және құрмет грамоталары / Благодарственные письма, похвальные листы и почётные грамоты	{1df709c4-9196-4f75-9da2-489650d00ad3}
49b98075-79b8-4c1e-95d2-9f373a0a1210	6. Педагогтердің байқауларға және кәсіби шеберлік конкурстарына қатысуы / Участие педагогов в конкурсах и конкурсах профессионального мастерства	{6cd7554a-6b25-405f-a8a7-4f28f4b502ec}
23900dc8-f3a5-475f-b2f2-552e92c265aa	7. WorldSkills кәсіби шеберлік чемпионатына қатысу және оны ілгерілету / Участие и продвижение чемпионата профессионального мастерства WorldSkills	{191b77af-4100-45f9-9804-35bd9c45dadb}
571d169a-e25b-4349-b65a-b56ca1aaa6b0	8. Ашық сабақтар / Открытые уроки	{a318065f-f5cb-4df4-86cb-f089d84b511b,a02e85f5-336a-4fee-93f9-4a99dcbf77bb}
1376e9f3-5ab0-4b1b-86d1-f7816ac6cfff	9. Тәрбие жұмысы / Воспитательная работа	{ffac28f0-3ae0-4469-9b65-737c02f129c1,f6d46f1b-d738-45a1-9dd3-e050ba69fbfb}
6b8e7106-a4e9-4ee6-b7c0-a057e28ced2b	10. Достижение студентов под руководством руководителя в конференциях и олимпиадах, спортивных мероприятиях	{d7c56069-1d39-4aab-a138-daa15b899a71}
cfd0371e-6e3e-463a-bab8-64eef5d29ea5	11. Оқу-өндірістік жұмысқа қатысу / Участие в учебно-производственной работе	{df74ed52-6be7-4c03-9cd5-906b57e1506a}
e3d17d4b-bd06-4590-bce9-7790c1b2c071	12. Колледжтің имиджін насихаттау мақсатында кәсіби бағдар беру жұмысын ілгерілету / Продвижение профориентационной работы в целях популяризации имиджа колледжа	{191da421-dfd2-4d3f-a698-a6bcd4350d4f}
d6c9b76a-ec70-4829-92b6-8da1b8725cba	Ескерту / Примечание: еңбек шартының талаптарын бұзған жағдайда балл шегеру / Вычитание баллов при нарушении условий трудового договора	{f2fd6dcf-723b-4c07-ad3d-a9849eecdd8e}
\.


--
-- Data for Name: awards; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.awards (id, status, reason, methodist, teacher, total_points, type, created_at, updated_at, variant, criteria, bonus_criteria, category_id, field_values) FROM stdin;
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

COPY public.discipline_topics (id, name, type, total_hours, theory_hours, practice_hours, individual_hours, srsp_hours, srs_hours, lesson_id) FROM stdin;
78c78428-fc32-421d-a5bc-5befa181668a	Объясняет основные концепции программирования на Python	COMBINED	2	2	0	0	0	0	\N
dc601ef5-9300-4acb-ad44-1edcf6329257	Разрабатывает простые программы с использованием функций Python	COMBINED	2	2	0	0	0	0	\N
a819c36b-629d-43b5-b437-1a57bfed963a	Реализовывает условные конструкции и циклы в Python	PRACTICAL	2	0	2	0	0	0	\N
8e432c38-68db-4ca6-a3eb-5e602934371c	Применяет базовые структуры данных Python (списки, кортежи, словари)	PRACTICAL	2	0	2	0	0	0	c8cec635-aa93-4648-9a6a-f23b9090190e
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.groups (keycloak_id, name, qualification, specialty) FROM stdin;
8b7e56e6-fc1a-4cc6-a795-f66c5d268229	Test-ednev-group	\N	\N
e6eff862-03f0-4852-821c-a190f83420d5	WEB25-А	3W06130102 "Web-дизайнер"	06130100 "Программное обеспечение"
4cadb558-be47-4ca5-b45c-7d5d94bf6366	WEB25-Б	3W06130102 "Web-дизайнер"	06130100 "Программное обеспечение"
ca2eec3f-8ab4-41f1-8a13-2210240296f9	ИС22-А	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
273aa813-7f5d-4c63-9bde-c8ba5643cf7c	ИС22-Б	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
2e25f729-2552-4c19-b1f4-66f4da78995e	ИС23-А	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
6435262a-2e4e-4901-9408-e99b63b87ab4	ИС23-Б	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
cba2cc54-6dd5-47ed-ba00-997e0a216fb7	ИС24	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
9c55597a-0c49-4853-879e-7eff13c70934	ИС25-А	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
af1cabf9-1e1c-4735-a3be-cdf264a3fe36	ИС25-Б	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
c98fddb4-9d8b-4f02-be13-7ef297279171	ОП24-А	3W06120101 "Оператор компьютерного аппаратного обеспечения"	06130100 "Программное обеспечение"
1f50b039-a7e0-4d0c-80db-531cdf3ff64f	ОП24-Б	3W06120101 "Оператор компьютерного аппаратного обеспечения"	06130100 "Программное обеспечение"
637ae75c-ea8b-4ba9-b937-a7c7d8f13d00	П22-А	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
615a632b-52e3-4981-8154-6a274e32e137	П22-Б	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
a0b37d63-2233-49fa-b427-e3a7a5a23c43	П22-В	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
822d3bb4-4370-4728-afd7-56dfff4ce4ee	П22-Г	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
b20b8e4a-2e3a-454e-8bad-ef9f722d798a	П22-Д	4S06130103 "Разработчик программного обеспечения	06130100 "Программное обеспечение"
0062438c-39d3-4f1c-be6f-8651652f931a	П22-ЕК	4S06130103 "Разработчик программного обеспечения	06130100 "Программное обеспечение"
0f6986f1-a950-40c1-ac1e-87e72225b44e	П22-ЖК	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
0aa8c842-4a36-443a-a8c4-c30349a73ee2	П22-ЗК	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
a0aefbb0-5576-4496-baac-b9680c3765d6	П22-ИК	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
838b6665-805b-4635-84f2-b84beea4d5f9	П23-3С	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
31ee78b8-abb4-4269-8d72-9b76802157aa	П23-А	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
7970a724-19e4-476f-a74d-c9efd2c80afa	П23-Б	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
e2c5b0dd-12cf-4d94-a06a-534a5a351479	П23-В	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
d0a4ad94-922f-4442-86e6-af5ea4cca674	П23-Г	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
fa0b764a-90ca-45a5-b012-d7ea166fc7a5	П23-Д	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
f38cb698-2e0d-4d76-92b2-df9d8f77722b	П23-Е	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
1a21de7e-2601-406f-8d46-66ce950e9cd7	П23-ЖК	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
620aa0f9-616c-404c-8139-24f2354088d9	П24-2С	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
f292f86b-7475-4784-95fb-a2da2fa1a2c1	П24-А	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
49f52724-960f-494a-8497-b6db3e8ad433	П24-Б	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
01510e61-0c7d-4d71-a1f8-9b35c6540607	П24-В	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
db6258a6-8106-493c-b09e-cc60289f76ed	П24-Г	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
760a6096-7577-4198-bd82-c380b920bf76	П24-Д	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
44666e40-2cb5-4621-9630-8b727f5a3556	П24-ЖК	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
6ff7e6c7-aa04-4262-a400-d34edfceea92	П25-1С	4S06130105 "Техник информационных систем"	06130100 "Программное обеспечение"
3edeab81-7b4a-4845-9744-8120cebe1afb	П25-А	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
9b098cf8-b7c1-44f5-922b-665711b922f8	П25-Б	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
466ceedd-1d36-444f-9696-265c225ce0c0	П25-В	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
de7e617e-f1bd-4136-a76f-876a2387073a	П25-Г	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
b537f6aa-8baf-4fec-8307-2ba7a6361633	П25-ДК	4S06130103 "Разработчик программного обеспечения"	06130100 "Программное обеспечение"
b32c7cbb-14c9-4f76-8767-d3b062130430	РЭТ22	4S07140905 "Техник мультимедийных и цифровых систем"	07140900 "Радиотехника, электроника и телекоммуникации"
ae1c35dc-92c8-4fda-8a17-50f743d91ab1	РЭТ23	4S07140905 "Техник мультимедийных и цифровых систем"	07140900 "Радиотехника, электроника и телекоммуникации"
ede3e4c3-b6af-4afb-b1cf-9cc0f77bda00	РЭТ24	4S07140905 "Техник мультимедийных и цифровых систем"	07140900 "Радиотехника, электроника и телекоммуникации"
b8a1cec0-02c9-40b7-8259-a02802a86cf9	РЭТ25	4S07140902 "Техник телекоммуникационных систем связи"	07140900 "Радиотехника, электроника и телекоммуникации"
75e27058-209f-4a98-b766-b24621d6d09b	С25	3W07140901 "Электромонтажник-накладчик телекоммуникационного оборудования и каналов связи"	07140900 "Радиотехника, электроника и телекоммуникации"
d3bf7a16-5778-443c-b6c1-af12d7c3f013	Т22-А	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
61f729f4-32c5-4dde-a12f-8eb90e18eab1	Т22-Б	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
65fc15fb-5ab1-4295-9e27-399c6f8960c4	Т23-А	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
b252af6e-c1bd-49a7-aea2-d7d1e08e00b7	Т23-Б	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
2f03e505-b72f-406c-aabf-3197a1ac0073	Т23-В	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
edc49d4e-e1ca-4e58-bdc5-a2166a464a44	Т24	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
df78fca4-5436-4101-9796-3f3786ce2b08	Т25	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
8521526c-cb69-46ce-9588-0b6a23d3a77b	Т25-1	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
4eef5c48-7a57-4c39-959c-7dcbd96ed7bf	Т25-4В	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
0df6145c-bf76-42c0-8dd9-237e4b1af427	Т25-4Г	4S06120102 "Техник сетевого и системного администрирования"	06120100 "Вычислительная техника и информационные сети'"
3edb761e-00a3-4213-a6fe-58bfd295604b	ТЗИ22	4S06120202 "Техник по информационной безопасности"	06120200 "Системы информационной безопасности"
92ad65eb-80f8-4b80-813b-fc3229a20f06	ТЗИ24	4S06120202 "Техник по информационной безопасности"	06120200 "Системы информационной безопасности"
05622ecb-80fa-412d-b2ef-f2ab077bc733	ТЗИ25	4S06120202 "Техник по информационной безопасности"	06120200 "Системы информационной безопасности"
cb61cf1f-1dd0-4be0-af31-76e25275ad8e	ТМ22	4S07151102 "Техник-механик"	07151100 "Эксплуатация и техническое обслуживание машин и оборудования"
748d32a1-9abe-4a76-9b82-59169b1695aa	ТМ23	4S07151102 "Техник-механик"	07151100 "Эксплуатация и техническое обслуживание машин и оборудования"
51889c72-412e-4297-b4ea-b5b2bf908642	ТМ25	4S07151102 "Техник-механик"	07151100 "Эксплуатация и техническое обслуживание машин и оборудования"
bfb73da8-2ef8-4dba-b3ae-7b7f8c47e21f	ЭВМ23-А	3W06120101 "Оператор компьютерного аппаратного обеспечения"	06120100 "Вычислительная техника и информационные сети"
4126bd33-9b50-41fe-a29a-23f85bd0a3a2	ЭВМ23-Б	3W06120101 "Оператор компьютерного аппаратного обеспечения"	06120100 "Вычислительная техника и информационные сети"
7eae6ae6-56dd-4246-b88b-51035b482d59	ЭВМ23-В	3W06120101 "Оператор компьютерного аппаратного обеспечения"	06120100 "Вычислительная техника и информационные сети"
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.lesson_progress (id, lesson_id, name, first_time, second_time, content, third_time) FROM stdin;
383acd4a-d35d-4fff-b0ac-f9316b3cb448	c8cec635-aa93-4648-9a6a-f23b9090190e	Введение и мотивация	{10}	{15}	{"Приветствие студентов, проверка присутствующих.","Озвучивание темы и целей практического занятия.","Краткое обсуждение важности структур данных в программировании на примерах из реальной жизни.","Актуализация знаний о предыдущих темах (если применимо)."}	{10}
905e841e-ec56-4c4f-a34d-9b6c2502ebf9	c8cec635-aa93-4648-9a6a-f23b9090190e	Изучение и применение списков	{20}	{25}	{"Объяснение концепции списков в Python: создание, доступ к элементам, изменение, добавление, удаление.","Демонстрация основных методов списков (append, insert, remove, pop, len, index).","Решение практических задач: составление списка покупок, хранение результатов измерений.","Индивидуальное выполнение мини-заданий студентами под контролем преподавателя."}	{20}
5969a83b-5eb1-470c-b5a1-ed834cf769fa	c8cec635-aa93-4648-9a6a-f23b9090190e	Работа с кортежами	{15}	{15}	{"Объяснение особенностей кортежей: неизменяемость, создание, доступ.","Сравнение списков и кортежей, определение сценариев использования кортежей.","Примеры использования: хранение координат, неизменяемых настроек.","Практическое задание: создание кортежа с данными студента."}	{20}
276b2ca6-8d9c-4e4d-973c-3b430a047afa	c8cec635-aa93-4648-9a6a-f23b9090190e	Использование словарей	{25}	{20}	{"Объяснение структуры словарей: пары ключ-значение, создание, доступ.","Демонстрация операций: добавление, изменение, удаление элементов, получение ключей/значений.","Решение практических задач: создание телефонной книги, хранение информации о пользователях.","Практическое задание: разработка простого словаря для учета успеваемости."}	{25}
c2fd0be7-5a26-4927-b6d3-db4b824ba2db	c8cec635-aa93-4648-9a6a-f23b9090190e	Закрепление материала и подведение итогов	{20}	{15}	{"Обсуждение возникших вопросов и сложностей.","Решение комплексной задачи, требующей применения всех трех структур данных.","Краткое повторение основных моментов занятия.","Оценка работы студентов, объявление домашнего задания (при наличии).","Анонс следующей темы (если применимо)."}	{15}
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.lessons (id, rup_name, discipline_name, topic_name, teacher, event_date, group_id, type, goals, tasks, expected, internet_resources, technical_resources, created_at, updated_at, file_url, plan_number) FROM stdin;
c8cec635-aa93-4648-9a6a-f23b9090190e	питон	РО1.1 Основы программирования на Python	Применяет базовые структуры данных Python (списки, кортежи, словари)	46313143-eadb-4798-b7f5-2fa97869e716	2026-05-20 10:31:40.785724+00	de7e617e-f1bd-4136-a76f-876a2387073a	PRACTICE	Сформировать у студентов понимание и навыки применения базовых структур данных Python: списков, кортежей и словарей, для решения практических задач программирования.	Научить студентов создавать, изменять и использовать списки, кортежи и словари в Python. Развить умение выбирать подходящую структуру данных для конкретной задачи. Ознакомить с основными операциями над списками, кортежами и словарями. Способствовать формированию алгоритмического мышления при работе с данными.	Студенты будут уверенно использовать списки, кортежи и словари в своих программах на Python. Смогут самостоятельно выбирать и применять эти структуры данных для эффективного решения поставленных задач. Будут способны анализировать и модифицировать существующий код, содержащий данные структуры.	{f57e041b-bac2-4262-aa9e-ff6de82335b6,5c86b995-5cf2-4a5f-ae0a-f19af8fe7a73,8b1a900a-5789-407c-83d5-c07eb19f0467,3c6e2735-7b03-40af-8d6a-676f571256e0,da82eac6-0794-45aa-b7f2-9a47a8c48307}	{ec02d1b1-62b7-423e-bda9-9e711956177c,0f5c93b3-6082-4a9e-8406-b01fa7005709,8535eb6b-470d-4b01-a4f4-45764d17aba3,b6e668c7-f626-4a63-9e39-d9fb2e59dce5}	2026-05-20 10:31:40.786204+00	2026-05-20 10:31:41.157997+00	lessons/c8cec635-aa93-4648-9a6a-f23b9090190e/Применяет_базовые_структуры_данных_Python__списки__кортежи__словари_20260520_103140_c8cec635.docx	47
\.


--
-- Data for Name: rup_approve_challenges; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_approve_challenges (challenge, rup_id, key_id, user_id, expires_at, used_at, created_at) FROM stdin;
eyJ0eXBlIjoicnVwX2FwcHJvdmVfY2hhbGxlbmdlIiwicnVwX2lkIjoiNjQxMmQ4NWUtYmNmZi00ZjFhLTlmMWItY2Q4N2U3ZGRmODYxIiwiYWN0aW9uIjoiQVBQUk9WRSIsImtleV9pZCI6IjA5YWFiY2JlLTFjYmMtNGZlOC04YTgxLTE3YjRlOWI4ODFmYSIsInVzZXJfaWQiOiI0NjMxMzE0My1lYWRiLTQ3OTgtYjdmNS0yZmE5Nzg2OWU3MTYiLCJub25jZSI6IjExMFZmTzFEemxGT3hsR3FqN1V3UjJRQ3BjM1V0Z0dCIiwiZXhwaXJlc19hdCI6IjIwMjYtMDUtMjBUMTA6MzU6MjZaIn0.I-C70jjn0YdE8Y7Ed9QlXYupJtZRVa5q16GHbu4eFM4	6412d85e-bcff-4f1a-9f1b-cd87e7ddf861	09aabcbe-1cbc-4fe8-8a81-17b4e9b881fa	46313143-eadb-4798-b7f5-2fa97869e716	2026-05-20 10:35:26.515115+00	2026-05-20 10:30:26.633684+00	2026-05-20 10:30:26.516406+00
\.


--
-- Data for Name: rup_disciplines; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_disciplines (id, name, total_hours, semesters, topics) FROM stdin;
a3f0ff5f-14a5-429b-82fb-cfe959a471cc	РО1.1 Основы программирования на Python	8	{2c102c78-c6a1-4015-a659-6c0fc92f78dd,bf170aee-7dbe-469c-ac35-c552e5a50341,954c3a41-1f18-48ca-8306-7c624ec71858,a897b49a-8a21-4024-ae14-3ed8c4d500c4,2727609f-62f7-475c-8689-4f2f4c683f66,f29e55c2-884e-4b99-9b74-f90dbc1ae9e8,30044c88-2bd2-45e6-ae90-2c9686df498d,7b3f351a-8b7a-426d-9fbc-3234c6e1ab41}	{78c78428-fc32-421d-a5bc-5befa181668a,dc601ef5-9300-4acb-ad44-1edcf6329257,8e432c38-68db-4ca6-a3eb-5e602934371c,a819c36b-629d-43b5-b437-1a57bfed963a}
\.


--
-- Data for Name: rup_exploration_notes; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rup_exploration_notes (id, basis, goals, summary, competencies, prerequisites, postrequisites, internet_resources, technical_resources) FROM stdin;
33ba1128-0c22-4a26-a592-d0635f1c7abe	крутой питон курс	выучить питон	\N	питон	ничего	крутой питон программист	\N	\N
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
6412d85e-bcff-4f1a-9f1b-cd87e7ddf861	питон	APPROVED	\N	1	FULL_TIME	2025-2026	THEORY	8	{46313143-eadb-4798-b7f5-2fa97869e716}	{de7e617e-f1bd-4136-a76f-876a2387073a}	46313143-eadb-4798-b7f5-2fa97869e716	46313143-eadb-4798-b7f5-2fa97869e716	33ba1128-0c22-4a26-a592-d0635f1c7abe	{a3f0ff5f-14a5-429b-82fb-cfe959a471cc}	2026-05-20 10:30:06.941322+00	2026-05-20 10:30:28.29285+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (keycloak_id, email, username, first_name, last_name, phone, role, rups, total_points, awards, violation, password_changed_at, last_seen_at, created_at, updated_at) FROM stdin;
46313143-eadb-4798-b7f5-2fa97869e716		kpopov27	Кирилл	Попов		ADMIN	\N	0	\N	NONE	\N	\N	2026-05-20 10:27:46.972872+00	2026-05-21 14:25:47.434576+00
\.


--
-- Name: lessons_plan_number_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.lessons_plan_number_seq', 1, true);


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
-- Name: rup_approve_challenges rup_approve_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rup_approve_challenges
    ADD CONSTRAINT rup_approve_challenges_pkey PRIMARY KEY (challenge);


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
-- Name: idx_rup_approve_challenges_expires_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rup_approve_challenges_expires_at ON public.rup_approve_challenges USING btree (expires_at);


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

\unrestrict hhDAvnaGKleUw64VGYHw64SXx6EYAhdgkI5yMaljNIcVzaG13Y8LOLJmSTQp4H6

