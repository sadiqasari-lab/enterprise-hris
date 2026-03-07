# Enterprise HRIS Platform - Technical Architecture

## Executive Summary

This document outlines the technical architecture for a production-grade Enterprise HRIS Platform designed for multi-company operations in Saudi Arabia with strict compliance, security, and anti-spoofing requirements.

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Web App (Next.js)  │  iOS App  │  Android App              │
│  - Arabic RTL       │  - Native │  - Native                 │
│  - English LTR      │  - API    │  - API                    │
│  - Responsive       │  - Driven │  - Driven                 │
└─────────────────────┬───────────┴───────────────────────────┘
                      │
                      │ HTTPS/REST/JSON
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  - Authentication Middleware                                 │
│  - Rate Limiting                                             │
│  - Request Validation                                        │
│  - CORS Configuration                                        │
│  - API Versioning                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ RBAC Service │  │ Audit Service│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Employee     │  │ Document     │  │ Attendance   │      │
│  │ Management   │  │ Management   │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Payroll      │  │ Leave        │  │ Performance  │      │
│  │ Service      │  │ Management   │  │ Management   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Recruitment  │  │ Training     │  │ Termination  │      │
│  │ (ATS)        │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    DATA ACCESS LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  - Prisma ORM                                                │
│  - Repository Pattern                                        │
│  - Transaction Management                                    │
│  - Query Optimization                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   PERSISTENCE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ PostgreSQL Database  │  │ Redis Cache          │        │
│  │ - Multi-tenant data  │  │ - Session storage    │        │
│  │ - Encrypted at rest  │  │ - Rate limiting      │        │
│  │ - Row-level security │  │ - Real-time data     │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                               │
│  ┌──────────────────────┐                                   │
│  │ File Storage (S3/NFS)│                                   │
│  │ - Documents          │                                   │
│  │ - Selfies            │                                   │
│  │ - Encrypted at rest  │                                   │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Company Architecture

### Data Isolation Strategy

Every table that contains company-specific data includes a `company_id` foreign key.

**Row-Level Security (RLS) Implementation:**

```sql
-- Example: Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  -- other fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_employees_company_id ON employees(company_id);

-- Application-level enforcement
-- Every query automatically filters by company_id
SELECT * FROM employees WHERE company_id = $1;
```

**Middleware Enforcement:**

```typescript
// Multi-company middleware
export const companyIsolationMiddleware = async (req, res, next) => {
  const user = req.user; // from auth middleware
  const companyId = user.company_id;
  
  // Inject company_id into all queries
  req.companyId = companyId;
  
  next();
};
```

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────┐                                      ┌─────────┐
│ Client  │                                      │ Server  │
└────┬────┘                                      └────┬────┘
     │                                                │
     │  1. POST /api/auth/login                      │
     │  { email, password }                          │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                                │ 2. Validate credentials
     │                                                │    Hash password + compare
     │                                                │
     │  3. Return JWT tokens                         │
     │  { accessToken, refreshToken }                │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  4. Store tokens (httpOnly cookie or storage) │
     │                                                │
     │                                                │
     │  5. Subsequent requests                       │
     │  Authorization: Bearer {accessToken}          │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                                │ 6. Verify JWT
     │                                                │    Extract user info
     │                                                │    Check permissions
     │                                                │
     │  7. Return protected resource                 │
     │◄──────────────────────────────────────────────┤
     │                                                │
```

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  companyId: string;
  roles: string[];
  permissions: string[];
  iat: number;  // issued at
  exp: number;  // expiration
}
```

### RBAC Model

**Entities:**

```typescript
// Role
interface Role {
  id: string;
  name: string;
  description: string;
  company_id: string | null; // null = system role
  permissions: Permission[];
}

// Permission
interface Permission {
  id: string;
  resource: string;      // e.g., 'employees', 'payroll'
  action: string;        // e.g., 'create', 'read', 'update', 'delete'
  scope: 'own' | 'department' | 'company' | 'all';
}

// UserRole
interface UserRole {
  user_id: string;
  role_id: string;
  company_id: string;
}
```

