# Payroll System with GM Approval - Complete Guide

## System Overview

The payroll system implements a **strict, non-bypassable GM approval workflow** for payroll execution. This ensures proper authorization and audit trail for all salary disbursements.

## Critical Workflow (NON-BYPASSABLE)

```
Step 1: HR Officer Prepares Payroll (DRAFT)
    ↓
Step 2: HR Officer Submits for Review (PENDING_REVIEW)
    ↓
Step 3: HR Admin Reviews & Approves (PENDING_GM_APPROVAL)
    ↓
Step 4: GM FINAL APPROVAL (APPROVED) ⚠️ LOCKS PAYROLL
    ↓
Step 5: HR Admin Executes Payroll (EXECUTED)
```

### Status Flow

- **DRAFT** - Being prepared by HR Officer
- **PENDING_REVIEW** - Awaiting HR Admin review
- **PENDING_GM_APPROVAL** - Awaiting GM final approval ⚠️
- **APPROVED** - GM approved, payroll locked, ready for execution
- **EXECUTED** - Payroll has been executed
- **REJECTED** - Rejected at any stage

## API Workflow

### Step 1: Create Payroll Cycle (HR Officer)

**Endpoint:**
```
POST /api/payroll/cycles
```

**Headers:**
```
Authorization: Bearer {HR_OFFICER_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "periodStart": "2026-02-01",
  "periodEnd": "2026-02-28",
  "employeeIds": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cycle": {
      "id": "cycle-uuid",
      "company_id": "company-uuid",
      "period_start": "2026-02-01T00:00:00Z",
      "period_end": "2026-02-28T23:59:59Z",
      "status": "DRAFT",
      "prepared_by": "hr-officer-user-id",
      "is_locked": false
    }
  },
  "message": "Payroll cycle created successfully"
}
```

### Step 2: Add Payroll Records (HR Officer)

**Endpoint:**
```
POST /api/payroll/cycles/{cycleId}/records
```

**Request:**
```json
{
  "records": [
    {
      "employeeId": "employee-uuid-1",
      "basicSalary": 10000,
      "allowances": {
        "housing": 3000,
        "transport": 1000
      },
      "deductions": {
        "insurance": 500,
        "tax": 300
      },
      "overtimeAmount": 500,
      "bonuses": 1000
    },
    {
      "employeeId": "employee-uuid-2",
      "basicSalary": 15000,
      "allowances": {
        "housing": 4500,
        "transport": 1500
      },
      "deductions": {
        "insurance": 750,
        "tax": 450
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "record-uuid-1",
        "employee_id": "employee-uuid-1",
        "basic_salary": 10000,
        "allowances": {
          "housing": 3000,
          "transport": 1000
        },
        "gross_salary": 15500,
        "total_deductions": 800,
        "net_salary": 14700,
        "employee": {
          "first_name": "Ahmed",
          "last_name": "Ali",
          "employee_number": "EMP001"
        }
      }
    ]
  }
}
```

### Step 3: Submit for Review (HR Officer)

**Endpoint:**
```
POST /api/payroll/cycles/{cycleId}/submit
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cycle": {
      "id": "cycle-uuid",
      "status": "PENDING_REVIEW",
      "records": [...]
    }
  },
  "message": "Payroll submitted for HR Admin review"
}
```

### Step 4: HR Admin Review

**Endpoint:**
```
POST /api/payroll/cycles/{cycleId}/review
```

**Headers:**
```
Authorization: Bearer {HR_ADMIN_TOKEN}
```

**Request (Approve):**
```json
{
  "approved": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cycle": {
      "id": "cycle-uuid",
      "status": "PENDING_GM_APPROVAL",
      "reviewed_by": "hr-admin-user-id",
      "reviewed_at": "2026-02-01T10:30:00Z"
    }
  },
  "message": "Payroll approved and sent to GM for final approval"
}
```

**Request (Reject):**
```json
{
  "approved": false,
  "rejectionReason": "Missing overtime calculations for 3 employees"
}
```

### Step 5: GM FINAL APPROVAL (CRITICAL ⚠️)

**Endpoint:**
```
POST /api/payroll/cycles/{cycleId}/gm-approval
```

**Headers:**
```
Authorization: Bearer {GM_TOKEN}
```

**Important:**
- **ONLY GM can access this endpoint**
- This is the ONLY way to unlock payroll execution
- After GM approval, payroll is LOCKED and cannot be modified

