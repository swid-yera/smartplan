-- Remove deprecated lesson metadata columns
ALTER TABLE "public"."lessons"
    DROP COLUMN IF EXISTS "module_label",
    DROP COLUMN IF EXISTS "ro_label";
