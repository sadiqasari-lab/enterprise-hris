"use client"

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Home, Users, Clock, Calendar, DollarSign, FileText,
  TrendingUp, Settings, Award, UserPlus,
  Search, CheckCircle, XCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const navigation = [
  { label: 'Dashboard',        href: '/hr-admin',                icon: Home },
  { label: 'Employees',        href: '/hr-admin/employees',      icon: Users },
  { label: 'Recruitment',      href: '/hr-admin/recruitment',    icon: UserPlus },
  { label: 'Attendance',       href: '/hr-admin/attendance',     icon: Clock },
  { label: 'Leave Management', href: '/hr-admin/leave',          icon: Calendar },
  { label: 'Payroll',          href: '/hr-admin/payroll',        icon: DollarSign },
  { label: 'Documents',        href: '/hr-admin/documents',      icon: FileText },
  { label: 'Performance',      href: '/hr-admin/performance',    icon: Award },
  { label: 'Reports',          href: '/hr-admin/reports',        icon: TrendingUp },
  { label: 'Settings',         href: '/hr-admin/settings',       icon: Settings },
]

// ── mock data ────────────────────────────────────────────────────────────────
const leaveTypes = [
  { id: '1', name: 'Annual Leave',    code: 'AL', daysPerYear: 30, isPaid: true },
  { id: '2', name: 'Sick Leave',      code: 'SL', daysPerYear: 15, isPaid: true },
  { id: '3', name: 'Emergency Leave', code: 'EL', daysPerYear: 5,  isPaid: true },
  { id: '4', name: 'Unpaid Leave',    code: 'UL', daysPerYear: 10, isPaid: false },
]

const requests = [
  { id: '1', employee: 'Mohammed Hassan',  dept: 'Engineering', type: 'Annual Leave',    days: 5, from: 'Feb 10', to: 'Feb 14', status: 'PENDING' },
  { id: '2', employee: 'Fatima Al-Rashid', dept: 'Marketing',   type: 'Sick Leave',      days: 2, from: 'Feb 05', to: 'Feb 06', status: 'APPROVED' },
  { id: '3', employee: 'Omar Abdullah',    dept: 'Engineering', type: 'Emergency Leave', days: 1, from: 'Feb 08', to: 'Feb 08', status: 'PENDING' },
  { id: '4', employee: 'Nora Salem',       dept: 'QA',          type: 'Annual Leave',    days: 3, from: 'Feb 18', to: 'Feb 20', status: 'REJECTED' },
  { id: '5', employee: 'Khalid Mansour',   dept: 'DevOps',      type: 'Unpaid Leave',    days: 2, from: 'Feb 25', to: 'Feb 26', status: 'PENDING' },
  { id: '6', employee: 'Sara Ibrahim',     dept: 'Engineering', type: 'Sick Leave',      days: 1, from: 'Feb 03', to: 'Feb 03', status: 'APPROVED' },
  { id: '7', employee: 'Youssef Nasser',   dept: 'Data',        type: 'Annual Leave',    days: 7, from: 'Mar 01', to: 'Mar 07', status: 'PENDING' },
]

const monthlyChart = [
  { month: 'Oct', Annual: 18, Sick: 4, Emergency: 2 },
  { month: 'Nov', Annual: 22, Sick: 6, Emergency: 3 },
  { month: 'Dec', Annual: 35, Sick: 3, Emergency: 1 },
  { month: 'Jan', Annual: 12, Sick: 8, Emergency: 2 },
  { month: 'Feb', Annual: 16, Sick: 5, Emergency: 1 },
]

const statusStyle: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED:'bg-gray-100 text-gray-700',
}

export default function HRLeavePage() {
  const userInfo = { name: 'Sarah Ahmed', role: 'HR Administrator' }
  const [filter, setFilter] = useState<string>('All')
  const [search, setSearch] = useState('')

  const filtered = requests.filter(r => {
    const matchStatus = filter === 'All' || r.status === filter
    const matchSearch = search === '' ||
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.dept.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const pending  = requests.filter(r => r.status === 'PENDING').length
  const approved = requests.filter(r => r.status === 'APPROVED').length
  const rejected = requests.filter(r => r.status === 'REJECTED').length

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review and manage all employee leave requests</p>
          </div>
          <Button>
            <Calendar className="h-4 w-4 mr-2" /> Add Leave Type
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending',  value: pending,  color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
            { label: 'Approved', value: approved, color: 'bg-green-50 border-green-200 text-green-800' },
            { label: 'Rejected', value: rejected, color: 'bg-red-50 border-red-200 text-red-800' },
            { label: 'Total',    value: requests.length, color: 'bg-blue-50 border-blue-200 text-blue-800' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Chart + Leave Types */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Leave Trends</CardTitle>
              <CardDescription>Days taken by type – last 5 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlyChart} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Annual"    fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="Sick"      fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="Emergency" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leave Types</CardTitle>
              <CardDescription>Configured types &amp; allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaveTypes.map(lt => (
                  <div key={lt.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{lt.name}</p>
                      <p className="text-xs text-gray-500">{lt.code} · {lt.daysPerYear} days/yr</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lt.isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {lt.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>{filtered.length} requests shown</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-48"
                  />
                </div>
                <div className="flex space-x-1">
                  {['All','PENDING','APPROVED','REJECTED'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {s === 'All' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Employee','Department','Leave Type','Days','Period','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">{r.employee.split(' ').map(n=>n[0]).join('')}</span>
                          </div>
                          <span className="font-medium text-gray-900">{r.employee}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.dept}</td>
                      <td className="px-4 py-3 text-gray-600">{r.type}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.days}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.from} – {r.to}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[r.status]}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'PENDING' ? (
                          <div className="flex space-x-1.5">
                            <button className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
