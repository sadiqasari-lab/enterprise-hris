# Disaster Recovery Plan

Comprehensive disaster recovery and business continuity plan for Enterprise HRIS Platform.

---

## Recovery Objectives

### RTO (Recovery Time Objective)
**Target: 4 hours** - Maximum acceptable downtime

### RPO (Recovery Point Objective)
**Target: 24 hours** - Maximum acceptable data loss (from last backup)

---

## Disaster Scenarios

### 1. Database Server Failure

**Impact:** Complete data unavailability
**Probability:** Low
**Detection:** Health check fails, database connection errors
**Recovery Time:** 2-4 hours

### 2. Application Server Failure

**Impact:** API/Web unavailable
**Probability:** Medium
**Detection:** Health check fails, 502/503 errors
**Recovery Time:** 1-2 hours

### 3. Data Corruption

**Impact:** Inconsistent or lost data
**Probability:** Very Low
**Detection:** Data validation errors, user reports
**Recovery Time:** 4-8 hours

### 4. Ransomware Attack

**Impact:** Encrypted files, data held hostage
**Probability:** Low
**Detection:** File encryption, ransom note
**Recovery Time:** 8-24 hours

### 5. Regional Outage (Data Center)

**Impact:** Complete service unavailability
**Probability:** Very Low
**Detection:** All health checks fail
**Recovery Time:** 4-8 hours (if geo-redundant)

---

## Backup Strategy

### Database Backups

**Daily Full Backup:**
```bash
#!/bin/bash
# /opt/backups/backup-db.sh

BACKUP_DIR="/opt/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hris_db_${TIMESTAMP}.sql.gz"

# Create backup
pg_dump -U hris_user -h localhost hris_db | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Verify backup
if [ $? -eq 0 ]; then
    echo "✓ Backup successful: ${BACKUP_FILE}"
    
    # Test restore to verify integrity
    gunzip -c "${BACKUP_DIR}/${BACKUP_FILE}" | head -n 100 > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ Backup verified"
    else
        echo "✗ Backup verification failed!"
        exit 1
    fi
else
    echo "✗ Backup failed!"
    exit 1
fi

# Upload to S3 (or other cloud storage)
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://hris-backups/database/${BACKUP_FILE}"

# Delete local backups older than 7 days
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +7 -delete

# Delete S3 backups older than 90 days
aws s3 ls s3://hris-backups/database/ | while read -r line; do
    createDate=$(echo $line|awk {'print $1" "$2'})
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "90 days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line|awk {'print $4'})
        if [[ $fileName != "" ]]; then
            aws s3 rm s3://hris-backups/database/$fileName
        fi
    fi
done
```

**Schedule:**
```bash
# crontab -e
0 2 * * * /opt/backups/backup-db.sh >> /var/log/backups/db-backup.log 2>&1
```

**Incremental Backups (Optional):**
```bash
# WAL archiving for point-in-time recovery
# In postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /opt/backups/wal/%f && cp %p /opt/backups/wal/%f'
```

### File System Backups

**Application Files:**
```bash
#!/bin/bash
# /opt/backups/backup-files.sh

BACKUP_DIR="/opt/backups/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hris_files_${TIMESTAMP}.tar.gz"

# Backup uploads and configs
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
    /opt/hris/uploads \
    /opt/hris/.env \
    /etc/nginx/sites-available/hris \
    /opt/hris/ecosystem.config.js

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://hris-backups/files/${BACKUP_FILE}"

# Cleanup old backups
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete
```

**Schedule:**
```bash
# Daily at 3 AM
0 3 * * * /opt/backups/backup-files.sh >> /var/log/backups/file-backup.log 2>&1
```

### Configuration Backups

**Automated Config Backup:**
```bash
#!/bin/bash
# /opt/backups/backup-configs.sh

BACKUP_DIR="/opt/backups/configs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "${BACKUP_DIR}/${TIMESTAMP}"

# Backup all configs
cp /opt/hris/.env "${BACKUP_DIR}/${TIMESTAMP}/"
cp /etc/nginx/sites-available/hris "${BACKUP_DIR}/${TIMESTAMP}/"
cp /etc/postgresql/16/main/postgresql.conf "${BACKUP_DIR}/${TIMESTAMP}/"
cp /etc/redis/redis.conf "${BACKUP_DIR}/${TIMESTAMP}/"
cp /opt/hris/ecosystem.config.js "${BACKUP_DIR}/${TIMESTAMP}/"

# Create archive
tar -czf "${BACKUP_DIR}/configs_${TIMESTAMP}.tar.gz" -C "${BACKUP_DIR}" "${TIMESTAMP}"
rm -rf "${BACKUP_DIR}/${TIMESTAMP}"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/configs_${TIMESTAMP}.tar.gz" "s3://hris-backups/configs/"

# Keep only last 30 days locally
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
```

### Backup Verification

