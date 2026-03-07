# Changelog

All notable changes to the Enterprise HRIS Platform.

## [1.0.0] - 2026-02-04

### 🎉 Initial Release - Production Ready

#### Core Features

**Authentication & Authorization**
- JWT-based authentication with access and refresh tokens
- 6-tier role-based access control (EMPLOYEE → MANAGER → HR_OFFICER → HR_ADMIN → GM → SUPER_ADMIN)
- Password reset and change functionality
- Multi-company tenant isolation

**Attendance Management**
- Multi-factor anti-spoofing system:
  - GPS geofencing (100m radius validation)
  - WiFi fingerprinting
  - Selfie verification (ML-ready placeholder)
  - Device tracking and validation
- Check-in/check-out workflow with timestamp recording
- Monthly attendance summaries
- Flagged attendance review system

**Payroll System**
- Saudi labor law compliant calculations
- Component-based salary structure:
  - Basic salary
  - Housing allowance
  - Transport allowance
  - GOSI contributions
- Three-tier approval workflow:
  1. HR Officer creates and submits
  2. HR Admin reviews
  3. GM provides final approval
- Automated payslip generation
- Monthly cycle management with rejection/resubmission flow

**Leave Management**
- Configurable leave types (Annual, Sick, Emergency, Unpaid)
- Automated balance initialization and tracking
- Saudi working week calendar (Sunday-Thursday)
- Working-day calculator excluding weekends and public holidays
- Request workflow with overlap detection
- Manager/HR approval system
- Balance restoration on cancellation

**Document Management**
- Secure file upload with category organization
- Multi-approver digital signature workflows
- Geolocation tracking for signature events
- Document versioning
- Audit trail for all document actions
- Categories: Contract, ID, Certificate, Policy, Other

**Performance Management**
- Performance cycles (Annual, Quarterly, Custom)
- Goal setting with progress tracking (0-100%)
- 360° appraisals with 1-5 rating scale
- Manager feedback with structured fields:
  - Overall rating
  - Strengths
  - Areas for improvement
  - Development recommendations
- Employee acknowledgement workflow
- Cycle-level analytics and reporting

**Recruitment & ATS**
- Job posting management (DRAFT → PUBLISHED → CLOSED)
- 6-stage applicant pipeline:
  1. NEW
  2. SCREENING
  3. INTERVIEW
  4. OFFER
  5. HIRED
  6. REJECTED
- Interview scheduling (PHONE, VIDEO, IN_PERSON)
- Multi-interviewer feedback system
- Rating scale: STRONG_YES → YES → NEUTRAL → NO → STRONG_NO
- Automated employee record creation on hire

**Employee Management**
- Comprehensive employee profiles
- Department hierarchy support
- Salary structure management
- Direct report tracking
- Soft-delete with GDPR compliance
- Department-level statistics

**Training & Development**
- Training record tracking (SCHEDULED → IN_PROGRESS → COMPLETED)
- Certification management with expiry tracking
- Issuing organization tracking
- Digital certificate storage

**Discipline Management**
- Incident tracking with types:
  - WARNING
  - SUSPENSION
  - TERMINATION_NOTICE
- Severity levels (LOW → MEDIUM → HIGH → CRITICAL)
- Action chain documentation
- Resolution tracking with notes

**Termination & Offboarding**
- Termination type support:
  - RESIGNATION
  - TERMINATION
  - RETIREMENT
  - END_OF_CONTRACT
- Auto-generated exit checklist (6 items):
  1. Return company laptop
  2. Return access cards & badges
  3. Complete knowledge transfer
  4. Final salary settlement
  5. Exit interview
  6. GOSI deregistration
- Approval workflow (PENDING → APPROVED → COMPLETED)
- Final settlement calculation

**Audit & Compliance**
- Comprehensive audit logging for all mutations
- Filterable log viewer (HR Admin / Super Admin only)
- Tracking fields:
  - User ID
  - Resource type & ID
  - Action performed
  - Timestamp
  - IP address
  - Detailed metadata

**Multi-Company Support**
- Super Admin company management
- Company-level settings and configuration
- Cross-company analytics
- Data isolation at row level

#### Frontend Dashboards

**Employee Portal**
- Personal dashboard with 3 quick-access panels
- Attendance check-in/out with GPS verification
- Leave balance view and request submission
- Document library with signature functionality
- Payslip download center

**Manager Dashboard**
- Team roster with real-time presence badges
- Weekly attendance bar chart
- Leave type distribution pie chart
- Pending leave approval cards with inline actions
- Team goal tracking with progress visualization

**HR Admin Portal**
- Comprehensive dashboard with KPIs:
  - Total employees
  - Active recruitment positions
  - Pending leave requests
  - Flagged attendance records
- Leave management page with:
  - Monthly trend charts
  - Leave type overview
  - Searchable/filterable requests table
