# Performance Optimization Guide

Best practices for optimizing Enterprise HRIS Platform performance.

---

## Database Optimization

### Essential Indexes

```sql
-- Employee queries
CREATE INDEX CONCURRENTLY idx_employees_company_id ON employees(company_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_employees_status ON employees(status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_employees_department ON employees(department_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_employees_manager ON employees(manager_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_employees_email_lower ON employees(LOWER(email));

-- Attendance queries
CREATE INDEX CONCURRENTLY idx_attendance_employee_date ON attendance_records(employee_id, date DESC);
CREATE INDEX CONCURRENTLY idx_attendance_company_date ON attendance_records(company_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_attendance_status ON attendance_records(status) WHERE date >= CURRENT_DATE - INTERVAL '90 days';

-- Leave requests
CREATE INDEX CONCURRENTLY idx_leave_requests_employee ON leave_requests(employee_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_leave_requests_status ON leave_requests(status) WHERE status IN ('PENDING', 'APPROVED');
CREATE INDEX CONCURRENTLY idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Payroll
CREATE INDEX CONCURRENTLY idx_payslips_employee ON payslips(employee_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_payroll_cycles_status ON payroll_cycles(status, period_start DESC);

-- Audit logs (partitioned recommended for large datasets)
CREATE INDEX CONCURRENTLY idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_logs_created ON audit_logs(created_at DESC);
```

### Query Optimization

**Bad:**
```javascript
// N+1 query problem
const employees = await prisma.employee.findMany();
for (const emp of employees) {
  const department = await prisma.department.findUnique({
    where: { id: emp.department_id }
  });
}
```

**Good:**
```javascript
// Single query with include
const employees = await prisma.employee.findMany({
  include: {
    department: true,
    manager: {
      select: { first_name: true, last_name: true }
    }
  }
});
```

### Connection Pooling

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Optimize connection pool
  connection_limit = 20
  pool_timeout = 10
}
```

```bash
# In DATABASE_URL
postgresql://user:pass@localhost:5432/hris_db?connection_limit=20&pool_timeout=10
```

### Pagination Always

```javascript
// Bad - loads all records
const employees = await prisma.employee.findMany();

// Good - paginated
const employees = await prisma.employee.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { created_at: 'desc' }
});
```

### Use Select to Limit Fields

```javascript
// Bad - returns all columns
const employee = await prisma.employee.findUnique({
  where: { id }
});

// Good - only needed fields
const employee = await prisma.employee.findUnique({
  where: { id },
  select: {
    id: true,
    first_name: true,
    last_name: true,
    email: true
  }
});
```

---

## Redis Caching Strategy

### Cache Frequently Accessed Data

```typescript
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache department list (changes infrequently)
async function getDepartments(companyId: string) {
  const cacheKey = `departments:${companyId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Cache miss - fetch from DB
  const departments = await prisma.department.findMany({
    where: { company_id: companyId }
  });
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(departments));
  
  return departments;
}

// Invalidate cache on update
async function updateDepartment(id: string, data: any) {
  const dept = await prisma.department.update({
    where: { id },
    data
  });
  
  // Invalidate cache
  await redis.del(`departments:${dept.company_id}`);
  
  return dept;
}
```

### Cache User Sessions

```typescript
// Store active session count
async function trackActiveUsers() {
  const cacheKey = 'active_users';
  
  await redis.incr(cacheKey);
  await redis.expire(cacheKey, 300); // 5 minutes
  
  const count = await redis.get(cacheKey);
  return parseInt(count || '0');
}
```

### Cache Dashboard Metrics

```typescript
// Cache expensive aggregations
async function getCompanyStats(companyId: string) {
  const cacheKey = `stats:${companyId}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const stats = {
    totalEmployees: await prisma.employee.count({
      where: { company_id: companyId, status: 'ACTIVE' }
    }),
    totalDepartments: await prisma.department.count({
      where: { company_id: companyId }
    }),
    avgSalary: await prisma.employee.aggregate({
      where: { company_id: companyId },
      _avg: { salary: true }
    })
  };
  
  // Cache for 15 minutes
  await redis.setex(cacheKey, 900, JSON.stringify(stats));
  
  return stats;
}
```

---

## API Optimization

### Response Compression

```typescript
import compression from 'compression';

app.use(compression({
  threshold: 1024, // Only compress >1KB responses
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### Rate Limiting per Route

```typescript
import rateLimit from 'express-rate-limit';

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts'
});

app.post('/api/auth/login', authLimiter, authController.login);

// Relaxed limit for general API
const apiLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 30
});

app.use('/api/', apiLimiter);
```

### Async Error Handling

```typescript
// Bad - blocks event loop
app.get('/employees', (req, res) => {
  const employees = syncDatabaseQuery(); // Blocks!
  res.json(employees);
});

// Good - non-blocking
app.get('/employees', async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json({ success: true, data: { employees } });
  } catch (error) {
    next(error);
  }
});
```

### Batch Operations

```typescript
// Bad - N queries
for (const employee of employees) {
  await prisma.leaveBalance.create({
    data: { employee_id: employee.id, year: 2026 }
  });
}

// Good - 1 query
await prisma.leaveBalance.createMany({
  data: employees.map(emp => ({
    employee_id: emp.id,
    year: 2026,
    total_days: 30
  }))
});
```

---

## Frontend Optimization

### Code Splitting

```typescript
// Bad - loads everything upfront
import { EmployeeList } from './EmployeeList';
import { PayrollDashboard } from './PayrollDashboard';

// Good - lazy load by route
const EmployeeList = lazy(() => import('./EmployeeList'));
const PayrollDashboard = lazy(() => import('./PayrollDashboard'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/employees" element={<EmployeeList />} />
    <Route path="/payroll" element={<PayrollDashboard />} />
  </Routes>
</Suspense>
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/employee-photo.jpg"
  width={100}
  height={100}
  alt="Employee"
  loading="lazy" // Lazy load off-screen images
  placeholder="blur" // Show blur while loading
/>
```

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

function EmployeeList({ employees, filters }) {
  // Expensive filtering only runs when inputs change
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.department === filters.department &&
      emp.status === filters.status
    );
  }, [employees, filters]);
  
  // Prevent function recreation on every render
  const handleEdit = useCallback((id: string) => {
    // edit logic
  }, []);
  
  return <Table data={filteredEmployees} onEdit={handleEdit} />;
}
```

### Debounce Search

```typescript
import { debounce } from 'lodash';
import { useState, useCallback } from 'react';

