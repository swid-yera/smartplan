-- Create "award_categories" table
CREATE TABLE "award_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "award_types" uuid[] NOT NULL DEFAULT '{}',
  "name" text NOT NULL,
  "icon" text NULL,
  "description" text NULL,
  "fields" uuid[] NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create "award_category_fields" table
CREATE TABLE "award_category_fields" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "key" text NOT NULL,
  "label" text NOT NULL,
  "type" text NOT NULL,
  "required" boolean NOT NULL DEFAULT false,
  "placeholder" text NULL,
  "help_text" text NULL,
  "options" jsonb NOT NULL DEFAULT '[]',
  "validation" jsonb NOT NULL DEFAULT '{}',
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "award_category_fields_key_key" UNIQUE ("key")
);
-- Modify "awards" table
ALTER TABLE "awards" ADD COLUMN "category_id" uuid NULL, ADD COLUMN "field_values" jsonb NOT NULL DEFAULT '{}', ADD CONSTRAINT "fk_award_category" FOREIGN KEY ("category_id") REFERENCES "award_categories" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