**Request (Approve):**
```json
{
  "approved": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cycle-uuid",
    "status": "APPROVED",
    "approved_by_gm": "gm-user-id",
    "approved_at_gm": "2026-02-01T14:00:00Z",
    "is_locked": true,
    "message": "Payroll approved by GM and locked. Ready for execution.",
    "summary": {
      "totalEmployees": 50,
      "totalGrossSalary": 750000,
      "totalDeductions": 45000,
      "totalNetSalary": 705000
    }
  }
}
```

**Request (Reject):**
```json
{
  "approved": false,
  "rejectionReason": "Need to verify overtime hours for department heads"
}
```

**Response (Rejection):**
```json
{
  "success": true,
  "data": {
    "status": "PENDING_REVIEW",
    "message": "Payroll rejected by GM. Sent back for corrections."
  }
}
```

### Step 6: Execute Payroll (HR Admin - After GM Approval)

**Endpoint:**
```
POST /api/payroll/cycles/{cycleId}/execute
```

**Headers:**
```
Authorization: Bearer {HR_ADMIN_TOKEN}
```

**Request:**
```json
{}
```

**Validation:**
- ✅ Status must be "APPROVED"
- ✅ Must have GM approval record
- ✅ Payroll must be locked
- ❌ Cannot execute without ALL above conditions

**Success Response:**
```json
{
  "success": true,
  "data": {
    "cycle": {
      "id": "cycle-uuid",
      "status": "EXECUTED",
      "executed_by": "hr-admin-user-id",
      "executed_at": "2026-02-01T15:00:00Z"
    }
  },
  "message": "Payroll executed successfully"
}
```

**Error Response (No GM Approval):**
```json
{
  "success": false,
  "error": {
    "message": "Payroll must be approved by GM before execution",
    "code": 403
  }
}
```

## View & Query APIs

### Get All Payroll Cycles

**Endpoint:**
```
GET /api/payroll/cycles?status=PENDING_GM_APPROVAL&year=2026
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cycles": [
      {
        "id": "cycle-uuid",
        "period_start": "2026-02-01",
        "period_end": "2026-02-28",
        "status": "PENDING_GM_APPROVAL",
        "summary": {
          "totalEmployees": 50,
          "totalGrossSalary": 750000,
          "totalNetSalary": 705000
        }
      }
    ]
  }
}
```

### Get Payroll Cycle Details

**Endpoint:**
```
GET /api/payroll/cycles/{cycleId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cycle": {
      "id": "cycle-uuid",
      "status": "APPROVED",
      "is_locked": true,
      "approved_by_gm": "gm-user-id",
      "approved_at_gm": "2026-02-01T14:00:00Z",
      "records": [
        {
          "id": "record-uuid",
          "employee": {
            "first_name": "Ahmed",
            "last_name": "Ali",
            "employee_number": "EMP001"
          },
          "gross_salary": 15500,
          "net_salary": 14700
        }
      ],
      "summary": {
        "totalEmployees": 50,
        "totalGrossSalary": 750000,
        "totalDeductions": 45000,
        "totalNetSalary": 705000
      }
    }
  }
}
```

### Employee Self-Service: My Payslips

**Endpoint:**
```
GET /api/payroll/payslips/my
```

**Headers:**
```
Authorization: Bearer {EMPLOYEE_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payslips": [
      {
        "id": "record-uuid",
        "cycle": {
          "period_start": "2026-02-01",
          "period_end": "2026-02-28",
          "status": "EXECUTED"
        },
        "basic_salary": 10000,
        "allowances": {
          "housing": 3000,
          "transport": 1000
        },
        "gross_salary": 15500,
        "deductions": {
          "insurance": 500,
          "tax": 300
        },
        "total_deductions": 800,
        "net_salary": 14700
      }
    ]
  }
}
```

## Security & Validation

### Role-Based Access Control

| Action | HR Officer | HR Admin | GM | Employee |
|--------|-----------|----------|-----|----------|
| Create Cycle | ✅ | ✅ | ❌ | ❌ |
| Add Records | ✅ | ✅ | ❌ | ❌ |
| Submit for Review | ✅ | ✅ | ❌ | ❌ |
| Review Payroll | ❌ | ✅ | ❌ | ❌ |
| **GM Approval** | ❌ | ❌ | **✅** | ❌ |
| Execute Payroll | ❌ | ✅ | ❌ | ❌ |
| View All Cycles | ❌ | ✅ | ✅ | ❌ |
| View Own Payslip | ❌ | ❌ | ❌ | ✅ |

### Critical Validations

#### 1. GM Approval Validation
```typescript
// ALWAYS validated server-side
if (cycle.status !== 'APPROVED') {
  throw Error('GM approval required');
}

if (!cycle.approved_by_gm) {
  throw Error('GM approval record not found');
}

if (!cycle.is_locked) {
  throw Error('Payroll must be locked');
}
```

