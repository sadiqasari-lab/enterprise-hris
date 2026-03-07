"use client"

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Home, Building2, Users, ShieldCheck, FileText,
  TrendingUp, AlertTriangle, Activity, CheckCircle2, Server,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from 'recharts'

const navigation = [
  { label: 'Dashboard',     href: '/super-admin',              icon: Home },
  { label: 'Companies',     href: '/super-admin/companies',    icon: Building2 },
  { label: 'Users',         href: '/super-admin/users',        icon: Users },
  { label: 'Audit Logs',    href: '/super-admin/audit',        icon: FileText },
  { label: 'System Health', href: '/super-admin/health',       icon: Server },
  { label: 'Security',      href: '/super-admin/security',     icon: ShieldCheck },
]

// ── mock data ────────────────────────────────────────────────────────────────
const employeeGrowth = [
  { month: 'Aug',  'Al-Noor':  42, 'TechStar': 28, 'Gulf Corp': 18 },
  { month: 'Sep',  'Al-Noor':  45, 'TechStar': 30, 'Gulf Corp': 20 },
  { month: 'Oct',  'Al-Noor':  48, 'TechStar': 34, 'Gulf Corp': 22 },
  { month: 'Nov',  'Al-Noor':  52, 'TechStar': 38, 'Gulf Corp': 25 },
  { month: 'Dec',  'Al-Noor':  55, 'TechStar': 41, 'Gulf Corp': 27 },
  { month: 'Jan',  'Al-Noor':  58, 'TechStar': 44, 'Gulf Corp': 30 },
  { month: 'Feb',  'Al-Noor':  60, 'TechStar': 46, 'Gulf Corp': 32 },
]

const companyPayrolls = [
  { name: 'Al-Noor',   amount: 2.1, color: '#3b82f6' },
  { name: 'TechStar',  amount: 1.4, color: '#8b5cf6' },
  { name: 'Gulf Corp', amount: 0.9, color: '#10b981' },
]

const companies = [
  { id: '1', name: 'Al-Noor Holdings', code: 'ANH', employees: 60, departments: 8, status: 'Active', lastPayroll: 'Feb 2026' },
  { id: '2', name: 'TechStar LLC',     code: 'TSL', employees: 46, departments: 6, status: 'Active', lastPayroll: 'Jan 2026' },
  { id: '3', name: 'Gulf Corp',        code: 'GFC', employees: 32, departments: 5, status: 'Active', lastPayroll: 'Feb 2026' },
]

const recentAuditLogs = [
  { id: '1', action: 'APPROVE', resource: 'payroll_cycle', user: 'sarah.ahmed@alnoor.com',  time: '10 min ago', severity: 'info' },
  { id: '2', action: 'CREATE',  resource: 'employee',      user: 'hr.officer@techstar.com', time: '1 h ago',    severity: 'info' },
  { id: '3', action: 'DELETE',  resource: 'document',      user: 'admin@gulfcorp.com',      time: '3 h ago',    severity: 'warn' },
  { id: '4', action: 'LOGIN',   resource: 'auth',          user: 'unknown@external.com',    time: '5 h ago',    severity: 'danger' },
  { id: '5', action: 'UPDATE',  resource: 'salary_structure', user: 'sarah.ahmed@alnoor.com', time: '8 h ago', severity: 'info' },
]

const healthChecks = [
  { service: 'API Server',      status: 'healthy',   latency: '12 ms' },
  { service: 'Database (PG)',   status: 'healthy',   latency: '34 ms' },
  { service: 'Redis Cache',     status: 'healthy',   latency: '2 ms' },
  { service: 'File Storage',    status: 'healthy',   latency: '89 ms' },
  { service: 'Email Service',   status: 'degraded',  latency: '420 ms' },
]

// ── helpers ──────────────────────────────────────────────────────────────────
const severityStyles: Record<string, string> = {
  info:   'bg-blue-50 text-blue-700',
  warn:   'bg-yellow-50 text-yellow-700',
  danger: 'bg-red-50 text-red-700',
}
const healthStyles: Record<string, { dot: string; label: string }> = {
  healthy:   { dot: 'bg-green-500',  label: 'text-green-700' },
  degraded:  { dot: 'bg-yellow-500', label: 'text-yellow-700' },
  down:      { dot: 'bg-red-500',    label: 'text-red-700' },
}

export default function SuperAdminDashboard() {
  const userInfo = { name: 'Super Admin', role: 'System Administrator' }

  const totalEmployees  = companies.reduce((s, c) => s + c.employees, 0)
  const totalDepts      = companies.reduce((s, c) => s + c.departments, 0)
  const totalPayroll    = companyPayrolls.reduce((s, c) => s + c.amount, 0)

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-gray-600 mt-1">Multi-company system overview</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Companies</CardDescription>
              <CardTitle className="text-3xl">{companies.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-green-600 font-medium">All active</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Total Employees</CardDescription>
              <CardTitle className="text-3xl">{totalEmployees}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3.5 w-3.5 mr-1" /> +8% this month
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Departments</CardDescription>
              <CardTitle className="text-3xl">{totalDepts}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Across all companies</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Monthly Payroll</CardDescription>
              <CardTitle className="text-3xl">SAR {totalPayroll.toFixed(1)}M</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Combined total</p>
            </CardContent>
          </Card>
          <Card className="hover-lift border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-800">System Health</CardDescription>
              <CardTitle className="text-3xl text-green-900">
                <CheckCircle2 className="h-7 w-7 inline text-green-600 mr-1" />
                OK
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-green-700">1 service degraded</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Growth Line */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Employee Growth</CardTitle>
              <CardDescription>Headcount over the last 7 months by company</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={employeeGrowth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Al-Noor"   stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="TechStar"  stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Gulf Corp" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payroll Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll by Company</CardTitle>
              <CardDescription>Current month (SAR M)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={companyPayrolls} layout="vertical" barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="M" domain={[0, 2.5]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={68} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} formatter={(v: number) => [`SAR ${v}M`, 'Payroll']} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {companyPayrolls.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Companies + Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Registered organisations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companies.map(c => (
                  <div key={c.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{c.code}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.employees} employees · {c.departments} departments</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{c.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Last payroll: {c.lastPayroll}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Audit Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Recent system events</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentAuditLogs.map(log => (
                  <div key={log.id} className={`flex items-center justify-between p-2.5 rounded-lg ${severityStyles[log.severity]}`}>
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wide opacity-80">{log.action}</span>
                      <span className="text-xs opacity-60">·</span>
                      <span className="text-xs font-medium truncate">{log.resource}</span>
                    </div>
                    <span className="text-xs opacity-60 flex-shrink-0 ml-3">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" /> System Health Checks
            </CardTitle>
            <CardDescription>Live service status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {healthChecks.map((h, i) => {
                const hs = healthStyles[h.status]
                return (
                  <div key={i} className="border border-gray-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className={`w-3 h-3 rounded-full ${hs.dot} ${h.status === 'healthy' ? 'animate-pulse' : ''}`} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{h.service}</p>
                    <p className={`text-xs font-medium mt-1 capitalize ${hs.label}`}>{h.status}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{h.latency}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
