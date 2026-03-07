# Testing Strategy

Comprehensive testing approach for Enterprise HRIS Platform.

---

## Testing Pyramid

```
           /\
          /  \  E2E Tests (5%)
         /____\
        /      \  Integration Tests (15%)
       /________\
      /          \  Unit Tests (80%)
     /____________\
```

**Philosophy:** Majority unit tests, some integration tests, minimal E2E tests.

---

## 1. Unit Testing

### Current Coverage: 60%+

**Target Coverage:**
- Functions: 70%
- Lines: 65%
- Branches: 60%

### Running Tests

```bash
# All tests
pnpm test

# Specific file
pnpm test employees.service.test.ts

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html
```

### Writing Unit Tests

**Service Layer Tests:**

```typescript
// apps/api/src/modules/employees/employees.service.test.ts
import { EmployeeService } from './employees.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn()
}));

describe('EmployeeService', () => {
  let service: EmployeeService;
  let mockPrisma: any;
  
  beforeEach(() => {
    mockPrisma = {
      employee: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      }
    };
    
    service = new EmployeeService(mockPrisma);
  });
  
  describe('findAll', () => {
    it('should return paginated employees', async () => {
      const mockEmployees = [
        { id: '1', firstName: 'Ahmed', lastName: 'Ali' },
        { id: '2', firstName: 'Fatima', lastName: 'Hassan' }
      ];
      
      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);
      mockPrisma.employee.count.mockResolvedValue(2);
      
      const result = await service.findAll('cmp_1', {
        page: 1,
        limit: 20
      });
      
      expect(result.employees).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith({
        where: { company_id: 'cmp_1', deleted_at: null },
        take: 20,
        skip: 0
      });
    });
    
    it('should filter by department', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      
      await service.findAll('cmp_1', {
        departmentId: 'dept_1',
        page: 1,
        limit: 20
      });
      
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            department_id: 'dept_1'
          })
        })
      );
    });
  });
  
  describe('create', () => {
    it('should create employee with user account', async () => {
      const employeeData = {
        employeeNumber: 'EMP999',
        firstName: 'Mohammed',
        lastName: 'Hassan',
        email: 'mohammed@test.com',
        departmentId: 'dept_1'
      };
      
      mockPrisma.employee.findFirst.mockResolvedValue(null); // No duplicate
      mockPrisma.employee.create.mockResolvedValue({
        id: 'emp_999',
        ...employeeData
      });
      
      const result = await service.create('cmp_1', employeeData);
      
      expect(result.employeeNumber).toBe('EMP999');
      expect(mockPrisma.employee.create).toHaveBeenCalled();
    });
    
    it('should throw error if employee number exists', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'existing' });
      
      await expect(
        service.create('cmp_1', {
          employeeNumber: 'EMP001',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com'
        })
      ).rejects.toThrow('Employee number already exists');
    });
  });
});
```

**Controller Tests:**

```typescript
// apps/api/src/modules/employees/employees.controller.test.ts
import { Request, Response } from 'express';
import { EmployeeController } from './employees.controller';
import { EmployeeService } from './employees.service';

jest.mock('./employees.service');

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let mockService: jest.Mocked<EmployeeService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  
  beforeEach(() => {
    mockService = new EmployeeService(null as any) as jest.Mocked<EmployeeService>;
    controller = new EmployeeController(mockService);
    
    mockReq = {
      user: { id: 'user_1', companyId: 'cmp_1' },
      params: {},
      query: {},
      body: {}
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });
  
  describe('getAll', () => {
    it('should return employees list', async () => {
      const mockEmployees = {
        employees: [{ id: '1', firstName: 'Ahmed' }],
        total: 1
      };
      
      mockService.findAll = jest.fn().mockResolvedValue(mockEmployees);
      
      await controller.getAll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockEmployees
      });
    });
    
    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockService.findAll = jest.fn().mockRejectedValue(error);
      
      await controller.getAll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
```

---

## 2. Integration Testing

### API Integration Tests

