# Category Plan

## Цель
Добавить сущность категорий KPI с настраиваемыми полями ввода для фронтенда и CRUD API.

Требования из задачи:
1. В `shared/atlas/schema.sql` добавить `award_categories` с полями:
- `id`
- `award_types` (массив `award_types.id`)
- `name`
- `icon` (string)
- `description`
- `fields` (массив UUID на таблицу полей)
2. Создать endpoint `api/kpi/categories` с методами `GET`, `POST`, `PUT`, `DELETE`.
3. `GET` по `id` должен возвращать category + развернутые данные по `award_types`.

## Важный контракт по URL
Текущий backend роутится как `/awards`, `/awards/types`, без явного префикса `/api`.
Фактический публичный URL обычно формируется через `NEXT_PUBLIC_API_URL` на фронте.

Нужно зафиксировать один вариант:
- Вариант A (рекомендуется): backend маршрут `'/kpi/categories'` (без `/api` внутри Gin), а внешний `/api` остается в `NEXT_PUBLIC_API_URL`/reverse-proxy.
- Вариант B: backend маршрут `'/api/kpi/categories'`, если требуется именно жесткий префикс внутри сервера.

## Проектное решение для fields
Рекомендуемая модель хранения:
- `award_category_fields`: описание одного поля формы (тип, label, required, options, валидация)
- `award_categories.fields`: `uuid[]`, ссылка на `award_category_fields.id`

Почему так:
- Совместимо с текущим стилем проекта (массивы UUID уже активно используются).
- Дает гибкость фронту (динамическая форма без изменений схемы).
- Можно переиспользовать field между категориями.

