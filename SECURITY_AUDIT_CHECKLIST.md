# Security Audit Checklist

Comprehensive security audit for Enterprise HRIS Platform.

---

## 1. Authentication & Authorization

### Password Security
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] Minimum password length enforced (8 characters)
- [ ] Password complexity requirements active
- [ ] Password change forces new unique password
- [ ] Failed login attempts tracked and locked after 5 attempts
- [ ] Account lockout duration: 30 minutes minimum

**Verification:**
```sql
SELECT 
  email,
  login_attempts,
  locked_until
FROM users
WHERE login_attempts >= 5;
```

### JWT Tokens
- [ ] Access token expiry: ≤ 15 minutes
- [ ] Refresh token expiry: ≤ 7 days
- [ ] JWT secrets are 32+ characters
- [ ] Secrets stored in environment variables (not code)
- [ ] Token rotation on refresh
- [ ] Revoked tokens stored in Redis blacklist

**Test:**
```bash
# Verify token expiry
curl -H "Authorization: Bearer OLD_TOKEN" http://localhost:3001/api/auth/profile
# Should return 401 after expiry
```

### Role-Based Access Control (RBAC)
- [ ] All API routes protected with `authenticate` middleware
- [ ] Role checks implemented for sensitive operations
- [ ] Least privilege principle applied
- [ ] No hardcoded admin credentials in code
- [ ] Separation of duties enforced (e.g., HR vs GM payroll approval)

**Audit:**
```bash
# Find unprotected routes
grep -r "router\\..*(" apps/api/src/modules/ | grep -v "authenticate"
```

---

## 2. Network Security

### TLS/SSL
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] TLS 1.2 or higher only
- [ ] Strong cipher suites configured
- [ ] SSL certificate valid and not expiring soon (<30 days)
- [ ] Certificate auto-renewal configured

**Check Certificate:**
```bash
openssl s_client -connect hris.your-company.com:443 -servername hris.your-company.com | openssl x509 -noout -dates
```

### Firewall & Network
- [ ] UFW/firewall active
- [ ] Only ports 80, 443, 22 open externally
- [ ] Database port 5432 not exposed to internet
- [ ] Redis port 6379 not exposed to internet
- [ ] SSH limited to key-based authentication
- [ ] Root SSH login disabled

**Verify:**
```bash
sudo ufw status
sudo nmap -p- localhost
```

### Rate Limiting
- [ ] Login endpoint: 5 req/s maximum
- [ ] General API: 30 req/s per IP
- [ ] Rate limits return 429 status
- [ ] Rate limit headers included in responses

**Test:**
```bash
# Trigger rate limit
for i in {1..10}; do curl -X POST http://localhost:3001/api/auth/login -d '{"email":"test","password":"test"}'; done
```

---

## 3. Data Protection

### Database Security
- [ ] Database credentials not in version control
- [ ] Strong database password (16+ chars, mixed case, symbols)
- [ ] Database user has minimum necessary privileges
- [ ] PostgreSQL configured for local connections only
- [ ] Database backups encrypted
- [ ] Backup files have restricted permissions (600)

**Check Permissions:**
```bash
ls -la /opt/backups/database/
# Should show: -rw------- (600)
```

### Encryption at Rest
- [ ] Uploaded documents stored with restricted permissions
- [ ] Sensitive fields encrypted in database (optional)
- [ ] Backup files encrypted (GPG or similar)
- [ ] Environment variables not logged

### Encryption in Transit
- [ ] All API communication over HTTPS
- [ ] Database connections use SSL (optional for localhost)
- [ ] Redis connections use TLS (optional for localhost)
- [ ] No sensitive data in URL parameters

---

## 4. Input Validation & Injection Prevention

### SQL Injection
- [ ] All database queries use parameterized statements (Prisma ORM)
- [ ] No raw SQL with string concatenation
- [ ] User input sanitized before database operations

**Review:**
```bash
# Search for potential SQL injection
grep -r "prisma\\\$queryRaw" apps/api/src/
# Ensure all use parameterized queries
```

### XSS Prevention
- [ ] React's default XSS protection used
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Content Security Policy headers configured
- [ ] User input escaped in templates

**CSP Header:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### Command Injection
- [ ] No shell commands executed with user input
- [ ] File uploads validated by type and size
- [ ] Uploaded files stored outside web root
- [ ] File extensions validated

**File Upload Validation:**
```typescript
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

---

## 5. Session Management

### Session Security
- [ ] Sessions stored in Redis (not memory)
- [ ] Session timeout: 15 minutes inactivity
- [ ] Logout invalidates session
- [ ] Concurrent session limit enforced (optional)
- [ ] Session ID regenerated on login

**Verify Redis Sessions:**
```bash
redis-cli KEYS "session:*" | wc -l
```

### Cookie Security
- [ ] Cookies have `HttpOnly` flag
- [ ] Cookies have `Secure` flag (HTTPS only)
- [ ] Cookies have `SameSite=Strict` or `Lax`
- [ ] Session cookies expire with browser close

---

## 6. API Security

### Security Headers
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Strict-Transport-Security` (HSTS) with 1 year max-age
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Server header doesn't leak version info

