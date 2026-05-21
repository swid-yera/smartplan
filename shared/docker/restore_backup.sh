#!/bin/bash

set -e

# =========================
# CONFIG
# =========================

COMPOSE_DIR="/c/Users/justs/jop/eduplan/shared/docker"
BACKUP_FILE="./backups/backup.sql"

SERVICE_NAME="postgres"
DB_USER="admin"
DB_NAME="eduplan"

CONTAINER_BACKUP_PATH="/tmp/backup.sql"

# =========================
# SCRIPT
# =========================

echo "Переход в папку docker-compose..."
cd "$COMPOSE_DIR"

echo "Проверка docker compose..."
docker compose ps

echo "Копирование backup в контейнер..."
docker compose cp "$BACKUP_FILE" "$SERVICE_NAME:$CONTAINER_BACKUP_PATH"

echo "Применение SQL backup..."
docker compose exec "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f "$CONTAINER_BACKUP_PATH"

echo "Проверка таблиц..."
docker compose exec "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo "Backup успешно применён."