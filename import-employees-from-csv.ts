/**
 * Employee Data Import Script
 * Imports employee data from CSV file
 * 
 * Usage: tsx scripts/migration/import-employees-from-csv.ts employees.csv
 */
import { PrismaClient } from '@hris/database';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface EmployeeImportRow {
  employeeNumber: string;
  firstName: string;
  firstNameAr?: string;
  lastName: string;
  lastNameAr?: string;
  email: string;
  phone: string;
  hireDate: string;
  departmentCode: string;
  position: string;
  positionAr?: string;
  basicSalary?: string;
  housingAllowance?: string;
  transportAllowance?: string;
}

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

async function importEmployees(csvFilePath: string, companyId: string): Promise<ImportStats> {
  const stats: ImportStats = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
  };

  // Read CSV file
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const records: EmployeeImportRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  stats.total = records.length;

  console.log(`📁 Found ${stats.total} records in CSV`);
  console.log('🔄 Starting import...\n');

  // Get all departments once
  const departments = await prisma.department.findMany({
    where: { company_id: companyId },
  });
  const deptMap = new Map(departments.map(d => [d.code, d.id]));

  // Get all leave types for this company
  const leaveTypes = await prisma.leaveType.findMany({
    where: { company_id: companyId },
  });

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNumber = i + 2; // +2 because CSV is 1-indexed and has header

    try {
      // Validate required fields
      if (!row.employeeNumber || !row.firstName || !row.lastName || !row.email) {
        throw new Error('Missing required fields');
      }

      // Check if employee already exists
      const existing = await prisma.employee.findFirst({
        where: {
          OR: [
            { employee_number: row.employeeNumber },
            { email: row.email.toLowerCase() },
          ],
        },
      });

      if (existing) {
        throw new Error(`Employee already exists: ${row.employeeNumber}`);
      }

      // Find department
      const departmentId = deptMap.get(row.departmentCode);
      if (!departmentId) {
        throw new Error(`Department not found: ${row.departmentCode}`);
      }

      // Create user account
      const hashedPassword = await bcrypt.hash('ChangeMe123!', 12);
      const user = await prisma.user.create({
        data: {
          email: row.email.toLowerCase(),
          password_hash: hashedPassword,
          company_id: companyId,
          roles: ['EMPLOYEE'],
          permissions: ['employee:read:own', 'attendance:*:own'],
        },
      });

      // Create employee
      const employee = await prisma.employee.create({
        data: {
          company_id: companyId,
          user_id: user.id,
          employee_number: row.employeeNumber,
          first_name: row.firstName,
          first_name_ar: row.firstNameAr || null,
          last_name: row.lastName,
          last_name_ar: row.lastNameAr || null,
          email: row.email.toLowerCase(),
          phone: row.phone,
          hire_date: new Date(row.hireDate),
          department_id: departmentId,
          position: row.position,
          position_ar: row.positionAr || null,
          status: 'ACTIVE',
        },
      });

      // Create salary structure if provided
      if (row.basicSalary) {
        await prisma.salaryStructure.create({
          data: {
            employee_id: employee.id,
            basic_salary: parseFloat(row.basicSalary),
            housing_allowance: row.housingAllowance ? parseFloat(row.housingAllowance) : 0,
            transport_allowance: row.transportAllowance ? parseFloat(row.transportAllowance) : 0,
            effective_from: new Date(row.hireDate),
          },
        });
      }

      // Initialize leave balances
      const currentYear = new Date().getFullYear();
      for (const leaveType of leaveTypes) {
        await prisma.leaveBalance.create({
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

      stats.success++;
      console.log(`✅ Row ${rowNumber}: ${row.firstName} ${row.lastName} (${row.employeeNumber})`);

    } catch (error) {
      stats.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      stats.errors.push({ row: rowNumber, error: errorMsg });
      console.error(`❌ Row ${rowNumber}: ${errorMsg}`);
    }
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: tsx import-employees-from-csv.ts <csv-file> [company-id]');
    console.error('\nCSV Format:');
    console.error('employeeNumber,firstName,firstNameAr,lastName,lastNameAr,email,phone,hireDate,departmentCode,position,positionAr,basicSalary,housingAllowance,transportAllowance');
    console.error('\nExample:');
    console.error('EMP001,Ahmed,أحمد,Al-Farsi,الفارسي,ahmed@company.com,+966501234567,2020-01-15,ENG,Manager,مدير,20000,8000,2000');
    process.exit(1);
  }

  const csvFile = args[0];
  const companyId = args[1] || await getDefaultCompanyId();

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ File not found: ${csvFile}`);
    process.exit(1);
  }

  console.log('\n🚀 Employee Import Tool\n');
  console.log(`📄 CSV File: ${csvFile}`);
  console.log(`🏢 Company ID: ${companyId}\n`);

  const stats = await importEmployees(csvFile, companyId);

  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary');
  console.log('='.repeat(50));
  console.log(`Total Records:  ${stats.total}`);
  console.log(`✅ Successful:  ${stats.success}`);
  console.log(`❌ Failed:      ${stats.failed}`);

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach(err => {
      console.log(`   Row ${err.row}: ${err.error}`);
    });
  }

  console.log('\n✨ Import complete!');
}

async function getDefaultCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({
    orderBy: { created_at: 'asc' },
  });
  
  if (!company) {
    throw new Error('No companies found. Please create a company first.');
  }
  
  return company.id;
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
