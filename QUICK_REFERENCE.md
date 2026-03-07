# Enterprise HRIS - Quick Reference Card

Fast reference for common operations and commands.

---

## 🚀 Quick Start

```bash
# Clone & setup
git clone <repo-url>
cd enterprise-hris
pnpm install
cp deploy/.env.example .env

# Database
createdb hris_db
pnpx prisma migrate dev --schema packages/database/schema.prisma
pnpm --filter @hris/api seed

# Start dev servers
pnpm --filter @hris/api dev     # http://localhost:3001
pnpm --filter @hris/web dev     # http://localhost:3000
```

---

## 🔐 Demo Login Credentials

| Role         | Email                   | Password  |
|--------------|-------------------------|-----------|
| Super Admin  | admin@system.com        | Admin123! |
| HR Admin     | hr.admin@alnoor.com     | Hris2026! |
| Manager      | manager.eng@alnoor.com  | Hris2026! |
| Employee     | employee@alnoor.com     | Hris2026! |

---

## 📦 pnpm Commands

```bash
# Install dependencies
pnpm install

# Run scripts in specific workspace
pnpm --filter @hris/api <script>
pnpm --filter @hris/web <script>

# Run script in all workspaces
pnpm -r <script>

# Add dependency
pnpm --filter @hris/api add express
pnpm --filter @hris/web add axios

# Remove dependency
pnpm --filter @hris/api remove express
```

---

## 🗄️ Database Commands

```bash
# Generate Prisma Client
pnpx prisma generate --schema packages/database/schema.prisma

# Create migration
pnpx prisma migrate dev --name migration_name --schema packages/database/schema.prisma

# Apply migrations (production)
pnpx prisma migrate deploy --schema packages/database/schema.prisma

# Reset database (⚠️ deletes all data)
pnpx prisma migrate reset --schema packages/database/schema.prisma

# Open Prisma Studio
pnpx prisma studio --schema packages/database/schema.prisma

# Seed database
pnpm --filter @hris/api seed

# Backup database
pg_dump -U hris_user hris_db > backup.sql

# Restore database
psql -U hris_user hris_db < backup.sql
```

---

## 🧪 Testing Commands

```bash
# Run all tests
pnpm --filter @hris/api test

# Run specific test file
pnpm --filter @hris/api test leave.service.test.ts

# Watch mode
pnpm --filter @hris/api test:watch

# Coverage report
pnpm --filter @hris/api test:coverage

# Lint
pnpm --filter @hris/api lint
pnpm --filter @hris/web lint

# Type check
pnpm --filter @hris/api typecheck
pnpm --filter @hris/web typecheck
```

---

## 🐳 Docker Commands

```bash
# Build and start all services
docker compose -f deploy/docker-compose.yml up -d --build

# View logs
docker compose -f deploy/docker-compose.yml logs -f
docker compose -f deploy/docker-compose.yml logs -f api
docker compose -f deploy/docker-compose.yml logs -f web

# Stop services
docker compose -f deploy/docker-compose.yml down

# Stop and remove volumes (⚠️ deletes data)
docker compose -f deploy/docker-compose.yml down -v

# Restart specific service
docker compose -f deploy/docker-compose.yml restart api

# Execute command in container
docker compose -f deploy/docker-compose.yml exec api sh
docker compose -f deploy/docker-compose.yml exec postgres psql -U hris_user hris_db

# View service status
docker compose -f deploy/docker-compose.yml ps

# Remove unused images
docker system prune -a
```

---

## 🔄 PM2 Commands (VPS Deployment)

```bash
# Start apps
pm2 start ecosystem.config.js

# View status
pm2 status
pm2 list

# View logs
pm2 logs
pm2 logs hris-api
pm2 logs hris-web --lines 100

# Restart
pm2 restart all
pm2 restart hris-api

# Stop
pm2 stop all
pm2 stop hris-api

# Delete
pm2 delete all
pm2 delete hris-api

# Monitor
pm2 monit

# Save current state
pm2 save

# Startup script
pm2 startup
pm2 unstartup

# Flush logs
pm2 flush
```

---

## 🌐 Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload (graceful restart)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# Stop
sudo systemctl stop nginx

# Start
sudo systemctl start nginx

# View status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Enable site
sudo ln -s /etc/nginx/sites-available/hris /etc/nginx/sites-enabled/

# Disable site
sudo rm /etc/nginx/sites-enabled/hris
```

---

## 🔐 SSL Certificate (Let's Encrypt)

```bash
# Obtain certificate
sudo certbot --nginx -d hris.your-company.com

