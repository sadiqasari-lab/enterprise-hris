export function getAttendanceStatusBadge(status?: string) {
  const value = (status || '').toUpperCase()
  if (value === 'VALID' || value === 'APPROVED') {
    return { label: 'Valid', className: 'bg-green-100 text-green-800' }
  }
  if (value === 'FLAGGED') {
    return { label: 'Flagged', className: 'bg-yellow-100 text-yellow-800' }
  }
  if (value === 'REJECTED') {
    return { label: 'Rejected', className: 'bg-red-100 text-red-800' }
  }
  return { label: status || 'Unknown', className: 'bg-gray-100 text-gray-700' }
}

export function formatFlags(flags?: string[]) {
  if (!flags || flags.length === 0) {
    return 'No flags'
  }
  return flags.join(', ')
}
