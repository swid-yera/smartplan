ALTER TABLE "public"."rup_disciplines"
ADD COLUMN "type" "public"."rups_type_enum";

UPDATE "public"."rup_disciplines" AS discipline
SET "type" = COALESCE(parent.type, 'THEORY'::"public"."rups_type_enum")
FROM (
    SELECT
        parent.type,
        discipline_id.id AS discipline_id
    FROM "public"."rups" AS parent
    JOIN LATERAL unnest(COALESCE(parent.disciplines, '{}'::uuid[])) AS discipline_id(id) ON TRUE
) AS parent
WHERE discipline.id = parent.discipline_id
  AND discipline."type" IS NULL;

UPDATE "public"."rup_disciplines"
SET "type" = 'THEORY'::"public"."rups_type_enum"
WHERE "type" IS NULL;

ALTER TABLE "public"."rup_disciplines"
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'THEORY'::"public"."rups_type_enum";
