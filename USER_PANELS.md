# Enterprise HRIS Platform - User Panels & Portals

## Overview

The system features **6 distinct panels** tailored to different user roles. Each panel has its own interface, navigation structure, and feature set based on role-based access control (RBAC).

---

## 1. Super Admin Panel

### Access Level
- **Role:** Super Admin
- **Scope:** All companies in the group, system-wide settings
- **Multi-company:** Can switch between companies or view consolidated data

### Navigation Structure
```
Super Admin Panel
├── Dashboard (Executive Overview)
├── Companies Management
│   ├── Company List
│   ├── Add/Edit Company
│   ├── Company Settings
│   └── Company Switching
├── Group-Level Reports
│   ├── Consolidated Headcount
│   ├── Group Attrition
│   ├── Cross-Company Analytics
│   └── Compliance Reports
├── System Settings
│   ├── Role Management (System Roles)
│   ├── Permission Management
│   ├── Email Templates
│   ├── System Configuration
│   └── API Settings
├── User Management
│   ├── All Users (across companies)
│   ├── Add/Edit Users
│   ├── Role Assignment
│   └── User Activity Logs
├── Audit & Compliance
│   ├── System Audit Logs
│   ├── Security Events
│   ├── Data Access Reports
│   └── Compliance Dashboard
└── Support & Maintenance
    ├── System Health
    ├── Database Backups
    ├── Error Logs
    └── Performance Metrics
```

### Key Features
- ✅ View and manage all 3 companies
- ✅ Create/edit/delete companies
- ✅ System-wide user management
- ✅ Configure system roles and permissions
- ✅ Access all audit logs
- ✅ System configuration and maintenance
- ✅ Group-level analytics and reporting
- ✅ Override capabilities (with audit trail)

### Dashboard Widgets
- Total employees across all companies
- Group-wide attrition rate
- Payroll summary (all companies)
- Attendance compliance
- Document expiry alerts (all companies)
- System health status
- Recent system activities
- Critical alerts

---

## 2. HR Admin Panel

### Access Level
- **Role:** HR Admin
- **Scope:** Single company (assigned company)
- **Multi-company:** Can only access assigned company

### Navigation Structure
```
HR Admin Panel
├── Dashboard (HR Overview)
├── Employees
│   ├── Employee Directory
│   ├── Add Employee
│   ├── Edit Employee
│   ├── Organization Chart
│   ├── Employee Documents
│   └── Bulk Import/Export
├── Recruitment (ATS)
│   ├── Job Postings
│   ├── Applicants
│   ├── Interview Scheduling
│   ├── Interview Feedback
│   └── Hiring Approvals
├── Onboarding
│   ├── Onboarding Checklists
│   ├── New Hires
│   ├── Task Management
│   └── Probation Tracking
├── Attendance Management
│   ├── Attendance Overview
│   ├── Daily/Weekly/Monthly Reports
│   ├── Flagged Entries Review
│   ├── Correction Approvals
│   ├── Location Management
│   ├── Rule Configuration
│   └── Device Approvals
├── Leave Management
│   ├── Leave Requests (All)
│   ├── Leave Approvals
│   ├── Leave Types Configuration
│   ├── Leave Balances
│   ├── Holiday Calendar
│   └── Leave Reports
├── Payroll Management
│   ├── Payroll Cycles
│   ├── Review Payroll (Step 2)
│   ├── Salary Structures
│   ├── Allowances/Deductions Setup
│   ├── Payroll Reports
│   └── Payslip Generation
├── Performance Management
│   ├── Review Cycles
│   ├── Appraisals (All Employees)
│   ├── Goal Tracking
│   └── Performance Reports
├── Training & Development
│   ├── Training Records
│   ├── Certifications
│   ├── Expiry Alerts
│   └── Training Reports
├── Disciplinary Actions
│   ├── Incidents
│   ├── Disciplinary Actions
│   ├── Approvals
│   └── Action History
├── Termination & Exit
│   ├── Termination Requests
│   ├── Approvals
│   ├── Exit Checklists
│   ├── Final Settlements
│   └── Archived Employees
├── Document Management
│   ├── Document Library
│   ├── Upload Documents
│   ├── Document Categories
│   ├── Signature Workflows
│   ├── Document Approvals
│   └── Expiry Tracking
├── Reports & Analytics
│   ├── Headcount Reports
│   ├── Attrition Analysis
│   ├── Attendance Analytics
│   ├── Payroll Summary
│   ├── Leave Reports
│   ├── Performance Reports
│   └── Custom Reports
├── Company Settings
│   ├── Departments
│   ├── Roles & Permissions (Company)
│   ├── Company Information
│   ├── Work Schedules
│   └── Company Policies
└── Audit & Compliance
    ├── Audit Logs (Company)
    ├── Compliance Reports
    ├── Data Access Logs
    └── KSA Labor Law Compliance
```

