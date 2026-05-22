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
read -r -p "Enter DB service name or container name (example: postgres or eduplan-postgres-1): " SERVICE_INPUT
read -r -p "Enter DB user: " DB_USER
read -r -p "Enter DB name: " DB_NAME

if [[ -z "${BACKUP_FILE}" || -z "${SERVICE_INPUT}" || -z "${DB_USER}" || -z "${DB_NAME}" ]]; then
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

SERVICE_NAME="$SERVICE_INPUT"
SERVICE_CONTAINER_ID=""

# If input is not a compose service, try to resolve it as a container name.
if ! docker compose ps --services | grep -Fxq "$SERVICE_NAME"; then
	SERVICE_CONTAINER_ID="$(docker compose ps -q "$SERVICE_NAME" 2>/dev/null || true)"

	if [[ -z "$SERVICE_CONTAINER_ID" ]]; then
		SERVICE_CONTAINER_ID="$(docker ps -q -f "name=^${SERVICE_INPUT}$" || true)"
	fi

	if [[ -z "$SERVICE_CONTAINER_ID" ]]; then
		echo "Error: '$SERVICE_INPUT' is neither a compose service name nor a running container name."
		echo "Hint: for this project the compose DB service is usually 'postgres'."
		exit 1
	fi
fi

echo "Uploading backup file into container path: $CONTAINER_BACKUP_PATH"
if [[ -n "$SERVICE_CONTAINER_ID" ]]; then
	docker exec -i "$SERVICE_CONTAINER_ID" sh -c "cat > '$CONTAINER_BACKUP_PATH'" < "$BACKUP_FILE"
else
	docker compose exec -T "$SERVICE_NAME" sh -c "cat > '$CONTAINER_BACKUP_PATH'" < "$BACKUP_FILE"
fi

echo "Applying SQL backup to database '$DB_NAME'..."
if [[ -n "$SERVICE_CONTAINER_ID" ]]; then
	docker exec -i "$SERVICE_CONTAINER_ID" psql -U "$DB_USER" -d "$DB_NAME" -f "$CONTAINER_BACKUP_PATH"
else
	docker compose exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f "$CONTAINER_BACKUP_PATH"
fi

echo "Checking tables..."
if [[ -n "$SERVICE_CONTAINER_ID" ]]; then
	docker exec -i "$SERVICE_CONTAINER_ID" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"
else
	docker compose exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"
fi

echo "Cleaning temporary file inside container..."
if [[ -n "$SERVICE_CONTAINER_ID" ]]; then
	docker exec -i "$SERVICE_CONTAINER_ID" rm -f "$CONTAINER_BACKUP_PATH"
else
	docker compose exec -T "$SERVICE_NAME" rm -f "$CONTAINER_BACKUP_PATH"
fi

echo "Backup restore completed successfully."
