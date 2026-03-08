"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import * as Dialog from '@radix-ui/react-dialog'
import { Calendar, Clock, Download, FileText, LogIn, LogOut, RefreshCw, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { employeeNavigation } from '@/lib/navigation'
import { apiClient } from '@/lib/api-client'
import { EmployeeStats } from '@/components/dashboard/EmployeeStats'
import { DocumentTable } from '@/components/documents/document-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'

type AttendanceMonthly = {
  present: number
  late: number
  absent: number
  total: number
  records?: any[]
}

type LeaveBalance = {
  annual: number
  sick: number
}

type PayslipRow = {
  id: string
  period: string
  amount: number
  status?: string
  paidDate?: string
}

type ActivityRow = {
  id: string
  type: string
  action: string
  createdAt: string
}

type LeaveFormState = {
  leaveTypeId: string
  startDate: string
  endDate: string
  reason: string
}

const employeeUser = {
  name: 'Ahmed Ali',
  role: 'Employee',
}

const defaultLeaveForm: LeaveFormState = {
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  reason: '',
}

export default function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [leaveSubmitting, setLeaveSubmitting] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [leaveForm, setLeaveForm] = useState<LeaveFormState>(defaultLeaveForm)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  const [attendance, setAttendance] = useState<AttendanceMonthly>({
    present: 0,
    late: 0,
    absent: 0,
    total: 0,
    records: [],
  })
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({ annual: 0, sick: 0 })
  const [payslips, setPayslips] = useState<PayslipRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    setRefreshing(!showLoader)
    setError(null)

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    try {
      const [attendanceRes, leaveRes, leaveTypesRes, payslipsRes, activityRes] = await Promise.all([
        apiClient.getAttendanceMonthly(month, year),
        apiClient.getLeaveBalance(year),
        apiClient.getLeaveTypes(),
        apiClient.getPayslipsSummary(),
        apiClient.getActivityFeed({ limit: 8 }),
      ])

      const monthly = attendanceRes?.data ?? {}
      setAttendance({
        present: Number(monthly.present ?? 0),
        late: Number(monthly.late ?? 0),
        absent: Number(monthly.absent ?? 0),
        total: Number(monthly.total ?? 0),
        records: Array.isArray(monthly.records) ? monthly.records : [],
      })

      const today = now.toISOString().slice(0, 10)
      const todayRecord = (Array.isArray(monthly.records) ? monthly.records : []).find(
        (record: any) => String(record.check_in_time || '').slice(0, 10) === today
      )
      setIsCheckedIn(Boolean(todayRecord && !todayRecord.check_out_time))

      const leaveData = leaveRes?.data ?? {}
      setLeaveBalance({
        annual: Number(leaveData.annual ?? 0),
        sick: Number(leaveData.sick ?? 0),
      })

      const nextLeaveTypes = leaveTypesRes?.data?.leaveTypes ?? []
      setLeaveTypes(Array.isArray(nextLeaveTypes) ? nextLeaveTypes : [])
      setLeaveForm((prev) => ({
        ...prev,
        leaveTypeId: prev.leaveTypeId || nextLeaveTypes?.[0]?.id || '',
      }))

      setPayslips(Array.isArray(payslipsRes?.data) ? payslipsRes.data : [])
      setActivity(Array.isArray(activityRes?.data) ? activityRes.data : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load employee dashboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard(true)
  }, [loadDashboard])

  const handleCheckInOut = async () => {
    setChecking(true)
    setError(null)
    try {
      if (isCheckedIn) {
        await apiClient.clockOut()
      } else {
        await apiClient.clockIn({
          locationId: 'main-office-id',
          deviceInfo: { os: 'Web', model: navigator.userAgent },
          wifiSSID: 'web-client',
        })
      }
      await loadDashboard(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Attendance action failed.')
    } finally {
      setChecking(false)
    }
  }

  const handleSubmitLeave = async () => {
    setLeaveSubmitting(true)
    setError(null)
    try {
      await apiClient.createLeaveRequest({
        leaveTypeId: leaveForm.leaveTypeId,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
      })
      setLeaveDialogOpen(false)
      setLeaveForm((prev) => ({ ...defaultLeaveForm, leaveTypeId: prev.leaveTypeId }))
      await loadDashboard(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Leave request failed.')
    } finally {
      setLeaveSubmitting(false)
    }
  }

  const payslipColumns = useMemo<ColumnDef<PayslipRow, unknown>[]>(
    () => [
      { accessorKey: 'period', header: 'Period' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => <span className="font-medium">{formatCurrency(Number(row.original.amount || 0))}</span>,
      },
      {
        accessorKey: 'paidDate',
        header: 'Paid Date',
        cell: ({ row }) => (
          <span>{row.original.paidDate ? formatDate(row.original.paidDate) : '-'}</span>
        ),
      },
    ],
    []
  )

  const activityColumns = useMemo<ColumnDef<ActivityRow, unknown>[]>(
    () => [
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'action', header: 'Action' },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => <span>{formatDate(row.original.createdAt)}</span>,
      },
    ],
    []
  )

  return (
    <DashboardLayout navigation={employeeNavigation} userInfo={employeeUser}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
            <p className="mt-1 text-gray-600">Live attendance, leave, payslip, and activity data.</p>
          </div>
          <Button variant="outline" onClick={() => loadDashboard(false)} disabled={refreshing || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-3 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Button className="h-auto py-5" loading={checking} onClick={handleCheckInOut}>
            {isCheckedIn ? <LogOut className="mr-2 h-5 w-5" /> : <LogIn className="mr-2 h-5 w-5" />}
            {isCheckedIn ? 'Check Out' : 'Check In'}
          </Button>
          <Button variant="outline" className="h-auto py-5" onClick={() => setLeaveDialogOpen(true)}>
            <Calendar className="mr-2 h-5 w-5" />
            Request Leave
          </Button>
          <Button
            variant="outline"
            className="h-auto py-5"
            disabled={!payslips.length}
            onClick={() => window.location.assign('/employee/payslips')}
          >
            <Download className="mr-2 h-5 w-5" />
            View Payslip
          </Button>
        </div>

        <EmployeeStats attendance={attendance} leaveBalance={leaveBalance} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Payslips</CardTitle>
              <CardDescription>Fetched from `GET /api/payslips`</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable data={payslips} columns={payslipColumns} isLoading={loading} emptyMessage="No payslips yet." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" />Recent Activity</CardTitle>
              <CardDescription>Fetched from `GET /api/activity/feed`</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable data={activity} columns={activityColumns} isLoading={loading} emptyMessage="No recent activity." />
            </CardContent>
          </Card>
        </div>

        <Dialog.Root open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <Dialog.Title className="text-lg font-semibold">Request Leave</Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-600">
                    Submit via `POST /api/leave/requests`.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded p-1 hover:bg-gray-100" aria-label="Close dialog">
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Leave Type</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={leaveForm.leaveTypeId}
                    onChange={(event) => setLeaveForm((prev) => ({ ...prev, leaveTypeId: event.target.value }))}
                  >
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(event) => setLeaveForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(event) => setLeaveForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Reason</label>
                  <textarea
                    className="min-h-[96px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={leaveForm.reason}
                    onChange={(event) => setLeaveForm((prev) => ({ ...prev, reason: event.target.value }))}
                    placeholder="Enter leave reason"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
                <Button
                  loading={leaveSubmitting}
                  onClick={handleSubmitLeave}
                  disabled={
                    !leaveForm.leaveTypeId ||
                    !leaveForm.startDate ||
                    !leaveForm.endDate ||
                    !leaveForm.reason.trim()
                  }
                >
                  Submit
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </DashboardLayout>
  )
}