function SearchBar() {
  const [results, setResults] = useState([]);
  
  // Only search after 300ms of no typing
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      const res = await apiClient.searchEmployees(query);
      setResults(res.data);
    }, 300),
    []
  );
  
  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search employees..."
    />
  );
}
```

### Virtual Scrolling for Large Lists

```typescript
import { FixedSizeList } from 'react-window';

function EmployeeTable({ employees }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {employees[index].name}
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={employees.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

## Server Optimization

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hris-api',
    script: './dist/server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

### Node.js Memory Tuning

```bash
# Increase heap size for large datasets
node --max-old-space-size=4096 dist/server.js

# In PM2
pm2 start dist/server.js --node-args="--max-old-space-size=4096"
```

### Nginx Optimization

```nginx
# In nginx.conf

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/css text/javascript application/javascript application/json;

# Static file caching
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API caching (optional for read-only endpoints)
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
proxy_cache_key "$scheme$request_method$host$request_uri";

location /api/departments {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    add_header X-Cache-Status $upstream_cache_status;
    proxy_pass http://api;
}

# Connection pooling
upstream api {
    server 127.0.0.1:3001;
    keepalive 64; # Reuse connections
}
```

---

## Database Maintenance

### Vacuum Regularly

```bash
# Auto-vacuum (should be enabled by default)
# Check in postgresql.conf:
autovacuum = on

# Manual vacuum for large deletes
psql -U hris_user -d hris_db -c "VACUUM ANALYZE employees;"

# Full vacuum (locks table - use off-hours)
psql -U hris_user -d hris_db -c "VACUUM FULL employees;"
```

### Analyze Statistics

```sql
-- Update query planner statistics
ANALYZE employees;
ANALYZE attendance_records;
ANALYZE leave_requests;

-- Auto-analyze all tables
ANALYZE;
```

### Partition Large Tables

```sql
-- For audit_logs table (example)
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Create index on partition
CREATE INDEX idx_audit_logs_2026_02_created 
    ON audit_logs_2026_02(created_at DESC);
```

### Archive Old Data

```sql
-- Move old attendance records to archive table
CREATE TABLE attendance_records_archive (LIKE attendance_records INCLUDING ALL);

-- Move records older than 2 years
INSERT INTO attendance_records_archive
SELECT * FROM attendance_records
WHERE date < CURRENT_DATE - INTERVAL '2 years';

-- Delete from main table
DELETE FROM attendance_records
WHERE date < CURRENT_DATE - INTERVAL '2 years';

-- Vacuum to reclaim space
VACUUM FULL attendance_records;
```

---

## Monitoring

### Enable Query Logging

```sql
-- In postgresql.conf
log_min_duration_statement = 1000  # Log queries >1 second
log_statement = 'all'  # Or 'ddl', 'mod'
```

### Track Slow Queries

```sql
-- Install pg_stat_statements
CREATE EXTENSION pg_stat_statements;

-- View slowest queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### Monitor API Response Times

```typescript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    // Alert if slow
    if (duration > 1000) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});
```

---

## Performance Benchmarks

### Target Metrics

| Metric                    | Target    |
|---------------------------|-----------|
| API Response (P95)        | < 200ms   |
| Dashboard Load (FCP)      | < 1.5s    |
| Database Query (avg)      | < 50ms    |
| Check-in Request          | < 500ms   |
| Payslip Generation        | < 2s      |
| Leave Request Submission  | < 300ms   |

### Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API health endpoint
ab -n 1000 -c 10 https://hris.your-company.com/api/health

# Test authenticated endpoint
ab -n 100 -c 5 -H "Authorization: Bearer TOKEN" \
   https://hris.your-company.com/api/employees
```

### Database Performance Testing

```bash
# Install pgbench
sudo apt install postgresql-contrib

# Initialize test database
pgbench -i -s 50 hris_db

# Run benchmark
pgbench -c 10 -j 2 -t 1000 hris_db
```

---

## Checklist

**Database:**
- [ ] All foreign keys have indexes
- [ ] Frequently queried columns indexed
- [ ] Connection pooling configured
- [ ] Auto-vacuum enabled
- [ ] Query performance monitored

**API:**
- [ ] Response compression enabled
- [ ] Rate limiting configured
- [ ] Pagination on all list endpoints
- [ ] Caching for read-heavy endpoints
- [ ] Error handling doesn't leak sensitive data

**Frontend:**
- [ ] Code splitting by route
- [ ] Images optimized
- [ ] Search debounced
- [ ] Large lists virtualized
- [ ] Memoization used appropriately

**Server:**
- [ ] PM2 cluster mode enabled
- [ ] Nginx caching configured
- [ ] Static assets have long cache headers
- [ ] Memory limits set appropriately
- [ ] Logging configured but not excessive

---

**Remember:** Premature optimization is the root of all evil. Profile first, then optimize hot paths!
