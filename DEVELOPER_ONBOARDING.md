# Developer Onboarding Guide

Welcome to the Enterprise HRIS development team! This guide will get you up and running.

---

## 👋 Welcome!

You're joining a project that manages HR operations for Saudi Arabian enterprises. Our stack:
- **Backend:** Node.js 20, Express, TypeScript, Prisma
- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Database:** PostgreSQL 16, Redis 7
- **Testing:** Jest
- **Deployment:** Docker, PM2, Nginx

---

## Day 1: Setup Your Environment

### Prerequisites

Install these tools:
```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
npm install -g pnpm

# Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# PostgreSQL client tools
sudo apt install -y postgresql-client

# Git (if not installed)
sudo apt install -y git
```

### Clone the Repository

```bash
# Get repository access from your team lead, then:
git clone https://github.com/your-org/enterprise-hris.git
cd enterprise-hris
```

### Initial Setup

```bash
# 1. Install dependencies (this may take 5-10 minutes)
pnpm install

# 2. Copy environment template
cp deploy/.env.example .env

# 3. Edit with your local settings
nano .env
```

**Minimum .env configuration:**
```env
DATABASE_URL="postgresql://hris_user:password@localhost:5432/hris_db"
JWT_SECRET="dev-secret-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="dev-refresh-secret-min-32-chars"
REDIS_URL="redis://localhost:6379"
```

### Database Setup

```bash
# 1. Start PostgreSQL and Redis (via Docker or local install)
# Option A: Docker
docker compose -f deploy/docker-compose.yml up -d postgres redis

# Option B: Local installation
sudo systemctl start postgresql
sudo systemctl start redis-server

# 2. Create database
createdb hris_db

# 3. Run migrations
pnpx prisma migrate dev --schema packages/database/schema.prisma

# 4. Seed demo data
pnpm --filter @hris/api seed
```

### Start Development Servers

```bash
# Terminal 1: API server (http://localhost:3001)
pnpm --filter @hris/api dev

# Terminal 2: Web server (http://localhost:3000)
pnpm --filter @hris/web dev
```

### Verify Setup

```bash
# Check API health
curl http://localhost:3001/api/health

# Login to web UI
open http://localhost:3000
# Email: hr.admin@alnoor.com
# Password: Hris2026!
```

✅ **If you can login, your environment is ready!**

---

## Day 2: Project Structure & Architecture

### Repository Layout

```
enterprise-hris/
├── apps/
│   ├── api/          # Backend Express API
│   └── web/          # Frontend Next.js app
├── packages/
│   ├── database/     # Prisma schema
│   ├── auth/         # Shared auth utilities
│   └── types/        # Shared TypeScript types
├── scripts/          # Utility scripts
├── deploy/           # Deployment configs
└── docs/             # Documentation
```

### Core Concepts

**1. Multi-company Tenancy**
- Every resource has `company_id`
- RBAC middleware enforces company isolation
- Super Admin can access all companies

**2. Role-Based Access Control (RBAC)**
```typescript
// 6 permission tiers
EMPLOYEE < MANAGER < HR_OFFICER < HR_ADMIN < GM < SUPER_ADMIN

// Example usage in routes:
router.get('/employees',
  authenticate,  // Ensure user is logged in
  requireAnyRole(['HR_OFFICER', 'HR_ADMIN']),  // Check role
  employeeController.list
);
```

**3. API Response Format**
```typescript
// Success
{
  "success": true,
  "data": { /* payload */ }
}

// Error
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

**4. Error Handling**
```typescript
// Always use ApiError for known errors
throw new ApiError(404, 'Employee not found');

// Controllers should use try-catch and next()
try {
  const result = await service.doSomething();
  res.json({ success: true, data: result });
} catch (error) {
  next(error);  // Error middleware handles it
}
```

---

## Day 3: Making Your First Change

### Typical Development Workflow

**1. Create a feature branch:**
```bash
git checkout main
git pull origin main
git checkout -b feature/add-employee-notes
```

**2. Make changes (example: add notes field to employee):**

**Update database schema:**
```prisma
// packages/database/schema.prisma
model Employee {
  // ... existing fields
  notes         String?  // Add this
}
```

**Create migration:**
```bash
pnpx prisma migrate dev --name add_employee_notes --schema packages/database/schema.prisma
```

**Update service:**
```typescript
// apps/api/src/modules/employees/employee.service.ts
async updateEmployee(id: string, data: UpdateEmployeeDto) {
  return await prisma.employee.update({
    where: { id },
    data: {
      ...existingFields,
      notes: data.notes  // Add this
    }
  });
}
```

**Update frontend:**
```typescript
// apps/web/app/(hr-admin)/hr-admin/employees/page.tsx
<Textarea
  label="Notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
