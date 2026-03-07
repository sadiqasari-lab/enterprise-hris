# Data Migration Guide

Guide for migrating data from legacy HR systems to Enterprise HRIS Platform.

---

## Overview

This guide covers migrating data from:
- Excel spreadsheets
- Legacy HR systems (CSV exports)
- Other database systems
- Google Sheets

---

## Migration Strategy

### Phase 1: Assessment (Week 1)

**Inventory Current Data:**
1. List all data sources
2. Identify data quality issues
3. Document custom fields
4. Map relationships

**Data Quality Checklist:**
```
[ ] Employee records complete?
[ ] Duplicate entries?
[ ] Missing required fields?
[ ] Inconsistent formatting?
[ ] Date formats standardized?
[ ] Phone numbers validated?
[ ] Email addresses unique?
```

### Phase 2: Preparation (Week 2)

**Clean Source Data:**
```bash
# Example: Clean employee CSV
# Remove duplicates, standardize formats, validate emails
python scripts/clean_employee_data.py legacy_employees.csv cleaned_employees.csv
```

**Create Mapping Document:**
```
Legacy Field → HRIS Field
-----------   -----------
emp_id → employeeNumber
fname → firstName
lname → lastName
dept_code → department.code
salary_basic → salaryStructure.basicSalary
```

### Phase 3: Test Migration (Week 3)

1. Migrate to staging environment
2. Validate data integrity
3. Test business logic
4. User acceptance testing

### Phase 4: Production Migration (Week 4)

1. Final data export from legacy system
2. Migration during maintenance window
3. Validation and verification
4. Go-live

---

## Migration Scripts

### 1. Employee Import Script

