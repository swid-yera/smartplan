-- Create enum type "criteria_method_enum"
CREATE TYPE "public"."criteria_method_enum" AS ENUM ('NORMAL', 'MEASURING', 'PENALTY');
-- Create "award_type_criteria" table
CREATE TABLE "public"."award_type_criteria" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "points" integer NULL,
  "method" "public"."criteria_method_enum" NULL,
  "bonus_name" text NULL,
  "bonus_points" integer NULL,
  "bonus_method" "public"."criteria_method_enum" NULL,
  PRIMARY KEY ("id")
);
-- Create enum type "discipline_topic_type"
CREATE TYPE "public"."discipline_topic_type" AS ENUM ('SNZ', 'PRACTICAL', 'COMBINED');
-- Create "discipline_topics" table
CREATE TABLE "public"."discipline_topics" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "type" "public"."discipline_topic_type" NOT NULL,
  "total_hours" integer NOT NULL DEFAULT 0,
  "theory_hours" integer NOT NULL DEFAULT 0,
  "practice_hours" integer NOT NULL DEFAULT 0,
  "individual_hours" integer NOT NULL DEFAULT 0,
  "srsp_hours" integer NOT NULL DEFAULT 0,
  "srs_hours" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("id")
);
-- Create enum type "rups_type_enum"
CREATE TYPE "public"."rups_type_enum" AS ENUM ('PRACTICE', 'THEORY');
-- Create "award_type_variants" table
CREATE TABLE "public"."award_type_variants" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text NULL,
  "criteria" uuid[] NULL,
  PRIMARY KEY ("id")
);
-- Create enum type "awards_status"
CREATE TYPE "public"."awards_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');
-- Create enum type "violation_enum"
CREATE TYPE "public"."violation_enum" AS ENUM ('NONE', 'REMARK', 'REBUKE', 'SEVERE_REPRIMAND');
-- Rename a column from "session_id" to "keycloak_id"
ALTER TABLE "public"."users" RENAME COLUMN "session_id" TO "keycloak_id";
-- Modify "users" table
ALTER TABLE "public"."users" DROP CONSTRAINT "users_email_key", ALTER COLUMN "username" SET NOT NULL, ADD COLUMN "phone" text NULL, ADD COLUMN "rups" text[] NULL, ADD COLUMN "total_points" integer NOT NULL DEFAULT 0, ADD COLUMN "awards" text[] NULL;
-- Create enum type "study_form_enum"
CREATE TYPE "public"."study_form_enum" AS ENUM ('CORRESPONDENCE', 'FULL_TIME');
-- Create "rup_disciplines" table
CREATE TABLE "public"."rup_disciplines" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "code" text NULL,
  "total_hours" integer NOT NULL DEFAULT 0,
  "semesters" uuid[] NULL,
  "topics" uuid[] NULL,
  PRIMARY KEY ("id")
);
-- Create "groups" table
CREATE TABLE "public"."groups" (
  "keycloak_id" uuid NOT NULL,
  "name" text NOT NULL,
  "qualification" text NULL,
  "specialty" text NULL,
  PRIMARY KEY ("keycloak_id", "name")
);
-- Create "discipline_semesters" table
CREATE TABLE "public"."discipline_semesters" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "semester" integer NOT NULL,
  "total_hours" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("id"),
  CONSTRAINT "discipline_semesters_semester_check" CHECK ((semester >= 1) AND (semester <= 8))
);
-- Create enum type "rups_status"
CREATE TYPE "public"."rups_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');
-- Create "award_types" table
CREATE TABLE "public"."award_types" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "variants" uuid[] NULL,
  PRIMARY KEY ("id")
);
-- Create "awards" table
CREATE TABLE "public"."awards" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "status" "public"."awards_status" NOT NULL,
  "reason" text NULL,
  "methodist" uuid NULL,
  "total_points" integer NOT NULL DEFAULT 0,
  "violation" "public"."violation_enum" NOT NULL,
  "type" uuid NULL,
  "text" text NULL,
  "images" text[] NULL DEFAULT '{}',
  "documents" text[] NULL DEFAULT '{}',
  "links" text[] NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_award_methodist" FOREIGN KEY ("methodist") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_award_type" FOREIGN KEY ("type") REFERENCES "public"."award_types" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "rup_resources" table
CREATE TABLE "public"."rup_resources" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "link" text NULL,
  PRIMARY KEY ("id")
);
-- Create "rup_exploration_notes" table
CREATE TABLE "public"."rup_exploration_notes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "basis" text NULL,
  "goals" text NULL,
  "summary" text NULL,
  "competencies" text NULL,
  "prerequisites" text NULL,
  "postrequisites" text NULL,
  "internet_resources_id" uuid NULL,
  "technical_resources_id" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "rup_exploration_notes_internet_resources_id_fkey" FOREIGN KEY ("internet_resources_id") REFERENCES "public"."rup_resources" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "rup_exploration_notes_technical_resources_id_fkey" FOREIGN KEY ("technical_resources_id") REFERENCES "public"."rup_resources" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "rups" table
CREATE TABLE "public"."rups" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
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
  CONSTRAINT "rups_course_check" CHECK ((course >= 1) AND (course <= 4))
);
