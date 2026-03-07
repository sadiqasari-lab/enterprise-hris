"use client"

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Home,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react'

const navigation = [
  { label: 'Dashboard', href: '/gm', icon: Home },
  { label: 'Payroll Approval', href: '/gm/payroll', icon: DollarSign },
  { label: 'Reports', href: '/gm/reports', icon: BarChart3 },
  { label: 'Documents', href: '/gm/documents', icon: FileText },
  { label: 'Analytics', href: '/gm/analytics', icon: PieChart },
]

export default function GMDashboard() {
  const userInfo = {
    name: 'Khalid Al-Rahman',
    role: 'General Manager',
  }

  // Mock data
  const executiveMetrics = {
    totalEmployees: 250,
    monthlyPayroll: 3750000,
    headcountGrowth: 5.2,
    avgSalary: 15000,
  }

  const pendingPayroll = {
    cycle: 'February 2026',
    status: 'PENDING_GM_APPROVAL',
    amount: 3750000,
    employees: 250,
    preparedBy: 'Sarah Ahmed',
    reviewedBy: 'Fatima Hassan',
    submittedDate: '2026-02-01',
  }

  const companyHealth = {
    attendance: 96.5,
    turnover: 4.2,
    satisfaction: 87,
    productivity: 92,
  }

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Executive Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            High-level overview and critical approvals
          </p>
        </div>

        {/* Critical Alert - Pending Payroll */}
        {pendingPayroll.status === 'PENDING_GM_APPROVAL' && (
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-yellow-900">
                      Payroll Awaiting Your Approval
                    </CardTitle>
                    <CardDescription className="text-yellow-700">
                      {pendingPayroll.cycle} • {pendingPayroll.employees} employees • 
                      SAR {(pendingPayroll.amount / 1000000).toFixed(2)}M
                    </CardDescription>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm font-medium rounded-full">
                  Urgent
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-yellow-700">Prepared by</p>
                    <p className="font-medium text-yellow-900">{pendingPayroll.preparedBy}</p>
                  </div>
                  <div>
                    <p className="text-yellow-700">Reviewed by</p>
                    <p className="font-medium text-yellow-900">{pendingPayroll.reviewedBy}</p>
                  </div>
                  <div>
                    <p className="text-yellow-700">Submitted</p>
                    <p className="font-medium text-yellow-900">
                      {new Date(pendingPayroll.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-yellow-700">Status</p>
                    <p className="font-medium text-yellow-900">Ready for Approval</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Payroll
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Review Details
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Reject & Request Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Executive Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Total Workforce</CardDescription>
              <CardTitle className="text-4xl">{executiveMetrics.totalEmployees}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+{executiveMetrics.headcountGrowth}% growth</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Monthly Payroll</CardDescription>
              <CardTitle className="text-3xl">
                SAR {(executiveMetrics.monthlyPayroll / 1000000).toFixed(2)}M
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                Avg: SAR {executiveMetrics.avgSalary.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Attendance Rate</CardDescription>
              <CardTitle className="text-4xl">{companyHealth.attendance}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${companyHealth.attendance}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Employee Satisfaction</CardDescription>
              <CardTitle className="text-4xl">{companyHealth.satisfaction}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${companyHealth.satisfaction}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Health Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Company Health Indicators</CardTitle>
            <CardDescription>Key performance indicators at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {companyHealth.attendance}%
                </div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
                <div className="text-xs text-gray-500 mt-1">Target: 95%</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {companyHealth.turnover}%
                </div>
                <div className="text-sm text-gray-600">Turnover Rate</div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt;5%</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {companyHealth.satisfaction}%
                </div>
                <div className="text-sm text-gray-600">Satisfaction Score</div>
                <div className="text-xs text-gray-500 mt-1">Target: 85%</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600 mb-2">
                  {companyHealth.productivity}%
                </div>
                <div className="text-sm text-gray-600">Productivity Index</div>
                <div className="text-xs text-gray-500 mt-1">Target: 90%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Approvals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Approvals</CardTitle>
              <CardDescription>Your recent approval history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: 'Payroll',
                    detail: 'January 2026 - SAR 3.6M',
                    date: 'Jan 28, 2026',
                    status: 'Approved',
                    icon: DollarSign,
                  },
                  {
                    type: 'Document',
                    detail: 'Q4 2025 Financial Report',
                    date: 'Jan 15, 2026',
                    status: 'Approved',
                    icon: FileText,
                  },
                  {
                    type: 'Recruitment',
                    detail: 'Senior Developer Position',
                    date: 'Jan 10, 2026',
                    status: 'Approved',
                    icon: Users,
                  },
                ].map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.type}</p>
                          <p className="text-sm text-gray-600">{item.detail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Performance scores by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Engineering', score: 94, trend: 'up' },
                  { name: 'Sales', score: 91, trend: 'up' },
                  { name: 'Marketing', score: 88, trend: 'down' },
                  { name: 'Operations', score: 92, trend: 'up' },
                ].map((dept) => (
                  <div key={dept.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {dept.name}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {dept.score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          dept.score >= 90 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${dept.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview - Q1 2026</CardTitle>
            <CardDescription>Payroll and compensation trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Paid (Jan)</p>
                <p className="text-2xl font-bold text-gray-900">SAR 3.6M</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg per Employee</p>
                <p className="text-2xl font-bold text-gray-900">SAR 14.4K</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Benefits Cost</p>
                <p className="text-2xl font-bold text-gray-900">SAR 450K</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Overtime Pay</p>
                <p className="text-2xl font-bold text-gray-900">SAR 125K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
