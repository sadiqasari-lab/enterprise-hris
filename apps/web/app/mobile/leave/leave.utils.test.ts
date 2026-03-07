import { describe, expect, it } from 'vitest'
import { getLeaveStatusBadge, validateMobileLeaveRequest } from './leave.utils'

describe('mobile leave utils', () => {
  it('validates leave request form', () => {
    const errors = validateMobileLeaveRequest({
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
    })

    expect(errors).toContain('Leave type is required')
    expect(errors).toContain('Start date is required')
    expect(errors).toContain('End date is required')
  })

  it('maps leave status badge metadata', () => {
    expect(getLeaveStatusBadge('APPROVED').label).toBe('Approved')
    expect(getLeaveStatusBadge('PENDING').label).toBe('Pending')
    expect(getLeaveStatusBadge('REJECTED').className).toContain('red')
  })
})