```typescript
// apps/api/tests/integration/employees.test.ts
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Employee API Integration', () => {
  let authToken: string;
  let companyId: string;
  
  beforeAll(async () => {
    // Setup test database
    await prisma.$executeRaw`TRUNCATE TABLE employees CASCADE`;
    
    // Create test company
    const company = await prisma.company.create({
      data: { name: 'Test Company', code: 'TEST' }
    });
    companyId = company.id;
    
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'TestPass123!'
      });
    
    authToken = loginRes.body.data.tokens.accessToken;
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  describe('POST /api/employees', () => {
    it('should create new employee', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeNumber: 'EMP001',
          firstName: 'Ahmed',
          lastName: 'Ali',
          email: 'ahmed@test.com',
          hireDate: '2026-01-01'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employee.firstName).toBe('Ahmed');
    });
    
    it('should return 409 for duplicate employee number', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeNumber: 'EMP001', // Duplicate
          firstName: 'Mohammed',
          lastName: 'Hassan',
          email: 'mohammed@test.com'
        });
      
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
    
    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ firstName: 'Test' });
      
      expect(res.status).toBe(401);
    });
  });
  
  describe('GET /api/employees', () => {
    it('should return paginated employees', async () => {
      const res = await request(app)
        .get('/api/employees?page=1&limit=20')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('employees');
      expect(res.body.data).toHaveProperty('total');
      expect(Array.isArray(res.body.data.employees)).toBe(true);
    });
  });
});
```

### Database Integration Tests

```typescript
// apps/api/tests/integration/database.test.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Integration', () => {
  it('should connect to database', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });
  
  it('should create and retrieve employee', async () => {
    const employee = await prisma.employee.create({
      data: {
        employeeNumber: 'TEST001',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        company_id: 'test_company',
        status: 'ACTIVE'
      }
    });
    
    const retrieved = await prisma.employee.findUnique({
      where: { id: employee.id }
    });
    
    expect(retrieved?.firstName).toBe('Test');
    
    // Cleanup
    await prisma.employee.delete({ where: { id: employee.id } });
  });
  
  it('should enforce foreign key constraints', async () => {
    await expect(
      prisma.employee.create({
        data: {
          employeeNumber: 'TEST002',
          firstName: 'Test',
          lastName: 'User',
          email: 'test2@test.com',
          department_id: 'non_existent_dept', // Should fail
          company_id: 'test_company'
        }
      })
    ).rejects.toThrow();
  });
});
```

---

## 3. End-to-End Testing

### Setup Playwright

```bash
pnpm add -D @playwright/test
npx playwright install
```

**playwright.config.ts:**
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } }
  ]
});
```

### E2E Test Examples

```typescript
// apps/web/tests/e2e/employee-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Employee Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'employee@alnoor.com');
    await page.fill('input[name="password"]', 'Hris2026!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
  });
  
  test('should check in successfully', async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({
      latitude: 24.7136,
      longitude: 46.6753
    });
    
    // Click check-in button
    await page.click('button:has-text("Check In")');
    
    // Verify success message
    await expect(page.locator('text=Checked in successfully')).toBeVisible();
    
    // Verify check-in time displayed
    await expect(page.locator('[data-testid="check-in-time"]')).toBeVisible();
  });
  
  test('should request leave', async ({ page }) => {
    // Navigate to leave page
    await page.click('a:has-text("Leave")');
    
    // Click request button
    await page.click('button:has-text("Request Leave")');
    
    // Fill form
    await page.selectOption('select[name="leaveTypeId"]', 'Annual Leave');
    await page.fill('input[name="startDate"]', '2026-03-10');
    await page.fill('input[name="endDate"]', '2026-03-14');
    await page.fill('textarea[name="reason"]', 'Family vacation');
    
    // Submit
    await page.click('button:has-text("Submit Request")');
    
    // Verify success
    await expect(page.locator('text=Leave request submitted')).toBeVisible();
    
    // Verify appears in list
    await expect(page.locator('text=Family vacation')).toBeVisible();
  });
  
  test('should view payslip', async ({ page }) => {
    await page.click('a:has-text("Payslips")');
    
    // Check table is visible
    await expect(page.locator('table')).toBeVisible();
    
    // Click view on first payslip
    await page.click('button:has-text("View"):first');
    
    // Verify payslip details
    await expect(page.locator('text=Basic Salary')).toBeVisible();
    await expect(page.locator('text=Net Salary')).toBeVisible();
  });
});
```

---

## 4. Load Testing

### Apache Bench

```bash
# Test login endpoint (rate limited to 5 req/s)
ab -n 100 -c 5 -p login.json -T application/json \
   https://hris.your-company.com/api/auth/login

