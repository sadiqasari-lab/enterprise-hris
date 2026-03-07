#!/bin/bash
#
# Automated Database Backup Script
# Backs up PostgreSQL database with compression and retention policy
#
# Usage: ./backup-database.sh
# Cron: 0 2 * * * /opt/hris/scripts/backup/backup-database.sh

set -e  # Exit on error

# Configuration
DB_NAME="${DB_NAME:-hris_db}"
DB_USER="${DB_USER:-hris_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"  # Optional: s3://your-bucket/hris-backups

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hris_backup_$TIMESTAMP.sql.gz"
BACKUP_LOG="$BACKUP_DIR/backup.log"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_LOG"
}

log "========================================="
log "Starting database backup..."
log "Database: $DB_NAME"
log "Backup file: $BACKUP_FILE"

# Check if database is accessible
if ! PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    log "ERROR: Cannot connect to database"
    exit 1
fi

# Perform backup with compression
log "Creating backup..."
if PGPASSWORD="$PGPASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_FILE.dump"; then
    
    # Also create a plain SQL dump for easier inspection
    PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=plain | gzip > "$BACKUP_FILE"
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✓ Backup completed successfully"
    log "  - Custom format: ${BACKUP_FILE}.dump"
    log "  - SQL format: $BACKUP_FILE"
    log "  - Size: $BACKUP_SIZE"
else
    log "ERROR: Backup failed"
    exit 1
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "✓ Backup integrity verified"
else
    log "ERROR: Backup file is corrupted"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3..."
    if aws s3 cp "$BACKUP_FILE" "$S3_BUCKET/hris_backup_$TIMESTAMP.sql.gz"; then
        log "✓ Uploaded to S3: $S3_BUCKET"
    else
        log "WARNING: S3 upload failed (continuing anyway)"
    fi
fi

# Apply retention policy - delete old backups
log "Applying retention policy ($RETENTION_DAYS days)..."
DELETED_COUNT=0
find "$BACKUP_DIR" -name "hris_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0 | while IFS= read -r -d '' file; do
    log "  Deleting old backup: $file"
    rm -f "$file"
    ((DELETED_COUNT++))
done
log "✓ Cleaned up $DELETED_COUNT old backup(s)"

# Generate backup summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "hris_backup_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "========================================="
log "Backup Summary:"
log "  - Total backups: $TOTAL_BACKUPS"
log "  - Total size: $TOTAL_SIZE"
log "  - Latest backup: $BACKUP_FILE"
log "========================================="
log "Backup completed successfully!"

exit 0