**Permission Checking:**

```typescript
// Middleware example
export const checkPermission = (resource: string, action: string) => {
  return async (req, res, next) => {
    const user = req.user;
    const hasPermission = await rbacService.checkPermission(
      user.id,
      resource,
      action,
      req.companyId
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage
router.post('/api/employees', 
  authenticate,
  checkPermission('employees', 'create'),
  createEmployee
);
```

**Manager Hierarchy Validation:**

```typescript
// Managers can only access their reporting hierarchy
export const validateManagerAccess = async (managerId: string, employeeId: string) => {
  const hierarchy = await getReportingHierarchy(managerId);
  return hierarchy.includes(employeeId);
};
```

---

## Attendance System Architecture

### Anti-Spoofing Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    MOBILE APP                             │
├──────────────────────────────────────────────────────────┤
│  1. Collect Data:                                         │
│     - GPS coordinates (lat, lng, accuracy, altitude)      │
│     - Selfie (camera capture, no gallery)                │
│     - WiFi SSID (connected network)                      │
│     - Device fingerprint (model, OS, instance ID)        │
│                                                            │
│  2. Send to Server:                                       │
│     POST /api/mobile/attendance/check-in                  │
│     {                                                      │
│       gps: { lat, lng, accuracy, altitude, speed },      │
│       selfie: "base64_image_data",                       │
│       wifi_ssid: "Office_Network",                       │
│       device: { model, os, instance_id }                 │
│     }                                                      │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ HTTPS
                   │
┌──────────────────▼───────────────────────────────────────┐
│                SERVER-SIDE VALIDATION                     │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 1. GPS ANTI-SPOOFING                            │    │
│  │   - Validate accuracy < 50m                     │    │
│  │   - Check geofence (distance from office)       │    │
│  │   - Detect abnormal jumps                       │    │
│  │   - Flag low-accuracy signals                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 2. SELFIE VERIFICATION                          │    │
│  │   - Validate image metadata (camera capture)    │    │
│  │   - Check image size/resolution                 │    │
│  │   - Detect duplicate images (hash comparison)   │    │
│  │   - Optional: Face recognition                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 3. WIFI VALIDATION                              │    │
│  │   - Check SSID against whitelist                │    │
│  │   - Validate network availability               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 4. DEVICE BINDING                               │    │
│  │   - Verify registered device                    │    │
│  │   - Check device fingerprint                    │    │
│  │   - Flag new devices                            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 5. BEHAVIOR ANALYSIS                            │    │
│  │   - Rate limiting (prevent rapid check-ins)     │    │
│  │   - Time window validation                      │    │
│  │   - Pattern detection                           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 6. RULE ENGINE                                  │    │
│  │   - Evaluate combination rules                  │    │
│  │   - Apply location-specific rules               │    │
│  │   - Generate validation result                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 7. AUDIT LOGGING                                │    │
│  │   - Log all data points                         │    │
│  │   - Flag suspicious entries                     │    │
│  │   - Create immutable audit record               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                            │
│  Return: { success: true/false, flags: [...] }           │
└──────────────────────────────────────────────────────────┘
```

### GPS Anti-Spoofing Implementation

```typescript
interface GPSValidationResult {
  isValid: boolean;
  flags: string[];
  distance: number; // meters from office
}

async function validateGPS(
  gps: { lat: number; lng: number; accuracy: number },
  locationId: string
): Promise<GPSValidationResult> {
  const location = await getAttendanceLocation(locationId);
  const flags: string[] = [];
  
  // 1. Check accuracy threshold
  if (gps.accuracy > 50) {
    flags.push('GPS_LOW_ACCURACY');
  }
  
  // 2. Calculate distance from office
  const distance = calculateDistance(
    gps.lat,
    gps.lng,
    location.latitude,
    location.longitude
  );
  
  // 3. Check geofence
  if (distance > location.radius_meters) {
    flags.push('GPS_OUTSIDE_GEOFENCE');
  }
  
  // 4. Check for abnormal jumps
  const lastLocation = await getLastAttendanceLocation(userId);
  if (lastLocation) {
    const timeDiff = Date.now() - lastLocation.timestamp;
    const distanceDiff = calculateDistance(
      gps.lat,
      gps.lng,
      lastLocation.lat,
      lastLocation.lng
    );
    
    // If moved > 100km in < 10 minutes, flag it
    if (distanceDiff > 100000 && timeDiff < 600000) {
      flags.push('GPS_ABNORMAL_JUMP');
    }
  }
  
  return {
    isValid: flags.length === 0,
    flags,
    distance
  };
}
```

### Selfie Verification Implementation

```typescript
interface SelfieValidationResult {
  isValid: boolean;
  flags: string[];
  imageHash: string;
}

