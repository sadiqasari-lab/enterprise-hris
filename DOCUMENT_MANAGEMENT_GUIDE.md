# Document Management & Digital Signature System - Complete Guide

## System Overview

The document management system implements a **DocuSign-like digital signature workflow** with configurable approval chains, version control, secure viewing, and comprehensive audit trails.

## Key Features

- 📄 **Document Upload** - Multiple file types (PDF, Word, Images)
- 🔄 **Version Control** - Track all document versions
- ✍️ **Digital Signatures** - Capture signatures with full audit trail
- 🔗 **Approval Chains** - Configurable multi-step approval workflow
- 🔒 **Secure Viewer** - Watermarked, access-controlled viewing
- 📊 **Audit Trail** - Complete access and signature history
- ⏰ **Expiry Tracking** - Automatic alerts for expiring documents
- 📱 **Mobile Support** - Sign documents on mobile devices

---

## Signature Workflow

### Configurable Approval Chain

```
Document Upload
    ↓
Initiate Signature Workflow
    ↓
Step 1: HR Officer Reviews & Signs
    ↓
Step 2: Department Manager Signs
    ↓
Step 3: HR Admin Signs
    ↓
Step 4: GM Final Signature
    ↓
Document Status: SIGNED (Locked)
```

### Status Flow

- **DRAFT** - Document uploaded, not yet in signature workflow
- **PENDING_SIGNATURE** - Signature workflow initiated
- **IN_PROGRESS** - Some approvers have signed, awaiting others
- **SIGNED** - All approvers have signed (document locked)
- **REJECTED** - Rejected by an approver
- **EXPIRED** - Document expiry date passed

---

## API Documentation

### 1. Upload Document

**Endpoint:**
```
POST /api/documents/upload
```

**Headers:**
```
Authorization: Bearer {TOKEN}
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
file: [Binary File]
title: "Employment Contract"
titleAr: "عقد العمل"
category: "CONTRACT"
employeeId: "employee-uuid"
expiryDate: "2027-01-01"
requireSignature: true
allowDownload: true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc-uuid",
      "title": "Employment Contract",
      "category": "CONTRACT",
      "file_type": "application/pdf",
      "file_size": 245678,
      "current_version": 1,
      "status": "PENDING_SIGNATURE",
      "require_signature": true,
      "created_at": "2026-02-01T10:00:00Z"
    }
  },
  "message": "Document uploaded successfully"
}
```

### 2. Initiate Signature Workflow

**Endpoint:**
```
POST /api/documents/{documentId}/initiate-signature
```

**Request:**
```json
{
  "approvalChain": {
    "steps": [
      {
        "order": 1,
        "approverId": "hr-officer-uuid",
        "approverRole": "HR_OFFICER"
      },
      {
        "order": 2,
        "approverId": "manager-uuid",
        "approverRole": "MANAGER"
      },
      {
        "order": 3,
        "approverId": "hr-admin-uuid",
        "approverRole": "HR_ADMIN"
      },
      {
        "order": 4,
        "approverId": "gm-uuid",
        "approverRole": "GM"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "approvalChain": {
      "id": "chain-uuid",
      "document_id": "doc-uuid",
      "status": "PENDING",
      "current_step": 1
    },
    "steps": [
      {
        "id": "step-1-uuid",
        "step_order": 1,
        "approver_id": "hr-officer-uuid",
        "approver_role": "HR_OFFICER",
        "status": "PENDING"
      },
      {
        "id": "step-2-uuid",
        "step_order": 2,
        "approver_id": "manager-uuid",
        "approver_role": "MANAGER",
        "status": "PENDING"
      },
      {
        "id": "step-3-uuid",
        "step_order": 3,
        "approver_id": "hr-admin-uuid",
        "approver_role": "HR_ADMIN",
        "status": "PENDING"
      },
      {
        "id": "step-4-uuid",
        "step_order": 4,
        "approver_id": "gm-uuid",
        "approver_role": "GM",
        "status": "PENDING"
      }
    ]
  },
  "message": "Signature workflow initiated"
}
```

### 3. Sign Document

**Endpoint:**
```
POST /api/documents/{documentId}/sign
```

**Headers:**
```
Authorization: Bearer {APPROVER_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "geolocation": {
    "latitude": 24.7136,
    "longitude": 46.6753
  }
}
```

**Response (Not Final Step):**
```json
{
  "success": true,
  "data": {
    "message": "Signature recorded, awaiting next approver",
    "status": "IN_PROGRESS",
    "signature": {
      "id": "sig-uuid",
      "signer_id": "hr-officer-uuid",
      "signed_at": "2026-02-01T11:00:00Z",
      "order_in_chain": 1
    },
    "nextApprover": "manager-uuid"
  }
}
```

**Response (Final Step):**
```json
{
  "success": true,
  "data": {
    "message": "Document fully signed",
    "status": "SIGNED",
    "signature": {
      "id": "sig-uuid",
      "signer_id": "gm-uuid",
      "signed_at": "2026-02-01T14:00:00Z",
      "order_in_chain": 4
    }
  }
}
```

