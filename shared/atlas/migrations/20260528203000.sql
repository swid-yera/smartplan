-- Modify "rup_resources" table
ALTER TABLE "public"."rup_resources"
  ALTER COLUMN "name" TYPE jsonb
    USING jsonb_build_object('ru', COALESCE(name, ''), 'kz', ''),
  ALTER COLUMN "name" SET DEFAULT '{"ru": "", "kz": ""}',
  ADD CONSTRAINT "rup_resources_name_locale_check" CHECK ((name ? 'ru'::text) AND (name ? 'kz'::text));
