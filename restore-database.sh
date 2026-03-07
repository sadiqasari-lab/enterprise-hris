#!/bin/bash
#
# Database Restore Script
# Restores PostgreSQL database from backup file
#
# Usage: ./restore-database.sh <backup-file>

set -e

# Configuration
DB_NAME="${DB_NAME:-hris_db}"
DB_USER="${DB_USER:-hris_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    find /opt/backups/database -name "hris_backup_*.sql.gz" -type f -printf "%T@ %Tc %p\n" | sort -n | tail -10 | cut -d' ' -f2-
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "========================================="
echo "Database Restore Tool"
echo "========================================="
echo "⚠️  WARNING: This will replace the current database!"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Creating backup of current database before restore..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PRE_RESTORE_BACKUP="/tmp/pre_restore_backup_$TIMESTAMP.sql.gz"
PGPASSWORD="$PGPASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$PRE_RESTORE_BACKUP"
echo "✓ Current database backed up to: $PRE_RESTORE_BACKUP"

echo "Terminating active connections..."
PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$DB_NAME'
      AND pid <> pg_backend_pid();
"

echo "Dropping existing database..."
PGPASSWORD="$PGPASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" || true

echo "Creating fresh database..."
PGPASSWORD="$PGPASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"

echo "Restoring from backup..."
if [[ "$BACKUP_FILE" == *.dump ]]; then
    # Custom format backup
    PGPASSWORD="$PGPASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        "$BACKUP_FILE"
else
    # Plain SQL backup
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$PGPASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME"
fi

echo "✓ Database restored successfully"

echo "Verifying restore..."
ROW_COUNT=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT COUNT(*) FROM employees;
")
echo "✓ Verification: Found $ROW_COUNT employees"

echo "========================================="
echo "Restore completed successfully!"
echo "Pre-restore backup saved at: $PRE_RESTORE_BACKUP"
echo "========================================="

exit 0
