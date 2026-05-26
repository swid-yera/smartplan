#!/bin/bash

set -euo pipefail

# =========================
# CONFIG
# =========================

SERVICE_NAME="${SERVICE_NAME:-postgres}"
DB_USER="${DB_USER:-admin}"
DB_NAME="${DB_NAME:-eduplan}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${BACKUP_FILE:-backup.sql}"
MODE="${1:-full}" # full | schema | data

# =========================
# SCRIPT
# =========================

echo "Создание папки для backup, если её нет..."
mkdir -p "$BACKUP_DIR"

echo "Проверка контейнеров..."
docker compose ps

PG_DUMP_EXTRA_ARGS=()
case "$MODE" in
  full)
    echo "Режим: полный backup (структура + данные)"
    ;;
  schema)
    echo "Режим: только структура (без данных)"
    PG_DUMP_EXTRA_ARGS+=(--schema-only)
    ;;
  data)
    echo "Режим: только данные (без структуры)"
    PG_DUMP_EXTRA_ARGS+=(--data-only)
    ;;
  *)
    echo "Ошибка: неизвестный режим '$MODE'. Используй: full | schema | data"
    exit 1
    ;;
esac

OUT_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo "Создание backup базы данных '$DB_NAME'..."
docker compose exec -T "$SERVICE_NAME" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" "${PG_DUMP_EXTRA_ARGS[@]}" \
  > "$OUT_PATH"

echo "Backup создан:"
echo "$OUT_PATH"

echo "Размер файла:"
ls -lh "$OUT_PATH"