# Renew all certificates
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates

# Revoke certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/hris.your-company.com/cert.pem
```

---

## 🐘 PostgreSQL Commands

```bash
# Connect to database
psql -U hris_user -d hris_db

# Inside psql:
\l              # List databases
\dt             # List tables
\d table_name   # Describe table
\du             # List users
\q              # Quit

# Backup
pg_dump -U hris_user hris_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U hris_user hris_db < backup_20260204.sql

# Check database size
psql -U hris_user -c "SELECT pg_size_pretty(pg_database_size('hris_db'));"

# Check table sizes
psql -U hris_user -d hris_db -c "
  SELECT tablename,
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'hris_db' AND state = 'idle';
```

---

## 📦 Redis Commands

```bash
# Connect to Redis
redis-cli

# Inside redis-cli:
PING                    # Test connection
KEYS *                  # List all keys (⚠️ don't use in production)
GET key_name            # Get value
DEL key_name            # Delete key
FLUSHALL                # Clear all data (⚠️ dangerous)
INFO                    # Server info
CLIENT LIST             # Connected clients
QUIT                    # Exit

# Redis with password
redis-cli -a your_password

# Check memory usage
redis-cli INFO memory
```

---

## 🔍 Debugging

```bash
# Check API health
curl http://localhost:3001/health
curl https://hris.your-company.com/api/health

# Test database connection
psql -U hris_user -h localhost -d hris_db -c "SELECT 1;"

# Check Redis connection
redis-cli PING

# View running processes
ps aux | grep node

# Check port usage
sudo lsof -i :3000
sudo lsof -i :3001

# Check disk space
df -h

# Check memory
free -h

# View system logs
sudo journalctl -u nginx
sudo journalctl -u postgresql

# Network diagnostics
ping hris.your-company.com
curl -I https://hris.your-company.com
```

---

## 🚨 Emergency Commands

```bash
# Restart everything (VPS)
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo systemctl restart redis-server

# Check all services status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server

# Emergency database backup
pg_dump -U hris_user hris_db | gzip > emergency_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# View recent errors
pm2 logs hris-api --err --lines 50
sudo tail -100 /var/log/nginx/error.log

# Check firewall
sudo ufw status

# Restart Docker Compose stack
cd /opt/hris/deploy
docker compose down
docker compose up -d --build
```

---

## 📊 Monitoring

```bash
# CPU & Memory
htop
top

# Disk I/O
iotop

# Network traffic
iftop
nethogs

# PM2 dashboard
pm2 monit

# Database connections
psql -U hris_user -d hris_db -c "SELECT count(*) FROM pg_stat_activity WHERE datname='hris_db';"

# Nginx active connections
curl http://localhost/nginx_status
```

---

## 🔄 Update & Deploy

```bash
# Pull latest code
cd /opt/hris
git pull origin main

# Install dependencies (if changed)
pnpm install --frozen-lockfile

# Run migrations
pnpx prisma generate --schema packages/database/schema.prisma
pnpx prisma migrate deploy --schema packages/database/schema.prisma

# Rebuild
pnpm --filter @hris/api build
pnpm --filter @hris/web build

# Restart
pm2 restart all
sudo systemctl reload nginx

# Or use deployment script
./deploy.sh
```

---

## 📝 API Endpoints

```bash
# Authentication
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/profile
POST   /api/auth/change-password

# Employees
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

# Attendance
POST   /api/attendance/check-in
POST   /api/attendance/check-out
GET    /api/attendance/records
GET    /api/attendance/summary

# Leave
POST   /api/leave/requests
GET    /api/leave/requests
GET    /api/leave/requests/my
POST   /api/leave/requests/:id/approve
POST   /api/leave/requests/:id/reject
GET    /api/leave/balances/my

# Payroll
GET    /api/payroll/cycles
POST   /api/payroll/cycles
POST   /api/payroll/cycles/:id/submit
POST   /api/payroll/cycles/:id/review
POST   /api/payroll/cycles/:id/gm-approval
GET    /api/payroll/payslips/my

# Documents
POST   /api/documents/upload
GET    /api/documents
POST   /api/documents/:id/initiate-signature
POST   /api/documents/:id/sign

# Full API documentation available at /api/docs (if enabled)
```

---

## 🆘 Support

- **Documentation**: See README.md, DEPLOYMENT_GUIDE.md
- **Issues**: https://github.com/your-org/enterprise-hris/issues
- **Email**: support@your-company.com