async function validateSelfie(
  selfieBase64: string,
  userId: string
): Promise<SelfieValidationResult> {
  const flags: string[] = [];
  
  // 1. Decode and validate image
  const imageBuffer = Buffer.from(selfieBase64, 'base64');
  const metadata = await getImageMetadata(imageBuffer);
  
  // 2. Check if from camera (not gallery)
  // This is approximate - check for EXIF data inconsistencies
  if (!metadata.cameraMake || !metadata.dateTimeOriginal) {
    flags.push('SELFIE_NO_CAMERA_METADATA');
  }
  
  // 3. Check image size/resolution (too small = suspicious)
  if (metadata.width < 480 || metadata.height < 640) {
    flags.push('SELFIE_LOW_RESOLUTION');
  }
  
  // 4. Calculate image hash
  const imageHash = await calculateImageHash(imageBuffer);
  
  // 5. Check for duplicate images
  const recentSelfies = await getRecentSelfieHashes(userId, 30); // last 30 days
  if (recentSelfies.includes(imageHash)) {
    flags.push('SELFIE_DUPLICATE_IMAGE');
  }
  
  // 6. Optional: Face recognition
  // if (faceRecognitionEnabled) {
  //   const employeePhoto = await getEmployeePhoto(userId);
  //   const faceMatch = await compareFaces(imageBuffer, employeePhoto);
  //   if (faceMatch.confidence < 0.8) {
  //     flags.push('SELFIE_FACE_MISMATCH');
  //   }
  // }
  
  return {
    isValid: flags.length === 0,
    flags,
    imageHash
  };
}
```

### Attendance Rule Engine

```typescript
interface AttendanceRule {
  id: string;
  company_id: string;
  location_id: string;
  require_gps: boolean;
  require_selfie: boolean;
  require_wifi: boolean;
  require_device_binding: boolean;
  allowed_check_in_start: string; // HH:mm
  allowed_check_in_end: string;   // HH:mm
}

