# 🚀 VPS Deployment Guide

Complete step-by-step instructions for deploying the Enterprise HRIS platform on a fresh Ubuntu 24.04 VPS.

---

## Prerequisites

- **VPS**: Ubuntu 24.04 LTS with at least 2GB RAM, 2 vCPUs, 40GB storage
- **Domain**: A registered domain pointed to your VPS IP (e.g., `hris.your-company.com`)
- **SSH Access**: Root or sudo privileges
- **Budget**: ~$10-20/month (DigitalOcean, Linode, Vultr, etc.)

---

## Part 1: Server Setup

### 1.1 Initial Server Configuration

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Create a non-root user
adduser hrisadmin
usermod -aG sudo hrisadmin

# Setup SSH for the new user
mkdir -p /home/hrisadmin/.ssh
cp ~/.ssh/authorized_keys /home/hrisadmin/.ssh/
chown -R hrisadmin:hrisadmin /home/hrisadmin/.ssh
chmod 700 /home/hrisadmin/.ssh
chmod 600 /home/hrisadmin/.ssh/authorized_keys

# Switch to new user
su - hrisadmin
```

### 1.2 Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 1.3 Install Essential Tools

```bash
# Git, curl, build tools
sudo apt install -y git curl build-essential

# Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
sudo npm install -g pnpm

# PM2 (process manager)
sudo npm install -g pm2
```

---

## Part 2: Database Setup

### 2.1 Install PostgreSQL 16

```bash
# Add PostgreSQL APT repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.2 Create Database & User

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql:
CREATE DATABASE hris_db;
CREATE USER hris_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE hris_db TO hris_user;
\q
```

### 2.3 Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Find and change:
listen_addresses = 'localhost'  # Keep as localhost for security

# Edit pg_hba.conf (only if you need remote access)
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add at the end (for local connections only):
local   hris_db     hris_user     md5

# Restart
sudo systemctl restart postgresql
```

---

## Part 3: Redis Installation

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis to start on boot
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Test
redis-cli ping  # Should return PONG

# Secure Redis (edit /etc/redis/redis.conf)
sudo nano /etc/redis/redis.conf

# Find and set:
# bind 127.0.0.1 ::1
# requirepass your_redis_password_here

# Restart
sudo systemctl restart redis-server
```

---

## Part 4: Application Deployment

### 4.1 Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/hris
sudo chown hrisadmin:hrisadmin /opt/hris

# Clone
cd /opt/hris
git clone https://github.com/your-org/enterprise-hris.git .

# Install dependencies
pnpm install --frozen-lockfile
```

### 4.2 Configure Environment

```bash
# Create production .env
cp deploy/.env.example .env

# Edit with your values
nano .env
```

**Critical values to set**:
```env
NODE_ENV=production
DATABASE_URL=postgresql://hris_user:your_secure_password_here@localhost:5432/hris_db
REDIS_URL=redis://:your_redis_password_here@localhost:6379

# Generate secure secrets (use `openssl rand -base64 32`)
JWT_SECRET=<run: openssl rand -base64 32>
JWT_REFRESH_SECRET=<run: openssl rand -base64 32>

# API URL (your domain)
NEXT_PUBLIC_API_URL=https://hris.your-company.com/api
```

### 4.3 Run Database Migrations

```bash
# Generate Prisma client
pnpx prisma generate --schema packages/database/schema.prisma

# Run migrations
pnpx prisma migrate deploy --schema packages/database/schema.prisma

# Seed demo data (optional)
pnpm --filter @hris/api seed
```

### 4.4 Build Applications

```bash
# Build API
pnpm --filter @hris/api build

# Build Web
pnpm --filter @hris/web build
```

### 4.5 Setup PM2 for Process Management

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [
    {
      name: 'hris-api',
      cwd: '/opt/hris/apps/api',
      script: 'dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/hris/api-error.log',
      out_file: '/var/log/hris/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
    {
      name: 'hris-web',
      cwd: '/opt/hris/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/hris/web-error.log',
      out_file: '/var/log/hris/web-out.log',
    },
  ],
};
PMEOF