### Key Features
- ✅ Full CRUD on employees
- ✅ Manage recruitment process
- ✅ Configure attendance rules
- ✅ **Review payroll** (Step 2 - after HR Officer preparation)
- ✅ Approve leave requests
- ✅ Manage performance cycles
- ✅ Handle terminations
- ✅ Generate comprehensive reports
- ✅ Configure company settings
- ✅ View company audit logs

### Dashboard Widgets
- Company headcount
- New hires this month
- Attrition rate
- Pending approvals (leave, attendance corrections)
- Payroll status
- Attendance summary
- Document expiries
- Recent activities
- Upcoming reviews
- Training due dates

---

## 3. HR Officer Panel

### Access Level
- **Role:** HR Officer
- **Scope:** Single company, operational level
- **Permissions:** Limited compared to HR Admin

### Navigation Structure
```
HR Officer Panel
├── Dashboard (Operations Overview)
├── Employees
│   ├── Employee Directory (View/Edit)
│   ├── Add Employee
│   ├── Employee Documents
│   └── Organization Chart (View)
├── Recruitment (ATS)
│   ├── Job Postings (Manage)
│   ├── Applicants (Manage)
│   ├── Interview Scheduling
│   └── Interview Feedback
├── Onboarding
│   ├── Onboarding Checklists
│   ├── New Hires Management
│   └── Task Assignments
├── Attendance
│   ├── Attendance Records (View)
│   ├── Daily Reports
│   ├── Flagged Entries
│   └── Correction Requests
├── Leave Management
│   ├── Leave Requests (View/Process)
│   ├── Leave Approvals (First Level)
│   └── Leave Balances
├── Payroll
│   ├── Prepare Payroll (Step 1)
│   ├── Payroll Data Entry
│   ├── Overtime Entry
│   ├── Allowances/Deductions
│   └── Submit for Review
├── Performance
│   ├── Performance Data Entry
│   └── Review Scheduling
├── Training
│   ├── Training Records Entry
│   ├── Certification Upload
│   └── Track Expiry Dates
├── Document Management
│   ├── Upload Documents
│   ├── Document Processing
│   └── Initiate Signatures
└── Reports
    ├── Basic Reports
    ├── Attendance Reports
    └── Leave Reports
```

### Key Features
- ✅ Add/edit employees (with approval)
- ✅ Manage recruitment day-to-day
- ✅ Handle onboarding tasks
- ✅ **Prepare payroll** (Step 1 - initial preparation)
- ✅ Process leave requests
- ✅ Enter attendance data
- ✅ Upload documents
- ✅ Generate basic reports
- ❌ Cannot approve payroll
- ❌ Cannot configure system settings
- ❌ Limited report access

### Dashboard Widgets
- Today's attendance summary
- Pending tasks
- New applicants
- Onboarding status
- Payroll preparation status
- Recent document uploads
- Upcoming deadlines

---

## 4. General Manager (GM) Panel

### Access Level
- **Role:** General Manager (GM)
- **Scope:** Single company, executive level
- **Critical Power:** **FINAL PAYROLL APPROVAL**

### Navigation Structure
```
General Manager (GM) Panel
├── Executive Dashboard
├── Payroll Approvals ★ CRITICAL ★
│   ├── Pending Payroll Cycles
│   ├── Review Payroll Details
│   ├── Approve/Reject Payroll
│   └── Approved Payroll History
├── Employees Overview
│   ├── Headcount Summary
│   ├── Organization Chart
│   ├── Key Positions
│   └── Department Overview
├── High-Level Approvals
│   ├── Termination Approvals
│   ├── Major Leave Requests
│   ├── Disciplinary Actions (Final)
│   └── Policy Changes
├── Reports & Analytics
│   ├── Executive Dashboard
│   ├── Financial Overview
│   ├── Payroll Summary
│   ├── Headcount Trends
│   ├── Attrition Analysis
│   ├── Budget vs Actual
│   └── Compliance Status
├── Document Approvals
│   ├── High-Level Document Signatures
│   ├── Policy Documents
│   └── Legal Documents
└── Strategic HR
    ├── Succession Planning
    ├── Organizational Structure
    └── Workforce Planning
```

