# Deployment Verification Checklist

Use this checklist to verify your HRIS deployment is working correctly.

---

## Pre-Deployment Checklist

### Environment Configuration
- [ ] `.env` file created and configured
- [ ] Database URL is correct
- [ ] Redis URL is configured
- [ ] JWT secrets are set (minimum 32 characters)
- [ ] All required environment variables are present
- [ ] `NODE_ENV` is set to `production`

### Security
- [ ] Strong passwords set for database
- [ ] JWT secrets are randomly generated (not defaults)
- [ ] Redis password configured
- [ ] Firewall rules configured (ports 80, 443, 22 only)
- [ ] SSH key-based authentication enabled
- [ ] Root SSH login disabled
- [ ] Fail2Ban installed and configured

### SSL/TLS
- [ ] Domain DNS pointing to server IP
- [ ] Let's Encrypt certificate obtained
- [ ] Auto-renewal configured (`certbot renew --dry-run` succeeds)
- [ ] HTTPS redirect working
- [ ] Certificate valid for at least 60 days

---

## Post-Deployment Checklist

### Infrastructure Services

#### PostgreSQL
```bash
# Check status
sudo systemctl status postgresql

# Test connection
psql -U hris_user -h localhost -d hris_db -c "SELECT 1;"

# Verify database exists
psql -U hris_user -h localhost -l | grep hris_db
```
- [ ] PostgreSQL service is running
- [ ] Database connection successful
- [ ] Database `hris_db` exists
- [ ] User `hris_user` has correct permissions

#### Redis
```bash
# Check status
sudo systemctl status redis-server

# Test connection
redis-cli PING
# Should return: PONG
```
- [ ] Redis service is running
- [ ] Redis responding to PING
- [ ] Password authentication working (if configured)

#### Nginx
```bash
# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check if serving requests
curl -I http://localhost
curl -I https://your-domain.com
```
- [ ] Nginx service is running
- [ ] Configuration syntax is valid
- [ ] HTTP request returns 301 redirect
- [ ] HTTPS request returns 200 OK
- [ ] SSL certificate is valid

---

### Application Services

#### API Server
```bash
# Check PM2 status (VPS)
pm2 status

# Or Docker status
docker compose ps

# Test health endpoint
curl https://your-domain.com/api/health
```
- [ ] API process is running
- [ ] Health endpoint returns 200 OK
- [ ] No error logs in last 100 lines
- [ ] Process restart count is 0

#### Web Server (Next.js)
```bash
# Check PM2 status (VPS)
pm2 status

# Or Docker status
docker compose ps

# Test homepage
curl -I https://your-domain.com
```
- [ ] Web process is running
- [ ] Homepage returns 200 OK
- [ ] No error logs in last 100 lines
- [ ] CSS and JS assets loading correctly

---

### Database Migrations

```bash
# Check migration status
pnpx prisma migrate status --schema packages/database/schema.prisma

# Verify tables exist
psql -U hris_user -d hris_db -c "\dt"
```
- [ ] All migrations applied successfully
- [ ] No pending migrations
- [ ] All tables present in database
- [ ] Foreign keys created correctly

**Expected tables (26 total):**
- [ ] User
- [ ] Employee
- [ ] Department
- [ ] Company
- [ ] Location
- [ ] AttendanceRecord
- [ ] LeaveType
- [ ] LeaveBalance
- [ ] LeaveRequest
- [ ] Holiday
- [ ] PayrollCycle
- [ ] Payslip
- [ ] SalaryStructure
- [ ] Document
- [ ] SignatureEvent
- [ ] PerformanceCycle
- [ ] Goal
- [ ] Appraisal
- [ ] JobPosting
- [ ] Applicant
- [ ] Interview
- [ ] InterviewFeedback
- [ ] TrainingRecord
- [ ] Certification
- [ ] DisciplinaryIncident
- [ ] DisciplinaryAction
- [ ] Termination
- [ ] ExitChecklist
- [ ] AuditLog

---

