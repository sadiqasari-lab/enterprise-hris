# Troubleshooting Guide

Common issues and solutions for the Enterprise HRIS Platform.

---

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Attendance Problems](#attendance-problems)
3. [Leave Management](#leave-management)
4. [Payroll Issues](#payroll-issues)
5. [Document Upload/Signature](#document-uploadsignature)
6. [Performance Issues](#performance-issues)
7. [Database Problems](#database-problems)
8. [Deployment Issues](#deployment-issues)

---

## Authentication Issues

### Problem: "Invalid credentials" error on login

**Symptoms:**
- User receives 401 error
- Password is definitely correct

**Possible Causes & Solutions:**

1. **Account locked after multiple failed attempts**
   ```bash
   # Check failed login attempts in logs
   grep "Failed login" /var/log/hris/api.log
   
   # Unlock user account in database
   psql -U hris_user -d hris_db
   UPDATE users SET login_attempts = 0 WHERE email = 'user@email.com';
   ```

2. **Account status is INACTIVE**
   ```sql
   SELECT email, status FROM users WHERE email = 'user@email.com';
   -- If status is not 'ACTIVE', update it
   UPDATE users SET status = 'ACTIVE' WHERE email = 'user@email.com';
   ```

3. **Email case sensitivity**
   ```javascript
   // Emails are stored lowercase
   // Ensure login attempt uses lowercase
   ```

---

### Problem: "Token expired" immediately after login

**Symptoms:**
- Login succeeds
- Next request fails with 401
- Token appears valid but server rejects it

**Solution:**

1. **Check system clock synchronization**
   ```bash
   # Ensure server time is correct
   timedatectl status
   
   # If wrong, sync with NTP
   sudo timedatectl set-ntp on
   sudo systemctl restart systemd-timesyncd
   ```

2. **Verify JWT secret consistency**
   ```bash
   # Check .env file
   grep JWT_SECRET .env
   
   # Ensure it hasn't changed since last restart
   # If changed, restart API server
   pm2 restart hris-api
   ```

---

### Problem: Refresh token not working

**Symptoms:**
- Access token expires
- Refresh request returns 401

**Solution:**

1. **Check Redis connection**
   ```bash
   # Test Redis
   redis-cli PING
   # Should return PONG
   
   # Check if refresh tokens are stored
   redis-cli KEYS "refresh:*"
   ```

2. **Verify refresh token hasn't been used**
   - Refresh tokens are one-time use
   - After successful refresh, old token is invalidated
   - Client must store and use new refresh token

---

## Attendance Problems

### Problem: GPS check-in fails with "Location not verified"

**Symptoms:**
- Employee is at office
- GPS shows correct location
- System rejects check-in

**Solutions:**

1. **Check office location coordinates**
   ```sql
   SELECT id, name, latitude, longitude, radius 
   FROM locations 
   WHERE id = 'loc_main_office';
   ```

2. **Verify GPS accuracy**
   - GPS accuracy should be <100m
   - If user is on VPN, GPS might be inaccurate
   - Ask user to disable VPN temporarily

3. **Increase location radius temporarily**
   ```sql
   UPDATE locations 
   SET radius = 200  -- Temporarily increase from 100m to 200m
   WHERE id = 'loc_main_office';
   ```

---

### Problem: "Already checked in" error when employee hasn't checked in

**Symptoms:**
- Employee tries to check in
- System says already checked in
- No check-in record in UI

**Solution:**

```sql
-- Find stuck attendance record
SELECT id, employee_id, check_in_time, check_out_time, created_at
FROM attendance_records
WHERE employee_id = 'emp_123'
  AND date = CURRENT_DATE
  AND check_out_time IS NULL;

-- If found, manually check them out
UPDATE attendance_records
SET check_out_time = NOW(),
    total_hours = EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 3600
WHERE id = 'att_stuck_id';
```

---

### Problem: WiFi verification failing despite being on office network

**Symptoms:**
- User connected to office WiFi
- SSID matches exactly
- Still rejected

**Cause:** WiFi SSID case sensitivity or special characters

**Solution:**

1. **Check registered SSID**
   ```sql
   SELECT ssid FROM locations WHERE id = 'loc_main_office';
   ```

2. **Update if needed**
   ```sql
   UPDATE locations 
   SET allowed_wifi_ssids = '["Company-5G", "Company-2.4G"]'
   WHERE id = 'loc_main_office';
   ```

3. **Temporarily disable WiFi check**
   ```javascript
   // In attendance validation config
   REQUIRE_WIFI_VALIDATION: false
   ```

---

## Leave Management

### Problem: Leave balance shows incorrect amount

**Symptoms:**
- Employee has 25 days but system shows 10
- Balance doesn't match manual calculation

**Solutions:**

1. **Recalculate balance**
   ```sql
   -- Check current balance
   SELECT lb.*, lt.days_per_year
   FROM leave_balances lb
   JOIN leave_types lt ON lb.leave_type_id = lt.id
   WHERE lb.employee_id = 'emp_123' AND lb.year = 2026;
   
   -- Check approved leave requests
   SELECT SUM(working_days) as total_used
   FROM leave_requests
   WHERE employee_id = 'emp_123'
     AND status = 'APPROVED'
     AND EXTRACT(YEAR FROM start_date) = 2026
     AND leave_type_id = 'lt_annual';
   
   -- Manually correct if needed
   UPDATE leave_balances
   SET used_days = 5,  -- From query above
       remaining_days = 25  -- 30 - 5
   WHERE employee_id = 'emp_123' 
     AND year = 2026
     AND leave_type_id = 'lt_annual';
   ```

2. **Check for cancelled requests not restored**
   ```sql
   SELECT * FROM leave_requests
   WHERE employee_id = 'emp_123'
     AND status = 'CANCELLED'
     AND balance_restored = false;
   
   -- Restore balance manually
   UPDATE leave_balances
   SET used_days = used_days - 5,
       remaining_days = remaining_days + 5
   WHERE employee_id = 'emp_123' AND year = 2026;
   
   UPDATE leave_requests
   SET balance_restored = true
   WHERE id = 'req_cancelled';
   ```

---

### Problem: Leave request rejected with "Overlapping request"

**Symptoms:**
- No visible overlapping leave in UI
- Request gets rejected

**Solution:**

```sql
-- Find overlapping requests
SELECT * FROM leave_requests
WHERE employee_id = 'emp_123'
  AND status IN ('PENDING', 'APPROVED')
  AND (
    (start_date <= '2026-03-14' AND end_date >= '2026-03-10')
  );

-- If found and shouldn't overlap (e.g., already cancelled)
UPDATE leave_requests
SET status = 'CANCELLED'
WHERE id = 'overlapping_req_id';
```

---

### Problem: Working days calculation incorrect

**Symptoms:**
- 5-day leave shows as 7 working days
- Weekend days counted

**Cause:** Public holidays or weekend configuration issue

**Solution:**

```sql
-- Check company working days configuration
SELECT settings->>'workingDays' 
FROM companies 
WHERE id = 'cmp_1';

-- Should return: ["SUN","MON","TUE","WED","THU"]

-- Check holidays table
SELECT * FROM holidays
WHERE date BETWEEN '2026-03-10' AND '2026-03-14'
  AND company_id = 'cmp_1';
```

---

## Payroll Issues

### Problem: Payslip amount doesn't match expected

**Symptoms:**
- Employee reports incorrect net pay
- Calculation seems off

**Debugging Steps:**

```sql
-- Get payslip breakdown
SELECT 
  ps.id,
  ps.basic_salary,
  ps.housing_allowance,
  ps.transport_allowance,
  ps.other_allowances,
  ps.total_earnings,
  ps.gosi_employee_contribution,
  ps.other_deductions,
  ps.total_deductions,
  ps.net_pay,
  pc.period_start,
  pc.period_end
FROM payslips ps
JOIN payroll_cycles pc ON ps.payroll_cycle_id = pc.id
WHERE ps.employee_id = 'emp_123'
ORDER BY pc.period_start DESC
LIMIT 1;

-- Check salary structure was active during period
SELECT * FROM salary_structures
WHERE employee_id = 'emp_123'
  AND effective_from <= '2026-02-01'
  AND (effective_to IS NULL OR effective_to >= '2026-02-28');

-- Check attendance deductions
SELECT 
  COUNT(*) FILTER (WHERE status = 'ABSENT') as absent_days,
  COUNT(*) FILTER (WHERE status = 'PRESENT') as present_days,
  COUNT(*) FILTER (WHERE status = 'LATE') as late_days
FROM attendance_records
WHERE employee_id = 'emp_123'
  AND date BETWEEN '2026-02-01' AND '2026-02-28';
```

**Common Issues:**

1. **GOSI incorrect** - Should be 9.75% of basic salary
   ```javascript
   gosiDeduction = basicSalary * 0.0975
   ```

2. **Prorated salary for new hire** - Check hire date
   ```javascript
   // If hired mid-month, salary should be prorated
   totalDaysInMonth = 28 (or 29, 30, 31)
   daysWorked = totalDaysInMonth - dayOfHire + 1
   proratedSalary = basicSalary * (daysWorked / totalDaysInMonth)
   ```

3. **Missing allowances**
   ```sql
   -- Verify salary structure includes all allowances
   SELECT * FROM salary_structures
   WHERE employee_id = 'emp_123'
     AND effective_from <= CURRENT_DATE
   ORDER BY effective_from DESC
   LIMIT 1;
   ```

---

### Problem: Payroll cycle stuck in "PENDING_REVIEW"

**Symptoms:**
- HR Admin approved but status didn't change
- Can't move to GM approval

**Solution:**

```sql
-- Check cycle status
SELECT * FROM payroll_cycles WHERE id = 'cyc_123';

-- Manually advance if workflow stuck
UPDATE payroll_cycles
SET status = 'PENDING_GM_APPROVAL',
    reviewed_by = 'user_hr_admin',
    reviewed_at = NOW()
WHERE id = 'cyc_123';
```

---

## Document Upload/Signature

### Problem: File upload fails with "File too large"

**Solutions:**

1. **Check Nginx upload limit**
   ```nginx
   # In /etc/nginx/sites-available/hris
   client_max_body_size 50M;  # Increase if needed
   ```

2. **Restart Nginx**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Check disk space**
   ```bash
   df -h /opt/hris/uploads
   # If >90% full, clean old files or expand disk
   ```

---

### Problem: Digital signature not capturing

**Symptoms:**
- Signature pad shows but doesn't record strokes
- Submit button disabled

**Browser Console Check:**
```javascript
// Check for JavaScript errors
// Common issue: Canvas API not supported

// Verify signature data is being captured
localStorage.getItem('signature_temp')
```

**Solutions:**

1. **Clear browser cache**
2. **Try different browser** (Chrome/Edge recommended)
3. **Disable browser extensions** temporarily
4. **Check for CORS errors** in console

---

## Performance Issues

### Problem: Dashboard loads very slowly (>5 seconds)

**Debugging:**

1. **Check database query performance**
   ```sql
   -- Enable query timing
   \timing on
   
   -- Run slow query
   EXPLAIN ANALYZE
   SELECT * FROM employees WHERE company_id = 'cmp_1';
   
   -- Look for sequential scans (bad), want index scans (good)
   ```

2. **Check missing indexes**
   ```sql
   -- Add index if missing
   CREATE INDEX idx_employees_company_id ON employees(company_id);
   CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
   CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
   ```

3. **Check Redis cache**
   ```bash
   redis-cli INFO stats
   # Look at keyspace_hits vs keyspace_misses
   # High misses = cache not working
   ```

---

### Problem: API response time > 1 second

**Solutions:**

1. **Enable query logging**
   ```javascript
   // In .env
   DEBUG=prisma:query
   ```

2. **Check database connection pool**
   ```javascript
   // In prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     // Add connection pooling
     connection_limit = 20
   }
   ```

3. **Add pagination**
   ```javascript
   // Never query all records
   // Always use take/skip
   const employees = await prisma.employee.findMany({
     take: 20,
     skip: page * 20
   });
   ```

---

## Database Problems

### Problem: "Too many connections" error

**Symptoms:**
```
Error: Prisma has reached max connection limit
```

**Solution:**

```bash
# Check current connections
psql -U hris_user -d hris_db -c "
  SELECT count(*) 
  FROM pg_stat_activity 
  WHERE datname = 'hris_db';
"

# Increase max connections in postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf
# Find and change:
max_connections = 200  # Increase from default 100

# Restart PostgreSQL
sudo systemctl restart postgresql

# Also update Prisma pool size
# In DATABASE_URL add: ?connection_limit=20
```

---

### Problem: Database locks causing timeouts

**Symptoms:**
- Requests hang then timeout
- Multiple employees trying to check in simultaneously

**Solution:**

```sql
-- Find locked queries
SELECT 
  pid, 
  state, 
  query, 
  wait_event
FROM pg_stat_activity
WHERE wait_event IS NOT NULL;

-- Kill problematic query
SELECT pg_terminate_backend(pid)
WHERE pid = <pid_from_above>;

-- Prevent future locks - use SELECT FOR UPDATE with NOWAIT
-- In code:
const employee = await prisma.employee.findUnique({
  where: { id },
  // Add lock hint if supported
});
```

---

## Deployment Issues

### Problem: Docker containers won't start

**Check logs:**
```bash
docker compose -f deploy/docker-compose.yml logs api
docker compose -f deploy/docker-compose.yml logs web
```

**Common Issues:**

1. **Database not ready**
   ```yaml
   # Ensure depends_on with condition
   api:
     depends_on:
       postgres:
         condition: service_healthy
   ```

2. **Environment variables missing**
   ```bash
   # Check .env file exists
   ls -la deploy/.env
   
   # Verify all required vars present
   grep -E "DATABASE_URL|JWT_SECRET|REDIS_URL" deploy/.env
   ```

3. **Port conflicts**
   ```bash
   # Check if ports already in use
   sudo lsof -i :3000
   sudo lsof -i :3001
   sudo lsof -i :5432
   
   # Kill conflicting process or change ports
   ```

---

### Problem: Nginx 502 Bad Gateway

**Causes & Solutions:**

1. **API server not running**
   ```bash
   pm2 status hris-api
   # If stopped
   pm2 restart hris-api
   ```

2. **Wrong upstream address**
   ```nginx
   # Check nginx config
   upstream api {
       server 127.0.0.1:3001;  # Ensure correct port
   }
   ```

3. **SELinux blocking connection** (if on RHEL/CentOS)
   ```bash
   sudo setsebool -P httpd_can_network_connect 1
   ```

---

### Problem: SSL certificate expired

**Symptoms:**
- Browser shows "Certificate expired"
- Let's Encrypt not auto-renewing

**Solution:**

```bash
# Check certificate expiry
sudo certbot certificates

# Renew manually
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run

# Check renewal cron/timer
sudo systemctl status certbot.timer

# Force renewal
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

---

## Getting More Help

### Enable Debug Logging

```bash
# API server
export DEBUG=* NODE_ENV=development
pm2 restart hris-api

# View logs
pm2 logs hris-api --lines 200
```

### Collect System Info

```bash
# Create debug report
cat > /tmp/hris-debug.txt << DEBUG
=== System Info ===
$(uname -a)
$(node --version)
$(npm --version)
$(docker --version)

=== Service Status ===
$(pm2 status)
$(sudo systemctl status postgresql | head -20)
$(sudo systemctl status nginx | head -20)

=== Database Stats ===
$(psql -U hris_user -d hris_db -c "SELECT count(*) FROM employees;")
$(psql -U hris_user -d hris_db -c "SELECT version();")

=== Disk Space ===
$(df -h)

=== Memory ===
$(free -h)

=== Recent Errors ===
$(pm2 logs hris-api --err --lines 50)
DEBUG

# Send to support
cat /tmp/hris-debug.txt
```

### Contact Support

- **Email**: support@your-company.com
- **GitHub Issues**: https://github.com/your-org/enterprise-hris/issues
- **Emergency Hotline**: +966-xxx-xxxx

---

**Pro Tip:** Most issues are solved by checking logs first:
```bash
# The debugging trinity
pm2 logs hris-api
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u postgresql -f
```
