# Security Hardening Guide

Comprehensive security hardening for Enterprise HRIS Platform.

---

## Security Layers

```
┌─────────────────────────────────────┐
│  Network Security (Firewall, SSL)   │
├─────────────────────────────────────┤
│  Application Security (JWT, RBAC)   │
├─────────────────────────────────────┤
│  Database Security (Encryption, RLS)│
├─────────────────────────────────────┤
│  Infrastructure (OS, Services)       │
└─────────────────────────────────────┘
```

---

## 1. Server Hardening

### Initial Server Setup

```bash
#!/bin/bash
# /opt/scripts/harden-server.sh

echo "=== Starting Server Hardening ==="

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser --disabled-password --gecos "" hrisadmin
usermod -aG sudo hrisadmin

# Configure SSH
cat >> /etc/ssh/sshd_config << 'SSHCONFIG'
# Disable root login
PermitRootLogin no

# Disable password authentication
PasswordAuthentication no
PubkeyAuthentication yes

# Change default port (optional)
Port 2222

# Disable empty passwords
PermitEmptyPasswords no

# Use protocol 2 only
Protocol 2

# Limit authentication attempts
MaxAuthTries 3
MaxSessions 2

# Disconnect idle sessions
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable X11 forwarding
X11Forwarding no

# Log more information
LogLevel VERBOSE
SSHCONFIG

# Restart SSH
systemctl restart sshd

# Configure firewall (UFW)
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (on custom port if changed)
ufw allow 2222/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Rate limit SSH
ufw limit 2222/tcp

# Enable firewall
ufw --force enable

echo "✓ Server hardening complete"
```

### Disable Unnecessary Services

```bash
# List running services
systemctl list-units --type=service --state=running

# Disable unnecessary services
systemctl disable bluetooth.service
systemctl disable cups.service
systemctl disable avahi-daemon.service

# Stop and mask to prevent restart
systemctl stop bluetooth.service
systemctl mask bluetooth.service
```

### Kernel Hardening (sysctl)

```bash
# /etc/sysctl.d/99-hris-hardening.conf

# IP Forwarding
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Ignore source routed packets
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_all = 1

# Log Martian packets
net.ipv4.conf.all.log_martians = 1

# Enable TCP SYN cookies (DDoS protection)
net.ipv4.tcp_syncookies = 1

# Disable IPv6 if not needed
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1

# Apply settings
sysctl -p /etc/sysctl.d/99-hris-hardening.conf
```

---

## 2. Application Security

### Environment Variables Protection

```bash
# Set proper permissions on .env
chmod 600 /opt/hris/.env
chown hrisadmin:hrisadmin /opt/hris/.env

# Verify no secrets in version control
cd /opt/hris
git ls-files | xargs grep -l "JWT_SECRET\|DATABASE_URL\|REDIS_URL" || echo "✓ No secrets found"

# Use secret management service (recommended)
# AWS Secrets Manager, HashiCorp Vault, etc.
```

### JWT Security Best Practices

```typescript
// apps/api/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate strong secret
export function generateJWTSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

// Secure JWT configuration
export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET!,
    expiresIn: '15m', // Short-lived
    algorithm: 'HS256' as const
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET!, // Different secret!
    expiresIn: '7d',
    algorithm: 'HS256' as const
  }
};

// Sign with additional claims
export function signToken(payload: any, type: 'access' | 'refresh') {
  const config = type === 'access' ? jwtConfig.accessToken : jwtConfig.refreshToken;
  
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomBytes(16).toString('hex') // JWT ID for revocation
    },
    config.secret,
    {
      expiresIn: config.expiresIn,
      algorithm: config.algorithm,
      issuer: 'hris.your-company.com',
      audience: 'hris-api'
    }
  );
}

// Verify with strict options
export function verifyToken(token: string, type: 'access' | 'refresh') {
  const config = type === 'access' ? jwtConfig.accessToken : jwtConfig.refreshToken;
  
  return jwt.verify(token, config.secret, {
    algorithms: [config.algorithm],
    issuer: 'hris.your-company.com',
    audience: 'hris-api',
    clockTolerance: 30 // 30 seconds
  });
}
```

### Password Security

