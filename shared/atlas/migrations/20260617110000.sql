ALTER TABLE "public"."kpi_upload_settings"
ADD COLUMN "exception_user_ids" uuid[] NOT NULL DEFAULT '{}';

UPDATE "public"."kpi_upload_settings"
SET "exception_user_ids" = '{}'
WHERE "exception_user_ids" IS NULL;
