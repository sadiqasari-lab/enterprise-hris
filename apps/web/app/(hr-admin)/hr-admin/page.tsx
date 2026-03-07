"use client"

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Home,
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Settings,
  Award,
  Briefcase,
} from 'lucide-react'

const navigation = [
  { label: 'Dashboard', href: '/hr-admin', icon: Home },
  { label: 'Employees', href: '/hr-admin/employees', icon: Users },
  { label: 'Recruitment', href: '/hr-admin/recruitment', icon: UserPlus },
  { label: 'Attendance', href: '/hr-admin/attendance', icon: Clock },
  { label: 'Leave Management', href: '/hr-admin/leave', icon: Calendar },
  { label: 'Payroll', href: '/hr-admin/payroll', icon: DollarSign },
  { label: 'Documents', href: '/hr-admin/documents', icon: FileText },
  { label: 'Performance', href: '/hr-admin/performance', icon: Award },
  { label: 'Reports', href: '/hr-admin/reports', icon: TrendingUp },
  { label: 'Settings', href: '/hr-admin/settings', icon: Settings },
]

export default function HRAdminDashboard() {
  const userInfo = {
    name: 'Sarah Ahmed',
    role: 'HR Administrator',
  }

  // Mock data
  const stats = {
    totalEmployees: 250,
    activeRecruitment: 12,
    pendingLeave: 8,
    flaggedAttendance: 5,
  }

  const payrollStats = {
    currentCycle: 'February 2026',
    status: 'PENDING_GM_APPROVAL',
    totalAmount: 3750000,
    employeeCount: 250,
  }

  const pendingApprovals = [
    {
      type: 'Leave Request',
      employee: 'Mohammed Hassan',
      department: 'Engineering',
      count: 3,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      type: 'Attendance Correction',
      employee: 'Fatima Ali',
      department: 'Marketing',
      count: 2,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      type: 'Document Signature',
      employee: 'Ahmed Khalid',
      department: 'Sales',
      count: 1,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  const recentActivities = [
    {
      action: 'New employee onboarded',
      detail: 'Omar Abdullah - Software Engineer',
      time: '2 hours ago',
      icon: UserPlus,
      color: 'text-green-600',
    },
    {
      action: 'Payroll submitted for review',
      detail: 'February 2026 - 250 employees',
      time: '5 hours ago',
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      action: 'Leave request approved',
      detail: 'Sarah Mohammed - 5 days annual leave',
      time: 'Yesterday',
      icon: Calendar,
      color: 'text-purple-600',
    },
    {
      action: 'Flagged attendance reviewed',
      detail: '15 records approved, 3 rejected',
      time: 'Yesterday',
      icon: Clock,
      color: 'text-yellow-600',
    },
  ]

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your workforce effectively
            </p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Total Employees</CardDescription>
              <CardTitle className="text-4xl">{stats.totalEmployees}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Active Recruitment</CardDescription>
              <CardTitle className="text-4xl">{stats.activeRecruitment}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-blue-600">
                <Briefcase className="h-4 w-4 mr-1" />
                <span>{stats.activeRecruitment} open positions</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Pending Leave</CardDescription>
              <CardTitle className="text-4xl">{stats.pendingLeave}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Review Now
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardDescription className="text-yellow-800">Flagged Attendance</CardDescription>
              <CardTitle className="text-4xl text-yellow-900">{stats.flaggedAttendance}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                <AlertCircle className="h-4 w-4 mr-2" />
                Review
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Status */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-900">Current Payroll Cycle</CardTitle>
                <CardDescription className="text-blue-700">
                  {payrollStats.currentCycle}
                </CardDescription>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Awaiting GM Approval
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-blue-700">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">
                  SAR {(payrollStats.totalAmount / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Employees</p>
                <p className="text-2xl font-bold text-blue-900">
                  {payrollStats.employeeCount}
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-end space-x-2">
                <Button variant="outline" className="bg-white">
                  View Details
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Send to GM
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Actions requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovals.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${item.bgColor}`}>
                          <Icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.type}</p>
                          <p className="text-sm text-gray-600">
                            {item.employee} • {item.department}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {item.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest HR actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-gray-50">
                        <Icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {item.action}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {item.detail}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
            <CardDescription>Employee distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Engineering', count: 85, color: 'bg-blue-500' },
                { name: 'Sales', count: 45, color: 'bg-green-500' },
                { name: 'Marketing', count: 32, color: 'bg-purple-500' },
                { name: 'Operations', count: 38, color: 'bg-yellow-500' },
              ].map((dept) => (
                <div key={dept.name} className="text-center">
                  <div className={`h-2 ${dept.color} rounded-full mb-2`}></div>
                  <p className="text-2xl font-bold text-gray-900">{dept.count}</p>
                  <p className="text-sm text-gray-600">{dept.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
