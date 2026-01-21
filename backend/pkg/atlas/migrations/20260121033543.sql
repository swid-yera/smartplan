-- Modify "awards" table
ALTER TABLE "public"."awards" DROP CONSTRAINT "awards_teacher_fkey", ALTER COLUMN "teacher" DROP NOT NULL;
