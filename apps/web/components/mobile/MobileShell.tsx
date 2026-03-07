"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Calendar, Clock, FileText, User } from 'lucide-react'

interface MobileShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

const navItems = [
  { href: '/mobile/attendance', label: 'Attendance', icon: Clock },
  { href: '/mobile/profile', label: 'Profile', icon: User, disabled: true },
  { href: '/mobile/leave', label: 'Leave', icon: Calendar, disabled: true },
  { href: '/mobile/payslips', label: 'Payslips', icon: FileText, disabled: true },
]

export function MobileShell({ title, subtitle, children }: MobileShellProps) {
  const pathname = usePathname()

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 border-x border-gray-200 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </header>

      <main className="flex-1 p-4 pb-20">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center justify-center py-3 text-gray-400 cursor-not-allowed"
              >
                <Icon className="h-4 w-4" />
                <span className="text-[11px] mt-1">{item.label}</span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-3 transition-colors',
                isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[11px] mt-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
