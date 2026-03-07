import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MobilePayslipsPage from './page'
import { apiClient } from '@/lib/api/client'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    getMobilePayslips: vi.fn(),
    getMobilePayslipDetail: vi.fn(),
  },
}))

vi.mock('@/components/mobile/MobileShell', () => ({
  MobileShell: ({ children, title, subtitle }: any) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  ),
}))

describe('MobilePayslipsPage', () => {
  const apiClientMock = apiClient as unknown as {
    getMobilePayslips: ReturnType<typeof vi.fn>
    getMobilePayslipDetail: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    apiClientMock.getMobilePayslips.mockResolvedValue({
      data: {
        payslips: [
          {
            id: 'pr-1',
            cycle_id: 'cy-1',
            net_salary: 14000,
            gross_salary: 15000,
            total_deductions: 1000,
            cycle: {
              period_start: '2026-03-01T00:00:00.000Z',
              period_end: '2026-03-31T00:00:00.000Z',
            },
          },
        ],
        summary: {
          totalGross: 15000,
          totalNet: 14000,
          totalDeductions: 1000,
          count: 1,
        },
      },
    })
  })

  it('loads payslip list and summary', async () => {
    render(<MobilePayslipsPage />)

    await waitFor(() => {
      expect(screen.getByText('Payslip History')).toBeInTheDocument()
    })

    expect(screen.getByText('View Details')).toBeInTheDocument()
    expect(screen.getByText(/Total Net/i)).toBeInTheDocument()
  })

  it('loads and renders payslip detail', async () => {
    apiClientMock.getMobilePayslipDetail.mockResolvedValue({
      data: {
        payslip: {
          id: 'pr-1',
          cycle_id: 'cy-1',
          basic_salary: 12000,
          overtime_amount: 0,
          bonuses: 500,
          gross_salary: 15000,
          total_deductions: 1000,
          net_salary: 14000,
          allowances: {
            housing: 2000,
          },
          deductions: {
            gosi: 1000,
          },
          cycle: {
            period_start: '2026-03-01T00:00:00.000Z',
            period_end: '2026-03-31T00:00:00.000Z',
          },
        },
      },
    })

    render(<MobilePayslipsPage />)

    const viewButton = await screen.findByRole('button', { name: /view details/i })
    await userEvent.click(viewButton)

    await waitFor(() => {
      expect(apiClientMock.getMobilePayslipDetail).toHaveBeenCalledWith('cy-1')
    })

    expect(screen.getByText('Payslip Details')).toBeInTheDocument()
    expect(screen.getByText('Allowances')).toBeInTheDocument()
    expect(screen.getByText('gosi')).toBeInTheDocument()
  })

  it('shows error when list API fails', async () => {
    apiClientMock.getMobilePayslips.mockRejectedValue({
      response: { data: { error: { message: 'Failed to load payslips' } } },
    })

    render(<MobilePayslipsPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load payslips')).toBeInTheDocument()
    })
  })
})