```typescript
// apps/api/src/utils/password.ts
import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';

const BCRYPT_ROUNDS = 12; // Adjust based on performance requirements

// Strong password policy
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  // Check length
  if (password.length < 12) {
    return {
      valid: false,
      score: 0,
      feedback: ['Password must be at least 12 characters']
    };
  }
  
  // Check complexity
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      valid: false,
      score: 1,
      feedback: ['Password must contain uppercase, lowercase, number, and special character']
    };
  }
  
  // Use zxcvbn for advanced checking
  const result = zxcvbn(password);
  
  return {
    valid: result.score >= 3, // 0-4 scale
    score: result.score,
    feedback: result.feedback.suggestions
  };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Verify with timing-safe comparison
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Check if password needs rehashing (if bcrypt rounds changed)
export function needsRehash(hash: string): boolean {
  const rounds = parseInt(hash.split('$')[2]);
  return rounds < BCRYPT_ROUNDS;
}
```

### Rate Limiting Enhancement

```typescript
// apps/api/src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Sliding window rate limiting
export const strictAuthLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  
  // Skip rate limiting for whitelisted IPs
  skip: (req) => {
    const whitelist = (process.env.RATE_LIMIT_WHITELIST || '').split(',');
    return whitelist.includes(req.ip);
  },
  
  // Custom key generator (by email + IP)
  keyGenerator: (req) => {
    return `${req.body.email || 'unknown'}:${req.ip}`;
  },
  
  // Custom handler
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Progressive delay (first failures are fast, later ones delayed)
export const progressiveDelayLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:progressive:'
  }),
  windowMs: 15 * 60 * 1000,
  max: async (req) => {
    // Allow more attempts, but with increasing delays
    return 10;
  },
  skipSuccessfulRequests: true,
  
  handler: async (req, res, next) => {
    const attempts = req.rateLimit.current;
    const delay = Math.min(attempts * 1000, 10000); // Max 10s delay
    
    await new Promise(resolve => setTimeout(resolve, delay));
    next();
  }
});
```

### Input Validation & Sanitization

```typescript
// apps/api/src/middleware/validation.ts
import { z } from 'zod';
import validator from 'validator';

// Strict email validation
export const emailSchema = z.string()
  .email()
  .max(255)
  .refine(email => validator.isEmail(email), 'Invalid email format');

// Phone number (Saudi format)
export const phoneSchema = z.string()
  .regex(/^\+966[0-9]{9}$/, 'Phone must be +966XXXXXXXXX');

// Employee number (alphanumeric, max 20 chars)
export const employeeNumberSchema = z.string()
  .regex(/^[A-Z0-9]{1,20}$/, 'Employee number must be alphanumeric');

// Sanitize user input
export function sanitizeInput(input: string): string {
  return validator.escape(
    validator.trim(input)
  );
}

// Prevent SQL injection (Prisma does this automatically, but for raw queries)
export function sanitizeForSQL(input: string): string {
  return input.replace(/[;\-\-]/g, '');
}

// Prevent XSS in stored data
export function sanitizeForXSS(html: string): string {
  const DOMPurify = require('isomorphic-dompurify');
  return DOMPurify.sanitize(html);
}
```

### CORS Configuration

```typescript
// apps/api/src/middleware/cors.ts
import cors from 'cors';

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://hris.your-company.com',
      'https://www.hris.your-company.com'
    ];
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};
```

---

## 3. Database Security

### PostgreSQL Hardening

```sql
-- /opt/scripts/harden-database.sql

-- Create restricted user for application
CREATE USER hris_app WITH PASSWORD 'STRONG_PASSWORD_HERE';

-- Grant only necessary privileges
GRANT CONNECT ON DATABASE hris_db TO hris_app;
GRANT USAGE ON SCHEMA public TO hris_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hris_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hris_app;

-- Revoke dangerous privileges
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE hris_db FROM PUBLIC;

-- Enable row-level security on sensitive tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (company isolation)
CREATE POLICY employee_company_isolation ON employees
  FOR ALL
  USING (company_id = current_setting('app.current_company_id')::uuid);

CREATE POLICY salary_company_isolation ON salary_structures
  FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = current_setting('app.current_company_id')::uuid
    )
  );

-- Audit logging
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function for audit
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_trail(table_name, operation, old_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_setting('app.current_user_id', true)::uuid);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_trail(table_name, operation, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user_id', true)::uuid);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_trail(table_name, operation, new_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_setting('app.current_user_id', true)::uuid);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_salary
  AFTER INSERT OR UPDATE OR DELETE ON salary_structures
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

**PostgreSQL Configuration (`postgresql.conf`):**

```ini
# /etc/postgresql/16/main/postgresql.conf

