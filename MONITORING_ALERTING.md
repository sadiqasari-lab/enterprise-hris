# Monitoring & Alerting Setup

Comprehensive monitoring and alerting strategy for Enterprise HRIS Platform.

---

## Monitoring Stack

### Recommended Tools

1. **Application Monitoring**: PM2 + Prometheus
2. **Database Monitoring**: pgAdmin + pg_stat_statements
3. **Log Aggregation**: Loki or ELK Stack
4. **Uptime Monitoring**: UptimeRobot or Pingdom
5. **Error Tracking**: Sentry
6. **Dashboards**: Grafana

---

## 1. Application Monitoring with PM2

### PM2 Monitoring Commands

```bash
# Real-time monitoring
pm2 monit

# List processes with stats
pm2 list

# Detailed info
pm2 show hris-api

# Monitor logs
pm2 logs hris-api --lines 100

# Resource usage
pm2 describe hris-api
```

### PM2 Plus (Cloud Monitoring)

```bash
# Link PM2 to cloud dashboard
pm2 link <secret_key> <public_key>

# Features:
# - Real-time metrics
# - Exception tracking
# - Custom metrics
# - Alerting
# - Log streaming
```

### Custom Metrics in Code

```typescript
// apps/api/src/utils/metrics.ts
import pmx from '@pm2/io';

// Custom metric: Active users
const activeUsers = pmx.metric({
  name: 'Active Users',
  value: 0
});

export function incrementActiveUsers() {
  activeUsers.set(activeUsers.val() + 1);
}

export function decrementActiveUsers() {
  activeUsers.set(Math.max(0, activeUsers.val() - 1));
}

// Custom metric: Check-ins per minute
const checkInsPerMinute = pmx.counter({
  name: 'Check-ins/min'
});

export function recordCheckIn() {
  checkInsPerMinute.inc();
}

// Response time tracking
const responseTimeHistogram = pmx.histogram({
  name: 'API Response Time',
  measurement: 'mean'
});

export function recordResponseTime(duration: number) {
  responseTimeHistogram.update(duration);
}
```

**Usage in middleware:**
```typescript
// apps/api/src/middleware/metrics.middleware.ts
import { recordResponseTime } from '../utils/metrics';

export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    recordResponseTime(duration);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`SLOW: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
}
```

---

## 2. Database Monitoring

### Enable PostgreSQL Statistics

```sql
-- In postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
pg_stat_statements.max = 10000

-- Restart PostgreSQL
sudo systemctl restart postgresql

-- Create extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Query Performance Monitoring

```sql
-- Top 10 slowest queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Queries with most calls
SELECT 
  query,
  calls,
  mean_exec_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

### Connection Monitoring

```sql
-- Active connections
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE datname = 'hris_db';

-- Connection count by state
SELECT 
  state,
  COUNT(*) as count
FROM pg_stat_activity
WHERE datname = 'hris_db'
GROUP BY state;

-- Long-running queries (>5 seconds)
SELECT 
  pid,
  now() - query_start as duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < now() - interval '5 seconds'
ORDER BY duration DESC;
```

### Database Size Monitoring

```sql
-- Database size
SELECT 
  pg_size_pretty(pg_database_size('hris_db')) as size;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 3. Redis Monitoring

### Redis CLI Monitoring

```bash
# Real-time monitoring
redis-cli MONITOR

# Server stats
redis-cli INFO

# Memory usage
redis-cli INFO memory

# Keyspace statistics
redis-cli INFO keyspace

# Slow log (queries >10ms)
redis-cli SLOWLOG GET 10

# Client connections
redis-cli CLIENT LIST
```

### Redis Metrics to Track

```bash
# Memory usage
redis-cli INFO | grep used_memory_human

# Connected clients
redis-cli INFO | grep connected_clients

# Operations per second
redis-cli INFO | grep instantaneous_ops_per_sec

# Hit rate
redis-cli INFO | grep keyspace_hits
redis-cli INFO | grep keyspace_misses
```

---

## 4. Log Aggregation

### Centralized Logging with Loki

**Install Loki & Promtail:**
```bash
# Download Loki
wget https://github.com/grafana/loki/releases/download/v2.9.0/loki-linux-amd64.zip
unzip loki-linux-amd64.zip
sudo mv loki-linux-amd64 /usr/local/bin/loki

# Download Promtail
wget https://github.com/grafana/loki/releases/download/v2.9.0/promtail-linux-amd64.zip
unzip promtail-linux-amd64.zip
sudo mv promtail-linux-amd64 /usr/local/bin/promtail
```

**Loki Config (`/etc/loki/config.yml`):**
```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /var/lib/loki/index
  filesystem:
    directory: /var/lib/loki/chunks
```

**Promtail Config (`/etc/promtail/config.yml`):**
```yaml
server:
  http_listen_port: 9080

positions:
  filename: /var/lib/promtail/positions.yaml

clients:
  - url: http://localhost:3100/loki/api/v1/push

scrape_configs:
  - job_name: hris-api
    static_configs:
      - targets:
          - localhost
        labels:
          job: hris-api
          __path__: /var/log/hris/api-*.log

  - job_name: hris-web
    static_configs:
      - targets:
          - localhost
        labels:
          job: hris-web
          __path__: /var/log/hris/web-*.log

  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/access.log

  - job_name: postgresql
    static_configs:
      - targets:
          - localhost
        labels:
          job: postgresql
          __path__: /var/log/postgresql/postgresql-*.log
```