### Database Seeding (Optional)

```bash
# Run seed script
pnpm --filter @hris/api seed
```
- [ ] Seed completed without errors
- [ ] Demo companies created (Al-Noor Holdings, TechStar LLC)
- [ ] Demo users created (4 users with different roles)
- [ ] Demo employees created
- [ ] Leave types initialized
- [ ] Sample data populated

---

### Functionality Tests

#### Authentication
Test login for each role:

**Super Admin**
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.com","password":"Admin123!"}'
```
- [ ] Returns 200 OK
- [ ] Returns `accessToken` and `refreshToken`
- [ ] Token contains correct user ID and roles

**HR Admin**
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr.admin@alnoor.com","password":"Hris2026!"}'
```
- [ ] Login successful
- [ ] Correct role returned

**Manager**
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager.eng@alnoor.com","password":"Hris2026!"}'
```
- [ ] Login successful
- [ ] Correct role returned

**Employee**
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@alnoor.com","password":"Hris2026!"}'
```
- [ ] Login successful
- [ ] Correct role returned

#### UI Access
Visit in browser:
- [ ] https://your-domain.com loads successfully
- [ ] Login page displays correctly
- [ ] Can login as HR Admin
- [ ] Dashboard loads with data
- [ ] Navigation works
- [ ] Charts render correctly
- [ ] Tables load data
- [ ] Forms can be submitted

#### API Endpoints
Test key endpoints:

```bash
# Get access token first
TOKEN=$(curl -s -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr.admin@alnoor.com","password":"Hris2026!"}' \
  | jq -r '.data.tokens.accessToken')

# Test employees endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/employees

# Test leave balances
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/leave/balances/my

# Test departments
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/employees/departments
```
- [ ] Employees endpoint returns data
- [ ] Leave balances endpoint returns data
- [ ] Departments endpoint returns data
- [ ] Responses are properly formatted JSON
- [ ] No 500 errors in any endpoint

---

### Performance Tests

#### Response Times
```bash
# API health check
time curl -s https://your-domain.com/api/health > /dev/null

# Homepage load
time curl -s https://your-domain.com > /dev/null
```
- [ ] API health responds in < 200ms
- [ ] Homepage loads in < 1.5s
- [ ] No timeout errors

#### Load Test (Optional)
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 https://your-domain.com/api/health
```
- [ ] All requests successful (100%)
- [ ] No failed requests
- [ ] Average response time < 500ms

---

### Security Tests

#### SSL/TLS
```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check SSL Labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```
- [ ] Certificate is valid
- [ ] Certificate chain is complete
- [ ] TLS 1.2+ supported
- [ ] Strong cipher suites enabled
- [ ] SSL Labs rating A or A+

#### Security Headers
```bash
curl -I https://your-domain.com
```
Expected headers:
- [ ] `Strict-Transport-Security` present
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Referrer-Policy` set
- [ ] Server version hidden (`Server: nginx`)

#### Rate Limiting
```bash
# Test auth rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST https://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n" \
    -s > /dev/null
  sleep 0.1
done
```
- [ ] First 5 requests return 401
- [ ] Subsequent requests return 429 (Too Many Requests)
- [ ] Rate limit resets after 1 minute

---

### Backup & Recovery

#### Automated Backups
```bash
# Check cron job exists
crontab -l | grep backup

# Check backup directory
ls -lh /opt/backups/database/
```
- [ ] Cron job scheduled for daily backups
- [ ] Backup directory exists
- [ ] At least one backup file present
- [ ] Backup file is not empty

#### Test Restore
```bash
# Create test backup
pg_dump -U hris_user hris_db > /tmp/test_backup.sql

# Restore to test database
createdb test_hris_db
psql -U hris_user test_hris_db < /tmp/test_backup.sql

# Verify tables exist
psql -U hris_user test_hris_db -c "\dt"

# Cleanup
dropdb test_hris_db
```
- [ ] Backup created successfully
- [ ] Restore completed without errors
- [ ] All tables present in restored database
- [ ] Data integrity verified

