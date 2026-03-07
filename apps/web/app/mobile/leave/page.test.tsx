import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MobileLeavePage from './page'
import { apiClient } from '@/lib/api/client'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    getMobileLeaveTypes: vi.fn(),
    getMobileLeaveBalances: vi.fn(),
    getMobileLeaveRequests: vi.fn(),
    mobileCreateLeaveRequest: vi.fn(),
    mobileCancelLeaveRequest: vi.fn(),
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

describe('MobileLeavePage', () => {
  const apiClientMock = apiClient as unknown as {
    getMobileLeaveTypes: ReturnType<typeof vi.fn>
    getMobileLeaveBalances: ReturnType<typeof vi.fn>
    getMobileLeaveRequests: ReturnType<typeof vi.fn>
    mobileCreateLeaveRequest: ReturnType<typeof vi.fn>
    mobileCancelLeaveRequest: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    apiClientMock.getMobileLeaveTypes.mockResolvedValue({
      data: { leaveTypes: [{ id: 'lt-1', name: 'Annual Leave' }] },
    })
    apiClientMock.getMobileLeaveBalances.mockResolvedValue({
      data: {
        balances: [
          {
            id: 'bal-1',
            remaining_days: 10,
            leave_type: { id: 'lt-1', name: 'Annual Leave' },
          },
        ],
      },
    })
    apiClientMock.getMobileLeaveRequests.mockResolvedValue({
      data: {
        requests: [
          {
            id: 'req-1',
            status: 'PENDING',
            leave_type_id: 'lt-1',
            leave_type: { id: 'lt-1', name: 'Annual Leave' },
            start_date: '2026-03-10',
            end_date: '2026-03-12',
            total_days: 3,
            reason: 'Trip',
          },
        ],
      },
    })
  })

  it('loads balances and leave request history', async () => {
    render(<MobileLeavePage />)

    await waitFor(() => {
      expect(screen.getByText('Days: 3')).toBeInTheDocument()
    })

    expect(screen.getByText('Leave Balances')).toBeInTheDocument()
  })

  it('shows validation error when creating request with missing fields', async () => {
    render(<MobileLeavePage />)

    const submitButton = await screen.findByRole('button', { name: /submit leave request/i })
    await userEvent.click(submitButton)

    expect(screen.getByText('Leave type is required')).toBeInTheDocument()
    expect(apiClientMock.mobileCreateLeaveRequest).not.toHaveBeenCalled()
  })

  it('submits and cancels leave requests', async () => {
    apiClientMock.mobileCreateLeaveRequest.mockResolvedValue({
      success: true,
      message: 'Leave request submitted',
      data: { leaveRequest: { id: 'req-2' } },
    })
    apiClientMock.mobileCancelLeaveRequest.mockResolvedValue({
      success: true,
      message: 'Leave request cancelled',
    })

    render(<MobileLeavePage />)

    const select = await screen.findByLabelText('Leave Type')
    await userEvent.selectOptions(select, 'lt-1')
    await userEvent.type(screen.getByLabelText('Start Date'), '2026-03-15')
    await userEvent.type(screen.getByLabelText('End Date'), '2026-03-16')
    await userEvent.type(screen.getByLabelText('Reason (Optional)'), 'Family visit')
    await userEvent.click(screen.getByRole('button', { name: /submit leave request/i }))

    await waitFor(() => {
      expect(apiClientMock.mobileCreateLeaveRequest).toHaveBeenCalledTimes(1)
    })

    const cancelButton = await screen.findByRole('button', { name: /cancel request/i })
    await userEvent.click(cancelButton)

    await waitFor(() => {
      expect(apiClientMock.mobileCancelLeaveRequest).toHaveBeenCalledWith('req-1')
    })
  })
})
