"use client"

import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Clock, AlertCircle, UserPlus, DollarSign, FileText, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'leave' | 'payroll' | 'document' | 'attendance' | 'system' | 'recruitment'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

const ICON_MAP = {
  leave: { Icon: Calendar, bg: 'bg-blue-100', color: 'text-blue-600' },
  payroll: { Icon: DollarSign, bg: 'bg-green-100', color: 'text-green-600' },
  document: { Icon: FileText, bg: 'bg-purple-100', color: 'text-purple-600' },
  attendance: { Icon: Clock, bg: 'bg-yellow-100', color: 'text-yellow-600' },
  system: { Icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600' },
  recruitment: { Icon: UserPlus, bg: 'bg-indigo-100', color: 'text-indigo-600' },
}

// Mock notifications – replace with apiClient.getNotifications() in production
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'leave', title: 'Leave Request Pending', message: 'Mohammed Hassan requested 3 days annual leave', timestamp: new Date(Date.now() - 1000 * 60 * 30), read: false, actionUrl: '/hr-admin/leave' },
  { id: '2', type: 'payroll', title: 'Payroll Awaiting Approval', message: 'February 2026 payroll is pending GM approval', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), read: false, actionUrl: '/hr-admin/payroll' },
  { id: '3', type: 'document', title: 'Document Signature Required', message: 'New employment contract for Ahmed Khalid needs your signature', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), read: false, actionUrl: '/employee/documents' },
  { id: '4', type: 'attendance', title: 'Attendance Flagged', message: '3 attendance records flagged for review today', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), read: true },
  { id: '5', type: 'recruitment', title: 'New Application', message: 'New applicant for Senior Developer position', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true },
  { id: '6', type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance tonight 2:00 AM – 4:00 AM', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), read: true },
]

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && <p className="text-xs text-gray-500">{unreadCount} unread</p>}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center text-xs text-primary hover:text-primary/80 font-medium">
                  <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No notifications</div>
            ) : (
              notifications.map((n) => {
                const { Icon, bg, color } = ICON_MAP[n.type]
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start space-x-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer',
                      !n.read && 'bg-blue-50/40'
                    )}
                    onClick={() => {
                      markRead(n.id)
                      if (n.actionUrl) window.location.href = n.actionUrl
                    }}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`h-4.5 w-4.5 ${color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn('text-sm', n.read ? 'text-gray-700' : 'text-gray-900 font-semibold')}>{n.title}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(n.timestamp)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && <div className="flex-shrink-0 mt-2 w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button className="w-full text-xs text-primary hover:text-primary/80 font-medium text-center">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
