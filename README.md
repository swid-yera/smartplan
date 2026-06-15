# EduPlan

Платформа для управления учебными планами (РУП), KPI преподавателей и образовательными материалами. Поддерживает два языка интерфейса — русский и казахский.

---

## Содержание

- [Обзор архитектуры](#обзор-архитектуры)
- [Сервисы](#сервисы)
- [Быстрый старт (Docker)](#быстрый-старт-docker)
- [Локальная разработка](#локальная-разработка)
- [Переменные окружения](#переменные-окружения)
- [База данных](#база-данных)
- [AI-генерация](#ai-генерация)
- [Структура проекта](#структура-проекта)

---

## Обзор архитектуры

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│ Document Rendering       │
│   Next.js :3000 │     │   Go/Gin  :8080 │     │ Service Python/FastAPI   │
└─────────────────┘     └────────┬────────┘     │ :8081                    │
                                 │              └──────────────────────────┘
                         ┌───────┴────────┐
                         │                │
                    ┌────▼────┐     ┌─────▼────┐
                    │Postgres │     │  Redis   │
                    │  :5432  │     │  :6379   │
                    └─────────┘     └──────────┘
                         │
                    ┌────▼────┐     ┌──────────┐
                    │  MinIO  │     │Keycloak  │
                    │   S3    │     │  (auth)  │
                    └─────────┘     └──────────┘
```

Аутентификация — через Keycloak (JWT). Три роли: `ADMIN`, `TEACHER`, `METHODIST`.

---

## Сервисы

### Frontend (`/frontend`)

**Стек:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query v5, Zustand, React Hook Form, Zod

**Основные страницы:**

| Путь | Описание |
|---|---|
| `/login` | Авторизация |
| `/dashboard` | Дашборд (статистика, рейтинги) |
| `/kpi/entry` | Ввод данных KPI преподавателем |
| `/kpi/categories` | Управление категориями KPI |
| `/kpi/types` | Управление типами и критериями KPI |
| `/kpi/[id]` | Просмотр и проверка KPI записи |
| `/rups` | Список рабочих учебных программ |
| `/rups/my` | Мои РУПы |
| `/rups/review` | РУПы на проверке |
| `/groups` | Управление группами (синхронизация с Keycloak) |
| `/users` | Управление пользователями |
| `/guides` | Справочники (КПИ, уроки, РУПы) |
| `/settings` | Настройки системы, HIK-интеграция |
| `/support` | Страница поддержки |

**Скрипты:**
```bash
npm run dev       # Режим разработки (Turbopack)
npm run build     # Сборка
npm run start     # Запуск production сборки
npm run lint      # Линтинг
```

---

### Backend API (`/backend`)

**Стек:** Go 1.25, Gin, sqlc, pgx/v5, gocloak, MinIO Go SDK, Redis, zerolog/zap

**Модули:**

| Пакет | Описание |
|---|---|
| `handler` | HTTP-обработчики (auth, users, rups, awards, categories, lessons, statistics, AI, groups, webhooks) |
| `service` | Бизнес-логика |
| `repository` | Работа с БД через sqlc-generated код |
| `middleware` | JWT-аутентификация, RBAC, валидация |
| `service/keycloak` | Синхронизация групп и пользователей с Keycloak |
| `localization` | Утилиты для локализованных текстов (ru/kz) |

**RUP approval flow:**

- При `PUT /rups/{id}/status` со статусом `APPROVED` backend сначала проверяет владение ключом через Kripto, затем регистрирует подпись и сохраняет артефакт QR для approved-ревизии.
- В ответе на approval возвращается `artifact` с `signatureId`, `verificationUrl` и `qrSvg`.
- `GET /rups/{id}/signature-artifact` отдает последний сохраненный артефакт для approved RUP и используется фронтендом после reload.

**Сборка и запуск:**
```bash
cd backend
go run main.go

# или собрать бинарник
go build -o eduplan.exe main.go
./eduplan.exe
```

**Генерация SQL-кода (sqlc):**
```bash
sqlc generate   # на основе sqlc.yaml и pkg/sqlc/queries.sql
```

---

### Document Rendering Service (`/document-rendering-service`)

**Стек:** Python 3.14, FastAPI, uvicorn, python-docx, docxtpl, pandas, openpyxl

**Эндпоинты:**

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/generate-rup` | Генерация .docx файла РУП по шаблону |
| `POST` | `/generate-lesson` | Генерация .docx плана урока |
| `POST` | `/hik-to-report` | Конвертация HIK-файла в Excel-отчёт |
| `DELETE` | `/cleanup` | Очистка временных файлов |

**Запуск:**
```bash
cd document-rendering-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8081

# или через скрипт
bash start.sh
```

**Переменные окружения** (`.env.local`):
```env
API_KEY_RUP_BACKEND=your-super-secret-api-key
```

---

## Быстрый старт (Docker)

Все сервисы запускаются одной командой через Docker Compose:

```bash
cd shared/docker
docker compose up -d
```

Что поднимается:

| Контейнер | Образ | Порт |
|---|---|---|
| `eduplan-ui` | build from `/frontend` | `3000` |
| `eduplan-api` | build from `/backend` | `8080` |
| `eduplan-render` | build from `/document-rendering-service` | `8081` |
| `eduplan-translation-service` | build from `/translation-service` | `8082` |
| `eduplan-translation-model-prepare` | one-shot model preparation tool | - |
| `eduplan-db` | `postgres:16` | `5432` |
| `eduplan-redis` | `redis:7-alpine` | `6379` |

**Требования перед запуском:**
1. Создайте `backend/.env` на основе `backend/.env.example`
2. Создайте `document-rendering-service/.env.local` на основе `.env.example`
3. Создайте `frontend/.env.local` с переменными:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXT_PUBLIC_RENDER_API_URL=http://localhost:8081
   ```

```bash
# Остановить все контейнеры
docker compose down

# Пересобрать после изменений
docker compose up -d --build
```

Для переводов РУП модель NLLB нужно подготовить один раз. Она хранится вне git в `models/translation`:

```bash
docker compose --profile tools run --rm translation-model-prepare
docker compose up --build -d translation-service api
```

---

## Локальная разработка

### Требования

- Go 1.25+
- Node.js 20+
- Python 3.11+
- PostgreSQL 16
- Redis 7
- MinIO (опционально, для хранения файлов)
- Keycloak (для аутентификации)

### Порядок запуска

```bash
# 1. База данных и Redis (через Docker)
cd shared/docker
docker compose up -d db redis

# 2. Применить миграции
cd shared/atlas
bash apply.sh

# 3. Backend
cd backend
cp .env.example .env   # заполнить значения
go run main.go

# 4. Document rendering service
cd document-rendering-service
cp .env.example .env.local
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8081

# 5. Frontend
cd frontend
npm install
npm run dev
```

### Миграции базы данных

Проект использует [Atlas](https://atlasgo.io/) для управления миграциями:

```bash
cd shared/atlas
bash migrate.sh   # создать новую миграцию
bash apply.sh     # применить миграции
```

Миграции хранятся в `shared/atlas/migrations/`. Схема базы данных — в `shared/atlas/schema.sql`.

### Бэкап и восстановление БД

```bash
bash shared/scripts/create_category_backup.sh  # мягкий бэкап категорий KPI
bash shared/scripts/create_backup.sh   # мягкий полный бэкап всей БД
bash shared/scripts/restore_backup.sh  # восстановить из бэкапа
```

---

## Переменные окружения

### Backend (`backend/.env`)

```env
# Keycloak
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=eduplan
KEYCLOAK_CLIENT_SECRET=secret
GROUP_ID=students-group-id
TEACHER_GROUP_ID=teacher-group-id
TEACHER_ROLES=Teacher
ADMIN_ROLES=Admins,Administrators
METHODIST_ROLES=Methodist

# Сервер
SERVER_PORT=8080
COOKIE_DOMAIN=example.com
BASE_URL=https://example.com/api
FRONTEND_URL=https://example.com

# `FRONTEND_URL` должен быть публично доступен: Kripto использует его как основу для verification URL,
# который попадает в QR-артефакт approved RUP.

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=eduplan
SSLMODE=disable
DATABASE_URL=postgresql://admin:admin@localhost:5432/eduplan?sslmode=disable

# Redis
RedisAddr=localhost:6379
RedisPassword=
RedisDB=0

# MinIO S3
MINIO_ENDPOINT=s3.example.com
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=admin
MINIO_BUCKET_NAME=eduplan
MINIO_USE_SSL=true

# Document rendering
DOCUMENT_RENDER_URL=http://localhost:8081
DOCUMENT_RENDER_API_KEY=your-api-key

# Translation service
TRANSLATION_BASE_URL=http://localhost:8082
TRANSLATION_TIMEOUT_SECONDS=120

# Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_PRIMARY_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
```

---

## База данных

**СУБД:** PostgreSQL 16

**Основные таблицы:**

| Таблица | Описание |
|---|---|
| `users` | Пользователи (синхронизируются с Keycloak) |
| `violation` | Нарушения пользователей |
| `rups` | Рабочие учебные программы |
| `awards` | KPI-достижения преподавателей |
| `award_categories` | Категории KPI |
| `award_types` | Типы и критерии KPI |
| `lessons` | Планы уроков |

**Основные enum-типы:**

- `user_role`: `ADMIN`, `TEACHER`, `METHODIST`
- `rups_status` / `awards_status`: `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`
- `violation_enum`: `NONE`, `REMARK`, `REBUKE`, `SEVERE_REPRIMAND`

Код доступа к БД генерируется через [sqlc](https://sqlc.dev/) из файла `backend/pkg/sqlc/queries.sql`.

---

## AI-генерация

Бэкенд использует только Gemini для генерации учебного контента (РУПы, планы уроков):

```env
GEMINI_API_KEY=your-key
GEMINI_PRIMARY_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
```

Поддерживается до 5 fallback-ключей (`GEMINI_API_KEY_1` ... `GEMINI_API_KEY_5`).

---

## Структура проекта

```
eduplan/
├── backend/                        # Go API сервер
│   ├── main.go                     # Точка входа
│   ├── config/                     # Конфигурация из env
│   ├── pkg/
│   │   ├── handler/                # HTTP-обработчики
│   │   ├── service/                # Бизнес-логика
│   │   │   └── keycloak/           # Синхронизация с Keycloak
│   │   ├── repository/             # Работа с БД и MinIO
│   │   ├── middleware/             # JWT, RBAC, валидация
│   │   ├── sqlc/                   # Запросы и сгенерированный код
│   │   ├── localization/           # Утилиты локализации ru/kz
│   │   └── helpers/                # Вспомогательные функции
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                       # Next.js приложение
│   ├── src/
│   │   ├── app/                    # App Router страницы
│   │   ├── components/             # Переиспользуемые компоненты
│   │   ├── helpers/                # Утилиты (локализация, форматирование)
│   │   ├── services/               # API-клиенты (TanStack Query)
│   │   ├── hooks/                  # Кастомные хуки
│   │   ├── shared/types/           # TypeScript типы
│   │   └── constants/              # Константы
│   └── Dockerfile
│
├── document-rendering-service/     # Python сервис генерации документов
│   ├── app/
│   │   ├── main.py                 # FastAPI приложение
│   │   ├── services/               # Генераторы (rup, lesson, hik)
│   │   ├── helpers/                # Вспомогательные функции
│   │   └── templates/              # .docx шаблоны документов
│   ├── requirements.txt
│   └── Dockerfile
│
├── shared/
│   ├── atlas/                      # Миграции БД (Atlas)
│   │   ├── schema.sql              # Полная схема
│   │   └── migrations/             # Файлы миграций
│   ├── docker/
│   │   └── docker-compose.yml      # Полный стек
│   └── scripts/
│       ├── create_category_backup.sh
│       ├── create_backup.sh        # Мягкий полный бэкап БД
│       └── restore_backup.sh       # Восстановление БД
│
├── docs/                           # Документация
│   ├── README.md                   # Этот файл
│   ├── endpoints.md                # Описание API эндпоинтов
│   ├── entities.md                 # Описание сущностей
│   ├── schema.sql                  # Схема БД
│   └── openapi.yaml                # OpenAPI спецификация
│
```
