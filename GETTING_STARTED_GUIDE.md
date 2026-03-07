# Getting Started with Enterprise HRIS

Complete quickstart guide for different user types.

---

## 🚀 For Developers

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Git

### Automated Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/your-org/enterprise-hris.git
cd enterprise-hris

# Run automated setup
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Create environment files
- ✅ Setup database
- ✅ Configure IDE
- ✅ Install Git hooks

### Manual Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 3. Edit .env files with your configuration

# 4. Setup database
pnpm --filter @hris/database prisma generate
pnpm --filter @hris/database prisma migrate dev

# 5. Seed database (optional)
pnpm --filter @hris/api seed
```

### Start Development

```bash
# Terminal 1: API
pnpm --filter @hris/api dev

# Terminal 2: Web
pnpm --filter @hris/web dev

# Or start both:
pnpm dev
```

**Access:**
- Web: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@system.com | Admin123! |
| HR Admin | hr.admin@alnoor.com | Hris2026! |
| Manager | manager.eng@alnoor.com | Hris2026! |
| Employee | employee@alnoor.com | Hris2026! |

---

## 🏢 For DevOps/SysAdmin

### Quick Deploy (Docker)

```bash
# 1. Clone repository
git clone https://github.com/your-org/enterprise-hris.git
cd enterprise-hris/deploy

# 2. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 3. Start services
docker compose up -d

# 4. Check health
curl http://localhost/api/health
```

### VPS Deployment

Follow **DEPLOYMENT_GUIDE.md** for complete Ubuntu 24.04 setup:
1. Server preparation
2. PostgreSQL installation
3. Redis installation
4. Application deployment
5. Nginx configuration
6. SSL certificate
7. Monitoring setup

**Estimated Time:** 2-3 hours

---

## 👥 For HR Administrators

### First Time Setup

**1. Access System**
- URL: https://hris.your-company.com
- Login with credentials provided by IT

**2. Change Password**
- Click profile → Settings → Change Password
- Use strong password (12+ characters)

**3. Familiarize with Dashboard**
- Review pending approvals
- Check recent activities
- Explore navigation menu

**4. Add First Employee**
- Employees → Add Employee
- Fill required information
- Set department and position
- Configure salary structure

**5. Configure Leave Types**
- Leave → Leave Types
- Verify Annual Leave (30 days)
- Verify Sick Leave (15 days)
- Add custom types if needed

**6. Setup Attendance Locations**
- Attendance → Locations
- Add office with GPS coordinates
- Configure WiFi SSIDs
- Set allowed radius

### Daily Operations

**Morning Routine:**
- [ ] Review pending leave requests
- [ ] Check attendance flagged records
- [ ] Review notifications

**Weekly Tasks:**
- [ ] Approve leave requests
- [ ] Review attendance reports
- [ ] Update employee records

**Monthly Tasks:**
- [ ] Process payroll
- [ ] Generate reports
- [ ] Review compliance

**See:** USER_MANUAL_HR_ADMIN.md for complete guide

---

## 👔 For Managers

### Your Dashboard

**Key Metrics:**
- Team size and attendance rate
- Pending approvals
- Goal progress
- Recent activity

### Common Tasks

**1. Approve Leave Request**
- Dashboard → Pending Approvals
- Review request details
- Check team calendar for conflicts
- Approve or reject with reason

**2. Review Team Attendance**
- Team → Attendance
- Filter by date range
- Review patterns
- Address issues

**3. Set Performance Goals**
- Team → Performance → Goals
- Click employee name
- Add SMART goal
- Set target date

**4. Conduct Appraisal**
- Performance → Appraisals
- Select employee and cycle
- Rate performance (1-5)
- Provide feedback
- Submit

**See:** USER_MANUAL_MANAGER.md for complete guide

---

## 👤 For Employees

### Getting Started

**1. First Login**
- URL: https://hris.your-company.com
- Email: (provided by HR)
- Temporary password: (provided by HR)
- You'll be prompted to change password

**2. Setup Profile**
- Add profile photo
- Update contact information
- Add emergency contact

**3. Understand Your Dashboard**
- Quick actions (Check In/Out, Request Leave)
- Leave balances
- Recent payslips
- Pending documents

### Daily Use

**Morning Check-In:**
```
1. Open HRIS
2. Click "Check In"
3. Allow location access
4. Confirm check-in
```

**Evening Check-Out:**
```
1. Click "Check Out"
2. Confirm
3. View total hours worked
```

**Request Leave:**
```
1. Leave → Request Leave
2. Select leave type
3. Choose dates
4. Add reason
5. Submit
```

**View Payslip:**
```
1. Payslips
2. Select month
3. View breakdown
4. Download PDF
```

**See:** USER_MANUAL_EMPLOYEE.md for complete guide

---

## 🧪 For QA/Testers

### Test Environment Setup

```bash
# 1. Setup test database
psql -U postgres -c "CREATE DATABASE hris_test;"