**Monthly Restore Test:**
```bash
#!/bin/bash
# /opt/backups/test-restore.sh

echo "=== Starting Backup Restore Test ==="

# Download latest backup from S3
LATEST_BACKUP=$(aws s3 ls s3://hris-backups/database/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp "s3://hris-backups/database/${LATEST_BACKUP}" /tmp/

# Create test database
psql -U postgres -c "DROP DATABASE IF EXISTS hris_test_restore;"
psql -U postgres -c "CREATE DATABASE hris_test_restore;"

# Restore backup
gunzip -c "/tmp/${LATEST_BACKUP}" | psql -U postgres -d hris_test_restore

# Verify table count
TABLE_COUNT=$(psql -U postgres -d hris_test_restore -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ $TABLE_COUNT -eq 26 ]; then
    echo "✓ Restore test successful! Found ${TABLE_COUNT} tables."
else
    echo "✗ Restore test FAILED! Expected 26 tables, found ${TABLE_COUNT}."
    exit 1
fi

# Verify employee count (sanity check)
EMP_COUNT=$(psql -U postgres -d hris_test_restore -t -c "SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL;")
echo "✓ Found ${EMP_COUNT} active employees."

# Cleanup
psql -U postgres -c "DROP DATABASE hris_test_restore;"
rm "/tmp/${LATEST_BACKUP}"

echo "=== Restore Test Complete ==="
```

**Schedule:**
```bash
# First Sunday of every month at 4 AM
0 4 1-7 * * [ $(date +\%u) -eq 7 ] && /opt/backups/test-restore.sh >> /var/log/backups/restore-test.log 2>&1
```

---

## Recovery Procedures

### Scenario 1: Database Corruption

**Detection:**
```
ERROR: invalid page in block 1234 of relation "employees"
```

**Recovery Steps:**

1. **Assess Damage:**
```bash
# Check database logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Try to connect
psql -U hris_user -d hris_db

# Check specific table
psql -U hris_user -d hris_db -c "SELECT COUNT(*) FROM employees;"
```

2. **Stop Application:**
```bash
pm2 stop hris-api
pm2 stop hris-web

# Or Docker:
docker compose -f deploy/docker-compose.yml stop api web
```

3. **Download Latest Backup:**
```bash
# List available backups
aws s3 ls s3://hris-backups/database/ | tail -5

# Download latest (or specific date)
aws s3 cp s3://hris-backups/database/hris_db_20260204_020000.sql.gz /tmp/
```

4. **Restore Database:**
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE hris_db;"
psql -U postgres -c "CREATE DATABASE hris_db OWNER hris_user;"

# Restore from backup
gunzip -c /tmp/hris_db_20260204_020000.sql.gz | psql -U postgres -d hris_db

# Verify
psql -U hris_user -d hris_db -c "SELECT COUNT(*) FROM employees;"
```

5. **Migrate to Latest Schema:**
```bash
cd /opt/hris
pnpm --filter @hris/database prisma migrate deploy
```

6. **Restart Application:**
```bash
pm2 start hris-api
pm2 start hris-web

# Verify health
curl http://localhost:3001/api/health
```

7. **Post-Recovery:**
```bash
# Check for data loss
# Compare employee count, recent records, etc.

# Document incident
# When did it occur?
# What was the cause?
# How much data was lost?
# Preventive measures?
```

**Estimated Downtime:** 2-4 hours  
**Data Loss:** Up to 24 hours (since last backup)

---

### Scenario 2: Application Server Failure

**Detection:**
```
502 Bad Gateway
Connection refused to localhost:3001
```

**Recovery Steps:**

1. **Check Server Status:**
```bash
# PM2
pm2 list
pm2 logs hris-api --err --lines 50

# Docker
docker compose ps
docker compose logs api --tail=50
```

2. **Restart Application:**
```bash
# PM2
pm2 restart hris-api
pm2 restart hris-web

# Docker
docker compose restart api web
```

3. **If Restart Fails - Rebuild:**
```bash
# PM2
cd /opt/hris
git pull origin main
pnpm install
pnpm build
pm2 restart all

# Docker
docker compose down
docker compose up -d --build
```

4. **If Server Hardware Failed - Deploy to New Server:**
```bash
# On new server:
# 1. Install dependencies (Node, PostgreSQL, etc.)
# 2. Clone repository
# 3. Restore database from backup
# 4. Copy .env file
# 5. Install and build
# 6. Start services
# 7. Update DNS/Load Balancer
```

**Estimated Downtime:** 1-2 hours (restart) or 4-8 hours (new server)

---

### Scenario 3: Ransomware Attack

**Detection:**
```
Files encrypted with .locked extension
Ransom note in /opt/hris/README_DECRYPT.txt
```

**Immediate Actions:**

1. **Isolate Affected Systems:**
```bash
# Disconnect from network
sudo ifconfig eth0 down

# Stop all services
pm2 stop all
sudo systemctl stop postgresql
sudo systemctl stop nginx
```

2. **Assess Damage:**
```bash
# Check for encrypted files
find /opt/hris -name "*.locked" -o -name "*.encrypted"

