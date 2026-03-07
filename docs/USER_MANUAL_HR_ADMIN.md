# HR Administrator User Manual

Complete guide for HR Administrators managing the Enterprise HRIS Platform.

---

## Your Capabilities

As HR Admin, you have full access to:
- ✅ All employee records (CRUD)
- ✅ Complete leave management
- ✅ Payroll cycle management (up to GM approval)
- ✅ Recruitment & applicant tracking
- ✅ Document management
- ✅ Performance cycles
- ✅ Training & certifications
- ✅ Discipline tracking
- ✅ Termination workflows
- ✅ System reports & analytics
- ❌ Multi-company management (Super Admin only)
- ❌ Final payroll approval (GM only)

---

## Dashboard Overview

Your HR Admin Dashboard shows:

**Key Metrics**
- Total Employees (with growth trend)
- Active Recruitment Positions
- Pending Leave Requests
- Flagged Attendance Records

**Current Payroll Status**
- Cycle name and period
- Status (Draft/Review/GM Approval)
- Total amount and employee count
- Quick action buttons

**Activity Feed**
- Recent employee onboarding
- Payroll submissions
- Leave approvals
- Document signatures

**Pending Approvals**
- Leave requests by employee
- Attendance corrections
- Document signatures

---

## Employee Management

### Adding New Employees

**Onboarding Process:**

1. Navigate to **Employees** → **Add Employee**
2. Fill **Basic Information**:
   - Employee Number (unique, e.g., EMP001)
   - First Name, Last Name (English + Arabic)
   - Email (will be login username)
   - Phone Number (+966 format)
   - Hire Date

3. **Employment Details**:
   - Department (select from dropdown)
   - Position/Job Title (English + Arabic)
   - Manager (their direct supervisor)
   - Employment Type (Full-time, Part-time, Contract)

4. Click **Create Employee**

**What Happens Next:**
- Employee record created with status ACTIVE
- System sends welcome email with temp password
- Leave balances initialized automatically
- User account created with EMPLOYEE role

**Pro Tip:** Prepare a batch import Excel template for multiple hires.

### Updating Employee Records

1. Search for employee (name, email, or employee number)
2. Click **Edit** button
3. Update any field:
   - Contact information
   - Department/Manager (for transfers)
   - Position (for promotions)
   - Status (ACTIVE, INACTIVE, TERMINATED)
4. Click **Save Changes**

**Audit Trail:** All changes are logged with your user ID and timestamp.

### Setting Up Salary Structures

1. Go to employee profile → **Salary** tab
2. Click **Add Salary Structure**
3. Enter components:
   - **Basic Salary** (SAR)
   - **Housing Allowance** (typically 25-40% of basic)
   - **Transport Allowance** (typically 10-15% of basic)
   - **Other Allowances** (custom, JSON format if needed)
4. Set **Effective From** date
5. **Effective To** (optional - leave blank if ongoing)
6. Save

**Saudi Labor Law Note:**
- GOSI calculated as 9.75% of basic salary
- Housing/transport allowances exempt from GOSI

**Salary Revisions:**
- Creating new salary structure auto-closes previous one
- History is maintained for audit purposes

---

## Leave Management

### Configuring Leave Types

1. **Leave** → **Leave Types** → **Add Type**
2. Fill details:
   - **Name** (e.g., "Annual Leave")
   - **Name (Arabic)** (e.g., "إجازة سنوية")
   - **Code** (2-3 letter, e.g., "AL")
   - **Days Per Year** (30 for annual, per Saudi law)
   - **Is Paid** (checkbox)
3. Save

**Standard Saudi Leave Types:**
- Annual Leave: 30 days (paid)
- Sick Leave: 15 days (paid, medical cert required after 3 days)
- Emergency Leave: 5 days (paid)
- Unpaid Leave: Variable (case-by-case)
- Maternity: 10 weeks (paid)
- Hajj Leave: Once (paid, for citizens)

### Initializing Leave Balances