# login.json
{
  "email": "test@test.com",
  "password": "TestPass123!"
}

# Test employees endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
   https://hris.your-company.com/api/employees
```

### K6 Load Testing

```javascript
// tests/load/employees-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 }    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests <500ms
    http_req_failed: ['rate<0.01']    // Error rate <1%
  }
};

const BASE_URL = 'https://hris.your-company.com/api';
let authToken;

export function setup() {
  // Login once to get token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@test.com',
    password: 'TestPass123!'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  return { token: loginRes.json('data.tokens.accessToken') };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  };
  
  // Get employees list
  let res = http.get(`${BASE_URL}/employees`, { headers });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
  
  sleep(1);
  
  // Get single employee
  res = http.get(`${BASE_URL}/employees/emp_123`, { headers });
  check(res, {
    'status is 200': (r) => r.status === 200
  });
  
  sleep(1);
}
```

**Run K6:**
```bash
k6 run tests/load/employees-api.js
```

---

## 5. Test Data Management

### Test Data Generator

```typescript
// apps/api/src/scripts/generate-test-data.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function generateTestData(companyId: string, count: number = 100) {
  console.log(`Generating ${count} test employees...`);
  
  // Create departments
  const departments = [];
  for (let i = 0; i < 5; i++) {
    const dept = await prisma.department.create({
      data: {
        code: `DEPT${i + 1}`,
        name: faker.commerce.department(),
        company_id: companyId
      }
    });
    departments.push(dept);
  }
  
  // Create employees
  const password = await bcrypt.hash('TestPass123!', 12);
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`;
    
    try {
      const user = await prisma.user.create({
        data: {
          email,
          password_hash: password,
          roles: ['EMPLOYEE'],
          company_id: companyId
        }
      });
      
      const employee = await prisma.employee.create({
        data: {
          employee_number: `TEST${String(i + 1).padStart(4, '0')}`,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: `+9665${faker.string.numeric(8)}`,
          hire_date: faker.date.past({ years: 5 }),
          department_id: departments[i % departments.length].id,
          position: faker.person.jobTitle(),
          status: 'ACTIVE',
          company_id: companyId,
          user_id: user.id
        }
      });
      
      // Create salary structure
      await prisma.salaryStructure.create({
        data: {
          employee_id: employee.id,
          basic_salary: faker.number.int({ min: 8000, max: 30000 }),
          housing_allowance: faker.number.int({ min: 3000, max: 12000 }),
          transport_allowance: faker.number.int({ min: 1000, max: 3000 }),
          effective_from: employee.hire_date
        }
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`Generated ${i + 1} employees...`);
      }
    } catch (error) {
      console.error(`Failed to create employee ${i + 1}:`, error.message);
    }
  }
  
  console.log('✅ Test data generation complete!');
}

const companyId = process.argv[2] || 'cmp_test';
const count = parseInt(process.argv[3]) || 100;

generateTestData(companyId, count)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Testing Checklist

**Before Every Release:**
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E critical path tests pass
- [ ] Load test meets performance targets
- [ ] Security scan (npm audit)
- [ ] Code coverage ≥60%
- [ ] Manual exploratory testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness check
- [ ] API documentation updated

---

## CI/CD Integration

Tests run automatically on every push via GitHub Actions (see `.github/workflows/test.yml`).

**Manual test run:**
```bash
# Run all tests
pnpm test:all

# Generate coverage report
pnpm test:coverage

# Upload to codecov (optional)
bash <(curl -s https://codecov.io/bash)
```

---

## Reporting Bugs

When reporting bugs, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Screenshots/videos
4. Browser/environment details
5. API request/response (if applicable)
6. Error logs

Template in GitHub Issues or Jira.
