# Attendance Anti-Spoofing System - Quick Start Guide

## System Overview

The attendance system implements **production-grade multi-factor anti-spoofing** for mobile check-in/check-out.

## API Endpoint: Check-In

### Endpoint
```
POST /api/attendance/check-in
```

### Headers
```
Authorization: Bearer {JWT_ACCESS_TOKEN}
Content-Type: application/json
```

### Request Body
```json
{
  "locationId": "uuid-of-office-location",
  "gps": {
    "latitude": 24.7136,
    "longitude": 46.6753,
    "accuracy": 15.0,
    "altitude": 612.0,
    "speed": 0.0
  },
  "selfie": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "wifiSSID": "Office_Network_5G",
  "deviceInfo": {
    "model": "iPhone 14 Pro",
    "os": "iOS",
    "osVersion": "17.2",
    "deviceId": "unique-device-identifier"
  }
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "record": {
      "id": "attendance-record-id",
      "check_in_time": "2026-02-01T08:30:00Z",
      "status": "VALID",
      "employee": {
        "first_name": "Ahmed",
        "last_name": "Ali"
      },
      "location": {
        "name": "Main Office"
      }
    },
    "validation": {
      "isValid": true,
      "validations": [
        {
          "type": "GPS",
          "isValid": true,
          "flags": [],
          "metadata": { "distance": 45.2 }
        },
        {
          "type": "SELFIE",
          "isValid": true,
          "flags": []
        },
        {
          "type": "WIFI",
          "isValid": true,
          "flags": []
        },
        {
          "type": "DEVICE",
          "isValid": true,
          "flags": []
        },
        {
          "type": "TIME_WINDOW",
          "isValid": true,
          "flags": []
        },
        {
          "type": "BEHAVIOR",
          "isValid": true,
          "flags": [],
          "metadata": { "suspicionLevel": "low" }
        }
      ],
      "allFlags": [],
      "requiresHRApproval": false,
      "suspicionLevel": "low",
      "canCheckIn": true
    }
  },
  "message": "Check-in successful"
}
```

### Flagged Response (200 OK with warnings)
```json
{
  "success": true,
  "data": {
    "record": {
      "id": "attendance-record-id",
      "status": "FLAGGED",
      "flags": [
        "GPS_LOW_ACCURACY",
        "SELFIE_NO_CAMERA_METADATA"
      ]
    },
    "validation": {
      "isValid": false,
      "allFlags": [
        "GPS_LOW_ACCURACY",
        "SELFIE_NO_CAMERA_METADATA"
      ],
      "requiresHRApproval": true,
      "suspicionLevel": "medium",
      "canCheckIn": true
    }
  },
  "message": "Check-in successful, but flagged for HR review"
}
```

### Blocked Response (400 Bad Request)
```json
{
  "success": false,
  "data": {
    "validation": {
      "isValid": false,
      "allFlags": [
        "GPS_OUTSIDE_GEOFENCE",
        "DEVICE_NOT_APPROVED"
      ],
      "requiresHRApproval": true,
      "suspicionLevel": "high",
      "canCheckIn": false
    }
  },
  "message": "Check-in blocked. Please contact HR."
}
```

## Common Flag Types

### GPS Flags
- `GPS_LOW_ACCURACY` - GPS signal accuracy below threshold
- `GPS_OUTSIDE_GEOFENCE` - Location outside allowed radius
- `GPS_ABNORMAL_JUMP` - Suspicious location change detected
- `GPS_INVALID_COORDINATES` - Coordinates are invalid
- `GPS_SUSPECTED_MOCK` - Possible fake GPS location

### Selfie Flags
- `SELFIE_LOW_RESOLUTION` - Image resolution too low
- `SELFIE_NO_CAMERA_METADATA` - Missing camera metadata
- `SELFIE_DUPLICATE_IMAGE` - Image used before
- `SELFIE_FILE_TOO_SMALL` - Suspicious file size
- `SELFIE_SUSPECTED_EDITED` - Image appears edited

### WiFi Flags
- `WIFI_NOT_CONNECTED` - Not connected to WiFi
- `WIFI_SSID_NOT_ALLOWED` - Connected to wrong network

### Device Flags
- `DEVICE_NOT_REGISTERED` - Device not registered
- `DEVICE_NOT_APPROVED` - Device pending approval
- `DEVICE_DEACTIVATED` - Device has been disabled
- `DEVICE_BELONGS_TO_ANOTHER_EMPLOYEE` - Security violation

### Behavior Flags
- `BEHAVIOR_RAPID_CHECKINS` - Multiple check-ins too quickly
- `BEHAVIOR_UNUSUAL_TIME_PATTERN` - Check-in at unusual time
- `BEHAVIOR_REPEATED_FLAGS` - Multiple flagged entries
- `BEHAVIOR_FREQUENT_MISSING_CHECKOUTS` - Pattern of missing check-outs

## Blocking vs Warning Flags

### Blocking Flags (prevent check-in)
- `DEVICE_NOT_APPROVED`
- `DEVICE_DEACTIVATED`
- `DEVICE_BELONGS_TO_ANOTHER_EMPLOYEE`
- `TIME_OUTSIDE_ALLOWED_WINDOW`
- `GPS_OUTSIDE_GEOFENCE`
- `WIFI_SSID_NOT_ALLOWED`

