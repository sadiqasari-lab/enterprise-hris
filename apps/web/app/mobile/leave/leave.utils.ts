export interface MobileLeaveRequestForm {
  leaveTypeId: string
  startDate: string
  endDate: string
  reason: string
}

export function validateMobileLeaveRequest(input: MobileLeaveRequestForm): string[] {
  const errors: string[] = []

  if (!input.leaveTypeId) {
    errors.push('Leave type is required')
  }

  if (!input.startDate) {
    errors.push('Start date is required')
  }

  if (!input.endDate) {
    errors.push('End date is required')
  }

  if (input.startDate && input.endDate && new Date(input.startDate) > new Date(input.endDate)) {
    errors.push('Start date cannot be after end date')
  }

  if (input.reason.trim().length > 500) {
    errors.push('Reason is too long')
  }

  return errors
}

export function getLeaveStatusBadge(status?: string): {
  label: string
  className: string
} {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Approved',
        className: 'bg-green-100 text-green-700',
      }
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-red-100 text-red-700',
      }
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-700',
      }
    case 'PENDING':
    default:
      return {
        label: 'Pending',
        className: 'bg-amber-100 text-amber-700',
      }
  }
}