/>
```

**3. Test your changes:**
```bash
# Run tests
pnpm --filter @hris/api test

# Manual testing
# 1. Restart API server (Ctrl+C and run again)
# 2. Go to http://localhost:3000
# 3. Test the new notes field
```

**4. Commit and push:**
```bash
git add .
git commit -m "feat(employees): add notes field

- Add notes column to Employee model
- Update employee service to handle notes
- Add notes textarea in employee form

Closes #123"

git push origin feature/add-employee-notes
```

**5. Create pull request:**
- Go to GitHub
- Create PR from your branch to `main`
- Fill out PR template
- Request review from team

---

## Common Development Tasks

### Adding a New API Endpoint

```typescript
// 1. Define in routes
// apps/api/src/modules/employees/employee.routes.ts
router.post('/employees/:id/assign-equipment',
  authenticate,
  requireAnyRole(['HR_OFFICER', 'HR_ADMIN']),
  employeeController.assignEquipment.bind(employeeController)
);

// 2. Implement in controller
// apps/api/src/modules/employees/employee.controller.ts
async assignEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await this.employeeService.assignEquipment(
      req.params.id,
      req.body.equipmentId
    );
    res.json({ success: true, data: { assignment: result } });
  } catch (error) {
    next(error);
  }
}

// 3. Implement in service
// apps/api/src/modules/employees/employee.service.ts
async assignEquipment(employeeId: string, equipmentId: string) {
  // Validate employee exists
  const employee = await this.prisma.employee.findUnique({
    where: { id: employeeId }
  });
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }
  
  // Create assignment
  return await this.prisma.equipmentAssignment.create({
    data: { employeeId, equipmentId, assignedDate: new Date() }
  });
}

// 4. Write test
// apps/api/src/modules/employees/__tests__/employee.service.test.ts
it('assigns equipment to employee', async () => {
  mockFindUnique.mockResolvedValue({ id: 'emp-1' });
  mockCreate.mockResolvedValue({
    id: 'assign-1',
    employeeId: 'emp-1',
    equipmentId: 'eq-1'
  });
  
  const result = await service.assignEquipment('emp-1', 'eq-1');
  
  expect(result.equipmentId).toBe('eq-1');
  expect(mockCreate).toHaveBeenCalledTimes(1);
});
```

### Adding a New Frontend Page

```typescript
// 1. Create page file
// apps/web/app/(hr-admin)/hr-admin/equipment/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  
  useEffect(() => {
    loadEquipment();
  }, []);
  
  async function loadEquipment() {
    const res = await apiClient.getEquipment();
    setEquipment(res.data.equipment);
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Equipment Management</h1>
      <Table data={equipment} columns={/* ... */} />
    </div>
  );
}

// 2. Add API client method
// apps/web/lib/api/client.ts
export const apiClient = {
  // ... existing methods
  
  getEquipment: async () => {
    const response = await axios.get('/equipment');
    return response.data;
  }
};

// 3. Add to navigation
// apps/web/components/layout/sidebar.tsx
<NavItem href="/hr-admin/equipment" icon={BoxIcon}>
  Equipment
</NavItem>
```

---

## Debugging Tips

### Backend Debugging

**View logs:**
```bash
# API logs
pnpm --filter @hris/api dev  # Shows logs in console

# Or with PM2 (production)
pm2 logs hris-api --lines 100
```

**Database queries:**
```bash
# Enable query logging
export DEBUG="prisma:query"
pnpm --filter @hris/api dev

# Or in Prisma Studio
pnpx prisma studio --schema packages/database/schema.prisma
```

**Test specific endpoint:**
```bash
# Use curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr.admin@alnoor.com","password":"Hris2026!"}'

# Or use Postman collection
# Import: testing/postman-collection.json
```

### Frontend Debugging

**React DevTools:**
- Install React DevTools browser extension
- Inspect component props/state

**Network tab:**
- Chrome DevTools → Network
- Filter by "XHR" to see API calls
- Check request/response

**Console logging:**
```typescript
console.log('Data:', data);  // During development only
// Remove before committing!
```

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm --filter @hris/api test

# Run specific test file
pnpm --filter @hris/api test employee.service.test.ts

# Watch mode (re-runs on file changes)
pnpm --filter @hris/api test:watch

# Coverage report
pnpm --filter @hris/api test:coverage
```

