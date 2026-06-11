#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${COMPOSE_DIR:-$SCRIPT_DIR/../docker}"
BACKUP_DIR_DEFAULT="$SCRIPT_DIR/backups"

SERVICE_NAME="db"
DB_USER="admin"
DB_NAME="eduplan"
BACKUP_FILE=""
BACKUP_DIR="$BACKUP_DIR_DEFAULT"

usage() {
  cat <<'EOF'
Usage:
  ./restore_backup.sh [options]

Options:
  -f, --file <path>       Path to backup SQL file.
  -b, --backups <dir>     Directory with backups (default: ./backups relative to script).
  -s, --service <name>    Docker Compose DB service (default: db).
  -u, --user <name>       Database user (default: admin).
  -d, --database <name>   Database name (default: eduplan).
  -h, --help              Show this help.

Examples:
  ./restore_backup.sh
  ./restore_backup.sh --file ./backups/backup.sql
  ./restore_backup.sh --service db --user admin --database eduplan
EOF
}

get_db_version_num() {
  docker compose exec -T "$SERVICE_NAME" psql -At -U "$DB_USER" -d "$DB_NAME" -c "SHOW server_version_num;" | tr -d '[:space:]'
}

is_full_data_dump() {
  grep -q '^INSERT INTO atlas_schema_revisions\.atlas_schema_revisions ' "$BACKUP_FILE"
}

get_restore_target_tables() {
  awk '
    match($0, /^(INSERT INTO|COPY) public\.([A-Za-z0-9_]+)/, m) {
      print m[2]
    }
  ' "$BACKUP_FILE" | sort -u
}

truncate_restore_target_tables() {
  mapfile -t target_tables < <(get_restore_target_tables)

  if [[ ${#target_tables[@]} -eq 0 ]]; then
    echo "Warning: no target tables detected in dump; skipping pre-restore cleanup."
    return
  fi

  local table_array_sql=""
  local table_name
  local truncate_sql
  for table_name in "${target_tables[@]}"; do
    if [[ -n "$table_array_sql" ]]; then
      table_array_sql+=", "
    fi
    table_array_sql+="'$table_name'"
  done

  echo "Info: truncating ${#target_tables[@]} target table(s) from dump."
  truncate_sql=$(cat <<'SQL'
DO $$
DECLARE
  table_list text;
BEGIN
  SELECT string_agg(format('public.%I', table_name), ', ')
    INTO table_list
  FROM unnest(ARRAY[__TABLE_ARRAY_SQL__]) AS table_name;

  IF table_list IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || table_list || ' RESTART IDENTITY CASCADE';
  END IF;
END $$;
SQL
)

  printf '%s\n' "${truncate_sql/__TABLE_ARRAY_SQL__/$table_array_sql}" |
    docker compose exec -T "$SERVICE_NAME" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME"
}

stream_backup_for_restore() {
  local db_version_num="$1"

  if [[ "$db_version_num" =~ ^[0-9]+$ ]] && (( db_version_num < 170000 )) && grep -q '^SET transaction_timeout = ' "$BACKUP_FILE"; then
    echo "Info: skipping unsupported 'SET transaction_timeout' from pg_dump 17 for PostgreSQL $db_version_num." >&2
    if is_full_data_dump; then
      sed \
        -e '/^SET transaction_timeout = /d' \
        -e '/^INSERT INTO atlas_schema_revisions\.atlas_schema_revisions /d' \
        -e '/^ALTER TABLE atlas_schema_revisions\.atlas_schema_revisions DISABLE TRIGGER ALL;$/d' \
        -e '/^ALTER TABLE atlas_schema_revisions\.atlas_schema_revisions ENABLE TRIGGER ALL;$/d' \
        "$BACKUP_FILE"
    else
      sed '/^SET transaction_timeout = /d' "$BACKUP_FILE"
    fi
    return
  fi

  if is_full_data_dump; then
    sed \
      -e '/^INSERT INTO atlas_schema_revisions\.atlas_schema_revisions /d' \
      -e '/^ALTER TABLE atlas_schema_revisions\.atlas_schema_revisions DISABLE TRIGGER ALL;$/d' \
      -e '/^ALTER TABLE atlas_schema_revisions\.atlas_schema_revisions ENABLE TRIGGER ALL;$/d' \
      "$BACKUP_FILE"
    return
  fi

  cat "$BACKUP_FILE"
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

DB_VERSION_NUM="$(get_db_version_num)"
echo "DB version:  $DB_VERSION_NUM"

if is_full_data_dump; then
  echo "Info: full data dump detected; truncating only tables that are present in the dump."
  echo "Info: keeping current Atlas migration state and skipping atlas_schema_revisions from dump."
  truncate_restore_target_tables
fi

echo "Restoring backup..."
stream_backup_for_restore "$DB_VERSION_NUM" | docker compose exec -T "$SERVICE_NAME" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME"

echo "Restore completed successfully. Current tables:"
docker compose exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c '\dt'
