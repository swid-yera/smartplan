-- Drop legacy user department column
ALTER TABLE "public"."users" DROP COLUMN "department";

-- Create departments table with Keycloak mapping and user memberships
CREATE TABLE "public"."departments" (
  "keycloak_id" uuid NOT NULL,
  "name" jsonb NOT NULL DEFAULT '{"kz": "", "ru": ""}',
  "users" uuid[] NOT NULL DEFAULT '{}',
  PRIMARY KEY ("keycloak_id"),
  CONSTRAINT "departments_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text))
);