```typescript
// apps/api/src/scripts/migrate-employees.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface EmployeeCSV {
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hire_date: string;
  department_code: string;
  position: string;
  basic_salary: string;
  housing_allowance: string;
  transport_allowance: string;
  manager_employee_number?: string;
}

async function migrateEmployees(csvPath: string, companyId: string) {
  const employees: EmployeeCSV[] = [];
  
  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => employees.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Found ${employees.length} employees to migrate`);
  
  // First pass: Create departments
  const departmentCodes = [...new Set(employees.map(e => e.department_code))];
  
  for (const code of departmentCodes) {
    await prisma.department.upsert({
      where: { code_company_id: { code, company_id: companyId } },
      update: {},
      create: {
        code,
        name: code, // Update with proper name if available
        company_id: companyId
      }
    });
  }
  
  console.log(`Created ${departmentCodes.length} departments`);
  
  // Second pass: Create employees (without manager relationship)
  const employeeMap = new Map<string, string>(); // employee_number -> id
  
  for (const emp of employees) {
    const department = await prisma.department.findFirst({
      where: { code: emp.department_code, company_id: companyId }
    });
    
    if (!department) {
      console.error(`Department ${emp.department_code} not found for employee ${emp.employee_number}`);
      continue;
    }
    
    try {
      // Create user account
      const hashedPassword = await bcrypt.hash('TempPass123!', 12);
      
      const user = await prisma.user.create({
        data: {
          email: emp.email.toLowerCase(),
          password_hash: hashedPassword,
          roles: ['EMPLOYEE'],
          company_id: companyId
        }
      });
      
      // Create employee
      const employee = await prisma.employee.create({
        data: {
          employee_number: emp.employee_number,
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email.toLowerCase(),
          phone: emp.phone,
          hire_date: new Date(emp.hire_date),
          department_id: department.id,
          position: emp.position,
          status: 'ACTIVE',
          company_id: companyId,
          user_id: user.id
        }
      });
      
      employeeMap.set(emp.employee_number, employee.id);
      
      // Create salary structure
      await prisma.salaryStructure.create({
        data: {
          employee_id: employee.id,
          basic_salary: parseFloat(emp.basic_salary),
          housing_allowance: parseFloat(emp.housing_allowance),
          transport_allowance: parseFloat(emp.transport_allowance),
          effective_from: new Date(emp.hire_date)
        }
      });
      
      console.log(`✓ Migrated employee: ${emp.first_name} ${emp.last_name} (${emp.employee_number})`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${emp.employee_number}:`, error.message);
    }
  }
  
  // Third pass: Update manager relationships
  for (const emp of employees) {
    if (emp.manager_employee_number) {
      const employeeId = employeeMap.get(emp.employee_number);
      const managerId = employeeMap.get(emp.manager_employee_number);
      
      if (employeeId && managerId) {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { manager_id: managerId }
        });
      }
    }
  }
  
  console.log('\n✅ Employee migration complete!');
  console.log(`Total migrated: ${employeeMap.size} / ${employees.length}`);
}

// Run migration
const companyId = process.argv[2];
const csvPath = process.argv[3];

if (!companyId || !csvPath) {
  console.error('Usage: ts-node migrate-employees.ts <companyId> <csvPath>');
  process.exit(1);
}

migrateEmployees(companyId, csvPath)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Usage:**
```bash
npx ts-node apps/api/src/scripts/migrate-employees.ts cmp_123 legacy_employees.csv
```

---

### 2. Leave Balance Import

```typescript
// apps/api/src/scripts/migrate-leave-balances.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parser';

const prisma = new PrismaClient();

interface LeaveBalanceCSV {
  employee_number: string;
  leave_type_code: string;
  year: string;
  total_days: string;
  used_days: string;
}

async function migrateLeaveBalances(csvPath: string, companyId: string) {
  const balances: LeaveBalanceCSV[] = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => balances.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Found ${balances.length} leave balances to migrate`);
  
  for (const balance of balances) {
    // Find employee
    const employee = await prisma.employee.findFirst({
      where: {
        employee_number: balance.employee_number,
        company_id: companyId
      }
    });
    
    if (!employee) {
      console.error(`Employee ${balance.employee_number} not found`);
      continue;
    }
    
    // Find leave type
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        code: balance.leave_type_code,
        company_id: companyId
      }
    });
    
    if (!leaveType) {
      console.error(`Leave type ${balance.leave_type_code} not found`);
      continue;
    }
    
    try {
      const totalDays = parseInt(balance.total_days);
      const usedDays = parseInt(balance.used_days);
      
      await prisma.leaveBalance.upsert({
        where: {
          employee_id_leave_type_id_year: {
            employee_id: employee.id,
            leave_type_id: leaveType.id,
            year: parseInt(balance.year)
          }
        },
        update: {
          used_days: usedDays,
          remaining_days: totalDays - usedDays
        },
        create: {
          employee_id: employee.id,
          leave_type_id: leaveType.id,
          year: parseInt(balance.year),
          total_days: totalDays,
          used_days: usedDays,
          remaining_days: totalDays - usedDays
        }
      });
      
      console.log(`✓ Migrated leave balance: ${balance.employee_number} - ${balance.leave_type_code}`);
    } catch (error) {
      console.error(`✗ Failed to migrate balance for ${balance.employee_number}:`, error.message);
    }
  }
  
  console.log('\n✅ Leave balance migration complete!');
}

const companyId = process.argv[2];
const csvPath = process.argv[3];

if (!companyId || !csvPath) {
  console.error('Usage: ts-node migrate-leave-balances.ts <companyId> <csvPath>');
  process.exit(1);
}

migrateLeaveBalances(companyId, csvPath)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

### 3. Attendance History Import

```typescript
// apps/api/src/scripts/migrate-attendance.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parser';

const prisma = new PrismaClient();

interface AttendanceCSV {
  employee_number: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string; // PRESENT, ABSENT, LATE
}

async function migrateAttendance(csvPath: string, companyId: string) {
  const records: AttendanceCSV[] = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => records.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Found ${records.length} attendance records to migrate`);
  
  let migrated = 0;
  
  for (const record of records) {
    const employee = await prisma.employee.findFirst({
      where: {
        employee_number: record.employee_number,
        company_id: companyId
      }
    });
    
    if (!employee) {
      console.error(`Employee ${record.employee_number} not found`);
      continue;
    }
    
    try {
      const date = new Date(record.date);
      const checkInTime = record.check_in_time ? new Date(`${record.date}T${record.check_in_time}`) : null;
      const checkOutTime = record.check_out_time ? new Date(`${record.date}T${record.check_out_time}`) : null;
      
      let totalHours = null;
      if (checkInTime && checkOutTime) {
        totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      }
      
      await prisma.attendanceRecord.create({
        data: {
          employee_id: employee.id,
          company_id: companyId,
          date,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          status: record.status as any,
          total_hours: totalHours,
          verification_method: 'MANUAL_MIGRATION'
        }
      });
      
      migrated++;
      
      if (migrated % 100 === 0) {
        console.log(`Migrated ${migrated} records...`);
      }
    } catch (error) {
      console.error(`✗ Failed to migrate attendance for ${record.employee_number} on ${record.date}:`, error.message);
    }
  }
  
  console.log(`\n✅ Attendance migration complete! Migrated ${migrated} / ${records.length}`);
}

const companyId = process.argv[2];
const csvPath = process.argv[3];

if (!companyId || !csvPath) {
  console.error('Usage: ts-node migrate-attendance.ts <companyId> <csvPath>');
  process.exit(1);
}

migrateAttendance(companyId, csvPath)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## CSV Templates

### Employee Import Template

```csv
employee_number,first_name,last_name,email,phone,hire_date,department_code,position,basic_salary,housing_allowance,transport_allowance,manager_employee_number
EMP001,Ahmed,Al-Farsi,ahmed@alnoor.com,+966501234567,2020-01-15,ENG,Engineering Manager,25000,10000,2500,
EMP002,Mohammed,Hassan,mohammed@alnoor.com,+966509876543,2021-06-01,ENG,Senior Developer,15000,6000,1500,EMP001
EMP003,Fatima,Abdullah,fatima@alnoor.com,+966505555555,2022-03-10,MKT,Marketing Specialist,12000,4800,1200,
```

### Leave Balance Template

```csv
employee_number,leave_type_code,year,total_days,used_days
EMP001,AL,2026,30,5
EMP001,SL,2026,15,0
EMP001,EL,2026,5,0
EMP002,AL,2026,30,10
EMP002,SL,2026,15,2
```

### Attendance Template

```csv
employee_number,date,check_in_time,check_out_time,status
EMP001,2026-01-05,08:30:00,17:15:00,PRESENT
EMP001,2026-01-06,08:45:00,17:00:00,LATE
EMP001,2026-01-07,,,ABSENT
EMP002,2026-01-05,08:25:00,17:30:00,PRESENT
```

---

## Data Validation

### Pre-Migration Validation Script

```typescript
// apps/api/src/scripts/validate-migration-data.ts
import * as fs from 'fs';
import * as csv from 'csv-parser';

async function validateEmployeeCSV(csvPath: string) {
  const employees: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => employees.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  
  // Check for duplicates
  const employeeNumbers = employees.map(e => e.employee_number);
  const duplicateNumbers = employeeNumbers.filter((num, i) => employeeNumbers.indexOf(num) !== i);
  if (duplicateNumbers.length > 0) {
    errors.push(`Duplicate employee numbers: ${duplicateNumbers.join(', ')}`);
  }
  
  const emails = employees.map(e => e.email.toLowerCase());
  const duplicateEmails = emails.filter((email, i) => emails.indexOf(email) !== i);
  if (duplicateEmails.length > 0) {
    errors.push(`Duplicate emails: ${duplicateEmails.join(', ')}`);
  }
  
  // Validate each record
  for (const emp of employees) {
    // Required fields
    if (!emp.employee_number) errors.push(`Missing employee_number for ${emp.first_name} ${emp.last_name}`);
    if (!emp.first_name) errors.push(`Missing first_name for ${emp.employee_number}`);
    if (!emp.last_name) errors.push(`Missing last_name for ${emp.employee_number}`);
    if (!emp.email) errors.push(`Missing email for ${emp.employee_number}`);
    
    // Email format
    if (emp.email && !emp.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push(`Invalid email format: ${emp.email}`);
    }
    
    // Phone format (Saudi)
    if (emp.phone && !emp.phone.match(/^\+966[0-9]{9}$/)) {
      warnings.push(`Phone ${emp.phone} for ${emp.employee_number} may not be in correct format (+966XXXXXXXXX)`);
    }
    
    // Date format
    if (emp.hire_date && !emp.hire_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errors.push(`Invalid hire_date format for ${emp.employee_number}: ${emp.hire_date} (use YYYY-MM-DD)`);
    }
    
    // Numeric fields
    if (emp.basic_salary && isNaN(parseFloat(emp.basic_salary))) {
      errors.push(`Invalid basic_salary for ${emp.employee_number}: ${emp.basic_salary}`);
    }
  }
  
  // Print report
  console.log('=== VALIDATION REPORT ===\n');
  console.log(`Total records: ${employees.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}\n`);
  
  if (errors.length > 0) {
    console.log('ERRORS:');
    errors.forEach(e => console.log(`  ✗ ${e}`));
    console.log();
  }
  
  if (warnings.length > 0) {
    console.log('WARNINGS:');
    warnings.forEach(w => console.log(`  ⚠ ${w}`));
    console.log();
  }
  
  if (errors.length === 0) {
    console.log('✅ Validation passed! Ready for migration.');
  } else {
    console.log('❌ Validation failed. Fix errors before migrating.');
    process.exit(1);
  }
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: ts-node validate-migration-data.ts <csvPath>');
  process.exit(1);
}

validateEmployeeCSV(csvPath).catch(console.error);
```

---

## Migration Checklist

**Pre-Migration:**
- [ ] Export data from legacy system
- [ ] Clean and standardize data
- [ ] Validate CSV files
- [ ] Backup current HRIS database
- [ ] Test migration on staging
- [ ] Document any custom transformations
- [ ] Notify users of planned downtime

**Migration Day:**
- [ ] Set maintenance mode
- [ ] Create fresh database backup
- [ ] Run employee migration
- [ ] Run leave balance migration
- [ ] Run attendance migration (optional - may be too large)
- [ ] Verify record counts
- [ ] Test login for sample employees
- [ ] Check data integrity

**Post-Migration:**
- [ ] Send password reset emails to all users
- [ ] Verify manager-employee relationships
- [ ] Verify department assignments
- [ ] Check leave balances
- [ ] Test critical workflows (attendance, leave requests, payroll)
- [ ] User acceptance testing
- [ ] Remove maintenance mode
- [ ] Monitor for issues

---

## Rollback Plan

If migration fails:

```bash
# Restore database from backup
pg_restore -U hris_user -d hris_db -c backup_pre_migration.dump

# Or using SQL dump
psql -U hris_user -d hris_db < backup_pre_migration.sql

# Verify restoration
psql -U hris_user -d hris_db -c "SELECT COUNT(*) FROM employees;"
```

---

## Support

For migration assistance:
- Email: migration-support@your-company.com
- Schedule consultation: Book 1-hour migration planning session
