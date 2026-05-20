-- Create sequence for lesson plan numbers
CREATE SEQUENCE IF NOT EXISTS "public"."lessons_plan_number_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    CACHE 1;

-- Add lesson metadata field used by lesson document template
ALTER TABLE "public"."lessons"
    ADD COLUMN "plan_number" integer;

-- Backfill plan number for existing rows
UPDATE "public"."lessons"
SET "plan_number" = nextval('public.lessons_plan_number_seq'::regclass)
WHERE "plan_number" IS NULL;

ALTER TABLE "public"."lessons"
    ALTER COLUMN "plan_number" SET DEFAULT nextval('public.lessons_plan_number_seq'::regclass),
    ALTER COLUMN "plan_number" SET NOT NULL;

-- Move sequence forward to the max existing value
SELECT setval(
    'public.lessons_plan_number_seq',
    COALESCE((SELECT MAX("plan_number") FROM "public"."lessons"), 1),
    true
);
