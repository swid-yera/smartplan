#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${COMPOSE_DIR:-$SCRIPT_DIR}"
BACKUP_DIR_DEFAULT="$COMPOSE_DIR/backups"

SERVICE_NAME="db"
DB_USER="admin"
DB_NAME="eduplan"
BACKUP_FILE=""
BACKUP_DIR="$BACKUP_DIR_DEFAULT"

usage() {
  cat <<'EOF'
Usage:
  ./restore_backups.sh [options]

Options:
  -f, --file <path>       Path to backup SQL file.
  -b, --backups <dir>     Directory with backups (default: ./backups).
  -s, --service <name>    Docker Compose DB service (default: postgres).
  -u, --user <name>       Database user (default: admin).
  -d, --database <name>   Database name (default: eduplan).
  -h, --help              Show this help.

Examples:
  ./restore_backups.sh
  ./restore_backups.sh --file ./backups/backup.sql
  ./restore_backups.sh --service postgres --user admin --database eduplan
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--file)
      BACKUP_FILE="${2:-}"
      shift 2
      ;;
    -b|--backups)
      BACKUP_DIR="${2:-}"
      shift 2
      ;;
    -s|--service)
      SERVICE_NAME="${2:-}"
      shift 2
      ;;
    -u|--user)
      DB_USER="${2:-}"
      shift 2
      ;;
    -d|--database)
      DB_NAME="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ ! -f "$COMPOSE_DIR/docker-compose.yml" ]]; then
  echo "Error: docker-compose.yml not found in $COMPOSE_DIR"
  exit 1
fi

cd "$COMPOSE_DIR"

if ! docker compose ps --services | grep -Fxq "$SERVICE_NAME"; then
  echo "Error: service '$SERVICE_NAME' not found in docker-compose.yml"
  docker compose ps --services || true
  exit 1
fi

if [[ -n "$BACKUP_FILE" ]]; then
  if [[ ! "$BACKUP_FILE" = /* ]]; then
    BACKUP_FILE="$COMPOSE_DIR/$BACKUP_FILE"
  fi
  if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "Error: backup file not found: $BACKUP_FILE"
    exit 1
  fi
else
  if [[ ! "$BACKUP_DIR" = /* ]]; then
    BACKUP_DIR="$COMPOSE_DIR/$BACKUP_DIR"
  fi

  if [[ ! -d "$BACKUP_DIR" ]]; then
    echo "Error: backups directory not found: $BACKUP_DIR"
    exit 1
  fi

  mapfile -t backups < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name "*.sql" | sort)
  if [[ ${#backups[@]} -eq 0 ]]; then
    echo "Error: no .sql backups found in $BACKUP_DIR"
    exit 1
  fi

  echo "Available backups:"
  for i in "${!backups[@]}"; do
    printf "  %d) %s\n" "$((i + 1))" "$(basename "${backups[$i]}")"
  done

  read -r -p "Choose backup number: " choice
  if ! [[ "$choice" =~ ^[0-9]+$ ]] || (( choice < 1 || choice > ${#backups[@]} )); then
    echo "Error: invalid choice."
    exit 1
  fi
  BACKUP_FILE="${backups[$((choice - 1))]}"
fi

echo "Compose dir: $COMPOSE_DIR"
echo "Service:     $SERVICE_NAME"
echo "DB user:     $DB_USER"
echo "DB name:     $DB_NAME"
echo "Backup file: $BACKUP_FILE"

echo "Restoring backup..."
docker compose exec -T "$SERVICE_NAME" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"

echo "Restore completed successfully. Current tables:"
docker compose exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c '\dt'
