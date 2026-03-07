/**
 * Database Seed Script
 * Creates demo data for development and testing
 * 
 * Usage: pnpm --filter @hris/api seed
 */
import { PrismaClient } from '@hris/database';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── 1. Create Companies ────────────────────────────────────────────────
  console.log('Creating companies...');
  const alnoor = await prisma.company.create({
    data: {
      name: 'Al-Noor Holdings',
      name_ar: 'شركة النور القابضة',
      code: 'ANH',
      settings: {
        workingDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'], // Saudi week
        defaultLeaveTypes: ['ANNUAL', 'SICK', 'EMERGENCY'],
      },
    },
  });

  const techstar = await prisma.company.create({
    data: {
      name: 'TechStar LLC',
      name_ar: 'شركة تيك ستار',
      code: 'TSL',
    },
  });

  console.log(`  ✓ ${alnoor.name} (${alnoor.code})`);
  console.log(`  ✓ ${techstar.name} (${techstar.code})\n`);

  // ── 2. Create Users (for auth) ─────────────────────────────────────────
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('Hris2026!', 12);

  const superAdminUser = await prisma.user.create({
    data: {
      email: 'admin@system.com',
      password_hash: await bcrypt.hash('Admin123!', 12),
      company_id: alnoor.id,
      roles: ['SUPER_ADMIN'],
      permissions: ['*:*:all'],
    },
  });

  const hrAdminUser = await prisma.user.create({
    data: {
      email: 'hr.admin@alnoor.com',
      password_hash: hashedPassword,
      company_id: alnoor.id,
      roles: ['HR_ADMIN'],
      permissions: ['employee:*:company', 'payroll:*:company', 'leave:*:company'],
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager.eng@alnoor.com',
      password_hash: hashedPassword,
      company_id: alnoor.id,
      roles: ['MANAGER'],
      permissions: ['employee:read:department', 'leave:approve:department'],
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@alnoor.com',
      password_hash: hashedPassword,
      company_id: alnoor.id,
      roles: ['EMPLOYEE'],
      permissions: ['employee:read:own', 'attendance:*:own', 'leave:create:own'],
    },
  });

  console.log(`  ✓ Super Admin: admin@system.com / Admin123!`);
  console.log(`  ✓ HR Admin: hr.admin@alnoor.com / Hris2026!`);
  console.log(`  ✓ Manager: manager.eng@alnoor.com / Hris2026!`);
  console.log(`  ✓ Employee: employee@alnoor.com / Hris2026!\n`);

  // ── 3. Create Departments ──────────────────────────────────────────────
  console.log('Creating departments...');
  const engineering = await prisma.department.create({
    data: {
      company_id: alnoor.id,
      name: 'Engineering',
      name_ar: 'الهندسة',
      code: 'ENG',
    },
  });

  const marketing = await prisma.department.create({
    data: {
      company_id: alnoor.id,
      name: 'Marketing',
      name_ar: 'التسويق',
      code: 'MKT',
    },
  });

  const hr = await prisma.department.create({
    data: {
      company_id: alnoor.id,
      name: 'Human Resources',
      name_ar: 'الموارد البشرية',
      code: 'HR',
    },
  });

  console.log(`  ✓ ${engineering.name} (${engineering.code})`);
  console.log(`  ✓ ${marketing.name} (${marketing.code})`);
  console.log(`  ✓ ${hr.name} (${hr.code})\n`);

  // ── 4. Create Employees ────────────────────────────────────────────────
  console.log('Creating employees...');

  const manager = await prisma.employee.create({
    data: {
      company_id: alnoor.id,
      user_id: managerUser.id,
      employee_number: 'EMP001',
      first_name: 'Ahmed',
      first_name_ar: 'أحمد',
      last_name: 'Al-Farsi',
      last_name_ar: 'الفارسي',
      email: 'manager.eng@alnoor.com',
      phone: '+966501234567',
      hire_date: new Date('2020-01-15'),
      department_id: engineering.id,
      position: 'Engineering Manager',
      position_ar: 'مدير الهندسة',
      status: 'ACTIVE',
    },
  });

  const hrAdmin = await prisma.employee.create({
    data: {
      company_id: alnoor.id,
      user_id: hrAdminUser.id,
      employee_number: 'EMP002',
      first_name: 'Sarah',
      first_name_ar: 'سارة',
      last_name: 'Ahmed',
      last_name_ar: 'أحمد',
      email: 'hr.admin@alnoor.com',
      phone: '+966502345678',
      hire_date: new Date('2019-03-01'),
      department_id: hr.id,
      position: 'HR Administrator',
      position_ar: 'مسؤول الموارد البشرية',
      status: 'ACTIVE',
    },
  });

  const employee1 = await prisma.employee.create({
    data: {
      company_id: alnoor.id,
      user_id: employeeUser.id,
      employee_number: 'EMP003',
      first_name: 'Mohammed',
      first_name_ar: 'محمد',
      last_name: 'Hassan',
      last_name_ar: 'حسن',
      email: 'employee@alnoor.com',
      phone: '+966503456789',
      hire_date: new Date('2021-06-01'),
      department_id: engineering.id,
      manager_id: manager.id,
      position: 'Senior Developer',
      position_ar: 'مطور أول',
      status: 'ACTIVE',
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      company_id: alnoor.id,
      employee_number: 'EMP004',
      first_name: 'Fatima',
      first_name_ar: 'فاطمة',
      last_name: 'Al-Rashid',
      last_name_ar: 'الرشيد',
      email: 'fatima@alnoor.com',
      phone: '+966504567890',
      hire_date: new Date('2022-01-15'),
      department_id: marketing.id,
      position: 'Marketing Specialist',
      position_ar: 'أخصائي تسويق',
      status: 'ACTIVE',
    },
  });

  console.log(`  ✓ ${manager.first_name} ${manager.last_name} (${manager.position})`);
  console.log(`  ✓ ${hrAdmin.first_name} ${hrAdmin.last_name} (${hrAdmin.position})`);
  console.log(`  ✓ ${employee1.first_name} ${employee1.last_name} (${employee1.position})`);
  console.log(`  ✓ ${employee2.first_name} ${employee2.last_name} (${employee2.position})\n`);

  // ── 5. Create Salary Structures ────────────────────────────────────────
  console.log('Creating salary structures...');
  await prisma.salaryStructure.createMany({
    data: [
      {
        employee_id: manager.id,
        basic_salary: 20000,
        housing_allowance: 8000,
        transport_allowance: 2000,
        effective_from: new Date('2024-01-01'),
      },
      {
        employee_id: employee1.id,
        basic_salary: 15000,
        housing_allowance: 6000,
        transport_allowance: 1500,
        effective_from: new Date('2024-01-01'),
      },
      {
        employee_id: employee2.id,
        basic_salary: 12000,
        housing_allowance: 5000,
        transport_allowance: 1200,
        effective_from: new Date('2024-01-01'),
      },
    ],
  });
  console.log('  ✓ 3 salary structures\n');

  // ── 6. Create Leave Types ──────────────────────────────────────────────
  console.log('Creating leave types...');
  const annualLeave = await prisma.leaveType.create({
    data: {
      company_id: alnoor.id,
      name: 'Annual Leave',
      name_ar: 'إجازة سنوية',
      code: 'AL',
      days_per_year: 30,
      is_paid: true,
    },
  });

  const sickLeave = await prisma.leaveType.create({
    data: {
      company_id: alnoor.id,
      name: 'Sick Leave',
      name_ar: 'إجازة مرضية',
      code: 'SL',
      days_per_year: 15,
      is_paid: true,
    },
  });

  const emergencyLeave = await prisma.leaveType.create({
    data: {
      company_id: alnoor.id,
      name: 'Emergency Leave',
      name_ar: 'إجازة طارئة',
      code: 'EL',
      days_per_year: 5,
      is_paid: true,
    },
  });

  console.log(`  ✓ ${annualLeave.name} (${annualLeave.days_per_year} days/year)`);
  console.log(`  ✓ ${sickLeave.name} (${sickLeave.days_per_year} days/year)`);
  console.log(`  ✓ ${emergencyLeave.name} (${emergencyLeave.days_per_year} days/year)\n`);

  // ── 7. Initialize Leave Balances ───────────────────────────────────────
  console.log('Initializing leave balances...');
  const employees = [manager, hrAdmin, employee1, employee2];
  const leaveTypes = [annualLeave, sickLeave, emergencyLeave];

  for (const emp of employees) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employee_id: emp.id,
          leave_type_id: lt.id,
          year: 2026,
          total_days: lt.days_per_year,
          used_days: 0,
          remaining_days: lt.days_per_year,
        },
      });
    }
  }
  console.log(`  ✓ ${employees.length * leaveTypes.length} leave balances initialized\n`);

  // ── 8. Create Sample Leave Requests ────────────────────────────────────
  console.log('Creating sample leave requests...');
  await prisma.leaveRequest.create({
    data: {
      employee_id: employee1.id,
      leave_type_id: annualLeave.id,
      start_date: new Date('2026-02-10'),
      end_date: new Date('2026-02-14'),
      working_days: 5,
      reason: 'Family vacation',
      status: 'PENDING',
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employee_id: employee2.id,
      leave_type_id: sickLeave.id,
      start_date: new Date('2026-02-05'),
      end_date: new Date('2026-02-06'),
      working_days: 2,
      reason: 'Medical appointment',
      status: 'APPROVED',
      approved_by: hrAdminUser.id,
      approved_at: new Date(),
    },
  });

  console.log('  ✓ 2 sample leave requests\n');

  // ── 9. Create Job Postings & Applicants ────────────────────────────────
  console.log('Creating recruitment data...');
  const posting = await prisma.jobPosting.create({
    data: {
      company_id: alnoor.id,
      department_id: engineering.id,
      title: 'Senior Software Developer',
      title_ar: 'مطور برمجيات أول',
      position: 'Software Developer',
      position_ar: 'مطور برمجيات',
      description: 'Looking for an experienced full-stack developer...',
      requirements: '5+ years experience, Node.js, React, PostgreSQL',
      status: 'PUBLISHED',
      posted_date: new Date('2026-01-15'),
    },
  });

  await prisma.applicant.createMany({
    data: [
      {
        job_posting_id: posting.id,
        first_name: 'Ali',
        last_name: 'Ahmed',
        email: 'ali@example.com',
        phone: '+966505555555',
        status: 'INTERVIEW',
        applied_date: new Date('2026-01-18'),
      },
      {
        job_posting_id: posting.id,
        first_name: 'Hana',
        last_name: 'Khaled',
        email: 'hana@example.com',
        phone: '+966506666666',
        status: 'SCREENING',
        applied_date: new Date('2026-01-20'),
      },
    ],
  });

  console.log(`  ✓ 1 job posting (${posting.title})`);
  console.log('  ✓ 2 applicants\n');

  // ── 10. Create Performance Cycle & Goals ───────────────────────────────
  console.log('Creating performance cycle...');
  const cycle = await prisma.performanceCycle.create({
    data: {
      company_id: alnoor.id,
      name: 'Q1 2026 Review',
      name_ar: 'مراجعة الربع الأول 2026',
      cycle_type: 'QUARTERLY',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-03-31'),
      status: 'ACTIVE',
    },
  });

  await prisma.goal.create({
    data: {
      employee_id: employee1.id,
      cycle_id: cycle.id,
      title: 'Migrate legacy services to microservices',
      description: 'Complete migration of 3 legacy monoliths',
      target_date: new Date('2026-03-31'),
      progress: 60,
      status: 'IN_PROGRESS',
    },
  });

  console.log(`  ✓ ${cycle.name}`);
  console.log('  ✓ 1 sample goal\n');

  // ── 11. Create Audit Log Entries ───────────────────────────────────────
  console.log('Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        company_id: alnoor.id,
        user_id: hrAdminUser.id,
        resource_type: 'employee',
        resource_id: employee1.id,
        action: 'CREATE',
        details: { message: 'Employee created during onboarding' },
        ip_address: '192.168.1.1',
      },
      {
        company_id: alnoor.id,
        user_id: managerUser.id,
        resource_type: 'leave_request',
        resource_id: employee1.id,
        action: 'APPROVE',
        details: { message: 'Leave request approved' },
        ip_address: '192.168.1.2',
      },
    ],
  });
  console.log('  ✓ 2 sample audit entries\n');

  console.log('✅ Database seeded successfully!\n');
  console.log('📝 Login credentials:');
  console.log('   Super Admin: admin@system.com / Admin123!');
  console.log('   HR Admin:    hr.admin@alnoor.com / Hris2026!');
  console.log('   Manager:     manager.eng@alnoor.com / Hris2026!');
  console.log('   Employee:    employee@alnoor.com / Hris2026!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