### Warning Flags (allow check-in but flag for review)
- All GPS accuracy/mock flags
- All selfie quality flags
- All behavior flags

## Testing Scenarios

### Scenario 1: Perfect Check-In
```json
{
  "locationId": "office-location-id",
  "gps": {
    "latitude": 24.7136,
    "longitude": 46.6753,
    "accuracy": 15.0
  },
  "selfie": "base64-image-data",
  "wifiSSID": "Office_Network",
  "deviceInfo": {
    "model": "iPhone 14",
    "os": "iOS",
    "deviceId": "approved-device-id"
  }
}
```
**Expected:** ✅ Check-in succeeds, status = VALID

### Scenario 2: Outside Geofence
```json
{
  "locationId": "office-location-id",
  "gps": {
    "latitude": 25.0000,
    "longitude": 47.0000,
    "accuracy": 15.0
  }
}
```
**Expected:** ❌ Check-in blocked, flag = GPS_OUTSIDE_GEOFENCE

### Scenario 3: Unregistered Device
```json
{
  "locationId": "office-location-id",
  "deviceInfo": {
    "model": "New Phone",
    "os": "Android",
    "deviceId": "new-device-id"
  }
}
```
**Expected:** ❌ Check-in blocked, flag = DEVICE_NOT_REGISTERED

### Scenario 4: Duplicate Selfie
```json
{
  "locationId": "office-location-id",
  "selfie": "same-image-as-yesterday"
}
```
**Expected:** ⚠️ Check-in allowed but flagged, flag = SELFIE_DUPLICATE_IMAGE

## HR Admin Endpoints

### Get Flagged Records
```
GET /api/attendance/flagged?startDate=2026-02-01&endDate=2026-02-28
Authorization: Bearer {HR_ADMIN_TOKEN}
```

### Approve Flagged Record
```
PUT /api/attendance/{recordId}/approve
Authorization: Bearer {HR_ADMIN_TOKEN}
```

### Reject Flagged Record
```
PUT /api/attendance/{recordId}/reject
Authorization: Bearer {HR_ADMIN_TOKEN}
Content-Type: application/json

{
  "reason": "GPS location is too far from office"
}
```

## Configuration

### Attendance Rules (Database)
```sql
-- Example: Configure rules for a location
INSERT INTO attendance_rules (
  location_id,
  require_gps,
  require_selfie,
  require_wifi,
  require_device_binding,
  allowed_check_in_start,
  allowed_check_in_end,
  is_active
) VALUES (
  'location-id',
  true,
  true,
  false,
  true,
  '06:00',
  '10:00',
  true
);
```

### Environment Variables
```env
# GPS Settings
GPS_ACCURACY_THRESHOLD=50
MAX_LOCATION_JUMP_DISTANCE=100000
MIN_LOCATION_JUMP_TIME=600000

# Selfie Settings
SELFIE_MIN_WIDTH=480
SELFIE_MIN_HEIGHT=640
```

## Mobile App Integration

### Step 1: Request Location Permission
```typescript
const location = await getCurrentPosition();
```

### Step 2: Capture Selfie
```typescript
const selfie = await capturePhotoFromCamera(); // Must be camera, not gallery
const base64 = await convertToBase64(selfie);
```

### Step 3: Get WiFi SSID
```typescript
const wifiSSID = await getCurrentWiFiSSID();
```

### Step 4: Get Device Info
```typescript
const deviceInfo = {
  model: await getDeviceModel(),
  os: await getOS(),
  osVersion: await getOSVersion(),
  deviceId: await getUniqueDeviceId()
};
```

### Step 5: Send Check-In Request
```typescript
const response = await fetch('/api/attendance/check-in', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    locationId,
    gps: location,
    selfie: base64,
    wifiSSID,
    deviceInfo
  })
});

const result = await response.json();

if (result.success) {
  if (result.data.validation.requiresHRApproval) {
    showWarning('Check-in recorded but flagged for review');
  } else {
    showSuccess('Check-in successful');
  }
} else {
  showError(result.message);
}
```

## Security Best Practices

1. **Always validate on server-side** - Never trust client data
2. **Store all validation data** - Maintain complete audit trail
3. **Flag suspicious patterns** - Don't just block, investigate
4. **Regular review of flagged entries** - HR should review weekly
5. **Update rules as needed** - Adjust thresholds based on false positives
6. **Monitor for new attack vectors** - Security is ongoing

## Performance Considerations

- **Selfie image compression** - Images saved as JPEG at 85% quality
- **Hash calculation** - Perceptual hash is fast, runs in <100ms
- **GPS calculation** - Haversine formula is O(1), very fast
- **Database indexes** - All query fields are indexed
- **Async processing** - Validation runs in parallel where possible

## Support & Troubleshooting

### Common Issues

**Issue:** "GPS accuracy too low"
- **Solution:** Ask user to enable high-accuracy location mode

**Issue:** "Device not approved"
- **Solution:** HR must approve device in admin panel

**Issue:** "Outside geofence"
- **Solution:** Check if office location coordinates are correct

**Issue:** "Duplicate selfie"
- **Solution:** User should take fresh selfie, not reuse old photos

---

This system provides enterprise-grade attendance tracking with comprehensive anti-spoofing protection.
