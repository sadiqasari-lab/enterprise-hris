import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MobileAttendancePage from '../attendance/page'
import MobileProfilePage from '../profile/page'
import MobileLeavePage from '../leave/page'
import MobilePayslipsPage from '../payslips/page'
import { apiClient } from '@/lib/api/client'

var pathnameMock = '/mobile/attendance'

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock,
}))

vi.mock('next/link', () => ({
  default: ({ href, className, children }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    getMobileAttendanceStatus: vi.fn(),
    getMobileAttendanceHistory: vi.fn(),
    getMobileProfile: vi.fn(),
    getMobileLeaveTypes: vi.fn(),
    getMobileLeaveBalances: vi.fn(),
    getMobileLeaveRequests: vi.fn(),
    getMobilePayslips: vi.fn(),
    getMobilePayslipDetail: vi.fn(),
  },
}))

describe('Mobile bootstrap integration journeys', () => {
  const apiClientMock = apiClient as unknown as {
    getMobileAttendanceStatus: ReturnType<typeof vi.fn>
    getMobileAttendanceHistory: ReturnType<typeof vi.fn>
    getMobileProfile: ReturnType<typeof vi.fn>
    getMobileLeaveTypes: ReturnType<typeof vi.fn>
    getMobileLeaveBalances: ReturnType<typeof vi.fn>
    getMobileLeaveRequests: ReturnType<typeof vi.fn>
    getMobilePayslips: ReturnType<typeof vi.fn>
    getMobilePayslipDetail: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    pathnameMock = '/mobile/attendance'

    apiClientMock.getMobileAttendanceStatus.mockResolvedValue({
      data: { checkedIn: false, canCheckIn: true, canCheckOut: false, defaultLocationId: 'loc-1' },
    })
    apiClientMock.getMobileAttendanceHistory.mockResolvedValue({
      data: { records: [] },
    })
    apiClientMock.getMobileProfile.mockResolvedValue({
      data: {
        employee: {
          employeeNumber: 'EMP-1001',
          workEmail: 'employee@company.com',
          firstName: 'Ali',
          lastName: 'Khan',
          phone: '+966500000000',
          nationality: 'Saudi',
          dateOfBirth: '1991-08-11T00:00:00.000Z',
          department: { name: 'Operations' },
          position: 'Specialist',
        },
      },
    })
    apiClientMock.getMobileLeaveTypes.mockResolvedValue({
      data: { leaveTypes: [{ id: 'lt-1', name: 'Annual Leave' }] },
    })
    apiClientMock.getMobileLeaveBalances.mockResolvedValue({
      data: { balances: [{ id: 'bal-1', remaining_days: 12, leave_type: { name: 'Annual Leave' } }] },
    })
    apiClientMock.getMobileLeaveRequests.mockResolvedValue({
      data: {
        requests: [
          {
            id: 'req-1',
            leave_type: { name: 'Annual Leave' },
            leave_type_id: 'lt-1',
            status: 'PENDING',
            start_date: '2026-03-10T00:00:00.000Z',
            end_date: '2026-03-12T00:00:00.000Z',
            total_days: 3,
            reason: 'Family event',
          },
        ],
      },
    })
    apiClientMock.getMobilePayslips.mockResolvedValue({
      data: {
        summary: {
          totalNet: 5000,
          totalGross: 6500,
          totalDeductions: 1500,
          count: 1,
        },
        payslips: [
          {
            id: 'ps-1',
            cycle_id: 'cycle-1',
            net_salary: 5000,
            gross_salary: 6500,
            cycle: {
              period_start: '2026-01-01T00:00:00.000Z',
              period_end: '2026-01-31T00:00:00.000Z',
            },
          },
        ],
      },
    })
    apiClientMock.getMobilePayslipDetail.mockResolvedValue({
      data: {
        payslip: {
          id: 'ps-1',
          cycle_id: 'cycle-1',
          basic_salary: 4000,
          overtime_amount: 300,
          bonuses: 200,
          allowances: { housing: 500 },
          deductions: { tax: 200 },
          gross_salary: 6500,
          total_deductions: 1500,
          net_salary: 5000,
          cycle: {
            period_start: '2026-01-01T00:00:00.000Z',
            period_end: '2026-01-31T00:00:00.000Z',
          },
        },
      },
    })
  })

  it('loads attendance module with shell navigation', async () => {
    pathnameMock = '/mobile/attendance'
    render(<MobileAttendancePage />)

    await waitFor(() => {
      expect(apiClientMock.getMobileAttendanceStatus).toHaveBeenCalledTimes(1)
    })

    expect(apiClientMock.getMobileAttendanceHistory).toHaveBeenCalledWith({
      status: undefined,
      page: 1,
      limit: 20,
    })
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/mobile/profile')
    expect(screen.getByRole('link', { name: /attendance/i })).toHaveClass('text-primary')
  })

  it('loads profile module and fetches current profile data', async () => {
    pathnameMock = '/mobile/profile'
    render(<MobileProfilePage />)

    await waitFor(() => {
      expect(apiClientMock.getMobileProfile).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText('EMP-1001')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save profile/i })).toBeDisabled()
    expect(screen.getByRole('link', { name: /profile/i })).toHaveClass('text-primary')
  })

  it('loads leave module and fetches balances plus request history', async () => {
    pathnameMock = '/mobile/leave'
    render(<MobileLeavePage />)

    await waitFor(() => {
      expect(apiClientMock.getMobileLeaveTypes).toHaveBeenCalledTimes(1)
      expect(apiClientMock.getMobileLeaveBalances).toHaveBeenCalledWith(new Date().getFullYear())
      expect(apiClientMock.getMobileLeaveRequests).toHaveBeenCalledTimes(1)
    })

    expect(screen.getAllByText('Annual Leave').length).toBeGreaterThan(0)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /leave/i })).toHaveClass('text-primary')
  })

  it('loads payslips module and opens details for a selected cycle', async () => {
    pathnameMock = '/mobile/payslips'
    render(<MobilePayslipsPage />)

    await waitFor(() => {
      expect(apiClientMock.getMobilePayslips).toHaveBeenCalledTimes(1)
    })

    const viewButton = await screen.findByRole('button', { name: /view details/i })
    await userEvent.click(viewButton)

    await waitFor(() => {
      expect(apiClientMock.getMobilePayslipDetail).toHaveBeenCalledWith('cycle-1')
    })

    expect(screen.getByText('Payslip Details')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /payslips/i })).toHaveClass('text-primary')
  })
})
