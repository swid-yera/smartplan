-- Create "users" table
CREATE TABLE "public"."users" (
  "session_id" uuid NOT NULL,
  "email" text NOT NULL,
  "username" text NULL,
  "first_name" text NULL,
  "last_name" text NULL,
  "roles" text[] NOT NULL DEFAULT '{}',
  "password_changed_at" timestamptz NULL,
  "last_seen_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("session_id"),
  CONSTRAINT "users_email_key" UNIQUE ("email")
);
