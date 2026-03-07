export function getPayslipPeriodLabel(record: any): string {
  const start = record?.cycle?.period_start
  const end = record?.cycle?.period_end
  if (!start || !end) {
    return 'Unknown Period'
  }

  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Unknown Period'
  }

  const startLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const endLabel = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startLabel} - ${endLabel}`
}

export function toDisplayEntries(value: unknown): Array<{ key: string; value: number }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  return Object.entries(value as Record<string, unknown>)
    .filter(([, itemValue]) => typeof itemValue === 'number')
    .map(([key, itemValue]) => ({ key, value: itemValue as number }))
}