---

### Monitoring & Logs

#### Application Logs
```bash
# PM2 logs (VPS)
pm2 logs hris-api --lines 100
pm2 logs hris-web --lines 100

# Docker logs
docker compose logs -f --tail=100 api
docker compose logs -f --tail=100 web
```
- [ ] No ERROR level logs
- [ ] No stack traces
- [ ] No database connection errors
- [ ] No Redis connection errors

#### System Logs
```bash
# Nginx access logs
sudo tail -100 /var/log/nginx/access.log

# Nginx error logs
sudo tail -100 /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -100 /var/log/postgresql/postgresql-16-main.log
```
- [ ] No 5xx errors in Nginx access log
- [ ] No errors in Nginx error log
- [ ] No critical errors in PostgreSQL log

#### Resource Usage
```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top -bn1 | head -20
```
- [ ] Disk usage < 80%
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%
- [ ] No swap usage

---

### CI/CD Verification

#### GitHub Actions
- [ ] Workflow file exists (`.github/workflows/ci-cd.yml`)
- [ ] GitHub secrets configured:
  - [ ] `DOCKERHUB_USER`
  - [ ] `DOCKERHUB_PASS`
  - [ ] `VPS_HOST`
  - [ ] `VPS_USER`
  - [ ] `VPS_SSH_KEY`
- [ ] Test push triggers workflow
- [ ] All jobs complete successfully
- [ ] Deployment succeeds

---

## Final Verification

### End-to-End User Flow

**Employee Portal**
1. [ ] Login as employee
2. [ ] View attendance records
3. [ ] Check-in (if within allowed time/location)
4. [ ] View leave balances
5. [ ] Submit leave request
6. [ ] View payslips
7. [ ] View and sign documents
8. [ ] Logout

**Manager Dashboard**
1. [ ] Login as manager
2. [ ] View team roster
3. [ ] Review pending leave requests
4. [ ] Approve/reject leave
5. [ ] View team attendance
6. [ ] Logout

**HR Admin Portal**
1. [ ] Login as HR admin
2. [ ] View dashboard with KPIs
3. [ ] Create new employee
4. [ ] Initialize leave balances
5. [ ] Create payroll cycle
6. [ ] Submit payroll for review
7. [ ] View recruitment pipeline
8. [ ] Logout

**GM Dashboard**
1. [ ] Login as GM
2. [ ] View pending payroll
3. [ ] Approve payroll
4. [ ] Verify payslips generated
5. [ ] Logout

### Documentation
- [ ] README.md is up to date
- [ ] DEPLOYMENT_GUIDE.md matches actual setup
- [ ] Environment variables documented in `.env.example`
- [ ] API endpoints documented
- [ ] User guides available (if applicable)

---

## Post-Launch Checklist

### Week 1
- [ ] Monitor error logs daily
- [ ] Check backup completion daily
- [ ] Review user feedback
- [ ] Monitor performance metrics
- [ ] Check disk space usage

### Week 2
- [ ] Review security logs
- [ ] Test backup restore process
- [ ] Update documentation if needed
- [ ] Check SSL certificate expiry
- [ ] Review API usage patterns

### Month 1
- [ ] Conduct security audit
- [ ] Review and update dependencies
- [ ] Optimize slow queries
- [ ] Archive old logs
- [ ] Update disaster recovery plan

---

## Troubleshooting

If any checks fail, refer to:
- **DEPLOYMENT_GUIDE.md** - Detailed setup instructions
- **QUICK_REFERENCE.md** - Common commands and solutions
- **README.md** - General documentation
- **GitHub Issues** - Known issues and solutions

---

## Sign-Off

**Deployment Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

**Status**: ☐ Ready for Production  ☐ Issues Found (see notes)

**Notes**:
```
[Add any notes about issues found or deviations from checklist]
```

---

**Congratulations!** 🎉

If all checks pass, your Enterprise HRIS Platform is production-ready.
