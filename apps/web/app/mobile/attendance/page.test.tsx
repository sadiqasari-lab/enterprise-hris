import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import MobileAttendancePage from './page'
import { apiClient } from '@/lib/api/client'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    getMobileAttendanceStatus: vi.fn(),
    getMobileAttendanceHistory: vi.fn(),
    mobileCheckIn: vi.fn(),
    mobileCheckOut: vi.fn(),
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

describe('MobileAttendancePage', () => {
  const apiClientMock = apiClient as unknown as {
    getMobileAttendanceStatus: ReturnType<typeof vi.fn>
    getMobileAttendanceHistory: ReturnType<typeof vi.fn>
    mobileCheckIn: ReturnType<typeof vi.fn>
    mobileCheckOut: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads status and history on mount', async () => {
    apiClientMock.getMobileAttendanceStatus.mockResolvedValue({
      data: { checkedIn: false, canCheckIn: true, canCheckOut: false, defaultLocationId: 'loc-1' },
    })
    apiClientMock.getMobileAttendanceHistory.mockResolvedValue({
      data: {
        records: [
          {
            id: 'rec-1',
            check_in_time: '2026-03-01T08:00:00.000Z',
            status: 'VALID',
            location: { name: 'Main Office' },
            flags: [],
          },
        ],
      },
    })

    render(<MobileAttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Not Checked In')).toBeInTheDocument()
    })

    expect(screen.getByText('Main Office')).toBeInTheDocument()
    expect(apiClientMock.getMobileAttendanceStatus).toHaveBeenCalledTimes(1)
    expect(apiClientMock.getMobileAttendanceHistory).toHaveBeenCalledTimes(1)
  })

  it('submits check-in and refreshes data', async () => {
    apiClientMock.getMobileAttendanceStatus.mockResolvedValue({
      data: { checkedIn: false, canCheckIn: true, canCheckOut: false, defaultLocationId: 'loc-1' },
    })
    apiClientMock.getMobileAttendanceHistory.mockResolvedValue({
      data: { records: [] },
    })
    apiClientMock.mobileCheckIn.mockResolvedValue({
      success: true,
      message: 'Check-in successful',
    })

    render(<MobileAttendancePage />)

    const button = await screen.findByRole('button', { name: /check in/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(apiClientMock.mobileCheckIn).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText('Check-in successful')).toBeInTheDocument()
  })

  it('shows API error when check-out fails', async () => {
    apiClientMock.getMobileAttendanceStatus.mockResolvedValue({
      data: { checkedIn: true, canCheckIn: false, canCheckOut: true, defaultLocationId: 'loc-1' },
    })
    apiClientMock.getMobileAttendanceHistory.mockResolvedValue({
      data: { records: [] },
    })
    apiClientMock.mobileCheckOut.mockRejectedValue({
      response: { data: { error: { message: 'No open check-in found for today' } } },
    })

    render(<MobileAttendancePage />)

    const button = await screen.findByRole('button', { name: /check out/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('No open check-in found for today')).toBeInTheDocument()
    })
  })
})
