# Contributing to Enterprise HRIS Platform

Thank you for your interest in contributing! This guide will help you get started.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Project Structure](#project-structure)
8. [Common Tasks](#common-tasks)

---

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment. All contributors are expected to:
- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the project and community
- Show empathy towards other contributors

### Unacceptable Behavior
- Harassment, discrimination, or offensive comments
- Trolling, insulting remarks, or personal attacks
- Publishing others' private information
- Any conduct that would be considered unprofessional

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL 14+
- Redis 6+ (optional for local dev)
- Git

### Initial Setup

```bash
# 1. Fork the repository
# Visit https://github.com/your-org/enterprise-hris and click "Fork"

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/enterprise-hris.git
cd enterprise-hris

# 3. Add upstream remote
git remote add upstream https://github.com/your-org/enterprise-hris.git

# 4. Install dependencies
pnpm install

# 5. Setup environment
cp deploy/.env.example .env
# Edit .env with your local database credentials

# 6. Setup database
createdb hris_db
pnpx prisma migrate dev --schema packages/database/schema.prisma
pnpm --filter @hris/api seed

# 7. Start development servers
pnpm --filter @hris/api dev     # Terminal 1
pnpm --filter @hris/web dev     # Terminal 2
```

---

## Development Workflow

### Branching Strategy

We follow a simplified Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch (not yet implemented)
- `feature/your-feature-name` - New features
- `bugfix/issue-description` - Bug fixes
- `hotfix/critical-issue` - Emergency production fixes

### Creating a Feature Branch

```bash
# Update your local main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/add-expense-tracking

# Make your changes...

# Commit with clear messages
git add .
git commit -m "feat(expenses): add expense tracking module

- Create Expense model with categories
- Add expense submission workflow
- Implement approval chain
- Add expense reports page

Closes #123"

# Push to your fork
git push origin feature/add-expense-tracking
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(payroll): add overtime calculation

Implement overtime hours tracking and pay calculation
according to Saudi labor law (1.5x for first 2 hours, 2x after).

Closes #456

---

fix(attendance): correct timezone handling

GPS timestamps were not being converted to company timezone
before validation, causing false positives for late check-ins.

Fixes #789

---

docs(api): update authentication endpoints

Add examples for refresh token flow and document
rate limiting behavior.
```

---

## Coding Standards

### TypeScript

```typescript
// ✅ Good - Type everything
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

async function getEmployee(id: string): Promise<Employee> {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) throw new ApiError(404, 'Employee not found');
  return employee;
}

// ❌ Bad - No types
async function getEmployee(id) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) throw new Error('Not found');
  return employee;
}
```

### Error Handling

```typescript
// ✅ Good - Use ApiError for expected errors
if (!request) {
  throw new ApiError(404, 'Leave request not found');
}

if (request.status !== 'PENDING') {
  throw new ApiError(400, 'Only pending requests can be approved');
}

// ✅ Good - Wrap in try-catch in controllers
async function approveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await leaveService.approve(req.params.id, req.userId!);
    res.json({ success: true, data: { request: result } });
  } catch (error) {
    next(error); // Let error handler middleware deal with it
  }
}

// ❌ Bad - Generic errors, no try-catch
async function approveRequest(req, res) {
  const result = await leaveService.approve(req.params.id, req.userId);
  res.json(result);
}
```

### React/Next.js

```typescript
// ✅ Good - Typed props, clear component structure
interface EmployeeCardProps {
  employee: {
    id: string;
    name: string;
    position: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  onEdit: (id: string) => void;
}

export function EmployeeCard({ employee, onEdit }: EmployeeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{employee.name}</CardTitle>
        <CardDescription>{employee.position}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'destructive'}>
          {employee.status}
        </Badge>
      </CardContent>
    </Card>
  );
}

// ❌ Bad - No types, unclear structure
export function EmployeeCard(props) {
  return (
    <div>
      <h3>{props.employee.name}</h3>
      <span>{props.employee.position}</span>
    </div>
  );
}
```

### Database Queries

```typescript
// ✅ Good - Include related data, handle nulls
const employee = await prisma.employee.findUnique({
  where: { id },
  include: {
    department: true,
    manager: { select: { first_name: true, last_name: true } },
    salary_structure: true,
  },
});

if (!employee) {
  throw new ApiError(404, 'Employee not found');
}

// ❌ Bad - No includes, multiple queries
const employee = await prisma.employee.findUnique({ where: { id } });
const department = await prisma.department.findUnique({ where: { id: employee.department_id } });
const manager = await prisma.employee.findUnique({ where: { id: employee.manager_id } });
```

### Code Style

**Run before committing:**
```bash
# Format with Prettier
pnpm format

# Lint
pnpm --filter @hris/api lint
pnpm --filter @hris/web lint

# Type check
pnpm --filter @hris/api typecheck
pnpm --filter @hris/web typecheck
```

**Key rules:**
- Use 2 spaces for indentation
- Use single quotes for strings
- No semicolons (configured in ESLint)
- Max line length: 100 characters
- Use meaningful variable names
- Add comments for complex logic

---

## Testing Guidelines

### Writing Unit Tests

```typescript
// ✅ Good test structure
describe('LeaveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLeaveRequest', () => {
    it('creates a leave request when balance is sufficient', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue({ id: 'emp-1', company_id: 'c1' });
      mockFindFirst
        .mockResolvedValueOnce({ id: 'lt-1' })             // leave type
        .mockResolvedValueOnce({ remaining_days: 30 })     // balance
        .mockResolvedValueOnce(null);                      // no overlap

      mockCreate.mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
        working_days: 5,
      });

      // Act
      const result = await service.createLeaveRequest({
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-14'),
        reason: 'Vacation',
      });

      // Assert
      expect(result.id).toBe('req-1');
      expect(result.status).toBe('PENDING');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('throws 400 when balance is insufficient', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue({ id: 'emp-1', company_id: 'c1' });
      mockFindFirst
        .mockResolvedValueOnce({ id: 'lt-1' })
        .mockResolvedValueOnce({ remaining_days: 2 });  // Only 2 days left

      // Act & Assert
      await expect(
        service.createLeaveRequest({
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          startDate: new Date('2026-02-10'),
          endDate: new Date('2026-02-14'),
          reason: 'Vacation',
        })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm --filter @hris/api test

# Run specific test file
pnpm --filter @hris/api test leave.service.test.ts

# Watch mode
pnpm --filter @hris/api test:watch

# Coverage report
pnpm --filter @hris/api test:coverage
```

### Coverage Requirements

All PRs must maintain or improve coverage:
- **Lines**: 60%
- **Branches**: 50%
- **Functions**: 60%

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test`)
- [ ] Added tests for new features
- [ ] Updated documentation if needed
- [ ] Commit messages follow convention
- [ ] No console.logs or debugger statements
- [ ] TypeScript compiles without errors
- [ ] Ran linter and fixed all issues

### Submitting a PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "Pull Request"
   - Base: `main` ← Compare: `your-branch`
   - Fill out the PR template:

   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Manual testing completed
   - [ ] All tests passing

   ## Screenshots (if applicable)
   [Add screenshots of UI changes]

   ## Related Issues
   Closes #123
   ```

3. **Review Process**
   - At least 1 approval required
   - All CI checks must pass
   - Address review comments
   - Keep PR up to date with main

4. **After Merge**
   ```bash
   git checkout main
   git pull upstream main
   git branch -d feature/your-feature-name
   ```

---

## Project Structure

```
enterprise-hris/
├── apps/
│   ├── api/                    # Backend API
│   │   └── src/
│   │       ├── modules/        # Feature modules
│   │       │   └── [module]/
│   │       │       ├── [module].service.ts     # Business logic
│   │       │       ├── [module].controller.ts  # HTTP handlers
│   │       │       ├── [module].routes.ts      # Route definitions
│   │       │       └── __tests__/              # Unit tests
│   │       ├── middleware/     # Express middleware
│   │       └── server.ts       # App entry point
│   └── web/                    # Next.js frontend
│       ├── app/                # App Router pages
│       ├── components/         # React components
│       └── lib/                # Utilities
├── packages/
│   ├── database/               # Prisma schema
│   ├── auth/                   # Auth utilities
│   └── types/                  # Shared types
└── deploy/                     # Deployment configs
```

### Adding a New Feature Module

1. **Create service**
   ```typescript
   // apps/api/src/modules/expenses/expense.service.ts
   import { PrismaClient } from '@hris/database';
   import { ApiError } from '../../middleware/errorHandler';

   const prisma = new PrismaClient();

   export class ExpenseService {
     async createExpense(employeeId: string, data: any) {
       // Business logic here
     }
   }

   export const expenseService = new ExpenseService();
   ```

2. **Create controller**
   ```typescript
   // apps/api/src/modules/expenses/expense.controller.ts
   import { Request, Response, NextFunction } from 'express';
   import { expenseService } from './expense.service';

   export class ExpenseController {
     async create(req: Request, res: Response, next: NextFunction) {
       try {
         const expense = await expenseService.createExpense(
           req.userId!,
           req.body
         );
         res.status(201).json({
           success: true,
           data: { expense },
         });
       } catch (error) {
         next(error);
       }
     }
   }

   export const expenseController = new ExpenseController();
   ```

3. **Create routes**
   ```typescript
   // apps/api/src/modules/expenses/expense.routes.ts
   import { Router } from 'express';
   import { expenseController } from './expense.controller';
   import { authenticate } from '../auth/auth.middleware';
   import { requireAnyRole } from '../../middleware/rbac.middleware';

   const router = Router();

   router.post(
     '/',
     authenticate,
     expenseController.create.bind(expenseController)
   );

   export default router;
   ```

4. **Register in server.ts**
   ```typescript
   import expenseRoutes from './modules/expenses/expense.routes';
   app.use('/api/expenses', expenseRoutes);
   ```

5. **Add tests**
   ```typescript
   // apps/api/src/modules/expenses/__tests__/expense.service.test.ts
   describe('ExpenseService', () => {
     // Your tests here
   });
   ```

---

## Common Tasks

### Adding a Database Migration

```bash
# 1. Edit schema
nano packages/database/schema.prisma

# 2. Create migration
pnpx prisma migrate dev --name add_expense_table --schema packages/database/schema.prisma

# 3. Commit migration files
git add packages/database/migrations/
git commit -m "feat(db): add expense tracking tables"
```

### Adding a UI Component

```typescript
// apps/web/components/ui/expense-form.tsx
'use client'

import { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface ExpenseFormProps {
  onSubmit: (data: ExpenseData) => Promise<void>
}

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  // Implementation
}
```

### Debugging

```bash
# Backend API
# Add breakpoints in VSCode, then:
node --inspect dist/server.js

# View logs
pm2 logs hris-api

# Database queries
# Enable Prisma query logging in .env:
DEBUG="prisma:query"
```

---

## Getting Help

- **Documentation**: Check `/docs` folder and README.md
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Slack**: Join our Slack workspace (link in README)

---

## Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to CONTRIBUTORS.md

Thank you for contributing! 🎉
