-- feat(points-by-categories): move user points to category map

ALTER TABLE users
ADD COLUMN points_by_categories JSONB NOT NULL DEFAULT '{}'::jsonb;

WITH award_points AS (
    SELECT
        teacher AS user_id,
        jsonb_object_agg(category_id::text, total_points_sum) AS points_map
    FROM (
        SELECT
            teacher,
            category_id,
            SUM(total_points)::int AS total_points_sum
        FROM awards
        WHERE
            status = 'APPROVED'
            AND teacher IS NOT NULL
            AND category_id IS NOT NULL
        GROUP BY teacher, category_id
    ) grouped_awards
    GROUP BY teacher
),
adjustment_points AS (
    SELECT
        keycloak_id AS user_id,
        CASE
            WHEN (
                -COALESCE((
                    SELECT SUM(COALESCE(points[1], 0))
                    FROM penalty
                    WHERE teacher = users.keycloak_id
                ), 0)
                - (COALESCE(cardinality(violation_ids), 0) * 10)
            ) = 0 THEN '{}'::jsonb
            ELSE jsonb_build_object(
                'violations_and_penalties',
                -COALESCE((
                    SELECT SUM(COALESCE(points[1], 0))
                    FROM penalty
                    WHERE teacher = users.keycloak_id
                ), 0)
                - (COALESCE(cardinality(violation_ids), 0) * 10)
            )
        END AS points_map
    FROM users
)
UPDATE users
SET points_by_categories = COALESCE(award_points.points_map, '{}'::jsonb) || COALESCE(adjustment_points.points_map, '{}'::jsonb)
FROM adjustment_points
LEFT JOIN award_points ON award_points.user_id = adjustment_points.user_id
WHERE users.keycloak_id = adjustment_points.user_id;

ALTER TABLE users
DROP COLUMN total_points;
