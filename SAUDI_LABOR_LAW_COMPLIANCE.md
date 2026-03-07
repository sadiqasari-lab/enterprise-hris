# Saudi Labor Law Compliance Documentation

Compliance matrix for Enterprise HRIS Platform with Saudi Arabia Labor Law requirements.

---

## Overview

This document maps HRIS features to Saudi Arabia Labor Law (Royal Decree No. M/51) requirements.

**Last Updated:** February 2026  
**Law Reference:** Saudi Labor Law (2005) and amendments  
**Scope:** Private sector employment

---

## Working Hours Compliance

### Article 98: Maximum Working Hours

**Legal Requirement:**
- Maximum 8 hours/day or 48 hours/week
- Ramadan: Reduced to 6 hours/day for Muslims
- Exception: Can extend to 9 hours/day if weekly hours don't exceed 48

**HRIS Implementation:**
✅ **Attendance Module**
- Tracks daily hours via check-in/check-out
- Flags records exceeding 8 hours
- Weekly aggregation with overtime calculation
- Ramadan mode (configurable)

**Verification:**
```sql
-- Query to find violations
SELECT employee_id, date, total_hours
FROM attendance_records
WHERE total_hours > 8
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

---

### Article 99: Overtime Pay

**Legal Requirement:**
- Overtime paid at 150% of hourly rate
- If overtime is on rest day/holiday: 150% first 5 hours, then 200%

**HRIS Implementation:**
✅ **Payroll Module**
- Overtime hours calculated automatically
- Overtime rate: 1.5x for regular days
- Weekend/holiday overtime: Configurable rates
- Included in payslip breakdown

**Configuration:**
```typescript
// In payroll calculation
const regularHourlyRate = basicSalary / 208; // 48h/week * 4.33 weeks
const overtimeHours = totalHours - 208;
const overtimePay = overtimeHours * regularHourlyRate * 1.5;
```

---

## Leave Entitlements

### Article 109: Annual Leave

**Legal Requirement:**
- 21 days per year (first 5 years of service)
- 30 days per year (after 5 years of service)
- Cannot be less than 2 weeks annually
- Unused leave carries forward (with limits)

**HRIS Implementation:**
✅ **Leave Module**
- Automatic entitlement based on hire date
- Default: 30 days (configurable)
- Working day calculator (excludes Fri-Sat)
- Balance tracking per year
- Carry-forward logic

**Annual Leave Rules:**
```typescript
function calculateAnnualLeave(hireDate: Date): number {
  const yearsOfService = differenceInYears(new Date(), hireDate);
  return yearsOfService < 5 ? 21 : 30;
}
```

---

### Article 116: Sick Leave

**Legal Requirement:**
- First 30 days: Full pay
- Next 60 days: 75% of pay
- Remaining days: Unpaid
- Medical certificate required after 3 days

**HRIS Implementation:**
✅ **Leave Module**
- Sick leave type configured
- 15 days full pay (configurable)
- Medical certificate upload capability
- Payroll integration for partial pay

**Sick Leave Calculation:**
```typescript
if (sickLeaveDays <= 30) {
  return basicSalary; // 100%
} else if (sickLeaveDays <= 90) {
  return basicSalary * 0.75; // 75%
} else {
  return 0; // Unpaid
}
```

---

### Article 112: Special Leave (Hajj)

**Legal Requirement:**
- 10 days paid leave for Hajj (once during employment)
- For Saudi nationals only

**HRIS Implementation:**
✅ **Leave Module**
- Hajj leave type available
- One-time use flag
- 10 days entitlement
- Nationality check (manual/automated)

---

## Compensation & Benefits

### Article 89: Wage Protection System (WPS)

**Legal Requirement:**
- Salaries paid through WPS-approved banks
- Payment by 10th of following month
- Salary transfer certificate required

**HRIS Implementation:**
✅ **Payroll Module**
- Bank transfer file generation (SIF format)
- Payment date tracking
- Integration-ready for WPS upload
- Salary certificate generation

**WPS File Format:**
```csv
Employee ID,Employee Name,Bank Account,Amount,Payment Date
EMP001,Ahmed Al-Farsi,SA1234567890,21375.00,2026-03-01
```

---

### Article 41: Employment Contract

**Legal Requirement:**
- Written contract in Arabic
- Copy provided to employee within 2 months
- Includes: job title, salary, benefits, start date

**HRIS Implementation:**
✅ **Document Module**
- Contract template storage
- Arabic + English versions
- Digital signature workflow
- Version control
- Employee access to download

---

### Article 77: End of Service Benefits

**Legal Requirement:**
- Half month salary per year (first 5 years)
- One month salary per year (after 5 years)
- Calculated on last basic salary

**HRIS Implementation:**
✅ **Termination Module**
- Automatic calculation based on:
  - Hire date
  - Last basic salary
  - Termination type
- Final settlement report

**Calculation:**
```typescript
function calculateEndOfServiceBenefit(
  hireDate: Date,
  terminationDate: Date,
  lastBasicSalary: number
): number {
  const years = differenceInYears(terminationDate, hireDate);
  let benefit = 0;
  
  // First 5 years: 0.5 month per year
  const first5Years = Math.min(years, 5);
  benefit += first5Years * (lastBasicSalary / 2);
  
  // After 5 years: 1 month per year
  if (years > 5) {
    const remaining = years - 5;
    benefit += remaining * lastBasicSalary;
  }
  
  return benefit;
}
```

---

## Social Insurance (GOSI)

### GOSI Law: Employee Contributions

**Legal Requirement:**
- Employee: 9.75% of basic salary
- Employer: 12.00% of basic salary
- Based on basic salary only (excludes allowances)

**HRIS Implementation:**
✅ **Payroll Module**
- Auto-calculation of GOSI
- Based on basic salary component
- Employer + Employee portions tracked
- Monthly GOSI report generation

**GOSI Calculation:**
```typescript
const basicSalary = 15000;
const employeeGOSI = basicSalary * 0.0975; // SAR 1,462.50
const employerGOSI = basicSalary * 0.1200; // SAR 1,800.00
```

---

## Working Week & Holidays

### Article 106: Weekly Rest

**Legal Requirement:**
- Minimum 24 consecutive hours rest per week
- Usually Friday (can be Friday + Saturday)
- Rest day work paid at 150% + compensatory day off

**HRIS Implementation:**
✅ **System Configuration**
- Company settings: Working days = Sun-Thu
- Weekend = Fri-Sat
- Holiday management module
- Attendance flagging for weekend work

**Configuration:**
```typescript
const companySettings = {
  workingDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
  weekendDays: ['FRI', 'SAT'],
  weeklyRestHours: 24
};
```

---

### Public Holidays

**Legal Requirement:**
- Eid al-Fitr: 4 days
- Eid al-Adha: 4 days
- National Day (Sept 23): 1 day
- Foundation Day (Feb 22): 1 day

**HRIS Implementation:**
✅ **Holiday Module**
- Pre-configured Saudi holidays
- Automatic date calculation (Islamic calendar)
- Leave request validation excludes holidays
- Payroll working day calculation

**Holiday Configuration:**
```typescript
const saudiHolidays2026 = [
  { name: 'Foundation Day', date: '2026-02-22' },
  { name: 'National Day', date: '2026-09-23' },
  { name: 'Eid al-Fitr', startDate: '2026-03-20', days: 4 },
  { name: 'Eid al-Adha', startDate: '2026-06-06', days: 4 }
];
```

---

## Termination & Resignation

### Article 75: Notice Period

**Legal Requirement:**
- Unlimited contract: 60 days notice
- Limited contract: 30 days notice
- Must be in writing

**HRIS Implementation:**
✅ **Termination Module**
- Notice period tracking
- Resignation date + last working day calculation
- Document upload (resignation letter)
- Manager notification

---

### Article 80: Unlawful Termination

**Legal Requirement:**
- Employer must have valid reason
- Written notice required
- Employee can file labor dispute

**HRIS Implementation:**
✅ **Discipline Module**
- Termination reason required (dropdown)
- Approval workflow
- Document trail
- Exit interview recording

**Valid Termination Reasons:**
```typescript
enum TerminationReason {
  RESIGNATION = 'Employee resignation',
  PERFORMANCE = 'Poor performance (documented)',
  MISCONDUCT = 'Serious misconduct',
  CONTRACT_END = 'End of contract term',
  REDUNDANCY = 'Position redundancy',
  MUTUAL_AGREEMENT = 'Mutual agreement'
}
```

---

## Data Privacy & Records

### Article 8: Employment Records

**Legal Requirement:**
- Maintain employee records for 10 years after termination
- Records in Arabic
- Accessible to Ministry of Labor

**HRIS Implementation:**
✅ **Audit & Archive**
- Soft-delete (data retained)
- 10-year retention policy
- Arabic fields for all records
- Export capability for authorities
- Audit log (all changes tracked)

---

## Compliance Checklist

### Daily Operations
- [ ] Attendance records created for all employees
- [ ] Overtime hours flagged if >8 hours/day
- [ ] Leave requests processed within 24 hours
- [ ] Documents digitally signed and stored

### Monthly Operations
- [ ] Payroll processed by 10th of month
- [ ] GOSI deductions calculated correctly
- [ ] WPS bank file generated and submitted
- [ ] Payslips distributed to employees

### Quarterly Operations
- [ ] Review working hours compliance
- [ ] Audit leave balances accuracy
- [ ] Check end-of-service benefit calculations
- [ ] Update holiday calendar

### Annual Operations
- [ ] Renew annual leave balances
- [ ] Generate labor law compliance report
- [ ] Review employment contracts
- [ ] Archive terminated employee records

---

## Ministry of Labor Reporting

### Required Reports

1. **Monthly Payroll Report**
   - Total employees
   - Total wages paid
   - GOSI contributions

2. **Quarterly Employment Report**
   - New hires
   - Terminations
   - Current headcount
   - Saudization percentage

3. **Annual Statistics**
   - Training hours
   - Leave utilization
   - Overtime hours
   - Turnover rate

**HRIS Export:**
```typescript
// Generate Ministry of Labor export
async function generateMOLReport(quarter: string) {
  const report = {
    quarter,
    newHires: await getNewHires(quarter),
    terminations: await getTerminations(quarter),
    totalEmployees: await getActiveEmployees(),
    saudizationRate: await calculateSaudizationRate(),
    trainingHours: await getTotalTrainingHours(quarter)
  };
  
  return exportToExcel(report, 'MOL_Report_Q1_2026.xlsx');
}
```

---

## Penalties for Non-Compliance

| Violation | Penalty (SAR) |
|-----------|---------------|
| Late salary payment | 3,000 - 10,000 per violation |
| Overtime not paid | 5,000 - 10,000 |
| No written contract | 2,000 - 5,000 per employee |
| GOSI not paid | 10% of unpaid amount |
| Leave rights denied | 5,000 - 10,000 |
| Unlawful termination | 3 months salary compensation |

---

## Audit Trail

All compliance-sensitive operations logged:

```sql
-- Audit log example
SELECT 
  user_id,
  action,
  resource_type,
  details,
  created_at
FROM audit_logs
WHERE resource_type IN ('payroll_cycle', 'leave_request', 'termination')
ORDER BY created_at DESC;
```

---

## Contact Information

**Ministry of Human Resources and Social Development (HRSD)**
- Website: https://www.hrsd.gov.sa
- Tel: 19911
- Email: info@hrsd.gov.sa

**General Organization for Social Insurance (GOSI)**
- Website: https://www.gosi.gov.sa
- Tel: 8001243344
- Email: customercare@gosi.gov.sa

---

## Disclaimer

This document provides guidance on HRIS system compliance with Saudi Labor Law. It does not constitute legal advice. Consult qualified legal counsel for specific situations and ongoing regulatory changes.

**Regular Review:** This compliance matrix should be reviewed quarterly and updated when labor law changes occur.