**Test:**
```bash
curl -I https://hris.your-company.com | grep -E "X-|Strict"
```

### CORS Configuration
- [ ] CORS restricted to known origins only
- [ ] Credentials allowed only for trusted origins
- [ ] Preflight requests handled correctly

**CORS Config:**
```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
};
```

### Request Size Limits
- [ ] Request body size limited (50MB for uploads)
- [ ] JSON payload size limited (1MB)
- [ ] Timeout configured (30s read, 10s connect)

---

## 7. Logging & Monitoring

### Security Event Logging
- [ ] All authentication attempts logged
- [ ] Failed login attempts logged with IP
- [ ] Admin actions logged (user creation, role changes)
- [ ] Sensitive operations logged (payroll approval, document signature)
- [ ] Logs include: timestamp, user ID, IP address, action

**Audit Log Review:**
```sql
SELECT * FROM audit_logs
WHERE action IN ('LOGIN_FAILED', 'PASSWORD_CHANGED', 'ROLE_UPDATED')
ORDER BY created_at DESC
LIMIT 100;
```

### Log Protection
- [ ] Logs don't contain passwords or tokens
- [ ] Log files have restricted permissions (640)
- [ ] Logs rotated regularly
- [ ] Old logs archived or deleted (90 days retention)

**Check Log Permissions:**
```bash
ls -la /var/log/hris/
# Should show: -rw-r----- (640)
```

### Monitoring & Alerts
- [ ] Failed login threshold alerts (10+ in 1 hour)
- [ ] Database backup failure alerts
- [ ] Disk space alerts (>80% usage)
- [ ] SSL certificate expiry alerts (30 days before)
- [ ] Service downtime alerts

---

## 8. Third-Party Dependencies

### Dependency Security
- [ ] All npm packages up to date
- [ ] Known vulnerabilities patched
- [ ] `npm audit` shows 0 high/critical issues
- [ ] Lock file committed (pnpm-lock.yaml)
- [ ] Unused dependencies removed

**Audit:**
```bash
cd apps/api
pnpm audit
pnpm outdated
```

### Supply Chain Security
- [ ] Dependencies from trusted sources only
- [ ] Package integrity verified (checksums)
- [ ] No suspicious recently-added dependencies

---

## 9. Incident Response

### Breach Detection
- [ ] Monitoring for unusual login patterns
- [ ] Database query anomaly detection
- [ ] Failed API request spike detection
- [ ] Unusual data export volume alerts

### Incident Response Plan
- [ ] Security incident contact list maintained
- [ ] Data breach notification procedure documented
- [ ] Backup restore procedure tested (quarterly)
- [ ] Post-incident review process defined

---

## 10. Compliance

### Data Privacy (GDPR/PDPL)
- [ ] User consent tracked for data collection
- [ ] Data retention policy implemented (10 years employees)
- [ ] Soft-delete preserves audit trail
- [ ] User data export functionality available
- [ ] Right to erasure process documented

### Saudi PDPL Compliance
- [ ] Personal data processing documented
- [ ] Data controller identified
- [ ] Cross-border data transfer restrictions respected
- [ ] Data breach notification to SDAIA within 72 hours

### Audit Trail
- [ ] All data modifications logged
- [ ] Audit logs immutable (append-only)
- [ ] Logs retained for 3 years minimum
- [ ] Compliance reports generated quarterly

---

## Security Audit Schedule

### Daily
- [ ] Review failed login attempts
- [ ] Check service health
- [ ] Monitor error logs

### Weekly
- [ ] Review audit logs for anomalies
- [ ] Check SSL certificate expiry
- [ ] Verify backup completion

### Monthly
- [ ] Run `pnpm audit` on dependencies
- [ ] Review user access rights
- [ ] Test backup restore procedure
- [ ] Update security documentation

### Quarterly
- [ ] Full security audit using this checklist
- [ ] Penetration testing (external)
- [ ] Review and update security policies
- [ ] Security training for developers

### Annually
- [ ] Third-party security assessment
- [ ] Disaster recovery drill
- [ ] Update incident response plan
- [ ] Review insurance coverage

---

## Audit Sign-Off

**Audit Date:** ____________________

**Auditor:** ____________________

**Findings Summary:**
```
Critical Issues: ___
High Priority: ___
Medium Priority: ___
Low Priority: ___
```

**Overall Security Rating:** ☐ Excellent  ☐ Good  ☐ Needs Improvement  ☐ Critical

**Next Audit Due:** ____________________

**Signature:** ____________________
