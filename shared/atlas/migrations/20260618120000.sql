ALTER TYPE "public"."discipline_topic_type" ADD VALUE IF NOT EXISTS 'SRSP';

UPDATE "public"."discipline_topics"
SET "total_hours" = COALESCE("theory_hours", 0)
    + COALESCE("practice_hours", 0)
    + COALESCE("individual_hours", 0)
    + COALESCE("srsp_hours", 0);

UPDATE "public"."rup_disciplines" AS rd
SET "total_hours" = COALESCE(semester_hours.total_hours, 0) + COALESCE(topic_hours.srsp_hours, 0)
FROM (
    SELECT
        discipline.id,
        COALESCE(SUM(semester.total_hours), 0) AS total_hours
    FROM "public"."rup_disciplines" AS discipline
    LEFT JOIN LATERAL unnest(COALESCE(discipline.semesters, '{}'::uuid[])) AS semester_id(id) ON TRUE
    LEFT JOIN "public"."discipline_semesters" AS semester ON semester.id = semester_id.id
    GROUP BY discipline.id
) AS semester_hours
LEFT JOIN (
    SELECT
        discipline.id,
        COALESCE(SUM(topic.srsp_hours), 0) AS srsp_hours
    FROM "public"."rup_disciplines" AS discipline
    LEFT JOIN LATERAL unnest(COALESCE(discipline.topics, '{}'::uuid[])) AS topic_id(id) ON TRUE
    LEFT JOIN "public"."discipline_topics" AS topic ON topic.id = topic_id.id
    GROUP BY discipline.id
) AS topic_hours ON topic_hours.id = semester_hours.id
WHERE rd.id = semester_hours.id;

UPDATE "public"."rups" AS rup
SET "total_hours" = COALESCE(discipline_hours.total_hours, 0)
FROM (
    SELECT
        parent.id,
        COALESCE(SUM(discipline.total_hours), 0) AS total_hours
    FROM "public"."rups" AS parent
    LEFT JOIN LATERAL unnest(COALESCE(parent.disciplines, '{}'::uuid[])) AS discipline_id(id) ON TRUE
    LEFT JOIN "public"."rup_disciplines" AS discipline ON discipline.id = discipline_id.id
    GROUP BY parent.id
) AS discipline_hours
WHERE rup.id = discipline_hours.id;