# 2. Run migrations
DATABASE_URL="postgresql://user@localhost/hris_test" \
  pnpm --filter @hris/database prisma migrate deploy

# 3. Seed test data
pnpm --filter @hris/api seed

# 4. Run tests
pnpm test
pnpm test:integration
pnpm test:e2e
```

### API Testing with Postman

1. Import `postman_collection.json`
2. Set environment variables:
   - `baseUrl`: http://localhost:3001/api
3. Run collection tests
4. Review test results

### Manual Testing Checklist

**Smoke Tests:**
- [ ] Can login as each role
- [ ] Dashboard loads
- [ ] Can navigate between pages
- [ ] Can logout

**Critical Paths:**
- [ ] Employee can check in/out
- [ ] Employee can request leave
- [ ] Manager can approve leave
- [ ] HR can create employee
- [ ] Payroll cycle completes

**See:** TESTING_STRATEGY.md for complete guide

---

## 🔒 For Security Auditors

### Security Review Checklist

**Authentication & Authorization:**
- [ ] Strong password policy enforced
- [ ] JWT tokens properly secured
- [ ] Rate limiting on auth endpoints
- [ ] RBAC correctly implemented

**Network Security:**
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CORS properly configured
- [ ] Firewall rules appropriate

**Data Security:**
- [ ] Database encrypted at rest
- [ ] Sensitive data masked in logs
- [ ] File upload restrictions
- [ ] Input validation present

**Monitoring:**
- [ ] Audit logging enabled
- [ ] Intrusion detection active
- [ ] Log aggregation configured
- [ ] Alerts functioning

**See:** SECURITY_HARDENING.md for complete guide

---

## 📚 Next Steps

### Developers
1. Read TECHNICAL_ARCHITECTURE.md
2. Review API_DOCUMENTATION.md
3. Check CONTRIBUTING.md
4. Join team Slack channel

### DevOps
1. Complete DEPLOYMENT_GUIDE.md
2. Setup MONITORING_ALERTING.md
3. Review DISASTER_RECOVERY_PLAN.md
4. Test backup procedures

### HR Team
1. Attend training session
2. Review PAYROLL_SYSTEM_GUIDE.md
3. Configure attendance locations
4. Import employee data (DATA_MIGRATION_GUIDE.md)

### Managers
1. Explore dashboard features
2. Review team roster
3. Practice leave approval workflow
4. Setup performance goals

### Employees
1. Complete profile setup
2. Practice check-in/out
3. View leave balances
4. Explore self-service features

---

## 🆘 Need Help?

### Documentation
- **Index:** COMPLETE_DOCUMENTATION_INDEX.md
- **FAQ:** Search documentation for common questions
- **Troubleshooting:** TROUBLESHOOTING_GUIDE.md

### Support Channels
- **Email:** support@your-company.com
- **Internal:** #hris-support Slack channel
- **Emergency:** IT Helpdesk

### Training Resources
- Video tutorials (coming soon)
- Monthly webinars
- User guides (role-specific)

---

## ✅ Verification

After setup, verify everything works:

```bash
# Health check
curl http://localhost:3001/api/health

# Login test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr.admin@alnoor.com","password":"Hris2026!"}'

# Database check
psql -U hris_user -d hris_db -c "SELECT COUNT(*) FROM employees;"
```

All checks should return successful responses.

---

**Welcome to Enterprise HRIS! We're here to help you succeed.** 🎉
