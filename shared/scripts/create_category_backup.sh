#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${COMPOSE_DIR:-$SCRIPT_DIR/../docker}"

SERVICE_NAME="${SERVICE_NAME:-db}"
DB_USER="${DB_USER:-admin}"
DB_NAME="${DB_NAME:-eduplan}"

BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-category_backup}"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M)"
BACKUP_FILE="${BACKUP_FILE:-${BACKUP_PREFIX}_${TIMESTAMP}.sql}"

# Мягкий backup: только данные, без CREATE TABLE/ALTER TABLE для схемы.
TABLES=(
  "public.award_categories"
  "public.award_category_fields"
  "public.award_type_criteria"
  "public.award_type_variants"
  "public.award_types"
)

if [[ ! -f "$COMPOSE_DIR/docker-compose.yml" ]]; then
  echo "Error: docker-compose.yml not found in $COMPOSE_DIR"
  exit 1
fi

echo "Создание папки для backup, если её нет..."
mkdir -p "$BACKUP_DIR"

cd "$COMPOSE_DIR"

echo "Проверка контейнеров..."
docker compose ps

OUT_PATH="$BACKUP_DIR/$BACKUP_FILE"
echo "Режим: мягкий data-only backup категорий KPI"
echo "Таблицы:"
for table in "${TABLES[@]}"; do
  echo "  - $table"
done
echo "Файл: $OUT_PATH"

PG_DUMP_ARGS=(
  --data-only
  --inserts
  --column-inserts
  --disable-triggers
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
