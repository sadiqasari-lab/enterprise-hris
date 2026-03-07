"use client"

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Home,
  Clock,
  Calendar,
  FileText,
  User,
  Award,
  Bell,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'

const navigation = [
  { label: 'Dashboard', href: '/employee', icon: Home },
  { label: 'Attendance', href: '/employee/attendance', icon: Clock },
  { label: 'Leave', href: '/employee/leave', icon: Calendar },
  { label: 'Payslips', href: '/employee/payslips', icon: FileText },
  { label: 'Documents', href: '/employee/documents', icon: FileText },
  { label: 'Profile', href: '/employee/profile', icon: User },
]

export default function EmployeeDashboard() {
  const userInfo = {
    name: 'Ahmed Ali',
    role: 'Software Engineer',
  }

  // Mock data
  const attendanceStats = {
    present: 20,
    late: 2,
    absent: 1,
    total: 23,
  }

  const leaveBalance = {
    annual: 15,
    sick: 5,
    emergency: 2,
  }

  const recentPayslip = {
    month: 'January 2026',
    netSalary: 14700,
    status: 'EXECUTED',
  }

  const pendingActions = [
    {
      id: 1,
      type: 'document',
      title: 'Employment Contract',
      description: 'Pending your signature',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 2,
      type: 'attendance',
      title: 'Missing Check-out',
      description: 'Yesterday - Request correction',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ]

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userInfo.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your work today
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-auto py-6 flex flex-col items-center space-y-2 hover-lift">
            <MapPin className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Check In</div>
              <div className="text-xs opacity-80">Mark your attendance</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto py-6 flex flex-col items-center space-y-2 hover-lift">
            <Calendar className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Request Leave</div>
              <div className="text-xs opacity-80">Submit leave application</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto py-6 flex flex-col items-center space-y-2 hover-lift">
            <FileText className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">View Payslip</div>
              <div className="text-xs opacity-80">Download latest payslip</div>
            </div>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Attendance This Month */}
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Attendance This Month</CardDescription>
              <CardTitle className="text-3xl">{attendanceStats.present}/{attendanceStats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Present
                  </span>
                  <span className="font-medium">{attendanceStats.present}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-yellow-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Late
                  </span>
                  <span className="font-medium">{attendanceStats.late}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    Absent
                  </span>
                  <span className="font-medium">{attendanceStats.absent}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balance */}
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Leave Balance</CardDescription>
              <CardTitle className="text-3xl">{leaveBalance.annual} days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Annual Leave</span>
                  <span className="font-medium">{leaveBalance.annual} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sick Leave</span>
                  <span className="font-medium">{leaveBalance.sick} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Emergency</span>
                  <span className="font-medium">{leaveBalance.emergency} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest Payslip */}
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Latest Payslip</CardDescription>
              <CardTitle className="text-2xl">SAR {recentPayslip.netSalary.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Period</span>
                  <span className="font-medium">{recentPayslip.month}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Pending Actions</CardDescription>
              <CardTitle className="text-3xl">{pendingActions.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <div
                      key={action.id}
                      className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className={`p-1.5 rounded ${action.bgColor}`}>
                        <Icon className={`h-3 w-3 ${action.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-medium truncate">{action.title}</p>
                        <p className="text-gray-500 truncate">{action.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'Checked in',
                  time: 'Today at 8:30 AM',
                  icon: Clock,
                  color: 'text-green-600',
                },
                {
                  action: 'Leave request approved',
                  time: 'Yesterday at 2:15 PM',
                  icon: Calendar,
                  color: 'text-blue-600',
                },
                {
                  action: 'Payslip generated',
                  time: 'Feb 1, 2026',
                  icon: FileText,
                  color: 'text-purple-600',
                },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg bg-gray-50`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-1">
                  Company Holiday - February 22nd
                </h4>
                <p className="text-sm text-blue-700">
                  Office will be closed for Saudi Founding Day celebration.
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-1">
                  New Training Program Available
                </h4>
                <p className="text-sm text-green-700">
                  Enroll in the Advanced Leadership Skills course. Limited seats available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