# Check database accessibility
psql -U hris_user -d hris_db -c "SELECT 1;"
```

3. **DO NOT PAY RANSOM**

4. **Restore from Backups:**
```bash
# Wipe infected server (or provision new one)
# Install fresh OS
# Restore from backups following standard procedure
# Change ALL passwords
# Update firewall rules
# Install security patches
```

5. **Security Hardening:**
```bash
# Update all packages
sudo apt update && sudo apt upgrade -y

# Enable firewall
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Disable unnecessary services
# Review and restrict user permissions
# Enable 2FA for all admin accounts
```

6. **Post-Incident:**
```bash
# Forensic analysis
# Identify entry point
# Report to authorities if needed
# Update security policies
# Employee security training
```

**Estimated Downtime:** 8-24 hours  
**Data Loss:** Depends on backup frequency

---

### Scenario 4: Complete Data Center Outage

**Detection:**
```
All services unreachable
Hosting provider confirms outage
```

**Recovery Steps (Assuming Geo-Redundant Setup):**

1. **Activate Disaster Recovery Site:**
```bash
# Update DNS to point to DR site
# AWS Route53 example:
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://failover.json
```

2. **Verify DR Site:**
```bash
# Check all services running
curl https://dr.hris.your-company.com/api/health

# Verify database
psql -h dr-db.example.com -U hris_user -d hris_db

# Test critical workflows
# - Login
# - Check-in
# - Leave request
```

3. **Communicate:**
```
# Email all users
Subject: Service Restored - Using Backup Site

We've experienced an outage at our primary data center.
Services have been restored via our disaster recovery site.

All data is current as of [LAST_SYNC_TIME].
No action required from you.

Status page: https://status.hris.your-company.com
```

4. **When Primary Restored:**
```bash
# Sync data from DR to primary
pg_dump -h dr-db.example.com -U hris_user hris_db | \
  psql -h primary-db.example.com -U hris_user hris_db

# Switch DNS back to primary
# Verify everything works
# Keep DR site ready
```

**Estimated Downtime:** 30 minutes - 2 hours (with geo-redundancy)  
**Data Loss:** Minimal (depends on replication lag)

---

## Disaster Recovery Checklist

### Preparation (Do Now)

- [ ] Automated daily backups configured
- [ ] Backups stored off-site (S3, Azure, etc.)
- [ ] Monthly restore tests scheduled
- [ ] Recovery procedures documented and tested
- [ ] Contact list updated (on-call, vendors, executives)
- [ ] Disaster recovery site identified (if applicable)
- [ ] Data replication configured (if geo-redundant)
- [ ] Monitoring and alerting active
- [ ] Incident response team trained
- [ ] Security hardening complete

### During Disaster

- [ ] Assess situation and severity
- [ ] Activate incident response team
- [ ] Communicate with stakeholders
- [ ] Execute recovery procedure
- [ ] Document all actions taken
- [ ] Track recovery progress
- [ ] Verify data integrity post-recovery
- [ ] Conduct user acceptance testing
- [ ] Gradual rollout if needed

### After Recovery

- [ ] Post-mortem meeting scheduled
- [ ] Root cause analysis completed
- [ ] Lessons learned documented
- [ ] Recovery procedures updated
- [ ] Preventive measures implemented
- [ ] Team debrief and recognition
- [ ] Stakeholder communication
- [ ] Insurance claim (if applicable)

---

## Contact Information

### Escalation Chain

**Level 1 - DevOps Team**
- Email: devops@your-company.com
- Phone: +966-xxx-xxxx (24/7)
- Slack: #devops-oncall

**Level 2 - Engineering Manager**
- Email: eng-manager@your-company.com
- Phone: +966-yyy-yyyy
- Availability: Business hours

**Level 3 - CTO**
- Email: cto@your-company.com
- Phone: +966-zzz-zzzz
- For: Critical outages, data breaches

### External Vendors

**Hosting Provider**
- Company: [Provider Name]
- Support: +1-xxx-xxx-xxxx
- Portal: https://support.provider.com
- Account ID: XXXX-YYYY-ZZZZ

**Database Consultant**
- Name: [Consultant Name]
- Email: consultant@example.com
- Phone: +966-aaa-aaaa
- Hourly Rate: [Rate]

**Security Firm**
- Company: [Security Firm]
- Hotline: +1-bbb-bbb-bbbb
- For: Security incidents, forensics

---

## Testing Schedule

**Monthly:**
- Database restore test
- Backup integrity verification
- Recovery procedure walkthrough (tabletop)

**Quarterly:**
- Full DR site activation test
- Geo-replication failover test
- Security vulnerability scan

**Annually:**
- Full disaster recovery drill
- Update disaster recovery plan
- Review and update contact information
- Train new team members

---

## Version History

| Version | Date       | Changes                    | Author    |
|---------|------------|----------------------------|-----------|
| 1.0     | 2026-02-04 | Initial disaster recovery plan | DevOps Team |

---

**Remember:** The best disaster recovery plan is one that's tested regularly!

**Next Review Date:** 2026-08-04
