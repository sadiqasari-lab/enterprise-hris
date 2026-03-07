import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileShell } from './MobileShell'

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

describe('MobileShell integration navigation', () => {
  beforeEach(() => {
    pathnameMock = '/mobile/attendance'
    vi.clearAllMocks()
  })

  it('renders heading, subtitle, and child content', () => {
    render(
      <MobileShell title="Mobile Title" subtitle="Mobile Subtitle">
        <div>Child Content</div>
      </MobileShell>
    )

    expect(screen.getByRole('heading', { name: 'Mobile Title' })).toBeInTheDocument()
    expect(screen.getByText('Mobile Subtitle')).toBeInTheDocument()
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('marks the matching route as active', () => {
    pathnameMock = '/mobile/profile'

    render(
      <MobileShell title="My Profile">
        <div>Profile Body</div>
      </MobileShell>
    )

    const profileLink = screen.getByRole('link', { name: /profile/i })
    const attendanceLink = screen.getByRole('link', { name: /attendance/i })

    expect(profileLink).toHaveClass('text-primary')
    expect(attendanceLink).not.toHaveClass('text-primary')
  })

  it('renders all mobile module links with correct routes', () => {
    render(
      <MobileShell title="Navigation">
        <div>Body</div>
      </MobileShell>
    )

    expect(screen.getByRole('link', { name: /attendance/i })).toHaveAttribute(
      'href',
      '/mobile/attendance'
    )
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/mobile/profile')
    expect(screen.getByRole('link', { name: /leave/i })).toHaveAttribute('href', '/mobile/leave')
    expect(screen.getByRole('link', { name: /payslips/i })).toHaveAttribute('href', '/mobile/payslips')
  })
})