async function evaluateAttendanceRules(
  checkInData: CheckInData,
  rules: AttendanceRule
): Promise<AttendanceValidationResult> {
  const validations: ValidationResult[] = [];
  
  // GPS validation
  if (rules.require_gps) {
    const gpsResult = await validateGPS(checkInData.gps, rules.location_id);
    validations.push({ type: 'GPS', ...gpsResult });
  }
  
  // Selfie validation
  if (rules.require_selfie) {
    const selfieResult = await validateSelfie(checkInData.selfie, checkInData.userId);
    validations.push({ type: 'SELFIE', ...selfieResult });
  }
  
  // WiFi validation
  if (rules.require_wifi) {
    const wifiResult = await validateWiFi(checkInData.wifi_ssid, rules.location_id);
    validations.push({ type: 'WIFI', ...wifiResult });
  }
  
  // Device binding validation
  if (rules.require_device_binding) {
    const deviceResult = await validateDevice(checkInData.device, checkInData.userId);
    validations.push({ type: 'DEVICE', ...deviceResult });
  }
  
  // Time window validation
  const timeResult = validateTimeWindow(
    new Date(),
    rules.allowed_check_in_start,
    rules.allowed_check_in_end
  );
  validations.push({ type: 'TIME', ...timeResult });
  
  // Aggregate results
  const allValid = validations.every(v => v.isValid);
  const allFlags = validations.flatMap(v => v.flags);
  
  return {
    isValid: allValid,
    validations,
    flags: allFlags,
    requiresHRApproval: allFlags.length > 0
  };
}
```

---

## Document Management & Digital Signature

### Document Signature Workflow

```
┌─────────────────────────────────────────────────────────┐
│                 DOCUMENT SIGNATURE FLOW                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. INITIATION                                           │
│     ┌──────────────────────────────────────────┐       │
│     │ User uploads document                     │       │
│     │ Selects signature workflow template       │       │
│     │ Configures approval chain:                │       │
│     │   - Initiator                             │       │
│     │   - Department Head                       │       │
│     │   - HR                                    │       │
│     │   - Final Signatory (e.g., CEO)          │       │
│     └──────────────────────────────────────────┘       │
│                                                           │
│  2. ROUTING                                              │
│     ┌──────────────────────────────────────────┐       │
│     │ System creates approval chain             │       │
│     │ Sends notification to first approver      │       │
│     │ Document status: PENDING                  │       │
│     └──────────────────────────────────────────┘       │
│                                                           │
│  3. APPROVAL STEPS (for each approver)                  │
│     ┌──────────────────────────────────────────┐       │
│     │ Approver receives notification            │       │
│     │ Approver reviews document                 │       │
│     │ Approver can:                             │       │
│     │   - Approve (sign)                        │       │
│     │   - Reject (with reason)                  │       │
│     │   - Request changes                       │       │
│     │                                            │       │
│     │ If APPROVE:                               │       │
│     │   - Capture digital signature             │       │
│     │   - Record timestamp                      │       │
│     │   - Record IP address                     │       │
│     │   - Record device info                    │       │
│     │   - Move to next approver                 │       │
│     │                                            │       │
│     │ If REJECT:                                │       │
│     │   - Document status: REJECTED             │       │
│     │   - Workflow stops                        │       │
│     │   - Notify initiator                      │       │
│     └──────────────────────────────────────────┘       │
│                                                           │
│  4. COMPLETION                                           │
│     ┌──────────────────────────────────────────┐       │
│     │ All approvers have signed                 │       │
│     │ Document status: APPROVED                 │       │
│     │ Document is LOCKED                        │       │
│     │ Generate signed PDF with all signatures   │       │
│     │ Create immutable audit trail              │       │
│     └──────────────────────────────────────────┘       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Digital Signature Data Model

```typescript
interface DocumentSignature {
  id: string;
  document_id: string;
  document_version_id: string;
  signer_user_id: string;
  signature_data: string; // base64 signature image
  signature_type: 'DIGITAL' | 'ELECTRONIC';
  signed_at: Date;
  ip_address: string;
  user_agent: string;
  device_info: {
    os: string;
    browser: string;
    device_type: string;
  };
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  order_in_chain: number; // 1 = first signer, 2 = second, etc.
}

interface DocumentApprovalChain {
  id: string;
  document_id: string;
  template_id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  current_step: number;
  steps: ApprovalStep[];
}

interface ApprovalStep {
  order: number;
  approver_user_id: string;
  approver_role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  signed_at?: Date;
  rejection_reason?: string;
}
```

### Secure Document Viewer

```typescript
// Document viewer component features:
// - Watermark with user name + timestamp
// - Disable right-click
// - Disable text selection (optional)
// - No download (if restricted)
// - View-only mode
// - Audit trail (track who viewed, when)

interface DocumentViewerProps {
  documentId: string;
  watermark?: {
    enabled: boolean;
    text: string; // e.g., "John Doe - 2026-02-01 14:30"
  };
  restrictions: {
    allowDownload: boolean;
    allowPrint: boolean;
    allowCopy: boolean;
  };
}

// Backend: Log document access
async function logDocumentAccess(
  documentId: string,
  userId: string,
  action: 'VIEW' | 'DOWNLOAD' | 'PRINT'
) {
  await prisma.documentAccessLog.create({
    data: {
      document_id: documentId,
      user_id: userId,
      action,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      timestamp: new Date()
    }
  });
}
```

