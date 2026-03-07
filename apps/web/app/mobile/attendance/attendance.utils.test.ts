import { describe, expect, it } from 'vitest'
import { formatFlags, getAttendanceStatusBadge } from './attendance.utils'

describe('mobile attendance utils', () => {
  it('maps known statuses to badges', () => {
    expect(getAttendanceStatusBadge('VALID').label).toBe('Valid')
    expect(getAttendanceStatusBadge('FLAGGED').label).toBe('Flagged')
    expect(getAttendanceStatusBadge('REJECTED').label).toBe('Rejected')
  })

  it('formats empty and non-empty flags', () => {
    expect(formatFlags()).toBe('No flags')
    expect(formatFlags([])).toBe('No flags')
    expect(formatFlags(['GPS_LOW_ACCURACY', 'DEVICE_NOT_APPROVED'])).toBe(
      'GPS_LOW_ACCURACY, DEVICE_NOT_APPROVED'
    )
  })
})
