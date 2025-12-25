-- Modify "rup_exploration_notes" table
ALTER TABLE "public"."rup_exploration_notes" DROP COLUMN "internet_resources_id", DROP COLUMN "technical_resources_id", ADD COLUMN "internet_resources" uuid[] NULL, ADD COLUMN "technical_resources" uuid[] NULL;
