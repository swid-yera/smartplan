-- Modify "awards" table
ALTER TABLE "public"."awards" DROP CONSTRAINT "awards_bonus_criteria_fkey", DROP CONSTRAINT "awards_criteria_fkey", DROP CONSTRAINT "awards_type_fkey", DROP CONSTRAINT "awards_variant_fkey";
