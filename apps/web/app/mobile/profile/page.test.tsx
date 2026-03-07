import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MobileProfilePage from './page'
import { apiClient } from '@/lib/api/client'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    getMobileProfile: vi.fn(),
    updateMobileProfile: vi.fn(),
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

describe('MobileProfilePage', () => {
  const apiClientMock = apiClient as unknown as {
    getMobileProfile: ReturnType<typeof vi.fn>
    updateMobileProfile: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    apiClientMock.getMobileProfile.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'employee@company.com' },
        employee: {
          id: 'emp-1',
          employeeNumber: 'EMP001',
          firstName: 'Aisha',
          lastName: 'Ali',
          workEmail: 'aisha.ali@company.com',
          department: { name: 'Engineering' },
          position: 'Software Engineer',
          phone: '+966500000123',
          nationality: 'Saudi',
          dateOfBirth: '1995-05-01T00:00:00.000Z',
        },
      },
    })
  })

  it('loads and renders profile information', async () => {
    render(<MobileProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Aisha')).toBeInTheDocument()
    })

    expect(screen.getByText('EMP001')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
  })

  it('shows validation error when required fields are empty', async () => {
    render(<MobileProfilePage />)

    const firstNameInput = await screen.findByLabelText('First Name')
    await userEvent.clear(firstNameInput)
    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await userEvent.click(saveButton)

    expect(screen.getByText('First name is required')).toBeInTheDocument()
    expect(apiClientMock.updateMobileProfile).not.toHaveBeenCalled()
  })

  it('submits profile updates and shows success', async () => {
    apiClientMock.updateMobileProfile.mockResolvedValue({
      message: 'Profile updated successfully',
      data: {
        user: { id: 'user-1', email: 'employee@company.com' },
        employee: {
          id: 'emp-1',
          employeeNumber: 'EMP001',
          firstName: 'Sara',
          lastName: 'Ali',
          workEmail: 'aisha.ali@company.com',
          department: { name: 'Engineering' },
          position: 'Software Engineer',
          phone: '+966500000123',
          nationality: 'Saudi',
          dateOfBirth: '1995-05-01T00:00:00.000Z',
        },
      },
    })

    render(<MobileProfilePage />)

    const firstNameInput = await screen.findByLabelText('First Name')
    await userEvent.clear(firstNameInput)
    await userEvent.type(firstNameInput, 'Sara')

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(apiClientMock.updateMobileProfile).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText('Profile updated successfully')).toBeInTheDocument()
  })
})