# Connection Security
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'
ssl_prefer_server_ciphers = on
ssl_min_protocol_version = 'TLSv1.2'

# Password encryption
password_encryption = scram-sha-256

# Logging
log_connections = on
log_disconnections = on
log_duration = off
log_line_prefix = '%t [%p]: user=%u,db=%d,app=%a,client=%h '
log_statement = 'ddl'  # Log schema changes
log_min_duration_statement = 1000  # Log slow queries (>1s)

# Disable superuser remote access
listen_addresses = 'localhost'
```

**pg_hba.conf:**

```
# /etc/postgresql/16/main/pg_hba.conf

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     scram-sha-256

# IPv4 local connections
host    hris_db         hris_app        127.0.0.1/32            scram-sha-256
host    hris_db         hris_user       127.0.0.1/32            scram-sha-256

# Deny all other connections
host    all             all             0.0.0.0/0               reject
```

### Data Encryption at Rest

```bash
# Enable PostgreSQL data encryption (requires LUKS)
# Create encrypted volume
cryptsetup luksFormat /dev/sdb
cryptsetup open /dev/sdb pgdata_encrypted

# Create filesystem
mkfs.ext4 /dev/mapper/pgdata_encrypted

# Mount and move PostgreSQL data
mount /dev/mapper/pgdata_encrypted /mnt/pgdata
rsync -av /var/lib/postgresql/ /mnt/pgdata/
mv /var/lib/postgresql /var/lib/postgresql.old
ln -s /mnt/pgdata /var/lib/postgresql

# Add to /etc/crypttab for auto-unlock on boot
echo "pgdata_encrypted /dev/sdb none" >> /etc/crypttab
```

---

## 4. Network Security

### Nginx Security Headers

```nginx
# /etc/nginx/sites-available/hris

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';" always;
add_header Permissions-Policy "geolocation=(self), microphone=(), camera=()" always;

# Hide Nginx version
server_tokens off;

# Disable vulnerable HTTP methods
if ($request_method !~ ^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$) {
    return 405;
}

# Block common attack patterns
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

location ~ ~$ {
    deny all;
    access_log off;
    log_not_found off;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

location /api/auth/ {
    limit_req zone=auth_limit burst=10 nodelay;
    # ... rest of config
}

location /api/ {
    limit_req zone=api_limit burst=50 nodelay;
    # ... rest of config
}

# DDoS protection
client_body_timeout 10s;
client_header_timeout 10s;
send_timeout 10s;
client_max_body_size 50M;
```

### SSL/TLS Best Practices

```bash
# Generate strong DH parameters
openssl dhparam -out /etc/nginx/dhparam.pem 4096
```

```nginx
# Nginx SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
ssl_dhparam /etc/nginx/dhparam.pem;

# SSL session caching
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

### Fail2Ban Configuration

```ini
# /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = security@your-company.com
sender = fail2ban@your-company.com
action = %(action_mwl)s

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 60
bantime = 3600

[hris-api-auth]
enabled = true
filter = hris-api-auth
port = http,https
logpath = /var/log/hris/api.log
maxretry = 5
findtime = 600
bantime = 3600
```

**Custom filter for API auth:**
```ini
# /etc/fail2ban/filter.d/hris-api-auth.conf

[Definition]
failregex = ^.*"POST \/api\/auth\/login.*" 401.*$
ignoreregex =
```

---

## 5. Security Monitoring

### Intrusion Detection (AIDE)

```bash
# Install AIDE
apt install aide -y

# Initialize database
aideinit

# Move database
mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Run check
aide --check

# Schedule daily checks
cat > /etc/cron.daily/aide-check << 'AIDECRON'
#!/bin/bash
aide --check | mail -s "AIDE Report $(hostname)" security@your-company.com
AIDECRON

chmod +x /etc/cron.daily/aide-check
```

### Security Scanning

```bash
# Install scanning tools
apt install lynis rkhunter chkrootkit -y

# Run Lynis security audit
lynis audit system

# Run rootkit detection
rkhunter --check
chkrootkit

# Schedule weekly scans
cat > /etc/cron.weekly/security-scan << 'SCANCRON'
#!/bin/bash
echo "=== Lynis Security Audit ===" > /tmp/security-report.txt
lynis audit system >> /tmp/security-report.txt 2>&1

echo "=== Rootkit Check ===" >> /tmp/security-report.txt
rkhunter --check --skip-keypress >> /tmp/security-report.txt 2>&1

mail -s "Weekly Security Scan $(hostname)" security@your-company.com < /tmp/security-report.txt
SCANCRON

chmod +x /etc/cron.weekly/security-scan
```

---

## 6. Application-Level Security

### CSRF Protection

```typescript
// apps/api/src/middleware/csrf.ts
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// In server.ts
app.use(cookieParser());
app.use(csrfProtection);

// Add CSRF token to responses
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

### Content Security Policy

```typescript
// apps/api/src/middleware/csp.ts
import helmet from 'helmet';

export const cspMiddleware = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  }
});
```

### File Upload Security

```typescript
// apps/api/src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: '/opt/hris/uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Whitelist file types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Virus scanning (ClamAV)
import { NodeClam } from 'clamscan';

