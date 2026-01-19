-- Rename a column from "images" to "files"
ALTER TABLE "public"."awards" RENAME COLUMN "images" TO "files";
-- Modify "awards" table
ALTER TABLE "public"."awards" DROP COLUMN "document";
