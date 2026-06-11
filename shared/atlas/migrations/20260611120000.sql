-- Add user_type classification for users and backfill existing rows.
CREATE TYPE "public"."user_type" AS ENUM ('GENERAL', 'HEAD', 'MASTER', 'SPECIALIST', 'NULL');

ALTER TABLE "public"."users"
ADD COLUMN "user_type" "public"."user_type";

UPDATE "public"."users"
SET "user_type" = 'NULL'
WHERE "user_type" IS NULL;

ALTER TABLE "public"."users"
ALTER COLUMN "user_type" SET NOT NULL;
