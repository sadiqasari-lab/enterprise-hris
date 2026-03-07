#!/usr/bin/env tsx
/**
 * Employee Data Migration Script
 * Import employees from CSV/Excel to HRIS database
 * 
 * Usage: tsx scripts/migration/import-employees.ts employees.csv
 */

import { PrismaClient } from '@hris/database';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface EmployeeImportRow {
  employee_number: string;
  first_name: string;
  first_name_ar?: string;
  last_name: string;
  last_name_ar?: string;
  email: string;
  phone?: string;
  hire_date: string;
  department_code: string;
  manager_email?: string;
  position: string;
  position_ar?: string;
  basic_salary?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  status?: string;
}

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; employee: string; error: string }>;
}

async function importEmployees(filePath: string, companyId: string) {
  console.log(`📥 Importing employees from: ${filePath}`);
  console.log(`🏢 Target company: ${companyId}\n`);

  // Verify company exists
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  // Read and parse CSV
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as EmployeeImportRow[];

  console.log(`📊 Found ${records.length} records to import\n`);

  const stats: ImportStats = {
    total: records.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Create department mapping cache
  const departmentCache = new Map<string, string>();
  const departments = await prisma.department.findMany({
    where: { company_id: companyId },
    select: { id: true, code: true },
  });
  departments.forEach(d => departmentCache.set(d.code, d.id));

  // Process each employee
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // +2 for header + 0-index

    try {
      // Validate required fields
      if (!row.employee_number || !row.first_name || !row.last_name || !row.email) {
        stats.skipped++;
        stats.errors.push({
          row: rowNum,
          employee: row.employee_number || 'UNKNOWN',
          error: 'Missing required fields (employee_number, first_name, last_name, email)',
        });
        continue;
      }

      // Check if employee already exists
      const existing = await prisma.employee.findFirst({
        where: {
          OR: [
            { employee_number: row.employee_number },
            { email: row.email.toLowerCase() },
          ],
          company_id: companyId,
        },
      });

      if (existing) {
        stats.skipped++;
        console.log(`⏭️  Row ${rowNum}: ${row.employee_number} already exists`);
        continue;
      }

      // Get department ID
      const departmentId = departmentCache.get(row.department_code);
      if (!departmentId) {
        stats.failed++;
        stats.errors.push({
          row: rowNum,
          employee: row.employee_number,
          error: `Department code '${row.department_code}' not found`,
        });
        continue;
      }

      // Find manager by email if provided
      let managerId: string | undefined;
      if (row.manager_email) {
        const manager = await prisma.employee.findFirst({
          where: {
            email: row.manager_email.toLowerCase(),
            company_id: companyId,
          },
        });
        if (manager) {
          managerId = manager.id;
        } else {
          console.warn(`⚠️  Row ${rowNum}: Manager ${row.manager_email} not found, proceeding without manager`);
        }
      }

      // Parse hire date
      const hireDate = new Date(row.hire_date);
      if (isNaN(hireDate.getTime())) {
        stats.failed++;
        stats.errors.push({
          row: rowNum,
          employee: row.employee_number,
          error: `Invalid hire_date: ${row.hire_date}`,
        });
        continue;
      }

      // Create employee in transaction
      await prisma.$transaction(async (tx) => {
        // Create user account
        const defaultPassword = `${row.first_name}${new Date().getFullYear()}!`;
        const passwordHash = await bcrypt.hash(defaultPassword, 12);

        const user = await tx.user.create({
          data: {
            email: row.email.toLowerCase(),
            password_hash: passwordHash,
            company_id: companyId,
            roles: ['EMPLOYEE'],
            permissions: ['employee:read:own', 'attendance:*:own', 'leave:create:own'],
          },
        });

        // Create employee record
        const employee = await tx.employee.create({
          data: {
            company_id: companyId,
            user_id: user.id,
            employee_number: row.employee_number,
            first_name: row.first_name,
            first_name_ar: row.first_name_ar,
            last_name: row.last_name,
            last_name_ar: row.last_name_ar,
            email: row.email.toLowerCase(),
            phone: row.phone,
            hire_date: hireDate,
            department_id: departmentId,
            manager_id: managerId,
            position: row.position,
            position_ar: row.position_ar,
            status: row.status || 'ACTIVE',
          },
        });

        // Create salary structure if salary data provided
        if (row.basic_salary) {
          await tx.salaryStructure.create({
            data: {
              employee_id: employee.id,
              basic_salary: row.basic_salary,
              housing_allowance: row.housing_allowance || 0,
              transport_allowance: row.transport_allowance || 0,
              effective_from: hireDate,
            },
          });
        }

        // Initialize leave balances
        const leaveTypes = await tx.leaveType.findMany({
          where: { company_id: companyId },
        });

        const currentYear = new Date().getFullYear();
        for (const leaveType of leaveTypes) {
          await tx.leaveBalance.create({
            data: {
              employee_id: employee.id,
              leave_type_id: leaveType.id,
              year: currentYear,
              total_days: leaveType.days_per_year,
              used_days: 0,
              remaining_days: leaveType.days_per_year,
            },
          });
        }
      });

      stats.success++;
      console.log(`✅ Row ${rowNum}: ${row.employee_number} - ${row.first_name} ${row.last_name}`);

    } catch (error: any) {
      stats.failed++;
      stats.errors.push({
        row: rowNum,
        employee: row.employee_number,
        error: error.message,
      });
      console.error(`❌ Row ${rowNum}: ${row.employee_number} - ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Records:     ${stats.total}`);
  console.log(`✅ Successfully Imported: ${stats.success}`);
  console.log(`⏭️  Skipped (duplicates): ${stats.skipped}`);
  console.log(`❌ Failed:                ${stats.failed}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n⚠️  ERRORS:\n');
    stats.errors.forEach(err => {
      console.log(`Row ${err.row} (${err.employee}): ${err.error}`);
    });
  }

  // Save error report
  if (stats.errors.length > 0) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      file: filePath,
      company: companyId,
      stats,
      errors: stats.errors,
    };

    const reportPath = path.join(
      __dirname,
      `import-errors-${Date.now()}.json`
    );

    fs.writeFileSync(reportPath, JSON.stringify(errorReport, null, 2));
    console.log(`\n📄 Error report saved to: ${reportPath}`);
  }

  return stats;
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: tsx import-employees.ts <csv-file> <company-id>');
    console.error('Example: tsx import-employees.ts employees.csv cmp_123');
    process.exit(1);
  }

  const [filePath, companyId] = args;

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    await importEmployees(filePath, companyId);
    console.log('\n✅ Import completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { importEmployees };
