-- feat/permissions: добавить роль SPECIAL, ENUM permission_code и таблицу permissions

-- 1. Добавить значение 'SPECIAL' в user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SPECIAL';

-- 2. Создать ENUM permission_code
-- MANAGE = methodist-уровень, VIEW = teacher-уровень, FULL = admin-уровень
CREATE TYPE permission_code AS ENUM (
    'RUP-manage',
    'RUP-view',
    'RUP-full',
    'KPI-manage',
    'KPI-view',
    'KPI-full'
);

-- 3. Создать таблицу permissions
-- Одна запись на пользователя; permissions — массив кодов доступа
CREATE TABLE permissions (
    id          UUID        PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    permissions permission_code[] NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,

    CONSTRAINT fk_user_permissions_user
        FOREIGN KEY (user_id)
        REFERENCES users (keycloak_id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_permission
        UNIQUE (user_id)
);
