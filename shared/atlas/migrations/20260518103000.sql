-- Modify "award_category_fields" table: add category scope
ALTER TABLE "award_category_fields" ADD COLUMN "category_id" uuid NULL;

-- Migrate existing links from award_categories.fields -> award_category_fields.category_id.
-- If one field was shared across categories, keep original for first category and clone for the rest.
WITH mapped AS (
  SELECT c.id AS category_id, unnest(c.fields) AS field_id
  FROM award_categories c
), ranked AS (
  SELECT
    category_id,
    field_id,
    ROW_NUMBER() OVER (PARTITION BY field_id ORDER BY category_id) AS rn
  FROM mapped
)
UPDATE award_category_fields f
SET category_id = r.category_id
FROM ranked r
WHERE f.id = r.field_id
  AND r.rn = 1;

WITH mapped AS (
  SELECT c.id AS category_id, unnest(c.fields) AS field_id
  FROM award_categories c
), ranked AS (
  SELECT
    category_id,
    field_id,
    ROW_NUMBER() OVER (PARTITION BY field_id ORDER BY category_id) AS rn
  FROM mapped
), duplicates AS (
  SELECT
    r.category_id,
    f.key,
    f.label,
    f.type,
    f.required,
    f.placeholder,
    f.help_text,
    f.options,
    f.validation,
    f.sort_order,
    f.created_at,
    f.updated_at
  FROM ranked r
  JOIN award_category_fields f ON f.id = r.field_id
  WHERE r.rn > 1
)
INSERT INTO award_category_fields (
  id,
  category_id,
  key,
  label,
  type,
  required,
  placeholder,
  help_text,
  options,
  validation,
  sort_order,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  d.category_id,
  d.key,
  d.label,
  d.type,
  d.required,
  d.placeholder,
  d.help_text,
  d.options,
  d.validation,
  d.sort_order,
  d.created_at,
  d.updated_at
FROM duplicates d;

-- Remove orphan fields that are not linked to any category.
DELETE FROM award_category_fields WHERE category_id IS NULL;

ALTER TABLE "award_category_fields"
  ALTER COLUMN "category_id" SET NOT NULL,
  ADD CONSTRAINT "fk_award_category_field_category" FOREIGN KEY ("category_id") REFERENCES "award_categories" ("id") ON DELETE CASCADE;

ALTER TABLE "award_category_fields" DROP CONSTRAINT "award_category_fields_key_key";
ALTER TABLE "award_category_fields" ADD CONSTRAINT "award_category_fields_category_id_key_key" UNIQUE ("category_id", "key");

-- Drop old denormalized link in categories.
ALTER TABLE "award_categories" DROP COLUMN "fields";