#### 2. User Role Validation
```typescript
// Double-checked in service layer
const user = await getUser(userId);
const isGM = user.roles.includes('GM');

if (!isGM) {
  throw Error('Only GM can approve payroll');
}
```

#### 3. Status Flow Validation
```typescript
// Each action requires specific status
const validTransitions = {
  submit: ['DRAFT'],
  review: ['PENDING_REVIEW'],
  gmApproval: ['PENDING_GM_APPROVAL'],
  execute: ['APPROVED']
};
```

## Error Scenarios

### Attempt to Execute Without GM Approval

**Request:**
```
POST /api/payroll/cycles/{cycleId}/execute
```

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Payroll must be approved by GM before execution",
    "code": 403
  }
}
```

### Non-GM User Attempts GM Approval

**Request:**
```
POST /api/payroll/cycles/{cycleId}/gm-approval
Authorization: Bearer {HR_ADMIN_TOKEN}
```

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Access Denied: Only General Manager (GM) can approve payroll for execution",
    "code": 403
  }
}
```

### Attempt to Modify Locked Payroll

**Request:**
```
POST /api/payroll/cycles/{cycleId}/records
```

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Payroll is locked after GM approval and cannot be modified",
    "code": 403
  }
}
```

## Audit Trail

Every payroll action is logged:

```typescript
{
  timestamp: "2026-02-01T14:00:00Z",
  userId: "gm-user-id",
  action: "PAYROLL_GM_APPROVAL",
  resourceType: "payroll_cycle",
  resourceId: "cycle-uuid",
  metadata: {
    status: "APPROVED",
    locked: true,
    totalAmount: 705000
  }
}
```

## Best Practices

### For HR Officers
1. ✅ Prepare payroll carefully - calculate all components
2. ✅ Double-check salary calculations before submitting
3. ✅ Ensure all employees are included
4. ✅ Add clear notes for any special cases

### For HR Admins
1. ✅ Review all calculations thoroughly
2. ✅ Verify overtime and bonuses
3. ✅ Check deductions are correct
4. ✅ Only send to GM when confident
5. ✅ Execute promptly after GM approval

### For GMs
1. ✅ Review payroll summary carefully
2. ✅ Verify total amounts match expectations
3. ✅ Check for any anomalies
4. ✅ Approve only when satisfied
5. ⚠️ Remember: Your approval LOCKS the payroll

### For Employees
1. ✅ Check payslips regularly
2. ✅ Report discrepancies immediately
3. ✅ Keep payslips for records

## Testing Scenarios

### Scenario 1: Happy Path
```
1. HR Officer creates cycle → Status: DRAFT ✅
2. HR Officer adds 50 employee records ✅
3. HR Officer submits → Status: PENDING_REVIEW ✅
4. HR Admin reviews & approves → Status: PENDING_GM_APPROVAL ✅
5. GM approves → Status: APPROVED, is_locked: true ✅
6. HR Admin executes → Status: EXECUTED ✅
```

### Scenario 2: GM Rejects
```
1-4. (Same as above)
5. GM rejects with reason → Status: PENDING_REVIEW ✅
6. HR Officer makes corrections → Status: DRAFT ✅
7. Re-submit and approve flow ✅
```

### Scenario 3: Attempted Bypass (BLOCKED)
```
1-4. (Same as above, but skip step 5)
5. HR Admin tries to execute without GM approval ❌
   Response: "Payroll must be approved by GM" ✅
```

## Database Schema

```sql
CREATE TABLE payroll_cycles (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  status VARCHAR NOT NULL, -- DRAFT, PENDING_REVIEW, PENDING_GM_APPROVAL, APPROVED, EXECUTED
  
  prepared_by VARCHAR NOT NULL,
  prepared_at TIMESTAMP NOT NULL,
  
  reviewed_by VARCHAR,
  reviewed_at TIMESTAMP,
  
  approved_by_gm VARCHAR, -- CRITICAL: GM user ID
  approved_at_gm TIMESTAMP, -- CRITICAL: GM approval timestamp
  
  executed_by VARCHAR,
  executed_at TIMESTAMP,
  
  is_locked BOOLEAN DEFAULT false, -- CRITICAL: Locks after GM approval
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Summary

The payroll system enforces a **strict 5-step workflow** where:
1. **HR Officer** prepares
2. **HR Officer** submits
3. **HR Admin** reviews
4. **GM** gives FINAL approval (locks payroll) ⚠️
5. **HR Admin** executes

**GM approval is MANDATORY and NON-BYPASSABLE.**

This ensures proper authorization, audit trail, and financial controls for all salary disbursements.