**Start services:**
```bash
sudo loki -config.file=/etc/loki/config.yml &
sudo promtail -config.file=/etc/promtail/config.yml &
```

---

## 5. Error Tracking with Sentry

### Setup Sentry

```bash
npm install @sentry/node @sentry/tracing
```

**Backend Integration:**
```typescript
// apps/api/src/utils/sentry.ts
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { Express } from 'express';

export function initSentry(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of requests
    
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
      new Tracing.Integrations.Postgres()
    ]
  });
  
  // Request handler (must be first)
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

export function sentryErrorHandler(app: Express) {
  // Error handler (must be after routes)
  app.use(Sentry.Handlers.errorHandler());
}
```

**Usage in server:**
```typescript
// apps/api/src/server.ts
import { initSentry, sentryErrorHandler } from './utils/sentry';

const app = express();

// Initialize Sentry first
initSentry(app);

// ... other middleware and routes

// Sentry error handler before custom error handler
sentryErrorHandler(app);
app.use(errorHandler);
```

**Frontend Integration:**
```typescript
// apps/web/app/layout.tsx
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});
```

---

## 6. Uptime Monitoring

### UptimeRobot Setup

1. Sign up at https://uptimerobot.com
2. Add monitors:
   - **HRIS API Health**: https://hris.your-company.com/api/health (every 5 min)
   - **HRIS Web**: https://hris.your-company.com (every 5 min)
   - **Database** (via keyword monitoring): Check for "status: healthy"

3. Configure alerts:
   - Email notifications
   - SMS for critical alerts
   - Slack/Discord webhooks

### Custom Health Check Endpoint

```typescript
// apps/api/src/routes/health.routes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

router.get('/health', async (req, res) => {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };
  
  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }
  
  // Redis check
  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'unhealthy';
  }
  
  // Disk space check
  const diskUsage = await checkDiskSpace();
  health.checks.disk = diskUsage < 90 ? 'healthy' : 'warning';
  health.diskUsagePercent = diskUsage;
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

async function checkDiskSpace(): Promise<number> {
  const { execSync } = require('child_process');
  const output = execSync("df -h / | tail -1 | awk '{print $5}'").toString();
  return parseInt(output.replace('%', ''));
}

export default router;
```

---

## 7. Alerting Rules

### Critical Alerts (Immediate Action)

**Trigger:** Service down, database unreachable, disk >95%
**Notification:** SMS + Email + Slack
**SLA:** Respond within 15 minutes

### Warning Alerts (Monitor Closely)

**Trigger:** High error rate (>5%), slow response time (>1s), disk >80%
**Notification:** Email + Slack
**SLA:** Respond within 1 hour

### Info Alerts (Informational)

**Trigger:** Successful deployment, scheduled backup complete
**Notification:** Email
**SLA:** Review daily

### Alert Configuration Example (Prometheus AlertManager)

```yaml
# /etc/prometheus/alerts.yml
groups:
  - name: hris_alerts
    interval: 30s
    rules:
      - alert: APIDown
        expr: up{job="hris-api"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "HRIS API is down"
          description: "API has been down for more than 2 minutes"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes"
      
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response time"
          description: "95th percentile response time is {{ $value }}s"
      
      - alert: DatabaseConnectionPoolFull
        expr: database_connections_active / database_connections_max > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly full"
          description: "{{ $value }}% of connections in use"
      
      - alert: DiskSpaceHigh
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Only {{ $value }}% disk space remaining"
```

---

## 8. Dashboards with Grafana

### Install Grafana

```bash
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

Access: http://localhost:3000 (admin/admin)

### Dashboard Examples

**1. System Overview Dashboard**
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

**2. Application Dashboard**
- Request rate
- Response time (p50, p95, p99)
- Error rate
- Active users

**3. Database Dashboard**
- Queries per second
- Active connections
- Transaction rate
- Slow queries

**4. Business Metrics Dashboard**
- Daily check-ins
- Leave requests (pending/approved)
- Active employees
- Payroll cycle status

---

## 9. Monitoring Checklist

**Daily:**
- [ ] Check error logs for anomalies
- [ ] Verify backup completion
- [ ] Review slow query log
- [ ] Check disk space

**Weekly:**
- [ ] Review Grafana dashboards
- [ ] Analyze performance trends
- [ ] Check for security updates
- [ ] Review alert frequency

**Monthly:**
- [ ] Database vacuum and analyze
- [ ] Log rotation and archival
- [ ] Performance baseline review
- [ ] Capacity planning review

---

## 10. Incident Response

### Severity Levels

**P0 - Critical:**
- Complete service outage
- Data loss
- Security breach

**P1 - High:**
- Major feature unavailable
- Performance severely degraded
- Affecting >50% users

**P2 - Medium:**
- Minor feature issue
- Performance slightly degraded
- Affecting <50% users

**P3 - Low:**
- Cosmetic issues
- Feature request
- Documentation

### Incident Response Process

1. **Detect** - Alert triggers
2. **Assess** - Determine severity
3. **Respond** - Follow runbook
4. **Communicate** - Update status page
5. **Resolve** - Fix and verify
6. **Document** - Post-mortem report

---

## Support Contacts

- **On-call Engineer**: +966-xxx-xxxx
- **DevOps Team**: devops@your-company.com
- **Database Admin**: dba@your-company.com
- **Emergency Escalation**: cto@your-company.com