---

## Payroll System Architecture

### Payroll Workflow (GM Approval Mandatory)

```
┌─────────────────────────────────────────────────────────┐
│              PAYROLL WORKFLOW (STRICT)                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Step 1: PREPARATION (HR Officer)                       │
│     ┌──────────────────────────────────────────┐       │
│     │ - Create payroll cycle                   │       │
│     │ - Add employees                          │       │
│     │ - Calculate salaries                     │       │
│     │ - Add allowances/deductions              │       │
│     │ - Calculate overtime                     │       │
│     │ - Generate payslips                      │       │
│     │                                           │       │
│     │ Status: DRAFT                            │       │
│     └──────────────────────────────────────────┘       │
│                ↓                                         │
│  Step 2: SUBMISSION (HR Officer)                        │
│     ┌──────────────────────────────────────────┐       │
│     │ HR Officer submits for review             │       │
│     │                                            │       │
│     │ Status: PENDING_REVIEW                    │       │
│     │ Notify: HR Admin                          │       │
│     └──────────────────────────────────────────┘       │
│                ↓                                         │
│  Step 3: REVIEW (HR Admin)                              │
│     ┌──────────────────────────────────────────┐       │
│     │ HR Admin reviews payroll                  │       │
│     │ Validates calculations                    │       │
│     │ Can:                                      │       │
│     │   - Approve & send to GM                 │       │
│     │   - Reject & send back to HR Officer    │       │
│     │                                            │       │
│     │ If Approved:                              │       │
│     │   Status: PENDING_GM_APPROVAL             │       │
│     │   Notify: GM                              │       │
│     └──────────────────────────────────────────┘       │
│                ↓                                         │
│  Step 4: FINAL APPROVAL (GM ONLY) ★ CRITICAL ★         │
│     ┌──────────────────────────────────────────┐       │
│     │ GM reviews payroll                        │       │
│     │                                            │       │
│     │ ONLY GM CAN APPROVE                       │       │
│     │ No bypass allowed                         │       │
│     │                                            │       │
│     │ If GM Approves:                           │       │
│     │   Status: APPROVED                        │       │
│     │   Payroll is LOCKED                       │       │
│     │   Cannot be edited                        │       │
│     │                                            │       │
│     │ If GM Rejects:                            │       │
│     │   Status: REJECTED                        │       │
│     │   Send back to HR Officer                │       │
│     └──────────────────────────────────────────┘       │
│                ↓                                         │
│  Step 5: EXECUTION (Automated)                          │
│     ┌──────────────────────────────────────────┐       │
│     │ Payroll execution button enabled          │       │
│     │ ONLY after GM approval                    │       │
│     │                                            │       │
│     │ Execute payroll:                          │       │
│     │   - Generate final payslips               │       │
│     │   - Create payment records                │       │
│     │   - Lock all data                         │       │
│     │                                            │       │
│     │ Status: EXECUTED                          │       │
│     │ Audit: Full trail logged                 │       │
│     └──────────────────────────────────────────┘       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Payroll Approval Validation

```typescript
// Payroll service - approval validation
async function approvePayrollCycle(
  cycleId: string,
  approverId: string
): Promise<PayrollApprovalResult> {
  const cycle = await prisma.payrollCycle.findUnique({
    where: { id: cycleId },
    include: { approvals: true }
  });
  
  if (!cycle) {
    throw new Error('Payroll cycle not found');
  }
  
  // Check current status
  if (cycle.status === 'DRAFT') {
    throw new Error('Payroll must be submitted first');
  }
  
  if (cycle.status === 'EXECUTED') {
    throw new Error('Payroll already executed');
  }
  
  // Get approver's role
  const approver = await getUserWithRoles(approverId);
  
  // Determine approval step based on current status
  if (cycle.status === 'PENDING_REVIEW') {
    // HR Admin approval
    if (!approver.roles.includes('HR_ADMIN')) {
      throw new Error('Only HR Admin can review payroll');
    }
    
    await prisma.payrollCycle.update({
      where: { id: cycleId },
      data: {
        status: 'PENDING_GM_APPROVAL',
        reviewed_by: approverId,
        reviewed_at: new Date()
      }
    });
    
    // Notify GM
    await notifyGM(cycle);
    
    return { success: true, nextStep: 'GM_APPROVAL' };
  }
  
  if (cycle.status === 'PENDING_GM_APPROVAL') {
    // GM FINAL APPROVAL - CRITICAL CHECK
    if (!approver.roles.includes('GM')) {
      throw new Error('Only GM can give final approval');
    }
    
    // GM approves - LOCK the payroll
    await prisma.payrollCycle.update({
      where: { id: cycleId },
      data: {
        status: 'APPROVED',
        approved_by_gm: approverId,
        approved_at_gm: new Date(),
        is_locked: true // PAYROLL IS NOW LOCKED
      }
    });
    
    // Audit log
    await auditLog({
      action: 'PAYROLL_GM_APPROVAL',
      userId: approverId,
      resourceType: 'payroll_cycle',
      resourceId: cycleId,
      metadata: {
        status: 'APPROVED',
        locked: true
      }
    });
    
    return { success: true, nextStep: 'READY_FOR_EXECUTION' };
  }
  
  throw new Error('Invalid payroll status for approval');
}

