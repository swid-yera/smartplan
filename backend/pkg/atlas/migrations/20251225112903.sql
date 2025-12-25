-- Modify "awards" table
ALTER TABLE "public"."awards" DROP COLUMN "documents", ADD COLUMN "document" text NULL DEFAULT '{}';
-- Modify "users" table
ALTER TABLE "public"."users" ALTER COLUMN "roles" DROP DEFAULT;
