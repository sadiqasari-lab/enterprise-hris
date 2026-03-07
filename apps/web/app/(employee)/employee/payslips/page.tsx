"use client"

import { useState } from 'react'
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
  Clock,
  Calendar,
  FileText,
  User,
  Download,
  Eye,
  TrendingUp,
  DollarSign,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const navigation = [
  { label: 'Dashboard', href: '/employee', icon: Home },
  { label: 'Attendance', href: '/employee/attendance', icon: Clock },
  { label: 'Leave', href: '/employee/leave', icon: Calendar },
  { label: 'Payslips', href: '/employee/payslips', icon: FileText },
  { label: 'Documents', href: '/employee/documents', icon: FileText },
  { label: 'Profile', href: '/employee/profile', icon: User },
]

export default function EmployeePayslipsPage() {
  const userInfo = {
    name: 'Ahmed Ali',
    role: 'Software Engineer',
  }

  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)

  // Mock payslips
  const payslips = [
    {
      id: '1',
      period: 'February 2026',
      month: 2,
      year: 2026,
      basicSalary: 12000,
      allowances: 3000,
      bonuses: 500,
      overtime: 0,
      grossSalary: 15500,
      deductions: 800,
      netSalary: 14700,
      status: 'EXECUTED',
      paidDate: '2026-02-28',
    },
    {
      id: '2',
      period: 'January 2026',
      month: 1,
      year: 2026,
      basicSalary: 12000,
      allowances: 3000,
      bonuses: 0,
      overtime: 500,
      grossSalary: 15500,
      deductions: 800,
      netSalary: 14700,
      status: 'EXECUTED',
      paidDate: '2026-01-28',
    },
    {
      id: '3',
      period: 'December 2025',
      month: 12,
      year: 2025,
      basicSalary: 12000,
      allowances: 3000,
      bonuses: 2000,
      overtime: 0,
      grossSalary: 17000,
      deductions: 850,
      netSalary: 16150,
      status: 'EXECUTED',
      paidDate: '2025-12-28',
    },
  ]

  const currentPayslip = payslips[0]

  const ytdStats = {
    totalGross: payslips.reduce((sum, p) => sum + p.grossSalary, 0),
    totalNet: payslips.reduce((sum, p) => sum + p.netSalary, 0),
    totalDeductions: payslips.reduce((sum, p) => sum + p.deductions, 0),
    avgSalary: payslips.reduce((sum, p) => sum + p.netSalary, 0) / payslips.length,
  }

  const handleDownload = (payslipId: string) => {
    // In real app, download PDF
    alert('Downloading payslip PDF...')
  }

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payslips</h1>
          <p className="text-gray-600 mt-1">View and download your salary slips</p>
        </div>

        {/* Current Month Payslip */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{currentPayslip.period}</CardTitle>
                <CardDescription>Latest payslip</CardDescription>
              </div>
              <Badge variant="success">Paid</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Net Salary Highlight */}
            <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-gray-600 mb-2">Net Salary</p>
              <p className="text-5xl font-bold text-primary">
                {formatCurrency(currentPayslip.netSalary)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Paid on {formatDate(new Date(currentPayslip.paidDate))}
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Earnings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-medium">{formatCurrency(currentPayslip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allowances</span>
                    <span className="font-medium">{formatCurrency(currentPayslip.allowances)}</span>
                  </div>
                  {currentPayslip.bonuses > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonuses</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(currentPayslip.bonuses)}
                      </span>
                    </div>
                  )}
                  {currentPayslip.overtime > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overtime</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(currentPayslip.overtime)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Gross Salary</span>
                    <span>{formatCurrency(currentPayslip.grossSalary)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Deductions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Social Insurance (GOSI)</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(currentPayslip.deductions * 0.5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income Tax</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(currentPayslip.deductions * 0.3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(currentPayslip.deductions * 0.2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total Deductions</span>
                    <span className="text-red-600">{formatCurrency(currentPayslip.deductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedPayslip(currentPayslip)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button onClick={() => handleDownload(currentPayslip.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* YTD Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>YTD Gross</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(ytdStats.totalGross)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Total earnings</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>YTD Net</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(ytdStats.totalNet)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">After deductions</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>YTD Deductions</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {formatCurrency(ytdStats.totalDeductions)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Total deducted</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Average Salary</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(ytdStats.avgSalary)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Monthly average</p>
            </CardContent>
          </Card>
        </div>

        {/* Payslip History */}
        <Card>
          <CardHeader>
            <CardTitle>Payslip History</CardTitle>
            <CardDescription>All your previous payslips</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross Salary</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.period}
                      <p className="text-xs text-gray-500">
                        Paid {formatDate(new Date(payslip.paidDate))}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payslip.grossSalary)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(payslip.deductions)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(payslip.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Paid</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayslip(payslip)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(payslip.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tax Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Summary (YTD)</CardTitle>
            <CardDescription>Your tax contributions for the year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Social Insurance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(ytdStats.totalDeductions * 0.5)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Income Tax</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(ytdStats.totalDeductions * 0.3)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Other Deductions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(ytdStats.totalDeductions * 0.2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