# Create log directory
sudo mkdir -p /var/log/hris
sudo chown hrisadmin:hrisadmin /var/log/hris

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

---

## Part 5: Nginx Reverse Proxy

### 5.1 Install Nginx

```bash
sudo apt install -y nginx

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5.2 Configure Nginx

```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create HRIS config
sudo nano /etc/nginx/sites-available/hris
```

**Paste this configuration**:
```nginx
# ── Upstream pools ────────────────────────────────────────────────────────
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream api {
    server 127.0.0.1:3001;
    keepalive 32;
}

# ── Rate limiting ─────────────────────────────────────────────────────────
limit_req_zone $binary_remote_addr zone=api_rate:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth_rate:10m rate=5r/s;

# ── HTTP → HTTPS redirect ─────────────────────────────────────────────────
server {
    listen 80;
    server_name hris.your-company.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# ── HTTPS server ──────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name hris.your-company.com;

    # TLS certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/hris.your-company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hris.your-company.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # API proxy
    location /api/ {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        limit_req zone=api_rate burst=60 nodelay;

        # Stricter limit on auth
        location /api/auth/login {
            limit_req zone=auth_rate burst=10 nodelay;
            proxy_pass http://api;
        }

        client_max_body_size 50M;
        proxy_connect_timeout 10s;
        proxy_read_timeout 30s;
    }

    # Next.js
    location / {
        proxy_pass http://nextjs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache Next.js static assets
        location /_next/static/ {
            proxy_pass http://nextjs;
            expires 1y;
            add_header Cache-Control immutable;
        }
    }

    # Uploads
    location /uploads/ {
        alias /opt/hris/uploads/;
        expires 30d;
        add_header Cache-Control immutable;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hris /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload (don't restart yet - we need Let's Encrypt first)
```

### 5.3 Setup Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Create webroot directory
sudo mkdir -p /var/www/certbot

# Get certificate
sudo certbot --nginx -d hris.your-company.com

# Follow prompts:
# - Enter email
# - Agree to ToS
# - Choose: Redirect HTTP to HTTPS (option 2)

# Test auto-renewal
sudo certbot renew --dry-run

# Reload Nginx
sudo systemctl reload nginx
```

---

## Part 6: Upload Directory & Permissions

```bash
# Create uploads directory
sudo mkdir -p /opt/hris/uploads
sudo chown hrisadmin:www-data /opt/hris/uploads
sudo chmod 775 /opt/hris/uploads

# Restart PM2 apps
pm2 restart all
```

---

## Part 7: Automated Backups

### 7.1 Database Backup Script

```bash
# Create backup directory
sudo mkdir -p /opt/backups/database
sudo chown hrisadmin:hrisadmin /opt/backups/database

# Create backup script
cat > /opt/backups/backup-db.sh << 'BACKUPEOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/database"
DB_NAME="hris_db"
DB_USER="hris_user"

# Backup
export PGPASSWORD='your_secure_password_here'
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/hris_backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "hris_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: hris_backup_$DATE.sql.gz"
BACKUPEOF

chmod +x /opt/backups/backup-db.sh
```

### 7.2 Setup Cron for Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily):
0 2 * * * /opt/backups/backup-db.sh >> /var/log/hris/backup.log 2>&1
```

---

## Part 8: Monitoring & Logs

### 8.1 View Application Logs

```bash
# PM2 logs
pm2 logs

# Specific app
pm2 logs hris-api
pm2 logs hris-web

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 8.2 Monitor Resources

```bash
# PM2 dashboard
pm2 monit

# Server resources
htop  # Install: sudo apt install htop

# Disk usage
df -h

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('hris_db'));"
```

---

## Part 9: CI/CD with GitHub Actions

Your repo already has `.github/workflows/ci-cd.yml`. To enable:

### 9.1 Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets → Actions, and add:

- `DOCKERHUB_USER`: Your Docker Hub username (if using Docker deployment)
- `DOCKERHUB_PASS`: Docker Hub password
- `VPS_HOST`: Your VPS IP or domain
- `VPS_USER`: `hrisadmin`
- `VPS_SSH_KEY`: Private SSH key for automated deployment

### 9.2 Setup SSH Key for GitHub Actions

```bash
# On your local machine:
ssh-keygen -t ed25519 -C "github-actions@hris" -f ~/.ssh/hris_deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/hris_deploy.pub hrisadmin@your-vps-ip

# Copy PRIVATE key content to GitHub Secret VPS_SSH_KEY
cat ~/.ssh/hris_deploy
```

### 9.3 Create Deployment Script on VPS

```bash
# On VPS
cat > /opt/hris/deploy.sh << 'DEPLOYEOF'
#!/bin/bash
set -e

echo "🚀 Deploying HRIS..."

cd /opt/hris

# Pull latest
git pull origin main

# Install deps (if changed)
pnpm install --frozen-lockfile

# Generate Prisma client
pnpx prisma generate --schema packages/database/schema.prisma

# Run migrations
pnpx prisma migrate deploy --schema packages/database/schema.prisma

# Build
pnpm --filter @hris/api build
pnpm --filter @hris/web build

# Restart apps
pm2 restart all

# Clear Nginx cache (if configured)
sudo systemctl reload nginx

echo "✅ Deployment complete!"
DEPLOYEOF

chmod +x /opt/hris/deploy.sh
```

Now pushing to `main` branch triggers: lint → test → deploy.

---

## Part 10: Security Hardening

### 10.1 Disable Root SSH Login

```bash
sudo nano /etc/ssh/sshd_config

# Set:
PermitRootLogin no
PasswordAuthentication no  # Force key-based auth

sudo systemctl restart sshd
```

### 10.2 Install Fail2Ban

```bash
sudo apt install -y fail2ban

# Create jail config
sudo nano /etc/fail2ban/jail.local

# Add:
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 10.3 Enable Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Part 11: Testing the Deployment

```bash
# Check all services are running
pm2 status
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx

# Test API health
curl https://hris.your-company.com/api/health

# Test web
curl -I https://hris.your-company.com
```

**Visit**: `https://hris.your-company.com` and login with seeded credentials:
- **HR Admin**: `hr.admin@alnoor.com` / `Hris2026!`

---

## Troubleshooting

### API not starting
```bash
# Check logs
pm2 logs hris-api

# Check database connection
sudo -u postgres psql -U hris_user -d hris_db -c "SELECT 1;"

# Check environment variables
pm2 env 0  # Shows env for first app
```

### 502 Bad Gateway
```bash
# Check if apps are running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

### Database connection issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string in .env
cat /opt/hris/.env | grep DATABASE_URL

# Test connection manually
psql "postgresql://hris_user:password@localhost:5432/hris_db"
```

---

## Maintenance Tasks

### Weekly
- Check disk space: `df -h`
- Review logs: `pm2 logs --lines 100`
- Check backup success: `ls -lh /opt/backups/database/`

### Monthly
- Update system packages: `sudo apt update && sudo apt upgrade -y`
- Review Nginx access logs for anomalies
- Rotate large log files if needed

### Quarterly
- Review user access and permissions
- Test database restore from backup
- Update Node.js if new LTS available

---

## 🎉 You're Done!

Your Enterprise HRIS is now live at `https://hris.your-company.com` with:
- ✅ SSL encryption (Let's Encrypt)
- ✅ Automated daily backups
- ✅ PM2 process management with auto-restart
- ✅ Nginx reverse proxy with rate limiting
- ✅ CI/CD via GitHub Actions
- ✅ Security hardening (firewall, fail2ban, no root SSH)

**Questions?** See [README.md](./README.md) or open an issue.
