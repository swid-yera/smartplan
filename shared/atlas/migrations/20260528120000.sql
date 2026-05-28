-- Create "violation" table
CREATE TABLE "public"."violation" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "issued_by" uuid NOT NULL,
  "note" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "violation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "violation_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Modify "users" table
ALTER TABLE "public"."users"
  ADD COLUMN "violation_ids" uuid[] NOT NULL DEFAULT '{}';