### 4. Reject Document

**Endpoint:**
```
POST /api/documents/{documentId}/reject
```

**Request:**
```json
{
  "rejectionReason": "Contract terms need revision regarding probation period"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Document rejected",
    "status": "REJECTED",
    "reason": "Contract terms need revision regarding probation period"
  }
}
```

### 5. Get Document Details

**Endpoint:**
```
GET /api/documents/{documentId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc-uuid",
      "title": "Employment Contract",
      "category": "CONTRACT",
      "status": "SIGNED",
      "current_version": 1,
      "file_size": 245678,
      "created_at": "2026-02-01T10:00:00Z",
      "employee": {
        "first_name": "Ahmed",
        "last_name": "Ali",
        "employee_number": "EMP001"
      },
      "versions": [
        {
          "version_number": 1,
          "file_path": "/uploads/contract-123.pdf",
          "created_at": "2026-02-01T10:00:00Z"
        }
      ],
      "signatures": [
        {
          "id": "sig-1",
          "signer_id": "hr-officer-uuid",
          "signed_at": "2026-02-01T11:00:00Z",
          "ip_address": "192.168.1.100",
          "order_in_chain": 1
        },
        {
          "id": "sig-2",
          "signer_id": "manager-uuid",
          "signed_at": "2026-02-01T12:00:00Z",
          "ip_address": "192.168.1.105",
          "order_in_chain": 2
        },
        {
          "id": "sig-3",
          "signer_id": "hr-admin-uuid",
          "signed_at": "2026-02-01T13:00:00Z",
          "ip_address": "192.168.1.110",
          "order_in_chain": 3
        },
        {
          "id": "sig-4",
          "signer_id": "gm-uuid",
          "signed_at": "2026-02-01T14:00:00Z",
          "ip_address": "192.168.1.115",
          "order_in_chain": 4
        }
      ],
      "approval_chain": {
        "id": "chain-uuid",
        "status": "APPROVED",
        "current_step": 4,
        "steps": [
          {
            "step_order": 1,
            "approver_id": "hr-officer-uuid",
            "status": "APPROVED",
            "approved_at": "2026-02-01T11:00:00Z"
          },
          {
            "step_order": 2,
            "approver_id": "manager-uuid",
            "status": "APPROVED",
            "approved_at": "2026-02-01T12:00:00Z"
          },
          {
            "step_order": 3,
            "approver_id": "hr-admin-uuid",
            "status": "APPROVED",
            "approved_at": "2026-02-01T13:00:00Z"
          },
          {
            "step_order": 4,
            "approver_id": "gm-uuid",
            "status": "APPROVED",
            "approved_at": "2026-02-01T14:00:00Z"
          }
        ]
      }
    }
  }
}
```

### 6. Get Pending Approvals

**Endpoint:**
```
GET /api/documents/pending-signatures/my
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "document": {
          "id": "doc-uuid",
          "title": "Employment Contract",
          "category": "CONTRACT",
          "employee": {
            "first_name": "Sarah",
            "last_name": "Ahmed"
          }
        },
        "stepOrder": 2,
        "approverRole": "MANAGER"
      },
      {
        "document": {
          "id": "doc-uuid-2",
          "title": "NDA Agreement",
          "category": "AGREEMENT"
        },
        "stepOrder": 1,
        "approverRole": "HR_ADMIN"
      }
    ]
  }
}
```

### 7. Download Document

**Endpoint:**
```
GET /api/documents/{documentId}/download
```

**Response:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="employment-contract.pdf"

[Binary PDF Data]
```

### 8. Get Document Audit Trail

**Endpoint:**
```
GET /api/documents/{documentId}/audit-trail
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessLogs": [
      {
        "id": "log-1",
        "user_id": "user-1",
        "action": "VIEW",
        "ip_address": "192.168.1.100",
        "accessed_at": "2026-02-01T10:30:00Z"
      },
      {
        "id": "log-2",
        "user_id": "user-2",
        "action": "DOWNLOAD",
        "ip_address": "192.168.1.105",
        "accessed_at": "2026-02-01T15:00:00Z"
      }
    ],
    "signatures": [
      {
        "id": "sig-1",
        "signer_id": "hr-officer-uuid",
        "signed_at": "2026-02-01T11:00:00Z",
        "ip_address": "192.168.1.100",
        "device_info": {
          "browser": "Chrome 120",
          "os": "Windows 11"
        },
        "geolocation": {
          "latitude": 24.7136,
          "longitude": 46.6753
        }
      }
    ]
  }
}
```

### 9. Get Expiring Documents

**Endpoint:**
```
GET /api/documents/expiring/list?days=30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-1",
        "title": "Work Permit",
        "category": "IQAMA",
        "expiry_date": "2026-02-15",
        "days_until_expiry": 14,
        "employee": {
          "first_name": "Mohammed",
          "last_name": "Hassan",
          "employee_number": "EMP005"
        }
      },
      {
        "id": "doc-2",
        "title": "Medical Insurance",
        "category": "INSURANCE",
        "expiry_date": "2026-02-20",
        "days_until_expiry": 19
      }
    ]
  }
}
```

---

## Document Categories

Predefined categories for organization:

- **CONTRACT** - Employment contracts
- **IQAMA** - Residence permits
- **PASSPORT** - Passport documents
- **VISA** - Visa documents
- **CERTIFICATE** - Certifications and qualifications
- **INSURANCE** - Insurance documents
- **POLICY** - Company policies
- **AGREEMENT** - NDAs, agreements
- **OFFER_LETTER** - Job offer letters
- **TERMINATION** - Termination documents
- **OTHER** - Other documents

---

## Signature Data Capture

### Signature Image Format

```javascript
// Capture signature on frontend
const canvas = document.getElementById('signature-pad');
const signatureData = canvas.toDataURL('image/png');

