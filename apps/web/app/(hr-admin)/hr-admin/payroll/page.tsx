"use client"

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Settings,
  Award,
  Briefcase,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  Plus,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { formatCurrency, formatDate } from '@/lib/utils'

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

export default function HRAdminPayrollPage() {
  const userInfo = {
    name: 'Sarah Ahmed',
    role: 'HR Administrator',
  }

  const [cycles, setCycles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<any>(null)

  // Mock payroll cycles
  const payrollCycles = [
    {
      id: 'cycle-1',
      period: 'February 2026',
      periodStart: '2026-02-01',
      periodEnd: '2026-02-28',
      status: 'PENDING_GM_APPROVAL',
      employeeCount: 250,
      totalGross: 3875000,
      totalDeductions: 125000,
      totalNet: 3750000,
      preparedBy: 'Sarah Ahmed',
      preparedAt: '2026-02-01T10:00:00Z',
      reviewedBy: 'Fatima Hassan',
      reviewedAt: '2026-02-01T14:00:00Z',
    },
    {
      id: 'cycle-2',
      period: 'January 2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      status: 'EXECUTED',
      employeeCount: 248,
      totalGross: 3720000,
      totalDeductions: 120000,
      totalNet: 3600000,
      preparedBy: 'Sarah Ahmed',
      executedAt: '2026-01-28T16:00:00Z',
    },
    {
      id: 'cycle-3',
      period: 'December 2025',
      periodStart: '2025-12-01',
      periodEnd: '2025-12-31',
      status: 'EXECUTED',
      employeeCount: 245,
      totalGross: 3675000,
      totalDeductions: 115000,
      totalNet: 3560000,
      preparedBy: 'Sarah Ahmed',
      executedAt: '2025-12-28T16:00:00Z',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>
      case 'PENDING_REVIEW':
        return <Badge variant="info">Pending Review</Badge>
      case 'PENDING_GM_APPROVAL':
        return <Badge variant="warning">Awaiting GM Approval</Badge>
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>
      case 'EXECUTED':
        return <Badge variant="success">Executed</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleSendToGM = async (cycleId: string) => {
    if (!confirm('Send this payroll cycle to GM for final approval?')) return

    setLoading(true)
    try {
      // In real app, this would call API
      // await apiClient.submitPayrollForReview(cycleId)
      alert('Payroll sent to GM for approval!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send payroll')
    } finally {
      setLoading(false)
    }
  }

  const handleExecutePayroll = async (cycleId: string) => {
    if (!confirm('Execute this payroll? This action cannot be undone.')) return

    setLoading(true)
    try {
      // In real app
      // await apiClient.executePayroll(cycleId)
      alert('Payroll executed successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to execute payroll')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600 mt-1">
              Manage payroll cycles and employee compensation
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Cycle
          </Button>
        </div>

        {/* Current Cycle Alert */}
        {payrollCycles[0].status === 'PENDING_GM_APPROVAL' && (
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-yellow-900">
                      Current Cycle Awaiting GM Approval
                    </CardTitle>
                    <CardDescription className="text-yellow-700">
                      {payrollCycles[0].period} • {payrollCycles[0].employeeCount} employees
                    </CardDescription>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm font-medium rounded-full">
                  Action Required
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-yellow-700">Gross Amount</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(payrollCycles[0].totalGross)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-yellow-700">Deductions</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(payrollCycles[0].totalDeductions)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-yellow-700">Net Amount</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(payrollCycles[0].totalNet)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedCycle(payrollCycles[0])}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
              <p className="text-xs text-yellow-700 mt-3 text-center">
                Reviewed by {payrollCycles[0].reviewedBy} • 
                Waiting for GM final approval to execute
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Total Employees</CardDescription>
              <CardTitle className="text-4xl">250</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Across all departments</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Monthly Payroll</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(3750000)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Current month net</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Average Salary</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(15000)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Per employee</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>YTD Total</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(7310000)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">2026 year-to-date</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Cycles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Cycles</CardTitle>
            <CardDescription>All payroll cycles and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollCycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">
                      {cycle.period}
                      <p className="text-xs text-gray-500">
                        {formatDate(new Date(cycle.periodStart))} - {formatDate(new Date(cycle.periodEnd))}
                      </p>
                    </TableCell>
                    <TableCell>{cycle.employeeCount}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cycle.totalGross)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cycle.totalNet)}
                    </TableCell>
                    <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCycle(cycle)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {cycle.status === 'PENDING_REVIEW' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendToGM(cycle.id)}
                            loading={loading}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send to GM
                          </Button>
                        )}
                        {cycle.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            onClick={() => handleExecutePayroll(cycle.id)}
                            loading={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Execute
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Workflow</CardTitle>
            <CardDescription>Standard payroll approval process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: 'Prepare Payroll',
                  description: 'HR Officer prepares payroll cycle with employee salaries',
                  role: 'HR Officer',
                  status: 'completed',
                },
                {
                  step: 2,
                  title: 'Submit for Review',
                  description: 'HR Officer submits payroll for HR Admin review',
                  role: 'HR Officer',
                  status: 'completed',
                },
                {
                  step: 3,
                  title: 'HR Admin Review',
                  description: 'HR Admin reviews and approves payroll details',
                  role: 'HR Admin',
                  status: 'completed',
                },
                {
                  step: 4,
                  title: 'GM Final Approval',
                  description: 'General Manager gives final approval (MANDATORY)',
                  role: 'GM',
                  status: 'pending',
                  critical: true,
                },
                {
                  step: 5,
                  title: 'Execute Payroll',
                  description: 'HR Admin executes payroll after GM approval',
                  role: 'HR Admin',
                  status: 'waiting',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${
                    item.critical ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      item.step
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <Badge variant={item.critical ? 'warning' : 'secondary'}>
                        {item.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
