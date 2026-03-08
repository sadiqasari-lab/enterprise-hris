import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './page'
import { apiClient } from '@/lib/api/client'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    login: vi.fn(),
    setTokens: vi.fn(),
  },
}))

describe('LoginPage integration journey', () => {
  const apiClientMock = apiClient as unknown as {
    login: ReturnType<typeof vi.fn>
    setTokens: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in and redirects EMPLOYEE to /employee', async () => {
    apiClientMock.login.mockResolvedValue({
      data: {
        user: { roles: ['EMPLOYEE'] },
        tokens: { accessToken: 'a', refreshToken: 'r' },
      },
    })

    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'employee@company.com')
    await userEvent.type(screen.getByLabelText('Password'), 'demo123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(apiClientMock.login).toHaveBeenCalledWith('employee@company.com', 'demo123')
      expect(apiClientMock.setTokens).toHaveBeenCalledWith('a', 'r')
      expect(pushMock).toHaveBeenCalledWith('/employee')
    })
  })

  it('shows backend error on failed login', async () => {
    apiClientMock.login.mockRejectedValue({
      response: { data: { error: { message: 'Invalid credentials' } } },
    })

    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'employee@company.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })
})
