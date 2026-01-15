-- Modify "award_type_criteria" table
ALTER TABLE "public"."award_type_criteria" ALTER COLUMN "method" SET NOT NULL, ALTER COLUMN "method" DROP DEFAULT;
