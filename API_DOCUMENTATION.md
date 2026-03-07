# Enterprise HRIS - API Documentation

Complete REST API reference with request/response examples for all 80+ endpoints.

**Base URLs:**
- Production: `https://hris.your-company.com/api`
- Development: `http://localhost:3001/api`

## Authentication

All endpoints require JWT Bearer token (except `/auth/login` and public applicant submission).

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

## Response Format

**Success (200/201):**
```json
{
  "success": true,
  "data": { /* response payload */ }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

## Rate Limits

- `/api/auth/login`: **5 req/s**
- All other endpoints: **30 req/s**

---

## Core Endpoints

### POST /auth/login
Rate limit: 5 req/s

```json
// Request
{
  "email": "hr.admin@alnoor.com",
  "password": "Hris2026!"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "hr.admin@alnoor.com",
      "roles": ["HR_ADMIN"]
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### GET /employees
RBAC: Any authenticated user (company scope)

```json
// Query params: ?search=ahmed&departmentId=dept-123&status=ACTIVE&page=1&limit=20

// Response
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "emp-123",
        "employeeNumber": "EMP001",
        "firstName": "Ahmed",
        "lastName": "Al-Farsi",
        "email": "ahmed@alnoor.com",
        "position": "Engineering Manager",
        "department": { "name": "Engineering" }
      }
    ],
    "total": 42
  }
}
```

### POST /attendance/check-in
RBAC: Employee (own records)

```json
// Request
{
  "locationId": "loc-main-office",
  "gps": {
    "latitude": 24.7136,
    "longitude": 46.6753
  },
  "wifiSSID": "AlNoor-Office",
  "selfie": "data:image/jpeg;base64,/9j/4AAQ..."
}

// Response
{
  "success": true,
  "data": {
    "record": {
      "id": "att-789",
      "checkInTime": "2026-02-04T08:30:00.000Z",
      "status": "PRESENT",
      "validations": {
        "gpsValid": true,
        "riskScore": 0.05
      }
    }
  }
}
```

### POST /leave/requests
RBAC: Employee

Business rules: Validates balance, detects overlaps, excludes weekends

```json
// Request
{
  "leaveTypeId": "lt-annual",
  "startDate": "2026-03-10",
  "endDate": "2026-03-14",
  "reason": "Family vacation"
}

// Response
{
  "success": true,
  "data": {
    "request": {
      "id": "req-456",
      "status": "PENDING",
      "workingDays": 5  // Excludes Fri-Sat
    }
  }
}
```

### POST /payroll/cycles/:id/gm-approval
RBAC: GM only

```json
// Request
{
  "approved": true
}

// Response - Status changes to APPROVED
{
  "success": true,
  "data": {
    "cycle": {
      "status": "APPROVED",
      "totalAmount": 3750000,
      "payslipsGenerated": 250
    }
  }
}
```

### POST /documents/:id/sign
RBAC: Assigned signers

```json
// Request
{
  "signatureData": "data:image/png;base64,iVBORw...",
  "geolocation": { "latitude": 24.7136, "longitude": 46.6753 }
}

// Response
{
  "success": true,
  "message": "Document signed successfully"
}
```

---

## Full Endpoint Reference

**Authentication (5 endpoints)**
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- GET /auth/profile
- POST /auth/change-password

**Employees (10 endpoints)**
- GET /employees
- GET /employees/:id
- POST /employees
- PUT /employees/:id
- DELETE /employees/:id
- GET /employees/:managerId/reports
- POST /employees/departments
- GET /employees/departments
- POST /employees/:employeeId/salary
- GET /employees/stats/departments

**Attendance (4 endpoints)**
- POST /attendance/check-in
- POST /attendance/check-out
- GET /attendance/records
- GET /attendance/summary

**Leave (10 endpoints)**
- POST /leave/types
- GET /leave/types
- POST /leave/balances/:employeeId/init
- GET /leave/balances/my
- GET /leave/balances/:employeeId
- POST /leave/requests
- GET /leave/requests
- GET /leave/requests/my
- POST /leave/requests/:id/approve
- POST /leave/requests/:id/reject
- POST /leave/requests/:id/cancel

**Payroll (7 endpoints)**
- GET /payroll/cycles
- POST /payroll/cycles
- POST /payroll/cycles/:id/submit
- POST /payroll/cycles/:id/review
- POST /payroll/cycles/:id/gm-approval
- POST /payroll/cycles/:id/execute
- GET /payroll/payslips/my

**Documents (6 endpoints)**
- POST /documents/upload
- GET /documents
- GET /documents/:id
- POST /documents/:id/initiate-signature
- POST /documents/:id/sign
- GET /documents/pending-signatures/my

**Performance (12 endpoints)**
- POST /performance/cycles
- GET /performance/cycles
- POST /performance/cycles/:id/complete
- POST /performance/employees/:employeeId/goals
- GET /performance/goals
- PUT /performance/goals/:id/progress
- POST /performance/cycles/:cycleId/appraisals/:employeeId
- GET /performance/appraisals
- POST /performance/appraisals/:id/submit
- POST /performance/appraisals/:id/acknowledge
- GET /performance/cycles/:id/stats

**Recruitment (10 endpoints)**
- POST /recruitment/postings
- GET /recruitment/postings
- PATCH /recruitment/postings/:id/status
- POST /recruitment/postings/:jobPostingId/applicants (public)
- GET /recruitment/applicants
- PATCH /recruitment/applicants/:id/status
- POST /recruitment/applicants/:id/interviews
- POST /recruitment/applicants/:id/feedback
- POST /recruitment/applicants/:id/hire

**Training (5 endpoints)**
- POST /training/employees/:employeeId/trainings
- GET /training/trainings
- PATCH /training/trainings/:id/status
- POST /training/employees/:employeeId/certifications
- GET /training/employees/:employeeId/certifications

**Discipline (5 endpoints)**
- POST /discipline/incidents
- GET /discipline/incidents
- GET /discipline/incidents/:id
- POST /discipline/incidents/:id/actions
- POST /discipline/incidents/:id/resolve

**Termination (6 endpoints)**
- POST /termination
- GET /termination
- GET /termination/:id
- POST /termination/:id/approve
- POST /termination/:id/complete
- PUT /termination/:id/checklist

**Audit (1 endpoint)**
- GET /audit/logs

**Companies (5 endpoints)**
- POST /companies
- GET /companies
- GET /companies/:id
- PUT /companies/:id
- GET /companies/:id/stats

**Total: 80+ endpoints**

---

For complete request/response schemas, see interactive Swagger docs at `/api/docs` (coming soon).