// Execute payroll - ONLY after GM approval
async function executePayrollCycle(
  cycleId: string,
  executorId: string
): Promise<void> {
  const cycle = await prisma.payrollCycle.findUnique({
    where: { id: cycleId }
  });
  
  // CRITICAL VALIDATION
  if (cycle.status !== 'APPROVED') {
    throw new Error('Payroll must be approved by GM before execution');
  }
  
  if (!cycle.approved_by_gm) {
    throw new Error('GM approval not found - cannot execute');
  }
  
  if (cycle.status === 'EXECUTED') {
    throw new Error('Payroll already executed');
  }
  
  // Execute payroll
  await prisma.$transaction(async (tx) => {
    // Generate final payslips
    // Create payment records
    // Update cycle status
    await tx.payrollCycle.update({
      where: { id: cycleId },
      data: {
        status: 'EXECUTED',
        executed_by: executorId,
        executed_at: new Date()
      }
    });
  });
  
  // Audit log
  await auditLog({
    action: 'PAYROLL_EXECUTED',
    userId: executorId,
    resourceType: 'payroll_cycle',
    resourceId: cycleId
  });
}
```

---

## Audit Logging Architecture

### Audit Log Structure

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  user_id: string;
  company_id: string;
  action: string; // e.g., 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
  resource_type: string; // e.g., 'employee', 'document', 'payroll'
  resource_id: string;
  ip_address: string;
  user_agent: string;
  changes?: {
    before: any;
    after: any;
  };
  metadata?: any;
}

// Immutable - no updates or deletes allowed
// Append-only table
```

### Audit Logging Implementation

```typescript
class AuditService {
  async log(params: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    changes?: { before: any; after: any };
    metadata?: any;
  }) {
    await prisma.auditLog.create({
      data: {
        ...params,
        timestamp: new Date(),
        ip_address: this.getIpAddress(),
        user_agent: this.getUserAgent()
      }
    });
  }
  
  // Middleware to auto-log data changes
  async logDataChange(
    userId: string,
    companyId: string,
    table: string,
    recordId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    before: any,
    after: any
  ) {
    await this.log({
      userId,
      companyId,
      action,
      resourceType: table,
      resourceId: recordId,
      changes: { before, after }
    });
  }
}

// Prisma middleware for automatic audit logging
prisma.$use(async (params, next) => {
  const before = params.action === 'update' || params.action === 'delete'
    ? await prisma[params.model].findUnique({ where: params.args.where })
    : null;
  
  const result = await next(params);
  
  const after = params.action === 'create' || params.action === 'update'
    ? result
    : null;
  
  if (['create', 'update', 'delete'].includes(params.action)) {
    await auditService.logDataChange(
      currentUser.id,
      currentUser.companyId,
      params.model,
      result?.id || params.args.where.id,
      params.action.toUpperCase(),
      before,
      after
    );
  }
  
  return result;
});
```

