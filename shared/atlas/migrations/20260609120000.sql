-- feat/lessons: зафиксировать канонический порядок этапов урока

ALTER TABLE lesson_progress
ADD COLUMN step_order SMALLINT;

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY lesson_id ORDER BY id ASC) AS row_num
    FROM lesson_progress
)
DELETE FROM lesson_progress lp
USING ranked
WHERE
    lp.id = ranked.id
    AND ranked.row_num > 7;

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY lesson_id ORDER BY id ASC) AS row_num
    FROM lesson_progress
)
UPDATE lesson_progress lp
SET step_order = ranked.row_num
FROM ranked
WHERE lp.id = ranked.id;

ALTER TABLE lesson_progress
ALTER COLUMN step_order SET NOT NULL;

ALTER TABLE lesson_progress
ADD CONSTRAINT lesson_progress_step_order_check CHECK (step_order BETWEEN 1 AND 7);

ALTER TABLE lesson_progress
ADD CONSTRAINT lesson_progress_lesson_step_order_key UNIQUE (lesson_id, step_order);
