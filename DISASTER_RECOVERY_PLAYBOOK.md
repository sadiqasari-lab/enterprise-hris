# Disaster Recovery Playbook

Emergency procedures for critical system failures.

---

## 🚨 Emergency Contacts

**On-Call Schedule:**
- **Primary:** DevOps Lead - +966-XXX-XXXX
- **Secondary:** Backend Lead - +966-XXX-XXXX
- **Escalation:** CTO - +966-XXX-XXXX

**Vendor Support:**
- **Hosting Provider:** support@provider.com / +966-XXX-XXXX
- **Database DBA:** dba@company.com / +966-XXX-XXXX

---

## ⚡ Severity Levels

### Severity 1 - CRITICAL (Response: Immediate)
- Complete system outage
- Data breach detected
- Database corruption
- Payroll data loss

### Severity 2 - HIGH (Response: <30 minutes)
- Partial system unavailable
- Performance severely degraded
- Authentication issues
- Backup failure

### Severity 3 - MEDIUM (Response: <2 hours)
- Non-critical feature unavailable
- Slow performance
- Integration issues

### Severity 4 - LOW (Response: Next business day)
- UI bugs
- Minor performance issues
- Documentation errors

---

## 🔥 Scenario 1: Complete System Outage

**Symptoms:** Website unreachable, API not responding

### Step 1: Initial Assessment (2 minutes)
```bash
# Check services
pm2 status
systemctl status postgresql
systemctl status redis-server
systemctl status nginx

# Check logs
pm2 logs hris-api --lines 50 --err
sudo tail -50 /var/log/nginx/error.log
```

### Step 2: Quick Recovery Attempts (5 minutes)

**If API down:**
```bash
pm2 restart hris-api
pm2 logs hris-api
```

**If Web down:**
```bash
pm2 restart hris-web
pm2 logs hris-web
```

**If Database down:**
```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql
# Check logs
sudo tail -50 /var/log/postgresql/postgresql-16-main.log
```

**If Nginx down:**
```bash
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

### Step 3: If Quick Recovery Fails (10 minutes)

**Check disk space:**
```bash
df -h
# If >95% full, emergency cleanup:
sudo journalctl --vacuum-time=1d
pm2 flush
find /tmp -type f -atime +7 -delete
```

**Check memory:**
```bash
free -h
# If OOM, restart services in order:
pm2 restart all
sudo systemctl restart postgresql
sudo systemctl restart redis-server
```

### Step 4: Restore from Backup (30 minutes)

**Last resort - restore entire system:**
```bash
# 1. Stop services
pm2 stop all
sudo systemctl stop nginx