---

## Database Schema Overview

### Core Tables

```prisma
// Users
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password_hash String
  company_id    String
  company       Company  @relation(fields: [company_id], references: [id])
  employee_id   String?  @unique
  employee      Employee? @relation(fields: [employee_id], references: [id])
  roles         UserRole[]
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?
}

// Employees
model Employee {
  id                String   @id @default(uuid())
  company_id        String
  company           Company  @relation(fields: [company_id], references: [id])
  employee_number   String   @unique
  first_name        String
  last_name         String
  email             String
  phone             String?
  hire_date         DateTime
  department_id     String
  department        Department @relation(fields: [department_id], references: [id])
  manager_id        String?
  manager           Employee? @relation("ManagerHierarchy", fields: [manager_id], references: [id])
  reports           Employee[] @relation("ManagerHierarchy")
  status            String   // ACTIVE, ON_PROBATION, TERMINATED
  probation_end     DateTime?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?
  
  @@index([company_id])
  @@index([manager_id])
}

// Companies
model Company {
  id          String   @id @default(uuid())
  name        String
  name_ar     String?
  settings    Json?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}

// Departments
model Department {
  id          String   @id @default(uuid())
  company_id  String
  company     Company  @relation(fields: [company_id], references: [id])
  name        String
  name_ar     String?
  parent_id   String?
  parent      Department? @relation("DepartmentHierarchy", fields: [parent_id], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  @@index([company_id])
}

// Roles
model Role {
  id          String   @id @default(uuid())
  name        String
  description String?
  company_id  String?  // null = system role
  company     Company? @relation(fields: [company_id], references: [id])
  permissions RolePermission[]
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}

// Permissions
model Permission {
  id          String   @id @default(uuid())
  resource    String   // e.g., 'employees', 'payroll'
  action      String   // e.g., 'create', 'read', 'update', 'delete'
  scope       String   // 'own', 'department', 'company', 'all'
  roles       RolePermission[]
}

// UserRole
model UserRole {
  user_id    String
  user       User     @relation(fields: [user_id], references: [id])
  role_id    String
  role       Role     @relation(fields: [role_id], references: [id])
  company_id String
  assigned_at DateTime @default(now())
  
  @@id([user_id, role_id, company_id])
}

// Documents
model Document {
  id                String   @id @default(uuid())
  company_id        String
  company           Company  @relation(fields: [company_id], references: [id])
  employee_id       String?
  employee          Employee? @relation(fields: [employee_id], references: [id])
  title             String
  category          String
  file_path         String
  file_type         String
  file_size         Int
  current_version   Int      @default(1)
  expiry_date       DateTime?
  status            String   // DRAFT, PENDING_SIGNATURE, SIGNED, EXPIRED
  versions          DocumentVersion[]
  signatures        DocumentSignature[]
  access_logs       DocumentAccessLog[]
  created_by        String
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?
  
  @@index([company_id])
  @@index([employee_id])
}

// AttendanceRecord
model AttendanceRecord {
  id                String   @id @default(uuid())
  company_id        String
  company           Company  @relation(fields: [company_id], references: [id])
  employee_id       String
  employee          Employee @relation(fields: [employee_id], references: [id])
  location_id       String
  location          AttendanceLocation @relation(fields: [location_id], references: [id])
  check_in_time     DateTime
  check_out_time    DateTime?
  gps_latitude      Float
  gps_longitude     Float
  gps_accuracy      Float
  wifi_ssid         String?
  device_id         String
  device            AttendanceDevice @relation(fields: [device_id], references: [id])
  selfie_path       String?
  selfie_hash       String?
  validation_result Json
  flags             String[] // Array of flags
  status            String   // VALID, FLAGGED, APPROVED, REJECTED
  created_at        DateTime @default(now())
  
  @@index([company_id])
  @@index([employee_id])
  @@index([location_id])
}

// PayrollCycle
model PayrollCycle {
  id                String   @id @default(uuid())
  company_id        String
  company           Company  @relation(fields: [company_id], references: [id])
  period_start      DateTime
  period_end        DateTime
  status            String   // DRAFT, PENDING_REVIEW, PENDING_GM_APPROVAL, APPROVED, EXECUTED, REJECTED
  prepared_by       String
  reviewed_by       String?
  reviewed_at       DateTime?
  approved_by_gm    String?  // CRITICAL: GM approval
  approved_at_gm    DateTime?
  executed_by       String?
  executed_at       DateTime?
  is_locked         Boolean  @default(false)
  records           PayrollRecord[]
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  @@index([company_id])
}

// AuditLog (Immutable)
model AuditLog {
  id            String   @id @default(uuid())
  timestamp     DateTime @default(now())
  user_id       String
  company_id    String
  action        String
  resource_type String
  resource_id   String
  ip_address    String
  user_agent    String
  changes       Json?
  metadata      Json?
  
  @@index([company_id])
  @@index([user_id])
  @@index([resource_type, resource_id])
  @@index([timestamp])
}
```