**For New Employees:**
- Balances auto-initialize on employee creation
- Based on hire date (prorated for mid-year hires)

**For New Year:**
1. **Leave** → **Balances** → **Initialize Year**
2. Select **Year**: 2026
3. Click **Initialize for All Employees**
4. System creates balances for all active employees
5. Previous year balances archived

**Manual Adjustment:**
1. Find employee → **Leave Balances**
2. Click **Adjust**
3. Enter reason (required for audit)
4. Add/subtract days
5. Save

### Managing Leave Requests (HR View)

**Dashboard View:**
- See ALL company leave requests (not just your direct reports)
- Filter by: Status, Department, Date Range
- Batch approve/reject capability

**Approval Process:**
1. Review request details
2. Check:
   - Balance sufficient?
   - Overlaps with team members?
   - Company holidays considered?
3. Approve or reject with reason
4. System handles balance deduction automatically

**Cancellation:**
- Employees can cancel PENDING requests
- HR can cancel APPROVED requests (with reason)
- Balance restoration automatic

---

## Payroll Management

### Creating Payroll Cycles

**Monthly Process (Recommended Schedule):**

**Day 1-5:** Prepare
1. **Payroll** → **Create Cycle**
2. Set period: First day to last day of month
3. Status starts as DRAFT
4. Review employee changes:
   - New hires (prorated salary)
   - Terminations (final pay)
   - Salary adjustments
   - Attendance deductions

**Day 6-10:** Process
5. System calculates for each employee:
   - Basic Salary
   - + Housing Allowance
   - + Transport Allowance
   - + Overtime (if applicable)
   - - GOSI (9.75% of basic)
   - - Absences
   - - Loans/Advances
   - = Net Salary

**Day 11-15:** Review & Submit
6. Click **Submit for Review**
7. Status → PENDING_REVIEW
8. HR Admin reviews and approves
9. Status → PENDING_GM_APPROVAL

**Day 16-20:** GM Approval
10. GM reviews and approves (in their dashboard)
11. Status → APPROVED

**Day 21-25:** Execute
12. Click **Execute Payroll**
13. Payslips generated for all employees
14. Bank transfer file created (if integrated)
15. Status → COMPLETED

### Handling Payroll Rejections

**If HR Admin Rejects:**
- Goes back to HR Officer
- Fix issues noted in rejection reason
- Resubmit for review

**If GM Rejects:**
- Goes back to HR Admin
- Address GM's concerns
- May need to regenerate payslips
- Resubmit through workflow

**Common Rejection Reasons:**
- Incorrect GOSI calculations
- Missing attendance deductions
- Unapproved salary changes
- New hires not properly prorated

### Payroll Reports

**Available Reports:**
1. **Summary Report**
   - Total payroll by department
   - Breakdown by component
   - Month-over-month comparison

2. **Bank Transfer File**
   - Format: CSV for bank upload
   - Columns: Employee Number, Name, Bank Account, Amount

3. **GOSI Report**
   - Employer + Employee contributions
   - Format for GOSI submission

4. **Individual Payslips**
   - PDF generation for each employee
   - Email distribution option

---

## Recruitment & ATS

### Creating Job Postings

1. **Recruitment** → **Job Postings** → **Create**
2. Fill details:
   - **Title** (English + Arabic)
   - **Department**
   - **Position/Level**
   - **Description** (job responsibilities)
   - **Requirements** (education, experience, skills)
   - **Salary Range** (optional, can hide publicly)
3. Save as **DRAFT**

**Publishing:**
4. Review posting
5. Click **Publish**
6. Status → PUBLISHED
7. Posting becomes visible on careers page
8. Share URL with recruitment channels

### Managing Applicants

**Application Flow:**

NEW → SCREENING → INTERVIEW → OFFER → HIRED/REJECTED

**1. New Applications**
- Arrive automatically via careers page
- Review: Resume, cover letter, qualifications
- Move to SCREENING or REJECT

