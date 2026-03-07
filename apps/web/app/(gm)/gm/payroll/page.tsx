"use client"

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Home,
  DollarSign,
  TrendingUp,
  FileText,
  BarChart3,
  PieChart,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Download,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

const navigation = [
  { label: 'Dashboard', href: '/gm', icon: Home },
  { label: 'Payroll Approval', href: '/gm/payroll', icon: DollarSign },
  { label: 'Reports', href: '/gm/reports', icon: BarChart3 },
  { label: 'Documents', href: '/gm/documents', icon: FileText },
  { label: 'Analytics', href: '/gm/analytics', icon: PieChart },
]

export default function GMPayrollApprovalPage() {
  const userInfo = {
    name: 'Khalid Al-Rahman',
    role: 'General Manager',
  }

  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  // Mock pending payroll
  const pendingPayroll = {
    id: 'cycle-feb-2026',
    period: 'February 2026',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    status: 'PENDING_GM_APPROVAL',
    employeeCount: 250,
    totalGross: 3875000,
    totalDeductions: 125000,
    totalNet: 3750000,
    preparedBy: {
      name: 'Sarah Ahmed',
      role: 'HR Officer',
      date: '2026-02-01T10:00:00Z',
    },
    reviewedBy: {
      name: 'Fatima Hassan',
      role: 'HR Admin',
      date: '2026-02-01T14:00:00Z',
    },
    departmentBreakdown: [
      { name: 'Engineering', employees: 85, amount: 1275000 },
      { name: 'Sales', employees: 45, amount: 675000 },
      { name: 'Marketing', employees: 32, amount: 480000 },
      { name: 'Operations', employees: 38, amount: 570000 },
      { name: 'Finance', employees: 25, amount: 375000 },
      { name: 'HR', employees: 15, amount: 225000 },
      { name: 'IT', employees: 10, amount: 150000 },
    ],
    topSalaries: [
      { name: 'Ahmed Khalid', department: 'Engineering', position: 'VP Engineering', salary: 45000 },
      { name: 'Fatima Hassan', department: 'HR', position: 'HR Director', salary: 40000 },
      { name: 'Mohammed Ali', department: 'Sales', position: 'Sales Director', salary: 38000 },
      { name: 'Sarah Ahmed', department: 'HR', position: 'HR Manager', salary: 35000 },
      { name: 'Omar Abdullah', department: 'Engineering', position: 'Senior Engineer', salary: 32000 },
    ],
  }

  const handleApprove = async () => {
    if (!confirm('Approve this payroll for execution? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      await apiClient.gmApprovePayroll(pendingPayroll.id, true)
      alert('Payroll approved successfully! HR can now execute the payment.')
      // Redirect or refresh
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve payroll')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    try {
      await apiClient.gmApprovePayroll(pendingPayroll.id, false, rejectionReason)
      alert('Payroll rejected. HR has been notified.')
      setShowRejectModal(false)
      setRejectionReason('')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject payroll')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Final Approval</h1>
          <p className="text-gray-600 mt-1">
            Review and approve payroll for execution
          </p>
        </div>

        {/* Critical Alert */}
        <Card className="border-2 border-red-400 bg-red-50">
          <CardHeader>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-red-900 flex items-center justify-between">
                  <span>Final Approval Required</span>
                  <Badge className="bg-red-200 text-red-900">URGENT</Badge>
                </CardTitle>
                <CardDescription className="text-red-700 mt-1">
                  Your approval is required before this payroll can be executed. Please review carefully.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Payroll Summary */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl">{pendingPayroll.period} Payroll</CardTitle>
            <CardDescription>
              {formatDate(new Date(pendingPayroll.periodStart))} - {formatDate(new Date(pendingPayroll.periodEnd))}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Gross Salary</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(pendingPayroll.totalGross)}
                </p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total Deductions</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(pendingPayroll.totalDeductions)}
                </p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <p className="text-sm text-green-700 mb-2">Net Amount to Pay</p>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency(pendingPayroll.totalNet)}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-lg font-semibold text-gray-900 flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  {pendingPayroll.employeeCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prepared By</p>
                <p className="text-lg font-semibold text-gray-900">{pendingPayroll.preparedBy.name}</p>
                <p className="text-xs text-gray-500">{formatDateTime(new Date(pendingPayroll.preparedBy.date))}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reviewed By</p>
                <p className="text-lg font-semibold text-gray-900">{pendingPayroll.reviewedBy.name}</p>
                <p className="text-xs text-gray-500">{formatDateTime(new Date(pendingPayroll.reviewedBy.date))}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant="warning" className="mt-1">Awaiting Your Approval</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
            <CardDescription>Payroll distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Employees</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Avg per Employee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayroll.departmentBreakdown.map((dept) => (
                  <TableRow key={dept.name}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-right">{dept.employees}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(dept.amount)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatCurrency(dept.amount / dept.employees)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{pendingPayroll.employeeCount}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(pendingPayroll.totalNet)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(pendingPayroll.totalNet / pendingPayroll.employeeCount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Salaries */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Salaries</CardTitle>
            <CardDescription>Highest compensated employees this period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayroll.topSalaries.map((employee, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(employee.salary)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Ready to Approve?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Once approved, HR can execute the payroll and payments will be processed.
                </p>
              </div>
              <Button variant="outline" className="bg-white">
                <Download className="h-4 w-4 mr-2" />
                Download Full Report
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 text-base"
                onClick={() => window.print()}
              >
                <FileText className="h-5 w-5 mr-2" />
                Review Details
              </Button>
              
              <Button
                variant="destructive"
                className="h-16 text-base"
                onClick={() => setShowRejectModal(true)}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Reject & Request Changes
              </Button>
              
              <Button
                className="h-16 text-base bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                loading={loading}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Approve Payroll
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <CardTitle className="text-red-900">Reject Payroll</CardTitle>
                <CardDescription>
                  Please provide a reason for rejecting this payroll cycle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Explain why you're rejecting this payroll..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectionReason('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReject}
                    loading={loading}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