---

## Security Measures

### Application Security

1. **Authentication:**
   - JWT with short expiration (15 minutes)
   - Refresh tokens with longer expiration (7 days)
   - Secure httpOnly cookies
   - Password hashing (bcrypt/argon2)

2. **Authorization:**
   - RBAC enforced at every layer
   - Multi-company data isolation
   - Manager hierarchy validation
   - API endpoint protection

3. **Data Protection:**
   - Encryption at rest (database)
   - Encryption in transit (HTTPS/TLS)
   - Encrypted file storage
   - Sensitive data masking in logs

4. **Input Validation:**
   - Zod schema validation
   - SQL injection prevention (ORM)
   - XSS prevention
   - CSRF protection

5. **Rate Limiting:**
   - API rate limiting
   - Login attempt limiting
   - File upload size limits

6. **Audit & Monitoring:**
   - Comprehensive audit logging
   - Failed login monitoring
   - Suspicious activity detection
   - Real-time alerts

### Infrastructure Security

1. **Server Hardening:**
   - Firewall configuration
   - SSH key-only access
   - Fail2ban
   - Regular security updates

2. **Network Security:**
   - VPN access for admin
   - Database not publicly accessible
   - API gateway with rate limiting

3. **Backup & Recovery:**
   - Automated daily backups
   - Off-site backup storage
   - Disaster recovery plan

---

## Performance Optimization

1. **Database:**
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Read replicas (if needed)

2. **Caching:**
   - Redis for session storage
   - API response caching
   - Static asset caching

3. **Frontend:**
   - Code splitting
   - Lazy loading
   - Image optimization
   - CDN for static assets

4. **API:**
   - Pagination
   - Field selection
   - Batch operations
   - Compression

---

## Scalability Considerations

1. **Horizontal Scaling:**
   - Stateless API servers
   - Load balancer
   - Multiple app instances

2. **Database Scaling:**
   - Read replicas
   - Connection pooling
   - Query optimization

3. **File Storage:**
   - S3-compatible storage
   - CDN integration

---

## Monitoring & Logging

1. **Application Logs:**
   - Structured logging (JSON)
   - Log levels (error, warn, info, debug)
   - Log aggregation

2. **Performance Monitoring:**
   - API response times
   - Database query performance
   - Error rates

3. **Business Metrics:**
   - Active users
   - Attendance records
   - Payroll cycles
   - Document signatures

---

## Compliance (KSA)

1. **Labor Law:**
   - Work hours tracking
   - Overtime calculation
   - Leave entitlements
   - End-of-service benefits

2. **Data Privacy:**
   - Employee data protection
   - Consent management
   - Data retention policies
   - Right to erasure

3. **Document Retention:**
   - Employee records (7 years after termination)
   - Payroll records (permanent)
   - Attendance records (2 years)

---

This architecture provides a solid foundation for building a production-grade Enterprise HRIS Platform with strict security, compliance, and anti-spoofing requirements.
