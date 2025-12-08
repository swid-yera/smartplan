-- === Типы ===
-- Статусы RUP
CREATE TYPE rup_status AS ENUM ('draft','review','approved','archived');

-- Тип недельной чётности для урока
CREATE TYPE week_parity AS ENUM ('both','even','odd');

-- Типы контрольных мероприятий
CREATE TYPE control_type AS ENUM ('exam','differentiated_pass','pass','credit','none');

-- Роли в системе (для локального RBAC-кеша; источником прав остаётся Keycloak)
CREATE TYPE app_role AS ENUM ('teacher','methodologist','student','admin');

-- === Справочные таблицы / каталог дисциплин ===

CREATE TABLE subjects (
    id              BIGSERIAL PRIMARY KEY,
    code            TEXT,                       -- код дисциплины (возможно внешняя система)
    name            TEXT NOT NULL,
    description     TEXT,
    qualification_level TEXT,
    default_hours   INTEGER DEFAULT 0,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_subjects_name ON subjects (lower(name));
CREATE INDEX idx_subjects_code ON subjects (code);

-- === Образовательные программы (OP) ===

CREATE TABLE educational_programs (
    id              BIGSERIAL PRIMARY KEY,
    code            TEXT UNIQUE,
    name            TEXT NOT NULL,
    level           TEXT,        -- СПО/ВО и т.д.
    qualification   TEXT,
    description     TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb, -- дополнительные требования НПА
    created_by      UUID,        -- kc_id пользователя, создавшего запись (Keycloak UUID)
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_op_name ON educational_programs (lower(name));

-- === Study Plans (РУП) ===

CREATE TABLE study_plans (
    id                      BIGSERIAL PRIMARY KEY,
    op_id                   BIGINT NOT NULL REFERENCES educational_programs(id) ON DELETE CASCADE,
    code                    TEXT, -- внутренний код РУП
    study_year              TEXT, -- например "2024/2025"
    semesters               INTEGER[] NOT NULL DEFAULT ARRAY[1,2], -- номера семестров в году (обычно 2)
    weeks_count_by_semester INTEGER[] NOT NULL, -- например [16,16]
    study_days_by_week      INTEGER NOT NULL DEFAULT 5, -- 5 или 6
    total_hours             INTEGER NOT NULL DEFAULT 0, -- общий объём, должен соответствовать сумме строк
    creator_kc_id           UUID, -- Keycloak user id
    status                  rup_status DEFAULT 'draft',
    metadata                JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_study_plans_op_id ON study_plans(op_id);
CREATE INDEX idx_study_plans_creator ON study_plans(creator_kc_id);
CREATE INDEX idx_study_plans_status ON study_plans(status);

-- === Группы студентов (из Keycloak) ===

CREATE TABLE groups (
    id              BIGSERIAL PRIMARY KEY,
    kc_group_id     UUID, -- id группы в Keycloak
    name            TEXT NOT NULL,
    code            TEXT,
    op_id           BIGINT REFERENCES educational_programs(id) ON DELETE SET NULL,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_groups_kc_id ON groups(kc_group_id);
CREATE INDEX idx_groups_name ON groups(lower(name));

-- === Связь студенты ↔ группы (кеш, snapshot из Keycloak при необходимости) ===

CREATE TABLE group_students (
    id              BIGSERIAL PRIMARY KEY,
    group_id        BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_kc_id   UUID NOT NULL, -- Keycloak user id
    enrolled_date   DATE,
    metadata        JSONB DEFAULT '{}'::jsonb,
    UNIQUE(group_id, student_kc_id)
);

CREATE INDEX idx_group_students_student ON group_students(student_kc_id);

-- === Кеш пользователей из Keycloak ===

CREATE TABLE users_meta (
    id              BIGSERIAL PRIMARY KEY,
    kc_user_id      UUID UNIQUE, -- Keycloak id
    username        TEXT,
    email           TEXT,
    display_name    TEXT,
    roles           app_role[] DEFAULT ARRAY[]::app_role[], -- snapshot ролей (app)
    meta            JSONB DEFAULT '{}'::jsonb, -- доп. поля
    last_sync_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_users_meta_email ON users_meta(lower(email));
CREATE INDEX idx_users_meta_username ON users_meta(lower(username));

-- === Строки РУП (RUPSubject) ===

CREATE TABLE rup_subjects (
    id                  BIGSERIAL PRIMARY KEY,
    rup_id              BIGINT NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    subject_id          BIGINT REFERENCES subjects(id),
    title               TEXT NOT NULL, -- название дисциплины (копия из каталога)
    code                TEXT,
    hours_total         INTEGER NOT NULL DEFAULT 0,
    hours_by_semester   INTEGER[] NOT NULL DEFAULT '{}'::integer[], -- распределение по семестрам
    lectures_hours      INTEGER DEFAULT 0,
    practice_hours      INTEGER DEFAULT 0,
    lab_hours           INTEGER DEFAULT 0,
    selfwork_hours      INTEGER DEFAULT 0,
    is_mandatory        BOOLEAN DEFAULT true,
    competencies        TEXT[] DEFAULT '{}'::text[],
    control_types       control_type[] DEFAULT ARRAY['none']::control_type[],
    method_doc_id       BIGINT, -- ссылка на RUPr (working_programs) когда есть
    order_no            INTEGER DEFAULT 0,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT chk_hours_nonneg CHECK (hours_total >= 0 AND lectures_hours >= 0 AND practice_hours >= 0 AND lab_hours >= 0 AND selfwork_hours >= 0)
);

CREATE INDEX idx_rup_subjects_rup_id ON rup_subjects(rup_id);
CREATE INDEX idx_rup_subjects_subject_id ON rup_subjects(subject_id);

-- === RUPr (рабочая учебная программа дисциплины) ===

CREATE TABLE working_programs (
    id                  BIGSERIAL PRIMARY KEY,
    subject_id          BIGINT REFERENCES subjects(id),
    rup_subject_id      BIGINT REFERENCES rup_subjects(id),
    version             TEXT DEFAULT '1.0',
    developer_kc_id     UUID, -- Keycloak id
    objective           TEXT,
    learning_outcomes   JSONB DEFAULT '[]'::jsonb,
    competencies         TEXT[] DEFAULT '{}'::text[],
    content_modules     JSONB DEFAULT '[]'::jsonb, -- массив модулей/тем с часами
    hours_structure     JSONB DEFAULT '{}'::jsonb, -- {lectures:.., practice:..}
    grading_policy      JSONB DEFAULT '{}'::jsonb,
    literature          JSONB DEFAULT '[]'::jsonb,
    ai_generated_parts  JSONB DEFAULT '[]'::jsonb,
    attachments         JSONB DEFAULT '[]'::jsonb, -- ссылки на files
    status              rup_status DEFAULT 'draft',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_working_programs_subject ON working_programs(subject_id);
CREATE INDEX idx_working_programs_rup_subject ON working_programs(rup_subject_id);

-- === Файловое хранилище (MinIO) — метаданные файлов ===

CREATE TABLE files (
    id              BIGSERIAL PRIMARY KEY,
    key             TEXT NOT NULL, -- object key в MinIO/S3
    bucket          TEXT NOT NULL,
    filename        TEXT,
    content_type    TEXT,
    size_bytes      BIGINT,
    uploaded_by_kc  UUID,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_files_key ON files(key);
CREATE INDEX idx_files_filename ON files(lower(filename));

-- === AI-задачи (парсинг / генерация) ===

CREATE TABLE ai_tasks (
    id              BIGSERIAL PRIMARY KEY,
    task_type       TEXT NOT NULL, -- e.g. 'docx_parse', 'generate_description', 'timetable_optimize'
    status          TEXT NOT NULL DEFAULT 'pending', -- pending/running/succeeded/failed
    payload         JSONB DEFAULT '{}'::jsonb, -- входные параметры
    result          JSONB, -- результат (если есть)
    error           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    started_at      TIMESTAMP WITH TIME ZONE,
    finished_at     TIMESTAMP WITH TIME ZONE,
    worker_meta     JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_tasks_type ON ai_tasks(task_type);

-- === Timetable (годовой) ===

CREATE TABLE timetables (
    id              BIGSERIAL PRIMARY KEY,
    rup_id          BIGINT REFERENCES study_plans(id) ON DELETE CASCADE,
    group_id        BIGINT REFERENCES groups(id) ON DELETE CASCADE,
    academic_year   TEXT, -- e.g. "2024/2025"
    semester        INTEGER NOT NULL,
    weeks           JSONB DEFAULT '[]'::jsonb, -- можно хранить упрощенно, либо использовать week/day/lesson ниже
    holidays        JSONB DEFAULT '[]'::jsonb, -- массив дат или диапазонов
    short_days      JSONB DEFAULT '[]'::jsonb, -- список дат коротких дней
    auto_optimized  BOOLEAN DEFAULT false,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_timetables_rup_group ON timetables(rup_id, group_id);

-- === Недельная детализация (альтернативный уровень хранения расписания) ===

CREATE TABLE tt_weeks (
    id              BIGSERIAL PRIMARY KEY,
    timetable_id    BIGINT REFERENCES timetables(id) ON DELETE CASCADE,
    week_index      INTEGER NOT NULL, -- порядковый номер недели в семестре (1..N)
    parity          week_parity DEFAULT 'both', -- для чет/нечетных
    metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tt_weeks_timetable ON tt_weeks(timetable_id);

CREATE TABLE tt_days (
    id              BIGSERIAL PRIMARY KEY,
    week_id         BIGINT REFERENCES tt_weeks(id) ON DELETE CASCADE,
    day_index       INTEGER NOT NULL, -- 1..7, где 1 = понедельник
    date            DATE, -- конкретная дата (если расписание развернуто на год)
    is_holiday      BOOLEAN DEFAULT false,
    is_short_day    BOOLEAN DEFAULT false,
    metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tt_days_week ON tt_days(week_id);
CREATE INDEX idx_tt_days_date ON tt_days(date);

CREATE TABLE tt_lessons (
    id              BIGSERIAL PRIMARY KEY,
    day_id          BIGINT REFERENCES tt_days(id) ON DELETE CASCADE,
    subject_id      BIGINT REFERENCES subjects(id),
    rup_subject_id  BIGINT REFERENCES rup_subjects(id),
    teacher_kc_id   UUID, -- Keycloak id преподавателя
    start_time      TIME WITHOUT TIME ZONE NOT NULL,
    end_time        TIME WITHOUT TIME ZONE NOT NULL,
    classroom       TEXT,
    hours           NUMERIC(4,2) DEFAULT 1.0,
    week_parity     week_parity DEFAULT 'both',
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_tt_lessons_day ON tt_lessons(day_id);
CREATE INDEX idx_tt_lessons_teacher ON tt_lessons(teacher_kc_id);
CREATE INDEX idx_tt_lessons_subject ON tt_lessons(subject_id);

-- === Экспортные задания / логи экспорта ===

CREATE TABLE exports (
    id              BIGSERIAL PRIMARY KEY,
    user_kc_id      UUID,
    rup_id          BIGINT REFERENCES study_plans(id),
    type            TEXT NOT NULL, -- word/pdf/excel/ical/csv
    params          JSONB DEFAULT '{}'::jsonb,
    file_id         BIGINT REFERENCES files(id),
    status          TEXT DEFAULT 'pending',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    finished_at     TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_exports_status ON exports(status);

---

# Триггеры и функции валидации (пример)

1. Проверка — сумма `hours_total` всех `rup_subjects` должна равняться `study_plans.total_hours`.
   Реализуем простую функцию и триггер, который при insert/update/delete строки `rup_subjects` будет обновлять поле `study_plans.total_hours_actual` (или валидировать и выбрасывать ошибку).

-- Добавим вспомогательное поле для проверки (можно использовать непосредственно total_hours, но осторожно с откатом)
ALTER TABLE study_plans ADD COLUMN total_hours_actual INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION fn_update_rup_total_hours() RETURNS TRIGGER AS $$
BEGIN
    -- Пересчитать сумму часов для данного RUP
    UPDATE study_plans
    SET total_hours_actual = (
        SELECT COALESCE(SUM(hours_total),0) FROM rup_subjects WHERE rup_id = NEW.rup_id
    ),
    updated_at = now()
    WHERE id = NEW.rup_id;

    RETURN NEW;
EXCEPTION WHEN others THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Триггер на INSERT и UPDATE
CREATE TRIGGER trg_rup_subjects_after_ins_up
AFTER INSERT OR UPDATE ON rup_subjects
FOR EACH ROW
EXECUTE FUNCTION fn_update_rup_total_hours();

-- Триггер на DELETE (используем OLD)
CREATE OR REPLACE FUNCTION fn_update_rup_total_hours_delete() RETURNS TRIGGER AS $$
BEGIN
    UPDATE study_plans
    SET total_hours_actual = (
        SELECT COALESCE(SUM(hours_total),0) FROM rup_subjects WHERE rup_id = OLD.rup_id
    ),
    updated_at = now()
    WHERE id = OLD.rup_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rup_subjects_after_delete
AFTER DELETE ON rup_subjects
FOR EACH ROW
EXECUTE FUNCTION fn_update_rup_total_hours_delete();

-- Контроль: можно добавить CHECK-constraint на таблицу study_plans при попытке перехода в статус 'approved'
-- чтобы total_hours_actual == total_hours
CREATE OR REPLACE FUNCTION fn_check_total_hours_on_approve() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        IF NEW.total_hours IS DISTINCT FROM NEW.total_hours_actual THEN
            RAISE EXCEPTION 'Невозможно утвердить: сумма часов в строках RUP (%), отличается от total_hours (%).',
                NEW.total_hours_actual, NEW.total_hours;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_study_plans_before_update
BEFORE UPDATE ON study_plans
FOR EACH ROW
EXECUTE FUNCTION fn_check_total_hours_on_approve();

2. Запрет пересечения уроков у одного преподавателя (базовая проверка при вставке `tt_lessons`):

CREATE OR REPLACE FUNCTION fn_check_lesson_overlap() RETURNS TRIGGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    IF NEW.teacher_kc_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO cnt
    FROM tt_lessons l
    JOIN tt_days d ON l.day_id = d.id
    WHERE l.teacher_kc_id = NEW.teacher_kc_id
      AND d.week_id = (SELECT week_id FROM tt_days WHERE id = NEW.day_id)
      AND l.day_id = NEW.day_id
      AND (
            (l.start_time < NEW.end_time AND l.end_time > NEW.start_time) -- пересечение интервалов
          );

    IF cnt > 0 THEN
        RAISE EXCEPTION 'Преподаватель имеет пересечение уроков в этот день';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tt_lessons_before_insert
BEFORE INSERT ON tt_lessons
FOR EACH ROW
EXECUTE FUNCTION fn_check_lesson_overlap();

CREATE TRIGGER trg_tt_lessons_before_update
BEFORE UPDATE ON tt_lessons
FOR EACH ROW
EXECUTE FUNCTION fn_check_lesson_overlap();

> Примечание: проверка перекрытия времени может потребовать учёта временных зон, коротких дней и дробных часов. Для производительности — лучше выполнять такие проверки в бизнес-логике (сервер), а также иметь уникальные индексы на состав (teacher_kc_id, day_id, start_time,end_time) при нужде.

---

# Индексы и производительность (рекомендации)

* GIN-индексы на JSONB-полях, если вы часто фильтруете по ним:

CREATE INDEX idx_working_programs_ai_parts_gin ON working_programs USING GIN (ai_generated_parts);
CREATE INDEX idx_files_metadata_gin ON files USING GIN (metadata);

* Индексы на часто используемые FK и поля: `teacher_kc_id`, `group_id`, `rup_id`, `subject_id`.
* Для полнотекстного поиска по содержанию дисциплин используйте `tsvector` и GIN:

ALTER TABLE subjects ADD COLUMN search_vector tsvector;
CREATE INDEX idx_subjects_search_vector ON subjects USING GIN(search_vector);
-- триггер для обновления search_vector при изменении name/description

---

# Миграции и управление версиями

* Рекомендуется поместить этот SQL в миграцию V1__init.sql для `golang-migrate` или другой мигратор.
* Разбивать на отдельные миграции: types -> таблицы справочников -> основные таблицы -> триггеры & функции -> индексы.
* Привести в порядок права: создать роль БД `app_rw` и `app_ro`, назначить права только на нужные таблицы/функции.

---

# Примеры дополнительных полей / JSON контрактов

* В `study_plans.metadata` можно хранить нормативы по приказу №130, номера приказов, ссылки на локальные документы.
* `working_programs.content_modules` — формат:

[
  {"module_no":1,"title":"Введение","hours":18,"topics":[{"title":"Тема 1","hours":2}]}
]

* `ai_tasks.payload` для docx_parse:

{
  "file_id": 123,
  "rup_id": 456,
  "options": {"extract_tables": true, "language": "ru"}
}

---

# Что ещё можно добавить (советы)

1. Дописать audit-лог: таблица `audit_logs` для записи изменений сущностей (who, when, what).
2. Добавить materialized view для быстрого подсчёта часов по RUP/группе.
3. Распределять большие операции (импорт, оптимизация расписания) в очередь (RabbitMQ/Redis queue) и хранить ссылки на `ai_tasks`.
4. Поддержать soft-delete (`deleted_at TIMESTAMP`) для критичных сущностей, если нужна история.

---

Если хочешь — я переведу это в конкретный файл миграции `V1__create_schema.sql` и положу в проект, либо дополню audit-логикой, view для отчётов и seed-примерами. Что сгенерировать дальше: файл миграции (готовый .sql), триггеры для контроля прав при изменении статусов или seed-данные?
