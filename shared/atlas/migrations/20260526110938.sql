-- Create enum type "rups_status"
CREATE TYPE "public"."rups_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');
-- Create enum type "study_form_enum"
CREATE TYPE "public"."study_form_enum" AS ENUM ('CORRESPONDENCE', 'FULL_TIME');
-- Create enum type "rups_type_enum"
CREATE TYPE "public"."rups_type_enum" AS ENUM ('PRACTICE', 'THEORY');
-- Create enum type "discipline_topic_type"
CREATE TYPE "public"."discipline_topic_type" AS ENUM ('SNZ', 'PRACTICAL', 'COMBINED');
-- Create enum type "awards_status"
CREATE TYPE "public"."awards_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');
-- Create enum type "violation_enum"
CREATE TYPE "public"."violation_enum" AS ENUM ('NONE', 'REMARK', 'REBUKE', 'SEVERE_REPRIMAND');
-- Create enum type "enum_criteria_method"
CREATE TYPE "public"."enum_criteria_method" AS ENUM ('NORMAL', 'MEASURING');
-- Create enum type "user_role"
CREATE TYPE "public"."user_role" AS ENUM ('ADMIN', 'TEACHER', 'METHODIST');
-- Create enum type "enum_lesson_type"
CREATE TYPE "public"."enum_lesson_type" AS ENUM ('PRACTICE', 'THEORY');
-- Create sequence "lessons_plan_number_seq"
CREATE SEQUENCE "public"."lessons_plan_number_seq" AS integer;
-- Create "award_categories" table
CREATE TABLE "public"."award_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "award_types" uuid[] NOT NULL DEFAULT '{}',
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "icon" text NULL,
  "description" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "award_categories_description_locale_check" CHECK ((description ? 'ru'::text) AND (description ? 'kz'::text)),
  CONSTRAINT "award_categories_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
-- Create "award_type_criteria" table
CREATE TABLE "public"."award_type_criteria" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "points" integer[] NULL,
  "method" "public"."enum_criteria_method" NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "award_type_criteria_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
-- Create "award_type_variants" table
CREATE TABLE "public"."award_type_variants" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "description" jsonb NULL,
  "criteria" uuid[] NULL,
  "bonus_criteria" uuid[] NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "award_type_variants_description_locale_check" CHECK ((description IS NULL) OR ((description ? 'ru'::text) AND (description ? 'kz'::text))),
  CONSTRAINT "award_type_variants_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
-- Create "award_types" table
CREATE TABLE "public"."award_types" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "variants" uuid[] NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "award_types_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
-- Create "departments" table
CREATE TABLE "public"."departments" (
  "keycloak_id" uuid NOT NULL,
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "users" uuid[] NOT NULL DEFAULT '{}',
  PRIMARY KEY ("keycloak_id"),
  CONSTRAINT "departments_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
-- Create "discipline_semesters" table
CREATE TABLE "public"."discipline_semesters" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "semester" integer NOT NULL,
  "total_hours" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("id"),
  CONSTRAINT "discipline_semesters_semester_check" CHECK ((semester >= 1) AND (semester <= 8))
);
-- Create "discipline_topics" table
CREATE TABLE "public"."discipline_topics" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "type" "public"."discipline_topic_type" NOT NULL,
  "lesson_id" uuid NULL,
  "total_hours" integer NOT NULL DEFAULT 0,
  "theory_hours" integer NOT NULL DEFAULT 0,
  "practice_hours" integer NOT NULL DEFAULT 0,
  "individual_hours" integer NOT NULL DEFAULT 0,
  "srsp_hours" integer NOT NULL DEFAULT 0,
  "srs_hours" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("id"),
  CONSTRAINT "discipline_topics_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
-- Create "rup_disciplines" table
CREATE TABLE "public"."rup_disciplines" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "total_hours" integer NOT NULL DEFAULT 0,
  "semesters" uuid[] NULL,
  "topics" uuid[] NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "rup_disciplines_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
