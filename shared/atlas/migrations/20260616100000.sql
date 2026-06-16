-- Add singleton KPI upload restriction setting

CREATE TABLE "public"."kpi_upload_settings" (
  "id" smallint NOT NULL DEFAULT 1,
  "blocked_after_date" date NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "kpi_upload_settings_singleton" CHECK (id = 1)
);

INSERT INTO "public"."kpi_upload_settings" ("id", "blocked_after_date")
VALUES (1, NULL)
ON CONFLICT ("id") DO NOTHING;