**2. Screening**
- Phone screening
- Initial assessment
- Move to INTERVIEW or REJECT

**3. Interview**
- Schedule via system:
  - **Type**: Phone, Video, In-Person
  - **Date/Time**
  - **Interviewers** (select from employees)
  - **Notes**: Focus areas
- After interview:
  - Interviewers submit feedback (rating 1-5)
  - Recommendations: STRONG_YES, YES, NEUTRAL, NO, STRONG_NO
- Move to OFFER or REJECT

**4. Offer**
- Generate offer letter
- Send to candidate
- Await acceptance
- Move to HIRED

**5. Hiring**
- Click **Hire** button
- System creates employee record automatically
- Links applicant to employee
- Initializes leave balances
- Sends onboarding email

### Interview Management

**Scheduling:**
1. Find applicant → **Schedule Interview**
2. Select interviewers (auto-emails them)
3. Choose type and time
4. Add prep notes
5. Save → Calendar invites sent

**Feedback Collection:**
- Interviewers login → **Interviews** tab
- Fill feedback form:
  - Rating (1-5 stars)
  - Comments
  - Recommendation
- Submit → visible to hiring manager

**Hiring Decision:**
- Review all feedback
- Compare candidates
- Make data-driven decision
- Document reasoning

---

## Document Management

### Uploading Documents

1. **Documents** → **Upload**
2. Select file (PDF, DOC, JPG, PNG)
3. Choose **Category**:
   - CONTRACT: Employment contracts
   - ID_DOCUMENT: National ID, passport
   - CERTIFICATE: Degrees, certifications
   - POLICY: Company policies
   - OTHER: Misc.
4. Assign to **Employee** (or leave company-wide)
5. Upload

**File Naming Convention:**
`[CATEGORY]_[EMPLOYEE]_[DATE]_[DESCRIPTION].pdf`

Example: `CONTRACT_EMP001_20260204_Employment.pdf`

### Digital Signature Workflows

**Setup Approval Chain:**

1. Open document
2. Click **Initiate Signature**
3. Add approvers in order:
   - Employee (signs first)
   - Manager (reviews and signs)
   - HR Admin (final approval)
4. Save workflow

**What Happens:**
- Employee receives notification
- They sign → moves to Manager
- Manager signs → moves to HR
- HR signs → document COMPLETE
- All signatures timestamped and geotagged

**Tracking:**
- See signature status real-time
- Download audit trail PDF
- Resend reminders to pending signers

---

## Performance Management

### Creating Performance Cycles

**Annual Cycle:**
1. **Performance** → **Cycles** → **Create**
2. Fill:
   - **Name**: "Annual Review 2026"
   - **Type**: ANNUAL
   - **Start**: January 1, 2026
   - **End**: December 31, 2026
3. Status: ACTIVE
4. Save

**Quarterly Cycles:** Same process, 3-month periods

### Monitoring Goals

**Dashboard View:**
- See all company goals
- Filter by:
  - Cycle
  - Department
  - Status (Not Started, In Progress, Completed)
  - Overdue
- Sort by progress %

**Intervention:**
- Identify struggling goals (low progress, approaching deadline)
- Reach out to manager/employee
- Offer support (training, resources)
- Adjust if needed

### Appraisal Analytics

1. **Performance** → **Analytics**
2. View:
   - **Rating Distribution**: Histogram of 1-5 ratings
   - **Avg Rating by Department**
   - **Completion Rate**: % of appraisals submitted
   - **Trends**: Compare to previous cycles

**Use For:**
- Compensation planning
- Promotions/Talent review
- Training needs analysis
- Performance improvement programs

---

## System Administration

### Managing Departments

**Creating:**
1. **Settings** → **Departments** → **Add**
2. Name (English + Arabic)
3. Code (3 letters)
4. Parent Department (for hierarchy, optional)
5. Save

**Department Hierarchy Example:**
```
Engineering (ENG)
  ├─ Frontend (ENG-FE)
  ├─ Backend (ENG-BE)
  └─ QA (ENG-QA)
```

