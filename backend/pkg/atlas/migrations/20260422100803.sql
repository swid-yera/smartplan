-- Modify "discipline_topics" table
ALTER TABLE "public"."discipline_topics" ADD COLUMN "lesson_id" uuid NULL;
-- Modify "lessons" table
ALTER TABLE "public"."lessons" ADD COLUMN "file_url" text NULL;
