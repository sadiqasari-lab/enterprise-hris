import { describe, expect, it } from 'vitest'
import { getPayslipPeriodLabel, toDisplayEntries } from './payslip.utils'

describe('mobile payslip utils', () => {
  it('builds period labels from cycle dates', () => {
    const label = getPayslipPeriodLabel({
      cycle: {
        period_start: '2026-03-01T00:00:00.000Z',
        period_end: '2026-03-31T00:00:00.000Z',
      },
    })

    expect(label).toContain('Mar')
    expect(label).toContain('2026')
  })

  it('returns numeric key/value entries only', () => {
    const entries = toDisplayEntries({
      housing: 2000,
      transport: 500,
      note: 'ignored',
    })

    expect(entries).toEqual([
      { key: 'housing', value: 2000 },
      { key: 'transport', value: 500 },
    ])
  })
})
