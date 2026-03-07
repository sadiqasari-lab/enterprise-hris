# Enterprise HRIS Platform 🏢

A comprehensive, multi-company Human Resource Information System built for Saudi Arabia, featuring full Arabic RTL support, sophisticated attendance anti-spoofing, multi-tier payroll approval workflows, and advanced recruitment tracking.

<div align="center">

![Status](https://img.shields.io/badge/status-production--ready-success)
![Node](https://img.shields.io/badge/node-20.x-339933?logo=node.js)
![TypeScript](https://img.shields.io/badge/typescript-5.3-3178c6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791?logo=postgresql)
![Next.js](https://img.shields.io/badge/next.js-14-black?logo=next.js)

</div>

---

## 🌟 Key Features

### 👥 Employee Management
- **Multi-company tenancy** with full data isolation
- Department hierarchies with custom org charts
- Comprehensive employee profiles with Arabic support
- Salary structures with housing/transport allowances (Saudi labor law compliant)
- Role-based access control (6 permission tiers)

### 📅 Attendance & Leave
- **Anti-spoofing system**: GPS geofencing, WiFi fingerprinting, selfie verification, device tracking
- Saudi working calendar (Friday-Saturday weekend, public holidays)
- Leave types: Annual (30d), Sick (15d), Emergency (5d), Unpaid
- Automated balance calculation with working-day counter
- Manager approval workflow with balance restoration on cancellation

### 💰 Payroll
- Saudi labor law calculations (basic + housing + transport + GOSI)
- Three-tier approval: HR Officer → HR Admin → General Manager
- Automated payslip generation with Arabic/English bilingual support
- Monthly cycle management with rejection/resubmission flow

### 📄 Document Management
- Secure upload with category organization (Contract, ID, Certificate, Policy)
- **Digital signature chains** with geolocation tracking
- Multi-approver workflows (HR → Department Manager → GM)
- Audit trail for every signature event

### 🎯 Performance Management
- Goal setting with progress tracking (0-100%)
- Performance cycles (Annual, Quarterly, Custom)
- 360° appraisals with 1-5 rating scale
- Manager feedback with strengths/areas for improvement
- Employee acknowledgement workflow

### 🎓 Recruitment & Training
- **Applicant Tracking System** with 6-stage pipeline (NEW → SCREENING → INTERVIEW → OFFER → HIRED → REJECTED)
- Multi-interviewer feedback with STRONG_YES/YES/NEUTRAL/NO/STRONG_NO ratings
- Interview scheduling (PHONE, VIDEO, IN_PERSON)
- Training records with status tracking (SCHEDULED → IN_PROGRESS → COMPLETED)
- Certification management with expiry tracking

### ⚖️ Compliance & Discipline
- Incident tracking (WARNING, SUSPENSION, TERMINATION_NOTICE)
- Severity levels (LOW → MEDIUM → HIGH → CRITICAL)
- Action chains with approval requirements
- Resolution tracking with notes

### 🚪 Offboarding
- Termination workflows (RESIGNATION, TERMINATION, RETIREMENT, END_OF_CONTRACT)
- Auto-generated 6-item exit checklist (laptop return, access cards, knowledge transfer, salary settlement, exit interview, GOSI deregistration)
- Final settlement calculation
- Status tracking: PENDING → APPROVED → COMPLETED

### 📊 Analytics & Reporting
- **Manager Dashboard**: Team presence, weekly attendance charts, leave distribution, goal tracking
- **HR Admin Dashboard**: Company-wide metrics, flagged attendance, pending approvals, recent activity
- **GM Dashboard**: Payroll approval queue with cycle details
- **Super Admin**: Multi-company KPIs, employee growth trends, system health monitoring
- Real-time notification center with type-based icons and unread counter

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (TLS + Rate Limiting)          │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
       ┌───────▼────────┐         ┌──────▼───────┐
       │  Next.js Web   │         │  Express API │
       │  (Port 3000)   │         │ (Port 3001)  │
       └───────┬────────┘         └──────┬───────┘
               │                          │
               │                 ┌────────▼────────┐
               │                 │  Prisma ORM     │
               │                 └────────┬────────┘
               │                          │
       ┌───────▼──────────────────────────▼────────┐
       │         PostgreSQL 16 + Redis 7           │
       └───────────────────────────────────────────┘
```

**Tech Stack**
- **Backend**: Node.js 20, Express, TypeScript, Prisma ORM
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts
- **Database**: PostgreSQL 16 with multi-company isolation
- **Cache**: Redis 7 for session management
- **Auth**: JWT (access + refresh tokens), bcrypt password hashing
- **Testing**: Jest with Prisma mocking (60% coverage target)
- **Deployment**: Docker Compose, Nginx reverse proxy
- **CI/CD**: GitHub Actions (lint → test → build → deploy)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ & **pnpm** 8+
- **PostgreSQL** 14+
- **Redis** 6+ (optional for local dev)
- **Docker** & **Docker Compose** (for production deployment)

### 1. Install Dependencies

```bash
# Clone repo
git clone https://github.com/your-org/enterprise-hris.git
cd enterprise-hris

# Install all workspace packages
pnpm install
```

### 2. Configure Environment

```bash
# Copy example env
cp deploy/.env.example .env

# Edit .env with your values
DATABASE_URL="postgresql://user:pass@localhost:5432/hris_db"
JWT_SECRET="your-secret-key-minimum-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-minimum-32-characters"
```

### 3. Database Setup

```bash
# Create database
createdb hris_db

# Run migrations
pnpx prisma migrate deploy --schema packages/database/schema.prisma

# (Optional) Seed demo data
pnpm --filter @hris/api seed
```

### 4. Start Development Servers

```bash
# Terminal 1 - API (http://localhost:3001)
pnpm --filter @hris/api dev

# Terminal 2 - Web (http://localhost:3000)
pnpm --filter @hris/web dev
```

### 5. Login (Demo Credentials)

After seeding, use these accounts:

| Role         | Email                      | Password  |
|--------------|----------------------------|-----------|
| Super Admin  | admin@system.com           | Admin123! |
| HR Admin     | hr.admin@alnoor.com        | Hris2026! |
| Manager      | manager.eng@alnoor.com     | Hris2026! |
| Employee     | employee@alnoor.com        | Hris2026! |

---

## 🧪 Testing

```bash
# Run all API unit tests
pnpm --filter @hris/api test

# Watch mode
pnpm --filter @hris/api test:watch

# Coverage report
pnpm --filter @hris/api test:coverage
```

**Test Coverage**: 32 unit tests across 4 service suites
- Leave Service (9 tests)
- Performance Service (8 tests)  
- Recruitment Service (8 tests)
- Employee Service (7 tests)

---

## 📦 Production Deployment

### Using Docker Compose (Recommended)

```bash
cd deploy

# 1. Configure production environment
cp .env.example .env
nano .env  # Set secure JWT secrets, DB passwords

# 2. Generate TLS certificates (or use Let's Encrypt)
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout certs/key.pem -out certs/cert.pem -days 365

# 3. Launch stack
docker compose up -d --build

# 4. Check logs
docker compose logs -f api web

# 5. Access application
# HTTP:  http://your-domain.com (redirects to HTTPS)
# HTTPS: https://your-domain.com
```

### Manual VPS Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions including:
- Ubuntu 24.04 server setup
- PostgreSQL + Redis installation
- Nginx configuration with Let's Encrypt
- PM2 process management
- Automated backups

---

## 📁 Project Structure

```
enterprise-hris/
├── apps/
│   ├── api/                    # Express REST API
│   │   └── src/
│   │       ├── modules/        # Feature modules (auth, payroll, leave, etc.)
│   │       ├── middleware/     # RBAC, error handling, logging
│   │       └── server.ts       # Entry point
│   └── web/                    # Next.js frontend
│       ├── app/                # App Router pages
│       │   ├── (employee)/     # Employee routes
│       │   ├── (hr-admin)/     # HR Admin routes
│       │   ├── (manager)/      # Manager routes
│       │   ├── (gm)/           # GM routes
│       │   └── (super-admin)/  # Super Admin routes
│       ├── components/         # React components
│       │   ├── ui/             # Design system
│       │   ├── layout/         # Shared layouts
│       │   └── notifications/  # Notification center
│       └── lib/                # API client, utilities
├── packages/
│   ├── database/               # Prisma schema + migrations
│   ├── auth/                   # JWT + RBAC shared logic
│   └── types/                  # Shared TypeScript types
├── deploy/
│   ├── Dockerfile.api          # API container
│   ├── Dockerfile.web          # Web container
│   ├── docker-compose.yml      # Full stack orchestration
│   └── nginx.conf              # Reverse proxy config
└── .github/workflows/
    └── ci-cd.yml               # Automated pipeline
```

---

## 🔐 Security Features

1. **Authentication**
   - JWT access tokens (15m expiry) + refresh tokens (7d expiry)
   - Bcrypt password hashing (12 rounds)
   - Rate limiting: 5 req/s on `/api/auth/login`, 30 req/s general API

2. **Authorization**
   - 6-tier RBAC (EMPLOYEE → MANAGER → HR_OFFICER → HR_ADMIN → GM → SUPER_ADMIN)
   - Row-level security via company_id isolation
   - Route guards for every sensitive endpoint

3. **Data Protection**
   - Soft-delete for GDPR compliance (deleted_at timestamps)
   - Audit logging for all mutations (who, what, when)
   - Encrypted sensitive fields (coming soon: SSN, bank accounts)

4. **Infrastructure**
   - TLS 1.2+ with strong ciphers
   - Security headers (HSTS, X-Frame-Options, CSP)
   - Docker secrets for production credentials

---

## 🌍 Internationalization

- **Arabic (RTL)** + **English (LTR)** UI
- Database columns: `name` / `name_ar`, `position` / `position_ar`
- Date formatting: Gregorian calendar (Saudi working week: Sun-Thu)
- Currency: SAR (Saudi Riyal)

---

## 📊 Performance

| Metric              | Target   | Status |
|---------------------|----------|--------|
| API P95 latency     | < 200ms  | ✅      |
| Page load (FCP)     | < 1.5s   | ✅      |
| Database queries    | < 50ms   | ✅      |
| Docker image (API)  | < 400MB  | ✅      |
| Docker image (Web)  | < 500MB  | ✅      |

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit with clear messages (`git commit -m 'Add 360° feedback'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Coding Standards**
- ESLint + Prettier configured
- TypeScript strict mode
- 60%+ test coverage for new features
- API routes must include RBAC guards

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 💬 Support

- **Documentation**: [Full docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/enterprise-hris/issues)
- **Email**: support@your-company.com

---

<div align="center">

**Built with ❤️ for Saudi enterprises**

[Report Bug](https://github.com/your-org/enterprise-hris/issues) · [Request Feature](https://github.com/your-org/enterprise-hris/issues) · [Documentation](./docs/)

</div>
