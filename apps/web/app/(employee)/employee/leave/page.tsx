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
  Clock,
  Calendar,
  FileText,
  User,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const navigation = [
  { label: 'Dashboard', href: '/employee', icon: Home },
  { label: 'Attendance', href: '/employee/attendance', icon: Clock },
  { label: 'Leave', href: '/employee/leave', icon: Calendar },
  { label: 'Payslips', href: '/employee/payslips', icon: FileText },
  { label: 'Documents', href: '/employee/documents', icon: FileText },
  { label: 'Profile', href: '/employee/profile', icon: User },
]

export default function EmployeeLeavePage() {
  const userInfo = {
    name: 'Ahmed Ali',
    role: 'Software Engineer',
  }

  const [showRequestForm, setShowRequestForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  })

  // Mock leave balance
  const leaveBalance = {
    annual: 15,
    sick: 5,
    emergency: 2,
    unpaid: 0,
  }

  // Mock leave requests
  const leaveRequests = [
    {
      id: '1',
      type: 'ANNUAL',
      startDate: '2026-02-15',
      endDate: '2026-02-20',
      days: 6,
      reason: 'Family vacation',
      status: 'PENDING',
      requestedAt: '2026-02-01T10:00:00Z',
    },
    {
      id: '2',
      type: 'ANNUAL',
      startDate: '2026-01-10',
      endDate: '2026-01-12',
      days: 3,
      reason: 'Personal matters',
      status: 'APPROVED',
      requestedAt: '2025-12-20T14:00:00Z',
      approvedBy: 'Manager Name',
      approvedAt: '2025-12-21T09:00:00Z',
    },
    {
      id: '3',
      type: 'SICK',
      startDate: '2025-12-05',
      endDate: '2025-12-07',
      days: 3,
      reason: 'Medical appointment',
      status: 'APPROVED',
      requestedAt: '2025-12-04T16:00:00Z',
      approvedBy: 'Manager Name',
      approvedAt: '2025-12-04T17:00:00Z',
    },
    {
      id: '4',
      type: 'ANNUAL',
      startDate: '2025-11-20',
      endDate: '2025-11-22',
      days: 3,
      reason: 'Wedding ceremony',
      status: 'REJECTED',
      requestedAt: '2025-11-10T10:00:00Z',
      rejectionReason: 'Critical project deadline',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'ANNUAL':
        return 'text-blue-600'
      case 'SICK':
        return 'text-red-600'
      case 'EMERGENCY':
        return 'text-orange-600'
      case 'UNPAID':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // API call here
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert('Leave request submitted successfully!')
      setShowRequestForm(false)
      setFormData({
        leaveType: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: '',
      })
    } catch (error) {
      alert('Failed to submit leave request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600 mt-1">Request and track your leave applications</p>
          </div>
          <Button onClick={() => setShowRequestForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Annual Leave</CardDescription>
              <CardTitle className="text-4xl text-blue-600">{leaveBalance.annual}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">days remaining</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Sick Leave</CardDescription>
              <CardTitle className="text-4xl text-red-600">{leaveBalance.sick}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">days remaining</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Emergency Leave</CardDescription>
              <CardTitle className="text-4xl text-orange-600">{leaveBalance.emergency}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">days remaining</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Unpaid Leave</CardDescription>
              <CardTitle className="text-4xl text-gray-600">{leaveBalance.unpaid}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">days taken</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <CardTitle>Request Leave</CardTitle>
                <CardDescription>Submit a new leave application</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Leave Type *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.leaveType}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                      required
                    >
                      <option value="ANNUAL">Annual Leave</option>
                      <option value="SICK">Sick Leave</option>
                      <option value="EMERGENCY">Emergency Leave</option>
                      <option value="UNPAID">Unpaid Leave</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason *
                    </label>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Please provide a reason for your leave request..."
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowRequestForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" loading={loading}>
                      Submit Request
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leave Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
            <CardDescription>All your leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <span className={`font-medium ${getLeaveTypeColor(request.type)}`}>
                        {request.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatDate(new Date(request.startDate))} - {formatDate(new Date(request.endDate))}
                        </div>
                        <div className="text-xs text-gray-500">
                          Requested {formatDate(new Date(request.requestedAt))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{request.days}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {request.status === 'PENDING' && (
                          <Button variant="destructive" size="sm">
                            Cancel
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

        {/* Leave Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Annual Leave: 21 days per year</p>
                  <p className="text-gray-600">Can be carried forward up to 5 days</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Sick Leave: 15 days per year</p>
                  <p className="text-gray-600">Medical certificate required for 3+ consecutive days</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Emergency Leave: 3 days per year</p>
                  <p className="text-gray-600">For unforeseen circumstances</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Notice Period</p>
                  <p className="text-gray-600">Submit requests at least 3 days in advance for annual leave</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