// Send to backend
{
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

### Metadata Captured

For each signature, the following is automatically recorded:

1. **Signer ID** - User who signed
2. **Timestamp** - Exact date/time of signature
3. **IP Address** - IP address of signer
4. **User Agent** - Browser and OS information
5. **Device Info** - Device details
6. **Geolocation** - GPS coordinates (if provided)
7. **Order in Chain** - Position in approval sequence

### Signature Verification

All signatures are:
- ✅ Timestamped with server time (non-repudiable)
- ✅ Linked to authenticated user
- ✅ IP address logged
- ✅ Device fingerprinted
- ✅ Geolocation recorded (optional)
- ✅ Immutable once saved

---

## Security Features

### Access Control

- 📄 **Document-Level** - Per-document permissions
- 👥 **Role-Based** - Different access for different roles
- 🔒 **Approval Chain** - Only current approver can sign
- 🚫 **Locked After Signing** - No modifications after final signature

### Audit Trail

Every action is logged:
- Document uploads
- Version changes
- Signature captures
- Document views
- Document downloads
- Approval/rejections

### Watermarking

Viewed documents include:
- User ID watermark
- Timestamp watermark
- Company watermark
- "CONFIDENTIAL" marking

---

## Use Cases

### 1. Employment Contract Signing

```
1. HR uploads employment contract
2. Initiates signature workflow:
   - Step 1: Employee signs
   - Step 2: Department Manager signs
   - Step 3: HR Admin signs
   - Step 4: GM final signature
3. Document locked after all signatures
4. Both parties receive signed copy
```

### 2. Policy Acknowledgment

```
1. HR uploads company policy
2. All employees must sign acknowledgment
3. Parallel approval (everyone signs independently)
4. Track who has/hasn't signed
```

### 3. NDA Agreement

```
1. HR uploads NDA
2. Employee signs
3. HR Admin countersigns
4. Document archived with signatures
```

### 4. Termination Documents

```
1. HR prepares termination letter
2. Department Manager reviews & signs
3. HR Admin signs
4. GM final signature
5. Employee receives copy
```

---

## Mobile App Integration

### Signature Capture on Mobile

```javascript
// React Native example
import SignatureCapture from 'react-native-signature-capture';

<SignatureCapture
  onSaveEvent={(result) => {
    // result.encoded contains base64 signature
    signDocument(documentId, result.encoded);
  }}
  saveImageFileInExtStorage={false}
  showNativeButtons={false}
/>
```

### Geolocation Capture

```javascript
navigator.geolocation.getCurrentPosition((position) => {
  const geolocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  };
  
  signDocument(documentId, signatureData, geolocation);
});
```

---

## Best Practices

### For HR Admin

1. ✅ Upload high-quality PDF documents
2. ✅ Set appropriate expiry dates
3. ✅ Configure approval chains based on document type
4. ✅ Monitor expiring documents weekly
5. ✅ Review audit trails for sensitive documents

### For Approvers

1. ✅ Review document carefully before signing
2. ✅ Use consistent signature
3. ✅ Sign promptly to avoid delays
4. ✅ Reject with clear reasons
5. ✅ Keep notification of pending approvals enabled

### For Employees

1. ✅ Download and save signed documents
2. ✅ Review all terms before signing
3. ✅ Check signature appears correctly
4. ✅ Report any discrepancies immediately

---

## Error Handling

### Common Errors

**Not Current Approver:**
```json
{
  "success": false,
  "error": {
    "message": "You are not the current approver",
    "code": 403
  }
}
```

**Document Already Signed:**
```json
{
  "success": false,
  "error": {
    "message": "Document is already signed",
    "code": 400
  }
}
```

**Invalid Signature Data:**
```json
{
  "success": false,
  "error": {
    "message": "Signature data is required",
    "code": 400
  }
}
```

---

## Summary

The Document Management & Digital Signature system provides:

- ✅ **Secure Upload** - Multiple file types supported
- ✅ **Version Control** - Complete version history
- ✅ **Flexible Approval Chains** - Configurable workflows
- ✅ **Digital Signatures** - Legally binding signatures
- ✅ **Complete Audit Trail** - Every action logged
- ✅ **Expiry Management** - Automatic alerts
- ✅ **Access Control** - Role-based permissions
- ✅ **Mobile Support** - Sign on any device

This ensures compliance, security, and efficiency in document management across the organization.
