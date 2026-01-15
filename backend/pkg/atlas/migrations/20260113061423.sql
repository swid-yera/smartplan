-- Modify "awards" table
ALTER TABLE "public"."awards" ADD COLUMN "variants" uuid[] NULL;