-- Create "rup_resources" table
CREATE TABLE "public"."rup_resources" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "link" text NULL,
  PRIMARY KEY ("id")
);
-- Create "award_category_fields" table
CREATE TABLE "public"."award_category_fields" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "category_id" uuid NOT NULL,
  "key" text NOT NULL,
  "label" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "type" text NOT NULL,
  "required" boolean NOT NULL DEFAULT false,
  "placeholder" jsonb NULL,
  "help_text" jsonb NULL,
  "options" jsonb NOT NULL DEFAULT '[]',
  "validation" jsonb NOT NULL DEFAULT '{}',
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "award_category_fields_category_id_key_key" UNIQUE ("category_id", "key"),
  CONSTRAINT "award_category_fields_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."award_categories" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "award_category_fields_help_text_locale_check" CHECK ((help_text IS NULL) OR ((help_text ? 'ru'::text) AND (help_text ? 'kz'::text))),
  CONSTRAINT "award_category_fields_label_locale_check" CHECK ((label ? 'ru'::text) AND (label ? 'kz'::text)),
  CONSTRAINT "award_category_fields_placeholder_locale_check" CHECK ((placeholder IS NULL) OR ((placeholder ? 'ru'::text) AND (placeholder ? 'kz'::text)))
);
-- Create "users" table
CREATE TABLE "public"."users" (
  "keycloak_id" uuid NOT NULL,
  "email" text NOT NULL,
  "username" text NOT NULL,
  "first_name" text NULL,
  "last_name" text NULL,
  "phone" text NULL,
  "role" "public"."user_role" NOT NULL,
  "rups" text[] NULL,
  "total_points" integer NOT NULL DEFAULT 0,
  "awards" text[] NULL,
  "violation" "public"."violation_enum" NOT NULL DEFAULT 'NONE',
  "password_changed_at" timestamptz NULL,
  "last_seen_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("keycloak_id")
);
-- Create "awards" table
CREATE TABLE "public"."awards" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "status" "public"."awards_status" NOT NULL,
  "reason" text NULL,
  "methodist" uuid NULL,
  "teacher" uuid NULL,
  "total_points" integer NOT NULL DEFAULT 0,
  "type" uuid NULL,
  "variant" uuid NULL,
  "criteria" uuid NULL,
  "bonus_criteria" uuid NULL,
  "category_id" uuid NULL,
  "field_values" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_award_category" FOREIGN KEY ("category_id") REFERENCES "public"."award_categories" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_award_methodist" FOREIGN KEY ("methodist") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "groups" table
CREATE TABLE "public"."groups" (
  "keycloak_id" uuid NOT NULL,
  "name" text NOT NULL,
  "qualification" jsonb NULL,
  "specialty" jsonb NULL,
  PRIMARY KEY ("keycloak_id"),
  CONSTRAINT "groups_qualification_locale_check" CHECK ((qualification IS NULL) OR ((qualification ? 'ru'::text) AND (qualification ? 'kz'::text))),
  CONSTRAINT "groups_specialty_locale_check" CHECK ((specialty IS NULL) OR ((specialty ? 'ru'::text) AND (specialty ? 'kz'::text)))
);
-- Create "lessons" table
CREATE TABLE "public"."lessons" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "rup_name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "discipline_name" jsonb NULL,
  "topic_name" jsonb NULL,
  "plan_number" integer NOT NULL DEFAULT nextval('public.lessons_plan_number_seq'),
  "teacher" uuid NOT NULL,
  "event_date" timestamptz NULL,
  "group_id" uuid NOT NULL,
  "type" "public"."enum_lesson_type" NOT NULL,
  "goals" jsonb NULL,
  "tasks" jsonb NULL,
  "expected" jsonb NULL,
  "internet_resources" uuid[] NULL,
  "technical_resources" uuid[] NULL,
  "file_url" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_lesson_groups" FOREIGN KEY ("group_id") REFERENCES "public"."groups" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_lesson_teacher" FOREIGN KEY ("teacher") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "lessons_discipline_name_locale_check" CHECK ((discipline_name IS NULL) OR ((discipline_name ? 'ru'::text) AND (discipline_name ? 'kz'::text))),
  CONSTRAINT "lessons_expected_locale_check" CHECK ((expected IS NULL) OR ((expected ? 'ru'::text) AND (expected ? 'kz'::text))),
  CONSTRAINT "lessons_goals_locale_check" CHECK ((goals IS NULL) OR ((goals ? 'ru'::text) AND (goals ? 'kz'::text))),
  CONSTRAINT "lessons_rup_name_locale_check" CHECK ((rup_name ? 'ru'::text) AND (rup_name ? 'kz'::text)),
  CONSTRAINT "lessons_tasks_locale_check" CHECK ((tasks IS NULL) OR ((tasks ? 'ru'::text) AND (tasks ? 'kz'::text))),
  CONSTRAINT "lessons_topic_name_locale_check" CHECK ((topic_name IS NULL) OR ((topic_name ? 'ru'::text) AND (topic_name ? 'kz'::text)))
);
-- Create "lesson_progress" table
CREATE TABLE "public"."lesson_progress" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "lesson_id" uuid NOT NULL,
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "first_time" integer[] NOT NULL,
  "second_time" integer[] NOT NULL,
  "third_time" integer[] NOT NULL,
  "content" text[] NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_lesson_progress_lesson" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "lesson_progress_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