## Предлагаемая структура таблиц (DDL-черновик)
```sql
-- =====================
-- AWARD CATEGORY FIELDS
-- =====================
CREATE TABLE award_category_fields (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL, -- text, textarea, number, select, date, file, url, checkbox ...
    required BOOLEAN NOT NULL DEFAULT false,
    placeholder TEXT,
    help_text TEXT,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (key)
);

-- =====================
-- AWARD CATEGORIES
-- =====================
CREATE TABLE award_categories (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    award_types UUID[] NOT NULL DEFAULT '{}',
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    fields UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Примечание:
- FK для каждого элемента массива в PostgreSQL напрямую не задается, валидацию ссылок делаем на сервисном уровне (`service`) перед insert/update.

## Этапы реализации

## Этап 1. Схема БД и миграции
Задачи:
1. Добавить таблицы `award_category_fields` и `award_categories` в `shared/atlas/schema.sql`.
2. Сгенерировать миграцию Atlas (`shared/atlas/migrations/*.sql`).
3. Применить миграцию локально.

Проверка:
- Таблицы существуют.
- `uuid[]` и `jsonb` поля создаются корректно.

## Этап 2. SQLC запросы
Задачи в `backend/pkg/sqlc/queries.sql`:
1. CRUD для `award_categories`.
2. CRUD (или минимум create/get/list) для `award_category_fields`.
3. Запросы для `GET category by id` + дальнейшей сборки полных `award_types` (через уже существующие query `GetAwardTypeByID`).

Минимальный набор запросов:
- `CreateAwardCategory`
- `GetAwardCategoryByID`
- `GetAllAwardCategories`
- `UpdateAwardCategory`
- `DeleteAwardCategory`
- `CreateAwardCategoryField`
- `GetAwardCategoryFieldByID`
- `GetAwardCategoryFieldsByIDs` (или выборка по массиву)

Затем: `sqlc generate`.

## Этап 3. Repository слой
Файлы:
- `backend/pkg/repository/award_repository.go` (или выделить `category_repository.go`)

Задачи:
1. Добавить методы для category/field.
2. Добавить методы валидации ссылок:
- Проверка существования каждого `award_type`.
- Проверка существования каждого `field`.

## Этап 4. Service слой
Файл:
- `backend/pkg/service/award_service.go` (или новый `category_service.go`)

Задачи:
1. DTO для request/response.
2. CRUD-методы для category.
3. В `GetCategoryByID` возвращать:
- базовые данные category,
- `award_types_expanded` (полные структуры типов, по аналогии с `BuildType`),
- `fields_expanded` (объекты полей).
4. Валидация перед create/update:
- `name` не пустой,
- `award_types` не пустой (если бизнес-требование),
- все ID существуют.

## Этап 5. Handler и роутинг
Файлы:
- `backend/pkg/handler`:
  - новый `category_handler.go` (рекомендуется)
  - `handler.go` (подключение маршрутов)
  - `main.go` (инициализация handler/service/repository при необходимости)

Маршруты (вариант A):
- `GET /kpi/categories`
- `GET /kpi/categories/:id`
- `POST /kpi/categories`
- `PUT /kpi/categories/:id`
- `DELETE /kpi/categories/:id`

Требование для `GET /kpi/categories/:id`:
- вернуть category + `award_types` в развернутом виде.

## Этап 6. Тест-кейсы
Проверить:
1. Создание category с валидными `award_types` и `fields`.
2. Ошибка 400 при невалидном UUID.
3. Ошибка 404/400 при ссылке на несуществующий `award_type`.
4. `GET /:id` действительно возвращает расширенный `award_types`.
5. `PUT` обновляет массивы и метаданные.
6. `DELETE` удаляет category.

## Этап 7. Frontend интеграция (опционально в рамках этой задачи)
1. Добавить `category.service.ts` по аналогии с `award.service.ts`.
2. Добавить типы:
- `IAwardCategory`
- `IAwardCategoryField`
- `ICreateAwardCategoryRequest`
3. Использовать `fields_expanded` для рендера динамической формы.

## Готовые промпты для реализации

## Промпт 1: DB + SQLC
```text
Сделай только слой БД и sqlc для категорий KPI.

Контекст:
- Проект Go + Gin + sqlc + atlas.
- Схема в shared/atlas/schema.sql.
- SQLC queries в backend/pkg/sqlc/queries.sql.

Задача:
1) Добавь таблицы:
- award_category_fields: id, key, label, type, required, placeholder, help_text, options(jsonb), validation(jsonb), sort_order, created_at, updated_at
- award_categories: id, award_types(uuid[]), name, icon, description, fields(uuid[]), created_at, updated_at
2) Обнови schema.sql.
3) Добавь CRUD queries для обеих таблиц в queries.sql.
4) Сгенерируй sqlc код.
5) Ничего не меняй в handler/service.

Выведи:
- список измененных файлов,
- SQL-дифф,
- команды миграции/генерации, которые были использованы.
```

## Промпт 2: Backend CRUD API
```text
Реализуй backend CRUD для KPI categories.

Требования:
- Endpoint группа: /kpi/categories
- Методы: GET, GET/:id, POST, PUT/:id, DELETE/:id
- GET /kpi/categories/:id должен возвращать:
  - category
  - fields_expanded
  - award_types_expanded (полные данные типов через существующую логику award type)

Ограничения:
- Используй существующую архитектуру repository -> service -> handler.
- Валидация UUID и проверка существования связанных сущностей обязательны.
- Формат ошибок в стиле существующих handler.

Сделай:
1) repository методы
2) service DTO + бизнес-логику
3) category handler
4) подключение маршрутов в handler.go/main.go

После изменений запусти локальную проверку сборки backend и покажи результат.
```

## Промпт 3: Контракт ответов API
```text
Приведи API контракт для /kpi/categories в формате JSON-примеров.

Нужно:
1) Пример POST body
2) Пример PUT body
3) Пример GET list response
4) Пример GET by id response с award_types_expanded и fields_expanded
5) Перечень кодов ошибок (400/404/500) и когда они возвращаются

Важно: структура должна соответствовать текущему стилю проекта (snake_case или camelCase выбрать консистентно и обосновать).
```

## Промпт 4: Интеграция фронтенда
```text
Сделай фронтенд интеграцию categories API в текущем проекте Next.js.

Сделай:
1) category.service.ts по аналогии с award.service.ts
2) TS типы для category/field
3) хуки react-query для CRUD
4) страницу списка категорий
5) форму создания/редактирования

Важно:
- Используй endpoint /kpi/categories.
- Для формы используй fields_expanded для динамических полей.
- Обработай loading/error/success состояния.

После изменений покажи список файлов и коротко опиши, как проверить вручную.
```

## Промпт 5: Валидация и приемка
```text
Проведи приемку реализации categories.

Проверь:
1) Миграции применяются без ошибок.
2) sqlc generate проходит.
3) backend собирается.
4) CRUD endpoint работает.
5) GET /kpi/categories/:id возвращает развернутые award_types.
6) Нет регрессий в существующих awards endpoints.

Выведи чеклист PASS/FAIL и список найденных дефектов с шагами воспроизведения.
```

## Definition of Done
1. В БД есть `award_categories` и `award_category_fields`.
2. Есть полный CRUD `GET/POST/PUT/DELETE` для `/kpi/categories`.
3. `GET /kpi/categories/:id` возвращает развернутые `award_types`.
4. Пройдены миграции, `sqlc generate`, сборка backend.
5. Подготовлены JSON-контракты и тест-кейсы.
