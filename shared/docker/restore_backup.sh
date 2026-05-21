#!/bin/bash

set -euo pipefail

# Use the current directory as docker-compose directory.
COMPOSE_DIR="$(pwd)"
CONTAINER_BACKUP_PATH="/tmp/restore_backup.sql"

echo "Working directory: $COMPOSE_DIR"
echo "This directory must contain docker-compose.yml."

if [[ ! -f "$COMPOSE_DIR/docker-compose.yml" ]]; then
	echo "Error: docker-compose.yml was not found in $COMPOSE_DIR"
	exit 1
fi

read -r -p "Enter backup SQL file path: " BACKUP_FILE
read -r -p "Enter DB service name (example: postgres): " SERVICE_NAME
read -r -p "Enter DB user: " DB_USER
read -r -p "Enter DB name: " DB_NAME

if [[ -z "${BACKUP_FILE}" || -z "${SERVICE_NAME}" || -z "${DB_USER}" || -z "${DB_NAME}" ]]; then
	echo "Error: all inputs are required."
	exit 1
fi

if [[ ! "$BACKUP_FILE" = /* ]]; then
	BACKUP_FILE="$COMPOSE_DIR/$BACKUP_FILE"
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
	echo "Error: backup file was not found: $BACKUP_FILE"
	exit 1
fi

echo "Checking docker compose services..."
cd "$COMPOSE_DIR"
docker compose ps

echo "Uploading backup file into container path: $CONTAINER_BACKUP_PATH"
docker compose exec -T "$SERVICE_NAME" sh -c "cat > '$CONTAINER_BACKUP_PATH'" < "$BACKUP_FILE"

echo "Applying SQL backup to database '$DB_NAME'..."
docker compose exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f "$CONTAINER_BACKUP_PATH"

echo "Checking tables..."
docker compose exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo "Cleaning temporary file inside container..."
docker compose exec -T "$SERVICE_NAME" rm -f "$CONTAINER_BACKUP_PATH"

echo "Backup restore completed successfully."