### Writing Tests

```typescript
// apps/api/src/modules/feature/__tests__/feature.service.test.ts
import { FeatureService } from '../feature.service';
import { prismaMock } from '../../../test/prisma-mock';

describe('FeatureService', () => {
  let service: FeatureService;
  
  beforeEach(() => {
    service = new FeatureService();
    jest.clearAllMocks();
  });
  
  it('creates a feature successfully', async () => {
    // Arrange
    const mockData = { name: 'Test Feature' };
    prismaMock.feature.create.mockResolvedValue({
      id: 'feat-1',
      ...mockData
    });
    
    // Act
    const result = await service.create(mockData);
    
    // Assert
    expect(result.id).toBe('feat-1');
    expect(result.name).toBe('Test Feature');
  });
  
  it('throws 404 when feature not found', async () => {
    // Arrange
    prismaMock.feature.findUnique.mockResolvedValue(null);
    
    // Act & Assert
    await expect(service.getById('invalid-id'))
      .rejects
      .toThrow(expect.objectContaining({ statusCode: 404 }));
  });
});
```

---

## Code Style & Best Practices

### TypeScript

✅ **Do:**
```typescript
// Always type function parameters and returns
async function getEmployee(id: string): Promise<Employee> {
  // ...
}

// Use interfaces for object shapes
interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
}

// Use enums for fixed sets
enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED'
}
```

❌ **Don't:**
```typescript
// No 'any' types
async function doSomething(data: any) { }  // BAD

// No implicit any
function process(input) { }  // BAD

// Don't ignore errors
try {
  // ...
} catch (e) { }  // BAD - at least log it
```

### React/Next.js

✅ **Do:**
```typescript
// Use TypeScript props
interface Props {
  employee: Employee;
  onEdit: (id: string) => void;
}

export function EmployeeCard({ employee, onEdit }: Props) {
  // ...
}

// Use client-side state management
'use client';  // When using hooks

const [data, setData] = useState<Employee[]>([]);
```

❌ **Don't:**
```typescript
// Don't fetch in Server Components without proper error handling
// Use try-catch and error boundaries

// Don't use inline styles
<div style={{ color: 'red' }}>  // Use Tailwind classes instead
```

---

## Getting Help

### Resources

📖 **Documentation:**
- README.md - Project overview
- API_DOCUMENTATION.md - API reference
- TECHNICAL_ARCHITECTURE.md - System design
- TROUBLESHOOTING_GUIDE.md - Common issues

🔧 **Tools:**
- Postman collection: `testing/postman-collection.json`
- Database viewer: `pnpx prisma studio`
- Logs: `pm2 logs` or check console

👥 **Team:**
- **Slack:** #hris-dev channel
- **Stand-ups:** Daily at 9:30 AM
- **Code Review:** All PRs need 1 approval
- **Office Hours:** Engineering Lead available 2-4 PM

### Common Questions

**Q: How do I reset my local database?**
```bash
pnpx prisma migrate reset --schema packages/database/schema.prisma
pnpm --filter @hris/api seed
```

**Q: My API changes aren't showing up?**
- Restart the dev server (Ctrl+C, then `pnpm --filter @hris/api dev`)
- Check for TypeScript errors in console

**Q: How do I test with different user roles?**
- Use seed data accounts (see README.md for credentials)
- Or create users via Prisma Studio

**Q: Where do I add a new database table?**
- Update `packages/database/schema.prisma`
- Run `pnpx prisma migrate dev --name your_migration_name`

---

## Your First Week

**Day 1-2:** Environment setup, read documentation  
**Day 3-4:** Make a small change (add field, fix bug)  
**Day 5:** Review codebase, understand architecture  
**Week 2:** Pick up your first feature ticket  
**Week 3:** Start code reviews for others  
**Week 4:** Lead a feature implementation  

---

## Checklist for New Developers

- [ ] Environment setup complete
- [ ] Can run API and Web locally
- [ ] Successfully logged into local instance
- [ ] Read README.md and TECHNICAL_ARCHITECTURE.md
- [ ] Made first code change (even if small)
- [ ] Ran tests successfully
- [ ] Submitted first pull request
- [ ] Joined team Slack channels
- [ ] Added to GitHub team
- [ ] Attended first standup

---

**Welcome to the team! Questions? Ask in #hris-dev or ping your tech lead.** 🚀