# 2. Restore database
LATEST_BACKUP=$(ls -t /opt/backups/database/*.sql.gz | head -1)
./scripts/backup/restore-database.sh "$LATEST_BACKUP"

# 3. Restart services
pm2 start all
sudo systemctl start nginx

# 4. Verify
curl https://hris.your-company.com/api/health
```

### Step 5: Communication (Ongoing)

**Notify stakeholders:**
```
Subject: HRIS System Outage - [Status]

We are currently experiencing a system outage affecting the HRIS platform.

Status: Investigating / Restoring / Resolved
Impact: All users / Partial functionality
ETA: [Time]
Workaround: [If available]

We will provide updates every 30 minutes.
```

---

## 🛡️ Scenario 2: Data Breach Detected

**Symptoms:** Unauthorized access alerts, suspicious activity

### Immediate Actions (Within 5 minutes)

**1. Isolate the system:**
```bash
# Block all external traffic
sudo ufw deny 80
sudo ufw deny 443

# Keep SSH open for investigation
sudo ufw allow 22

# Stop API to prevent data access
pm2 stop hris-api
```

**2. Preserve evidence:**
```bash
# Capture current state
mkdir -p /var/log/incident/$(date +%Y%m%d_%H%M%S)
cd /var/log/incident/$(date +%Y%m%d_%H%M%S)

# Copy logs
cp /var/log/nginx/access.log ./
cp /var/log/nginx/error.log ./
pm2 logs --lines 1000 > pm2.log

# Database activity
psql -U hris_user -d hris_db -c "
  SELECT * FROM pg_stat_activity
" > db_activity.log

# Recent audit logs
psql -U hris_user -d hris_db -c "
  SELECT * FROM audit_logs
  WHERE created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
" > audit_logs.log
```

**3. Notify authorities (Saudi Arabia - PDPL):**
- **SDAIA (Saudi Data & AI Authority):** Within 72 hours
- **Legal Team:** Immediately
- **Insurance Provider:** Within 24 hours

**4. Change all credentials:**
```bash
# Generate new JWT secrets
openssl rand -base64 64 > jwt_secret.txt

# Update .env
nano .env
# Update JWT_SECRET and JWT_REFRESH_SECRET

# Force password reset for all users
psql -U hris_user -d hris_db -c "
  UPDATE users SET must_change_password = true
"
```

### Investigation (Within 24 hours)

**Analyze breach scope:**
```sql
-- Check recently accessed sensitive data
SELECT 
  user_id,
  resource_type,
  action,
  ip_address,
  created_at
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND resource_type IN ('payroll_cycle', 'salary_structure', 'employee')
ORDER BY created_at DESC;

-- Check unusual login patterns
SELECT 
  user_id,
  ip_address,
  COUNT(*) as login_count,
  MAX(created_at) as last_login
FROM audit_logs
WHERE action = 'LOGIN'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, ip_address
HAVING COUNT(*) > 50;  -- Suspicious high frequency
```

---

## 💾 Scenario 3: Database Corruption

**Symptoms:** Database errors, data inconsistencies

### Immediate Actions

**1. Assess damage:**
```bash
# Check database integrity
psql -U hris_user -d hris_db -c "
  SELECT schemaname, tablename 
  FROM pg_tables 
  WHERE schemaname = 'public'
" | while read schema table; do
  echo "Checking $table..."
  psql -U hris_user -d hris_db -c "SELECT COUNT(*) FROM $table" || echo "ERROR: $table corrupted"
done
```

**2. Attempt repair:**
```bash
# Reindex all tables
psql -U hris_user -d hris_db -c "REINDEX DATABASE hris_db"

# Vacuum full (reclaim space, rebuild)
psql -U hris_user -d hris_db -c "VACUUM FULL ANALYZE"
```

**3. If repair fails - restore from backup:**
```bash
# Find last known good backup
ls -lt /opt/backups/database/

# Test restore to temporary database first
createdb hris_test
gunzip -c /opt/backups/database/hris_backup_20260204_020000.sql.gz | \
  psql -U hris_user -d hris_test

# Verify test database
psql -U hris_user -d hris_test -c "SELECT COUNT(*) FROM employees"

# If good, restore to production
./scripts/backup/restore-database.sh /opt/backups/database/hris_backup_20260204_020000.sql.gz
```

---

## 🔐 Scenario 4: SSL Certificate Expired

**Symptoms:** HTTPS errors, browser warnings

### Quick Fix (5 minutes)

```bash
# Check certificate status
openssl x509 -enddate -noout -in /etc/letsencrypt/live/*/fullchain.pem

# Renew immediately
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx

# Verify
curl -I https://hris.your-company.com
```

---

## 🕐 Scenario 5: Payroll Data Loss (CRITICAL)

**This is a Severity 1 incident - payroll must be processed**

### Recovery Steps

**1. Restore from most recent backup:**
```bash
# Find backup before data loss
BACKUP_DATE="20260203_020000"  # Adjust as needed
./scripts/backup/restore-database.sh /opt/backups/database/hris_backup_$BACKUP_DATE.sql.gz
```

**2. Verify payroll data:**
```sql
-- Check payroll cycle exists
SELECT * FROM payroll_cycles WHERE period_start >= '2026-02-01';

-- Check payslips count
SELECT COUNT(*) FROM payslips WHERE payroll_cycle_id = 'cycle_id';

-- Verify amounts
SELECT 
  SUM(basic_salary) as total_basic,
  SUM(net_pay) as total_net,
  COUNT(*) as employee_count
FROM payslips
WHERE payroll_cycle_id = 'cycle_id';
```

**3. If data unrecoverable - manual recreation:**
```sql
-- Export employee salary data
\copy (
  SELECT 
    e.employee_number,
    e.first_name,
    e.last_name,
    ss.basic_salary,
    ss.housing_allowance,
    ss.transport_allowance
  FROM employees e
  JOIN salary_structures ss ON e.id = ss.employee_id
  WHERE ss.effective_to IS NULL
) TO '/tmp/payroll_data.csv' CSV HEADER;

-- HR must verify amounts manually before processing
```

**4. Emergency communication:**
```
Subject: URGENT - Payroll Processing Status

Due to a technical issue, payroll processing is delayed.

Current Status: [Investigating/Recovering/Processing]
Expected Resolution: [Date/Time]
Payment Date Impact: [Expected delay]

We are working with highest priority to resolve this.
Manual processing being prepared as backup plan.

Updates every hour until resolved.
```

---

## 📋 Recovery Checklist

After any major incident, complete this checklist:

### Immediate (Within 24 hours)
- [ ] System fully restored and operational
- [ ] All services health-checked
- [ ] Users notified of resolution
- [ ] Incident report drafted

### Short-term (Within 1 week)
- [ ] Root cause identified
- [ ] Permanent fix implemented
- [ ] Monitoring enhanced to detect similar issues
- [ ] Documentation updated

### Long-term (Within 1 month)
- [ ] Post-incident review conducted
- [ ] Process improvements implemented
- [ ] Team training completed
- [ ] Disaster recovery plan updated

---

## 📊 Post-Incident Report Template

```markdown
# Incident Report: [Brief Description]

**Date:** [Incident Date]
**Duration:** [Time from start to resolution]
**Severity:** [1-4]
**Affected Users:** [Number/All]

## Summary
[2-3 sentence summary of what happened]

## Timeline
- [HH:MM] - Issue detected
- [HH:MM] - Team notified
- [HH:MM] - Root cause identified
- [HH:MM] - Fix implemented
- [HH:MM] - System restored
- [HH:MM] - All-clear confirmed

## Root Cause
[Technical explanation of what caused the issue]

## Impact
- Users affected: [Number]
- Downtime: [Minutes/Hours]
- Data loss: [Yes/No - describe]
- Financial impact: [If applicable]

## Resolution
[What was done to fix the issue]

## Prevention
[What will be done to prevent recurrence]

## Action Items
1. [ ] [Action 1 - Owner - Due Date]
2. [ ] [Action 2 - Owner - Due Date]
3. [ ] [Action 3 - Owner - Due Date]

## Lessons Learned
[Key takeaways for the team]
```

---

## 🔄 Disaster Recovery Testing

**Schedule:** Quarterly (Every 3 months)

### Q1 Test: Database Restore
- Restore from 7-day-old backup
- Verify data integrity
- Measure recovery time
- Document any issues

### Q2 Test: System Failover
- Simulate complete server failure
- Deploy to backup server
- Test full functionality
- Update runbooks

### Q3 Test: Security Breach Response
- Simulated breach scenario
- Test isolation procedures
- Verify evidence collection
- Review notification process

### Q4 Test: Data Corruption
- Simulate table corruption
- Test repair procedures
- Verify backup restore
- Update documentation

---

## 📞 Escalation Path

**Level 1:** On-call engineer (Response: Immediate)
- System monitoring alerts
- User-reported issues
- Automated health check failures

**Level 2:** Technical Lead (Response: 15 minutes)
- Issues not resolved in 30 minutes
- Multiple system failures
- Performance degradation

**Level 3:** Engineering Manager (Response: 30 minutes)
- Issues not resolved in 1 hour
- Data integrity concerns
- Security incidents

**Level 4:** CTO (Response: 1 hour)
- Major data loss
- Security breach
- Extended outage (>2 hours)
- Legal/compliance issues

**Level 5:** CEO (Response: As needed)
- Company reputation at risk
- Major financial impact
- Regulatory involvement

---

## 💡 Prevention Tips

**Daily:**
- Monitor health-check.sh output
- Review error logs
- Check backup completion

**Weekly:**
- Test restore from backup
- Review security alerts
- Update dependency patches

**Monthly:**
- Disaster recovery drill
- Security audit
- Performance review

**Quarterly:**
- Full DR test
- Update runbooks
- Team training

---

**Remember:** In a crisis, stay calm, follow the playbook, communicate clearly, and document everything.