const clamscan = new NodeClam().init({
  removeInfected: true,
  quarantineInfected: '/opt/hris/quarantine/',
  scanLog: '/var/log/hris/virus-scan.log'
});

export async function scanFile(filePath: string): Promise<boolean> {
  const { isInfected } = await clamscan.isInfected(filePath);
  return !isInfected;
}
```

---

## 7. Security Checklist

### Pre-Production

- [ ] All secrets in environment variables (not code)
- [ ] Strong JWT secrets (64+ random bytes)
- [ ] HTTPS enforced (no HTTP)
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma + parameterized queries)
- [ ] XSS prevention (React escaping + sanitization)
- [ ] CSRF protection enabled
- [ ] File upload restrictions
- [ ] Password policy enforced (12+ chars, complexity)
- [ ] bcrypt with 12+ rounds
- [ ] Database RLS enabled for multi-tenancy
- [ ] Audit logging for sensitive operations
- [ ] Firewall configured (only necessary ports)
- [ ] SSH hardened (no root, key-only auth)
- [ ] Fail2Ban configured
- [ ] Automatic security updates enabled
- [ ] Intrusion detection (AIDE) configured
- [ ] Regular vulnerability scans scheduled
- [ ] Backup encryption enabled
- [ ] Database encryption at rest
- [ ] SSL/TLS certificates valid
- [ ] Error messages don't leak information
- [ ] Development dependencies excluded from production
- [ ] Unused dependencies removed
- [ ] Security contact email published
- [ ] Security incident response plan documented

### Post-Production

- [ ] Regular security audits (quarterly)
- [ ] Penetration testing (annually)
- [ ] Dependency updates (monthly)
- [ ] SSL certificate renewal (automated)
- [ ] Log review (weekly)
- [ ] Access review (quarterly)
- [ ] Backup restore tests (monthly)
- [ ] Disaster recovery drills (semi-annually)
- [ ] Security training for team (annually)
- [ ] Compliance audit (annually)

---

## 8. Incident Response

### Security Breach Response

1. **Contain:**
   ```bash
   # Immediately block suspicious IP
   ufw deny from <IP_ADDRESS>
   
   # Isolate affected servers
   systemctl stop hris-api
   systemctl stop nginx
   ```

2. **Investigate:**
   ```bash
   # Check logs
   grep <IP_ADDRESS> /var/log/nginx/access.log
   grep "Failed" /var/log/auth.log
   cat /var/log/hris/api.log | grep -i "error\|unauthorized"
   
   # Check for unauthorized access
   last -f /var/log/wtmp
   lastb -f /var/log/btmp
   ```

3. **Eradicate:**
   - Change all passwords
   - Rotate JWT secrets
   - Revoke compromised tokens
   - Patch vulnerabilities
   - Update firewall rules

4. **Recover:**
   - Restore from clean backup if necessary
   - Rebuild compromised systems
   - Verify data integrity

5. **Document:**
   - Timeline of events
   - Actions taken
   - Lessons learned
   - Preventive measures

---

## Support

**Security Concerns:**
- Email: security@your-company.com
- PGP Key: [Public Key Link]
- Response Time: 24 hours

**Responsible Disclosure:**
We appreciate security researchers who responsibly disclose vulnerabilities.
