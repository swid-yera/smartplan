#!/bin/bash

set -euo pipefail

# =========================
# CONFIG
# =========================

SERVICE_NAME="${SERVICE_NAME:-postgres}"
DB_USER="${DB_USER:-admin}"
DB_NAME="${DB_NAME:-eduplan}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-awards_backup}"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M)"
BACKUP_FILE="${BACKUP_FILE:-${BACKUP_PREFIX}_${TIMESTAMP}.sql}"

# Таблицы по умолчанию как в awards_backup_*.sql
TABLES=(
  "public.award_categories"
  "public.award_category_fields"
  "public.award_type_criteria"
  "public.award_type_variants"
  "public.award_types"
)

# =========================
# SCRIPT
# =========================

echo "Создание папки для backup, если её нет..."
mkdir -p "$BACKUP_DIR"

echo "Проверка контейнеров..."
docker compose ps

OUT_PATH="$BACKUP_DIR/$BACKUP_FILE"
echo "Режим: только данные таблиц (без CREATE TABLE)"
echo "Файл: $OUT_PATH"

PG_DUMP_ARGS=(
  --data-only
  --inserts
  --column-inserts
  -U "$DB_USER"
  -d "$DB_NAME"
)

for table in "${TABLES[@]}"; do
  PG_DUMP_ARGS+=( -t "$table" )
done

echo "Создание backup базы данных '$DB_NAME'..."
docker compose exec -T "$SERVICE_NAME" pg_dump "${PG_DUMP_ARGS[@]}" > "$OUT_PATH"

echo "Backup создан:"
echo "$OUT_PATH"

echo "Размер файла:"
ls -lh "$OUT_PATH"
