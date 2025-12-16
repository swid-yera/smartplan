#!/bin/bash
set -e

# Run migrations
echo "Running database migrations..."
psql "$DATABASE_URL" -f internal/db/migrations/0001_init.sql

# Start the application
echo "Starting the application..."
exec "$@"

