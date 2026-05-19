-- Rename a column from "start_minute" to "first_time"
ALTER TABLE "public"."lesson_progress" RENAME COLUMN "start_minute" TO "first_time";
-- Rename a column from "end_minute" to "second_time"
ALTER TABLE "public"."lesson_progress" RENAME COLUMN "end_minute" TO "second_time";
-- Modify "lesson_progress" table
ALTER TABLE "public"."lesson_progress" ADD COLUMN "third_time" integer[] NOT NULL;
