"use client"

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Home, Users, Calendar, Award, TrendingUp, Clock,
  CheckCircle, XCircle, AlertTriangle, ArrowRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const navigation = [
  { label: 'Dashboard',         href: '/manager',              icon: Home },
  { label: 'My Team',           href: '/manager/team',         icon: Users },
  { label: 'Leave Approvals',   href: '/manager/leave',        icon: Calendar },
  { label: 'Performance',       href: '/manager/performance',  icon: Award },
  { label: 'Reports',           href: '/manager/reports',      icon: TrendingUp },
]

// ── mock data ────────────────────────────────────────────────────────────────
const teamMembers = [
  { id: '1', name: 'Mohammed Hassan',  position: 'Senior Developer',   status: 'Present',  avatar: 'MH' },
  { id: '2', name: 'Fatima Al-Rashid', position: 'UI/UX Designer',     status: 'On Leave', avatar: 'FA' },
  { id: '3', name: 'Omar Abdullah',    position: 'Backend Developer',  status: 'Present',  avatar: 'OA' },
  { id: '4', name: 'Nora Salem',       position: 'QA Engineer',        status: 'Present',  avatar: 'NS' },
  { id: '5', name: 'Khalid Mansour',   position: 'DevOps Engineer',    status: 'Absent',   avatar: 'KM' },
  { id: '6', name: 'Sara Ibrahim',     position: 'Project Manager',    status: 'Present',  avatar: 'SI' },
  { id: '7', name: 'Youssef Nasser',   position: 'Data Analyst',       status: 'Present',  avatar: 'YN' },
]

const weeklyAttendance = [
  { day: 'Mon', present: 7, absent: 0, late: 0 },
  { day: 'Tue', present: 6, absent: 1, late: 1 },
  { day: 'Wed', present: 7, absent: 0, late: 0 },
  { day: 'Thu', present: 5, absent: 1, late: 1 },
  { day: 'Fri', present: 6, absent: 0, late: 1 },
]

const leaveDistribution = [
  { name: 'Annual',    value: 12, color: '#3b82f6' },
  { name: 'Sick',      value: 3,  color: '#ef4444' },
  { name: 'Emergency', value: 2,  color: '#f59e0b' },
  { name: 'Unpaid',    value: 1,  color: '#6b7280' },
]

const pendingLeaves = [
  { id: '1', employee: 'Mohammed Hassan', type: 'Annual',    days: 3, from: 'Feb 10', to: 'Feb 12', status: 'Pending' },
  { id: '2', employee: 'Nora Salem',      type: 'Sick',      days: 1, from: 'Feb 08', to: 'Feb 08', status: 'Pending' },
  { id: '3', employee: 'Youssef Nasser',  type: 'Emergency', days: 2, from: 'Feb 14', to: 'Feb 15', status: 'Pending' },
]

const goals = [
  { title: 'Migrate to microservices',  progress: 72, target: 'Mar 2026', status: 'on-track' },
  { title: 'Code coverage to 80%',      progress: 58, target: 'Feb 2026', status: 'at-risk' },
  { title: 'Reduce deploy time by 40%', progress: 90, target: 'Feb 2026', status: 'on-track' },
  { title: 'Team training hours: 40h',  progress: 25, target: 'Q1 2026',  status: 'at-risk' },
]

// ── helpers ──────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  Present:  'bg-green-100 text-green-700',
  Absent:   'bg-red-100 text-red-700',
  'On Leave': 'bg-blue-100 text-blue-700',
}

const goalStatusColors: Record<string, string> = {
  'on-track': 'bg-green-100 text-green-700',
  'at-risk':  'bg-yellow-100 text-yellow-700',
}

export default function ManagerDashboard() {
  const userInfo = { name: 'Ahmed Al-Farsi', role: 'Engineering Manager' }

  const presentCount  = teamMembers.filter(m => m.status === 'Present').length
  const absentCount   = teamMembers.filter(m => m.status === 'Absent').length
  const onLeaveCount  = teamMembers.filter(m => m.status === 'On Leave').length

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">Engineering Team · 7 direct reports</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Team Size</CardDescription>
              <CardTitle className="text-4xl">{teamMembers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3 text-xs">
                <span className="text-green-600 font-medium">{presentCount} present</span>
                <span className="text-red-600 font-medium">{absentCount} absent</span>
                <span className="text-blue-600 font-medium">{onLeaveCount} leave</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Pending Approvals</CardDescription>
              <CardTitle className="text-4xl text-yellow-700">{pendingLeaves.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full border-yellow-300 text-yellow-800 hover:bg-yellow-50">
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Review Now
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Goals On Track</CardDescription>
              <CardTitle className="text-4xl text-green-700">{goals.filter(g => g.status === 'on-track').length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">{goals.filter(g => g.status === 'at-risk').length} at risk</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Avg Attendance</CardDescription>
              <CardTitle className="text-4xl">94<span className="text-lg">%</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Bar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
              <CardDescription>This week's team presence</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyAttendance} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 8]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }} />
                  <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} name="Present" />
                  <Bar dataKey="late"    fill="#f59e0b" radius={[4, 4, 0, 0]} name="Late" />
                  <Bar dataKey="absent"  fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Leave-type Pie */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Types</CardTitle>
              <CardDescription>Team leave breakdown (this month)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={leaveDistribution} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={68} innerRadius={34} paddingAngle={3}>
                    {leaveDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Team + Pending Leaves */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Team</CardTitle>
                <CardDescription>Direct reports</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">{m.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.position}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[m.status]}`}>{m.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending leave requests */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>Awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingLeaves.map(l => (
                  <div key={l.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{l.employee}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{l.type} · {l.days} day{l.days > 1 ? 's' : ''} · {l.from} – {l.to}</p>
                      </div>
                      <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                    <div className="flex space-x-2 mt-2.5">
                      <Button size="sm" className="flex-1 h-7 bg-green-600 hover:bg-green-700 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7 border-red-200 text-red-600 hover:bg-red-50 text-xs">
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Team Goals</CardTitle>
            <CardDescription>Current quarter objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((g, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${goalStatusColors[g.status]}`}>
                      {g.status === 'on-track' ? 'On Track' : 'At Risk'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${g.status === 'on-track' ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{g.progress}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Target: {g.target}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
