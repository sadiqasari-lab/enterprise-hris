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
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Settings,
  Award,
  UserPlus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

export default function HRAdminEmployeesPage() {
  const userInfo = {
    name: 'Sarah Ahmed',
    role: 'HR Administrator',
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Mock employees data
  const employees = [
    {
      id: '1',
      employeeNumber: 'EMP001',
      firstName: 'Ahmed',
      lastName: 'Ali',
      email: 'ahmed.ali@company.com',
      phone: '+966 50 123 4567',
      department: 'Engineering',
      position: 'Software Engineer',
      manager: 'Mohammed Hassan',
      salary: 15000,
      joinDate: '2024-01-15',
      status: 'ACTIVE',
    },
    {
      id: '2',
      employeeNumber: 'EMP002',
      firstName: 'Fatima',
      lastName: 'Hassan',
      email: 'fatima.hassan@company.com',
      phone: '+966 50 234 5678',
      department: 'HR',
      position: 'HR Manager',
      manager: 'Sarah Ahmed',
      salary: 18000,
      joinDate: '2023-03-10',
      status: 'ACTIVE',
    },
    {
      id: '3',
      employeeNumber: 'EMP003',
      firstName: 'Mohammed',
      lastName: 'Abdullah',
      email: 'mohammed.abdullah@company.com',
      phone: '+966 50 345 6789',
      department: 'Sales',
      position: 'Sales Executive',
      manager: 'Omar Khalid',
      salary: 12000,
      joinDate: '2024-05-20',
      status: 'ACTIVE',
    },
    {
      id: '4',
      employeeNumber: 'EMP004',
      firstName: 'Sarah',
      lastName: 'Mohammed',
      email: 'sarah.mohammed@company.com',
      phone: '+966 50 456 7890',
      department: 'Marketing',
      position: 'Marketing Specialist',
      manager: 'Noura Ahmed',
      salary: 13000,
      joinDate: '2023-11-01',
      status: 'ACTIVE',
    },
    {
      id: '5',
      employeeNumber: 'EMP005',
      firstName: 'Khalid',
      lastName: 'Ibrahim',
      email: 'khalid.ibrahim@company.com',
      phone: '+966 50 567 8901',
      department: 'Engineering',
      position: 'Senior Developer',
      manager: 'Mohammed Hassan',
      salary: 22000,
      joinDate: '2022-06-15',
      status: 'ACTIVE',
    },
    {
      id: '6',
      employeeNumber: 'EMP006',
      firstName: 'Noura',
      lastName: 'Ahmed',
      email: 'noura.ahmed@company.com',
      phone: '+966 50 678 9012',
      department: 'Marketing',
      position: 'Marketing Director',
      manager: 'CEO',
      salary: 28000,
      joinDate: '2021-04-01',
      status: 'ACTIVE',
    },
  ]

  const departments = ['ALL', 'Engineering', 'Sales', 'Marketing', 'HR', 'Operations', 'Finance']

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDepartment =
      selectedDepartment === 'ALL' || emp.department === selectedDepartment

    const matchesStatus = selectedStatus === 'ALL' || emp.status === selectedStatus

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'ACTIVE').length,
    onLeave: 3,
    pending: 2,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>
      case 'ON_LEAVE':
        return <Badge variant="warning">On Leave</Badge>
      case 'PROBATION':
        return <Badge variant="info">Probation</Badge>
      case 'TERMINATED':
        return <Badge variant="destructive">Terminated</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all employee information
            </p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Total Employees</CardDescription>
              <CardTitle className="text-4xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="hover-lift border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardDescription className="text-green-700">Active</CardDescription>
              <CardTitle className="text-4xl text-green-900">{stats.active}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="hover-lift border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardDescription className="text-yellow-700">On Leave</CardDescription>
              <CardTitle className="text-4xl text-yellow-900">{stats.onLeave}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="hover-lift border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-700">Pending</CardDescription>
              <CardTitle className="text-4xl text-blue-900">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or employee number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <select
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === 'ALL' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="PROBATION">Probation</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
                <CardDescription>All employee records</CardDescription>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{employee.employeeNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.manager}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(employee.salary)}
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No employees found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employee count by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { dept: 'Engineering', count: 85, color: 'bg-blue-500' },
                { dept: 'Sales', count: 45, color: 'bg-green-500' },
                { dept: 'Marketing', count: 32, color: 'bg-purple-500' },
                { dept: 'Operations', count: 38, color: 'bg-yellow-500' },
                { dept: 'Finance', count: 25, color: 'bg-red-500' },
                { dept: 'HR', count: 15, color: 'bg-indigo-500' },
              ].map((item) => (
                <div key={item.dept} className="text-center">
                  <div className={`h-2 ${item.color} rounded-full mb-2`}></div>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  <p className="text-sm text-gray-600">{item.dept}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
