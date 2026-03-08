"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, XCircle, CalendarDays, Stethoscope, Siren } from 'lucide-react'

type EmployeeStatsProps = {
  attendance: {
    present: number
    late: number
    absent: number
    total: number
  }
  leaveBalance: {
    annual: number
    sick: number
  }
}

export function EmployeeStats({ attendance, leaveBalance }: EmployeeStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Attendance This Month</CardDescription>
          <CardTitle>{attendance.present}/{attendance.total}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-green-700">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />Present</span>
            <span>{attendance.present}</span>
          </div>
          <div className="flex items-center justify-between text-amber-700">
            <span className="inline-flex items-center gap-1"><AlertCircle className="h-4 w-4" />Late</span>
            <span>{attendance.late}</span>
          </div>
          <div className="flex items-center justify-between text-rose-700">
            <span className="inline-flex items-center gap-1"><XCircle className="h-4 w-4" />Absent</span>
            <span>{attendance.absent}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Annual Leave Balance</CardDescription>
          <CardTitle>{leaveBalance.annual} days</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="inline-flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4" />
            Remaining annual leave
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Sick Leave Balance</CardDescription>
          <CardTitle>{leaveBalance.sick} days</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="inline-flex items-center gap-2 text-sm text-gray-600">
            <Stethoscope className="h-4 w-4" />
            Available sick leave
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
