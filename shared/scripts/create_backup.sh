#!/usr/bin/env bash

set -euo pipefail

# =========================
# CONFIG
# =========================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${COMPOSE_DIR:-$SCRIPT_DIR/../docker}"

SERVICE_NAME="${SERVICE_NAME:-db}"
DB_USER="${DB_USER:-admin}"
DB_NAME="${DB_NAME:-eduplan}"

BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-full_data_backup}"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M)"
BACKUP_FILE="${BACKUP_FILE:-${BACKUP_PREFIX}_${TIMESTAMP}.sql}"

# =========================
# SCRIPT
# =========================

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
echo "Режим: мягкий full data-only backup всей базы"
echo "Схема и таблицы миграциями не создаются, в backup пишутся только данные."
echo "Файл: $OUT_PATH"

PG_DUMP_ARGS=(
  --data-only
  --inserts
  --column-inserts
  --disable-triggers
  -U "$DB_USER"
  -d "$DB_NAME"
)

echo "Создание backup базы данных '$DB_NAME'..."
docker compose exec -T "$SERVICE_NAME" pg_dump "${PG_DUMP_ARGS[@]}" > "$OUT_PATH"

echo "Backup создан:"
echo "$OUT_PATH"

echo "Размер файла:"
ls -lh "$OUT_PATH"