### Key Features
- ✅ **FINAL PAYROLL APPROVAL** (Step 3 - mandatory, non-bypassable)
- ✅ View executive reports
- ✅ Approve terminations
- ✅ Approve high-value/high-level documents
- ✅ View organization-wide metrics
- ✅ Strategic decision support
- ❌ Cannot prepare payroll
- ❌ Cannot do day-to-day HR operations

### Dashboard Widgets (Executive Focus)
- **PENDING PAYROLL APPROVALS** (highlighted)
- Total payroll amount (current cycle)
- Company headcount
- Monthly attrition rate
- Budget utilization
- Pending high-level approvals
- Critical alerts
- Compliance status
- Executive KPIs

### Payroll Approval Interface (CRITICAL)
```
┌─────────────────────────────────────────────────────┐
│  PAYROLL APPROVAL - [Month Year]                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Status: PENDING GM APPROVAL                        │
│                                                      │
│  ⚠️ YOUR APPROVAL IS REQUIRED TO PROCEED            │
│                                                      │
│  Payroll Summary:                                   │
│  ├─ Total Employees: 150                           │
│  ├─ Total Gross Salary: SAR 1,250,000              │
│  ├─ Total Deductions: SAR 75,000                   │
│  ├─ Total Net Salary: SAR 1,175,000                │
│  └─ Period: Jan 1 - Jan 31, 2026                   │
│                                                      │
│  Prepared by: HR Officer (Ahmed Ali)                │
│  Reviewed by: HR Admin (Sarah Ahmed)                │
│                                                      │
│  [View Detailed Breakdown]                          │
│  [Download Payroll Report]                          │
│                                                      │
│  ┌─────────────────────────────────────────┐       │
│  │  ✅ APPROVE PAYROLL                     │       │
│  │  (This will lock the payroll)           │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  ┌─────────────────────────────────────────┐       │
│  │  ❌ REJECT PAYROLL                      │       │
│  │  (Send back to HR for corrections)      │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 5. Manager Panel

### Access Level
- **Role:** Department Manager / Team Lead
- **Scope:** Own team/department only (reporting hierarchy)
- **Data:** Only employees in reporting structure

### Navigation Structure
```
Manager Panel
├── Dashboard (Team Overview)
├── My Team
│   ├── Team Members
│   ├── Organization Chart (My Team)
│   ├── Team Performance
│   └── Team Documents
├── Attendance Management
│   ├── Team Attendance
│   ├── Daily/Weekly Reports
│   ├── Approve Corrections
│   └── Attendance Issues
├── Leave Management
│   ├── Team Leave Requests
│   ├── Approve/Reject Leaves
│   ├── Team Leave Calendar
│   └── Leave Balance Overview
├── Performance Management
│   ├── Team Goals
│   ├── Set Goals for Team
│   ├── Performance Reviews
│   ├── Conduct Appraisals
│   └── Performance History
├── Approvals
│   ├── Pending Approvals
│   ├── Leave Approvals
│   ├── Attendance Corrections
│   ├── Overtime Approvals
│   └── Document Approvals
├── Training & Development
│   ├── Team Training Needs
│   ├── Training Requests
│   └── Skill Development
├── Reports
│   ├── Team Reports
│   ├── Attendance Summary
│   ├── Performance Reports
│   └── Leave Reports
└── Self-Service (Manager's Own)
    ├── My Profile
    ├── My Attendance
    ├── My Leave
    ├── My Payslips
    └── My Documents
```

### Key Features
- ✅ View team members only (reporting hierarchy)
- ✅ Approve team leave requests
- ✅ Approve attendance corrections
- ✅ Conduct performance reviews
- ✅ Set team goals
- ✅ View team reports
- ✅ Approve overtime
- ❌ Cannot see other departments
- ❌ Cannot access payroll
- ❌ Cannot configure system settings
- ❌ Cannot see employees outside hierarchy

### Dashboard Widgets
- Team size
- Team attendance today
- Pending approvals count
- Team leave calendar
- Performance review due
- Team performance score
- Attendance issues
- Training needs

### Hierarchy Validation Example
```typescript
// Manager can only access their reporting hierarchy
async function getManagerTeam(managerId: string) {
  // Recursively get all employees in hierarchy
  const team = await getReportingHierarchy(managerId);
  return team; // Only these employees are accessible
}

// Block access to employees outside hierarchy
if (!isInManagerHierarchy(managerId, employeeId)) {
  throw new Error('Access denied: Employee not in your team');
}
```

---

## 6. Employee Self-Service Panel

### Access Level
- **Role:** Employee
- **Scope:** Own data only
- **Permissions:** View and manage personal information

### Navigation Structure
```
Employee Self-Service Panel
├── Dashboard (My Overview)
├── My Profile
│   ├── Personal Information
│   ├── Contact Details
│   ├── Emergency Contacts
│   ├── Bank Details
│   └── Edit Profile (Limited)
├── Attendance
│   ├── My Attendance Records
│   ├── Monthly Summary
│   ├── Request Correction
│   └── Attendance Calendar
├── Leave Management
│   ├── My Leave Balance
│   ├── Request Leave
│   ├── Leave History
│   ├── Cancel Leave Request
│   └── Leave Calendar
├── Payroll
│   ├── My Payslips
│   ├── Download Payslip
│   ├── Salary History
│   └── Tax Documents
├── Performance
│   ├── My Goals
│   ├── Self-Assessment
│   ├── Performance History
│   └── Feedback Received
├── Training & Certifications
│   ├── My Training Records
│   ├── Certificates
│   ├── Training Calendar
│   └── Request Training
├── Documents
│   ├── My Documents
│   ├── Download Documents
│   ├── Upload Documents (if allowed)
│   ├── Sign Documents
│   └── Document Requests
├── Time Off
│   ├── Holidays
│   ├── Company Calendar
│   └── Team Availability
└── Help & Support
    ├── HR Contact
    ├── FAQs
    ├── Policies
    └── Submit Ticket
```

### Key Features
- ✅ View own profile
- ✅ Edit limited profile fields
- ✅ Request leave
- ✅ View attendance records
- ✅ Request attendance corrections
- ✅ View/download payslips
- ✅ View own documents
- ✅ Sign documents (digital signature)
- ✅ View performance reviews
- ✅ Submit self-assessments
- ❌ Cannot see other employees
- ❌ Cannot access HR functions
- ❌ Cannot see payroll data
- ❌ Cannot configure anything

### Dashboard Widgets
- Leave balance (Annual, Sick, etc.)
- Upcoming leaves
- Recent attendance
- Latest payslip
- Pending documents to sign
- Performance review status
- Upcoming training
- Company announcements

### Mobile-First Features (Employee Panel)
```
Mobile App (Employee Focus)
├── Quick Actions
│   ├── 📍 Check In/Out (GPS + Selfie)
│   ├── 🏖️ Request Leave
│   ├── 📄 View Payslip
│   └── 📋 My Attendance
├── Attendance
│   ├── Check-In/Out (MAIN FEATURE)
│   ├── GPS Status Indicator
│   ├── WiFi Status Indicator
│   ├── Selfie Capture
│   └── Validation Feedback
├── Leave
│   ├── Leave Balance
│   ├── Request Leave
│   └── Leave History
├── Payslips
│   ├── Latest Payslip
│   └── Download PDF
├── Profile
│   ├── View Profile
│   └── Edit Contact
└── Notifications
    ├── Approval Status
    ├── Announcements
    └── Reminders
```

---

## Panel Comparison Matrix

| Feature | Super Admin | HR Admin | HR Officer | GM | Manager | Employee |
|---------|-------------|----------|------------|-------|---------|----------|
| **Access Scope** | All companies | Single company | Single company | Single company | Own team | Self only |
| **Manage Companies** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Add Employees** | ✅ | ✅ | ✅ (limited) | ❌ | ❌ | ❌ |
| **View All Employees** | ✅ | ✅ | ✅ | ✅ (overview) | ❌ (team only) | ❌ |
| **Prepare Payroll** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Review Payroll** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Approve Payroll (FINAL)** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Configure Attendance Rules** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Approve Leave (Team)** | ✅ | ✅ | ✅ | ✅ (high-level) | ✅ | ❌ |
| **View Audit Logs** | ✅ (all) | ✅ (company) | ❌ | ❌ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Company Settings** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Generate Reports** | ✅ (all) | ✅ (all) | ✅ (basic) | ✅ (executive) | ✅ (team) | ❌ |
| **Approve Terminations** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Mobile Check-In/Out** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Panel Access Flow

### Authentication & Role Detection
```typescript
// Login flow determines which panel to show
async function loginUser(email: string, password: string) {
  // 1. Authenticate
  const user = await authenticate(email, password);
  
  // 2. Get user roles
  const roles = await getUserRoles(user.id);
  
  // 3. Determine primary role (highest privilege)
  const primaryRole = determinePrimaryRole(roles);
  
  // 4. Redirect to appropriate panel
  switch (primaryRole) {
    case 'SUPER_ADMIN':
      redirect('/super-admin/dashboard');
      break;
    case 'HR_ADMIN':
      redirect('/hr-admin/dashboard');
      break;
    case 'HR_OFFICER':
      redirect('/hr-officer/dashboard');
      break;
    case 'GM':
      redirect('/gm/dashboard');
      break;
    case 'MANAGER':
      redirect('/manager/dashboard');
      break;
    case 'EMPLOYEE':
      redirect('/employee/dashboard');
      break;
  }
}
```

### Panel Routing Structure
```
/super-admin/*    → Super Admin Panel
/hr-admin/*       → HR Admin Panel
/hr-officer/*     → HR Officer Panel
/gm/*             → GM Panel
/manager/*        → Manager Panel
/employee/*       → Employee Self-Service Panel
```

---

## UI/UX Differentiation

### Super Admin Panel
- **Color Scheme:** Purple/Blue (system-level authority)
- **Layout:** Data-dense, analytics-heavy
- **Navigation:** Sidebar with company switcher
- **Widgets:** Multi-company metrics

### HR Admin Panel
- **Color Scheme:** Blue/Teal (professional)
- **Layout:** Comprehensive, multi-section
- **Navigation:** Expandable sidebar with all modules
- **Widgets:** Company-wide HR metrics

### HR Officer Panel
- **Color Scheme:** Blue/Green (operational)
- **Layout:** Task-focused, streamlined
- **Navigation:** Simplified sidebar
- **Widgets:** Daily tasks, pending items

### GM Panel
- **Color Scheme:** Dark Navy/Gold (executive)
- **Layout:** Clean, executive-focused
- **Navigation:** Minimal, high-level sections
- **Widgets:** KPIs, approvals, strategic metrics
- **Special:** Payroll approval prominently featured

### Manager Panel
- **Color Scheme:** Blue/Orange (team-oriented)
- **Layout:** Team-centric
- **Navigation:** Team management focus
- **Widgets:** Team metrics, approvals

### Employee Panel
- **Color Scheme:** Light Blue/Green (friendly)
- **Layout:** Simple, card-based
- **Navigation:** Minimal, self-service focused
- **Widgets:** Personal info, quick actions

---

## Shared Components Across Panels

While each panel is distinct, they share:
- ✅ Common design system (buttons, forms, tables)
- ✅ Consistent typography
- ✅ Same authentication mechanism
- ✅ Shared API client
- ✅ Common notification system
- ✅ Unified theme system (light/dark)
- ✅ RTL/LTR support

But with:
- ❌ Different navigation structures
- ❌ Different feature sets
- ❌ Different data access levels
- ❌ Different UI complexity

---

## Implementation Notes

### Panel as Separate Apps (Recommended)
```
apps/
├── super-admin-panel/   (Next.js app)
├── hr-admin-panel/      (Next.js app)
├── hr-officer-panel/    (Next.js app)
├── gm-panel/            (Next.js app)
├── manager-panel/       (Next.js app)
└── employee-panel/      (Next.js app)
```

**OR**

### Single App with Role-Based Routing
```
apps/web/
├── app/
│   ├── (super-admin)/
│   ├── (hr-admin)/
│   ├── (hr-officer)/
│   ├── (gm)/
│   ├── (manager)/
│   └── (employee)/
```

**Recommended:** Single app with route groups for easier maintenance and shared components.

---

This structure ensures clear separation of concerns, proper access control, and tailored user experiences for each role.
