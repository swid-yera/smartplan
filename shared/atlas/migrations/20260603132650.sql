CREATE FUNCTION "public"."lesson_progress_content_to_jsonb"(input text[])
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(
        jsonb_agg(jsonb_build_object('ru', COALESCE(item, ''), 'kz', '')),
        '[]'::jsonb
    )
    FROM unnest(COALESCE(input, ARRAY[]::text[])) AS item;
$$;

-- Modify "lesson_progress" table
ALTER TABLE "public"."lesson_progress"
  ALTER COLUMN "content" TYPE jsonb
    USING "public"."lesson_progress_content_to_jsonb"("content"),
  ALTER COLUMN "content" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "content" SET NOT NULL;

ALTER TABLE "public"."lesson_progress"
  ADD CONSTRAINT "lesson_progress_content_array_check" CHECK (jsonb_typeof(content) = 'array');

DROP FUNCTION "public"."lesson_progress_content_to_jsonb"(text[]);

-- Modify "lessons" table
ALTER TABLE "public"."lessons"
  DROP CONSTRAINT "lessons_discipline_name_locale_check",
  ADD CONSTRAINT "lessons_discipline_name_locale_check" CHECK ((discipline_name ? 'ru'::text) AND (discipline_name ? 'kz'::text)),
  DROP CONSTRAINT "lessons_expected_locale_check",
  ADD CONSTRAINT "lessons_expected_locale_check" CHECK ((expected ? 'ru'::text) AND (expected ? 'kz'::text)),
  DROP CONSTRAINT "lessons_goals_locale_check",
  ADD CONSTRAINT "lessons_goals_locale_check" CHECK ((goals ? 'ru'::text) AND (goals ? 'kz'::text)),
  DROP CONSTRAINT "lessons_tasks_locale_check",
  ADD CONSTRAINT "lessons_tasks_locale_check" CHECK ((tasks ? 'ru'::text) AND (tasks ? 'kz'::text)),
  DROP CONSTRAINT "lessons_topic_name_locale_check",
  ADD CONSTRAINT "lessons_topic_name_locale_check" CHECK ((topic_name ? 'ru'::text) AND (topic_name ? 'kz'::text)),
  ALTER COLUMN "discipline_name" TYPE jsonb USING COALESCE("discipline_name", '{"ru": "", "kz": ""}'::jsonb),
  ALTER COLUMN "discipline_name" SET NOT NULL,
  ALTER COLUMN "discipline_name" SET DEFAULT '{"kz": "", "ru": ""}',
  ALTER COLUMN "topic_name" TYPE jsonb USING COALESCE("topic_name", '{"ru": "", "kz": ""}'::jsonb),
  ALTER COLUMN "topic_name" SET NOT NULL,
  ALTER COLUMN "topic_name" SET DEFAULT '{"kz": "", "ru": ""}',
  ALTER COLUMN "goals" TYPE jsonb USING COALESCE("goals", '{"ru": "", "kz": ""}'::jsonb),
  ALTER COLUMN "goals" SET NOT NULL,
  ALTER COLUMN "goals" SET DEFAULT '{"kz": "", "ru": ""}',
  ALTER COLUMN "tasks" TYPE jsonb USING COALESCE("tasks", '{"ru": "", "kz": ""}'::jsonb),
  ALTER COLUMN "tasks" SET NOT NULL,
  ALTER COLUMN "tasks" SET DEFAULT '{"kz": "", "ru": ""}',
  ALTER COLUMN "expected" TYPE jsonb USING COALESCE("expected", '{"ru": "", "kz": ""}'::jsonb),
  ALTER COLUMN "expected" SET NOT NULL,
  ALTER COLUMN "expected" SET DEFAULT '{"kz": "", "ru": ""}';
