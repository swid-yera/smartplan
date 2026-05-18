-- Modify "awards" table: remove legacy free-form materials fields
ALTER TABLE "awards"
  DROP COLUMN "text",
  DROP COLUMN "files",
  DROP COLUMN "links";