- Recruitment page with:
  - Hiring pipeline visualization
  - Job posting management
  - Applicant tracking with stage badges
- Employee directory with search and filters
- Payroll cycle management

**GM Dashboard**
- Payroll approval queue
- Cycle-level financial summaries
- One-click approval/rejection with reason tracking

**Super Admin Dashboard**
- Multi-company overview
- Employee growth line chart (per company)
- Payroll comparison bar chart
- Company management cards
- Audit log stream with severity coloring
- System health monitoring (5 services)

**UI Components**
- 12 reusable components:
  - Button (variants: default, destructive, outline, secondary, ghost, link)
  - Card (with header, title, description, content, footer)
  - Input (with validation states)
  - Select (with search)
  - Textarea
  - Dialog (modal system)
  - Alert (4 variants: default, destructive, warning, info)
  - Badge (5 variants: default, success, warning, destructive, outline, info)
  - Table (with sorting and pagination ready)
  - NotificationPanel (with type icons, unread counter)
- Recharts integration for data visualization
- Responsive design with mobile support

#### Technical Implementation

**Backend Architecture**
- Express.js REST API
- TypeScript strict mode
- Prisma ORM with PostgreSQL 16
- Redis 7 for session management
- JWT token management with refresh flow
- Comprehensive error handling with ApiError class
- Request logging middleware
- RBAC middleware for route protection

**Frontend Architecture**
- Next.js 14 with App Router
- React 18 with TypeScript
- Tailwind CSS 3.4 for styling
- Axios with request/response interceptors
- Automatic token refresh on 401
- Form validation with react-hook-form + zod

**Testing**
- 32 unit tests with Jest
- Prisma client mocking
- Coverage: 60% lines, 50% branches, 60% functions
- Test suites:
  - Leave Service (9 tests)
  - Performance Service (8 tests)
  - Recruitment Service (8 tests)
  - Employee Service (7 tests)

**DevOps & Deployment**
- Docker multi-stage builds
- Docker Compose orchestration
- Nginx reverse proxy with:
  - TLS termination
  - Rate limiting (5 req/s auth, 30 req/s general)
  - Security headers (HSTS, X-Frame-Options, etc.)
  - Static asset caching
- GitHub Actions CI/CD:
  - Automated linting
  - Unit tests
  - Multi-arch image builds (amd64, arm64)
  - SSH deployment to VPS
- PM2 process management for VPS deployments
- Automated database migrations
- Daily backup scripts

**Database**
- PostgreSQL 16
- 26 data models
- Multi-company row-level isolation
- Soft-delete support
- Comprehensive foreign key relationships
- Optimized indexes for common queries

**Security**
- Bcrypt password hashing (12 rounds)
- JWT with short-lived access tokens (15m)
- Refresh token rotation
- Rate limiting on authentication endpoints
- SQL injection protection via Prisma
- XSS protection via React
- CSRF protection via SameSite cookies
- Security headers enforcement

#### Documentation
- Comprehensive README (5,000 words)
- Step-by-step deployment guide (7,500 words)
- Technical architecture documentation
- Database seed script with demo data
- API documentation via code comments
- Contributing guidelines

#### Internationalization
- Arabic (RTL) + English (LTR) support
- Bilingual database columns (name/name_ar)
- Saudi Arabia localization:
  - Currency: SAR
  - Calendar: Gregorian with Saudi working week
  - Date formats
  - Phone number validation (+966)

---

## Upcoming Features (Roadmap)

### v1.1.0 - Enhanced Reporting (Q2 2026)
- Excel/PDF export for all major reports
- Custom report builder
- Scheduled report delivery via email
- Data visualization dashboards with drill-down

### v1.2.0 - Mobile Application (Q3 2026)
- React Native mobile app
- Biometric attendance (fingerprint/face)
- Push notifications
- Offline mode support

### v1.3.0 - Advanced Integrations (Q4 2026)
- GOSI API integration for automated reporting
- WPS (Wage Protection System) integration
- Email service (SendGrid/AWS SES)
- SMS notifications (Twilio)

### v2.0.0 - AI/ML Features (2027)
- Face recognition for attendance verification
- Predictive analytics for attrition risk
- Automated resume screening
- Chatbot for HR queries

---

## Migration Notes

### From Manual HR Systems
1. Export employee data to CSV
2. Run migration script (see `/docs/migrations/`)
3. Verify data integrity
4. Train staff on new system
5. Go live with parallel run period

### Database Migrations
All migrations are handled automatically by Prisma. To apply:
```bash
pnpx prisma migrate deploy --schema packages/database/schema.prisma
```

---

## Breaking Changes

None - this is the initial release.

---

## Contributors

- Development Team
- QA Team
- Documentation Team
- Special thanks to all beta testers

---

## License

MIT License - see LICENSE file for details.