### User Role Management

**Changing User Roles:**
1. Find employee → **User Account** tab
2. Current roles displayed
3. Click **Edit Roles**
4. Add/remove:
   - EMPLOYEE (default)
   - MANAGER
   - HR_OFFICER
   - HR_ADMIN
   - GM
5. Save

**Role Hierarchy:**
- EMPLOYEE < MANAGER < HR_OFFICER < HR_ADMIN < GM < SUPER_ADMIN

**Permission Scope:**
- Employee: Own records only
- Manager: Own + direct reports
- HR Officer: Department
- HR Admin: Company
- GM: Company (approval power)
- Super Admin: All companies

---

## Reports & Analytics

### Standard Reports

**1. Headcount Report**
- Total active employees
- By department, position
- Trends over time
- New hires vs. terminations

**2. Attendance Report**
- Aggregate metrics
- Lateness patterns
- Absence tracking
- Overtime analysis

**3. Leave Report**
- Balance utilization
- Most common leave types
- Peak leave periods
- Remaining liabilities

**4. Payroll Report**
- Total cost by department
- Component breakdown
- Month-over-month variance
- Budget vs. actual

**5. Turnover Report**
- Termination count
- Turnover rate %
- Reasons for leaving
- Retention analytics

### Custom Reports

1. **Reports** → **Custom**
2. Select:
   - **Data Source** (Employees, Attendance, Leave, etc.)
   - **Filters** (department, date range, etc.)
   - **Metrics** (count, sum, average, etc.)
   - **Grouping** (by department, month, etc.)
3. **Preview**
4. Save as template
5. **Export** to Excel or PDF

---

## Compliance & Audit

### Audit Logs

**Viewing Logs:**
1. **Audit** → **Logs**
2. Filter by:
   - **Resource Type** (employee, payroll, etc.)
   - **Action** (CREATE, UPDATE, DELETE, APPROVE)
   - **User**
   - **Date Range**
3. Export for external audits

**What's Logged:**
- Who performed action
- What was changed
- When it happened
- IP address
- Before/After values

**Use Cases:**
- Compliance audits
- Security investigations
- Dispute resolution
- Training examples

### Saudi Labor Law Compliance

**Automatic Checks:**
- ✅ Working hours < 48 per week
- ✅ Overtime paid at correct rate (1.5x or 2x)
- ✅ Annual leave entitlement (30 days min)
- ✅ Sick leave policy compliant
- ✅ GOSI contributions calculated correctly
- ✅ End-of-service benefits

**Flags/Warnings:**
- 🚨 Employee > 11 hours/day
- 🚨 No leave taken in 12 months
- 🚨 Missing GOSI registration
- 🚨 Contract expiring in 30 days

---

## Troubleshooting

### Common Issues

**"Employee can't login"**
- Reset password → Email new temp password
- Check account status (Active?)
- Verify email address correct

**"Payslip amount incorrect"**
- Review payroll cycle logs
- Check salary structure effective dates
- Verify attendance deductions
- Recalculate if needed

**"Leave balance doesn't match"**
- Check balance adjustment history
- Verify all requests properly approved
- Manual recount if needed
- Document discrepancy resolution

---

## Best Practices

**Daily:**
- [ ] Review new leave requests (< 24h response)
- [ ] Check flagged attendance
- [ ] Monitor recruitment applications

**Weekly:**
- [ ] Review pending approvals
- [ ] Update job postings status
- [ ] Check system notifications

**Monthly:**
- [ ] Process payroll
- [ ] Employee data audit
- [ ] Generate HR reports
- [ ] Review compliance flags

**Quarterly:**
- [ ] Performance cycle management
- [ ] Department headcount planning
- [ ] Training needs assessment
- [ ] System backup verification

---

For advanced topics and policy guidance, refer to the HR Policy Handbook.

**Questions?** Contact: System-admin@your-company.com 📧
