#!/bin/bash

set -e

# =========================
# CONFIG
# =========================

# COMPOSE_DIR="/c/Users/justs/jop/eduplan/shared/docker/"

SERVICE_NAME="postgres"
DB_USER="admin"
DB_NAME="eduplan"

BACKUP_DIR="./backups"
BACKUP_FILE="backup.sql"

# =========================
# SCRIPT
# =========================

#echo "Переход в папку docker-compose..."
#cd "$COMPOSE_DIR"

echo "Создание папки для backup, если её нет..."
mkdir -p "$BACKUP_DIR"

echo "Проверка контейнеров..."
docker compose ps

echo "Создание backup базы данных '$DB_NAME'..."

docker compose exec -T "$SERVICE_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

echo "Backup создан:"
echo "$COMPOSE_DIR/$BACKUP_DIR/$BACKUP_FILE"

echo "Размер файла:"
ls -lh "$BACKUP_DIR/$BACKUP_FILE"
