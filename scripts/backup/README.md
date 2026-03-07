# Backup & Restore Scripts

Automated database backup and restore tools for production use.

## Backup Script

### Setup

1. **Make executable:**
   ```bash
   chmod +x scripts/backup/backup-database.sh
   ```

2. **Configure environment:**
   ```bash
   export PGPASSWORD="your-db-password"
   export DB_NAME="hris_db"
   export DB_USER="hris_user"
   export BACKUP_DIR="/opt/backups/database"
   export RETENTION_DAYS="30"
   ```

3. **Test backup:**
   ```bash
   ./scripts/backup/backup-database.sh
   ```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/hris && PGPASSWORD=yourpass ./scripts/backup/backup-database.sh >> /var/log/hris/backup.log 2>&1
```

### S3 Upload (Optional)

```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS credentials
aws configure

# Set S3 bucket in environment
export S3_BUCKET="s3://your-bucket/hris-backups"

# Backup will automatically upload to S3
./scripts/backup/backup-database.sh
```

## Restore Script

### Usage

```bash
# List available backups
./scripts/backup/restore-database.sh

# Restore from specific backup
./scripts/backup/restore-database.sh /opt/backups/database/hris_backup_20260204_020000.sql.gz
```

### Safety Features

- Creates pre-restore backup automatically
- Requires explicit confirmation
- Verifies backup integrity before restore
- Shows row count after restore

## Backup Strategy

### Daily Backups
- Retention: 30 days
- Schedule: 2 AM daily
- Location: `/opt/backups/database/`

### Weekly Full Backups
- Retention: 90 days
- Upload to S3 for off-site storage

### Before Major Changes
- Always create manual backup:
  ```bash
  ./scripts/backup/backup-database.sh
  ```

## Monitoring

Check backup logs:
```bash
tail -f /opt/backups/database/backup.log
```

Check disk space:
```bash
du -sh /opt/backups/database/
df -h /opt/backups
```

## Recovery Scenarios

### Scenario 1: Data Corruption
```bash
# Restore from last night's backup
./scripts/backup/restore-database.sh /opt/backups/database/hris_backup_20260204_020000.sql.gz
```

### Scenario 2: Accidental Deletion
```bash
# Restore specific table from backup
gunzip -c /opt/backups/database/hris_backup_20260204_020000.sql.gz | \
  grep "CREATE TABLE employees" -A 1000 | \
  psql -U hris_user -d hris_db
```

### Scenario 3: Disaster Recovery
```bash
# 1. Setup new server
# 2. Install PostgreSQL
# 3. Download backup from S3
aws s3 cp s3://your-bucket/hris-backups/hris_backup_20260204_020000.sql.gz .

# 4. Restore
./scripts/backup/restore-database.sh hris_backup_20260204_020000.sql.gz
```

## Best Practices

1. **Test restores regularly** (monthly)
2. **Monitor backup sizes** - sudden changes indicate issues
3. **Keep 3-2-1 rule**: 3 copies, 2 different media, 1 offsite
4. **Document restore procedures**
5. **Alert on backup failures**

## Troubleshooting

### Backup fails with "disk full"
```bash
# Check disk space
df -h /opt/backups

# Clean old backups manually
find /opt/backups/database -name "*.sql.gz" -mtime +30 -delete

# Or expand disk
```

### Restore fails with "database in use"
```bash
# Force disconnect all users
sudo systemctl stop hris-api
sudo systemctl stop hris-web

# Try restore again
./scripts/backup/restore-database.sh backup.sql.gz

# Restart services
sudo systemctl start hris-api
sudo systemctl start hris-web
```

### Backup file corrupted
```bash
# Verify integrity
gunzip -t backup.sql.gz

# If corrupted, use previous day's backup
./scripts/backup/restore-database.sh /opt/backups/database/hris_backup_20260203_020000.sql.gz
```