-- Create "rup_exploration_notes" table
CREATE TABLE "public"."rup_exploration_notes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "basis" jsonb NULL,
  "goals" jsonb NULL,
  "summary" jsonb NULL,
  "competencies" jsonb NULL,
  "prerequisites" jsonb NULL,
  "postrequisites" jsonb NULL,
  "internet_resources" uuid[] NULL,
  "technical_resources" uuid[] NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "rup_exploration_notes_basis_locale_check" CHECK ((basis IS NULL) OR ((basis ? 'ru'::text) AND (basis ? 'kz'::text))),
  CONSTRAINT "rup_exploration_notes_competencies_locale_check" CHECK ((competencies IS NULL) OR ((competencies ? 'ru'::text) AND (competencies ? 'kz'::text))),
  CONSTRAINT "rup_exploration_notes_goals_locale_check" CHECK ((goals IS NULL) OR ((goals ? 'ru'::text) AND (goals ? 'kz'::text))),
  CONSTRAINT "rup_exploration_notes_postrequisites_locale_check" CHECK ((postrequisites IS NULL) OR ((postrequisites ? 'ru'::text) AND (postrequisites ? 'kz'::text))),
  CONSTRAINT "rup_exploration_notes_prerequisites_locale_check" CHECK ((prerequisites IS NULL) OR ((prerequisites ? 'ru'::text) AND (prerequisites ? 'kz'::text))),
  CONSTRAINT "rup_exploration_notes_summary_locale_check" CHECK ((summary IS NULL) OR ((summary ? 'ru'::text) AND (summary ? 'kz'::text)))
);
-- Create "rups" table
CREATE TABLE "public"."rups" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "status" "public"."rups_status" NOT NULL,
  "reason" text NULL,
  "course" integer NOT NULL,
  "study_form" "public"."study_form_enum" NOT NULL,
  "study_year" text NOT NULL,
  "type" "public"."rups_type_enum" NOT NULL,
  "total_hours" integer NOT NULL DEFAULT 0,
  "contacts" uuid[] NULL,
  "group_ids" text[] NULL,
  "methodist" uuid NULL,
  "teacher" uuid NULL,
  "exploration_note_id" uuid NULL,
  "disciplines" uuid[] NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_methodist" FOREIGN KEY ("methodist") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_teacher" FOREIGN KEY ("teacher") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "rups_exploration_note_id_fkey" FOREIGN KEY ("exploration_note_id") REFERENCES "public"."rup_exploration_notes" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "rups_course_check" CHECK ((course >= 1) AND (course <= 4)),
  CONSTRAINT "rups_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
