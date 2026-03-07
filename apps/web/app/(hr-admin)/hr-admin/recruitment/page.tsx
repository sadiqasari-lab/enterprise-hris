"use client"

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Home, Users, Clock, Calendar, DollarSign, FileText,
  TrendingUp, Settings, Award, UserPlus, Briefcase, Search,
  ArrowRight, ChevronDown,
} from 'lucide-react'
import {
  FunnelChart, Funnel, XAxis, Tooltip, ResponsiveContainer, LabelList,
  BarChart, Bar, CartesianGrid, YAxis,
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

// ── mock ─────────────────────────────────────────────────────────────────────
const postings = [
  { id: '1', title: 'Senior Software Developer', dept: 'Engineering', status: 'PUBLISHED', applicants: 24, posted: 'Jan 15' },
  { id: '2', title: 'UI/UX Designer',            dept: 'Design',      status: 'PUBLISHED', applicants: 18, posted: 'Jan 20' },
  { id: '3', title: 'DevOps Engineer',           dept: 'Engineering', status: 'PUBLISHED', applicants: 11, posted: 'Feb 01' },
  { id: '4', title: 'HR Coordinator',            dept: 'HR',          status: 'DRAFT',     applicants: 0,  posted: 'Feb 03' },
  { id: '5', title: 'Data Analyst',              dept: 'Data',        status: 'CLOSED',    applicants: 30, posted: 'Dec 10' },
]

const applicants = [
  { id: '1', name: 'Ali Ahmed',       posting: 'Senior Software Developer', stage: 'INTERVIEW', email: 'ali@email.com',    applied: 'Jan 18' },
  { id: '2', name: 'Hana Khaled',     posting: 'UI/UX Designer',           stage: 'OFFER',     email: 'hana@email.com',   applied: 'Jan 22' },
  { id: '3', name: 'Sami Yusuf',      posting: 'Senior Software Developer', stage: 'SCREENING', email: 'sami@email.com',   applied: 'Jan 25' },
  { id: '4', name: 'Lina Mustafa',    posting: 'DevOps Engineer',          stage: 'NEW',       email: 'lina@email.com',   applied: 'Feb 02' },
  { id: '5', name: 'Tarek Hassan',    posting: 'Senior Software Developer', stage: 'HIRED',     email: 'tarek@email.com',  applied: 'Jan 16' },
  { id: '6', name: 'Dina Al-Nour',    posting: 'UI/UX Designer',           stage: 'REJECTED',  email: 'dina@email.com',   applied: 'Jan 21' },
  { id: '7', name: 'Rami Salem',      posting: 'DevOps Engineer',          stage: 'INTERVIEW', email: 'rami@email.com',   applied: 'Feb 03' },
  { id: '8', name: 'Mona Khalil',     posting: 'Senior Software Developer', stage: 'NEW',       email: 'mona@email.com',   applied: 'Jan 28' },
]

// Funnel data for the pipeline visualisation (manual aggregation)
const funnelData = [
  { name: 'New',        value: 3, fill: '#6366f1' },
  { name: 'Screening', value: 1, fill: '#8b5cf6' },
  { name: 'Interview', value: 2, fill: '#a78bfa' },
  { name: 'Offer',     value: 1, fill: '#c4b5fd' },
  { name: 'Hired',     value: 1, fill: '#22c55e' },
]

// Simple horizontal bar chart as funnel substitute (recharts FunnelChart is experimental)
const pipelineData = [
  { stage: 'New',        count: 3 },
  { stage: 'Screening', count: 1 },
  { stage: 'Interview', count: 2 },
  { stage: 'Offer',     count: 1 },
  { stage: 'Hired',     count: 1 },
]

const stageStyle: Record<string, string> = {
  NEW:        'bg-indigo-100 text-indigo-800',
  SCREENING:  'bg-purple-100 text-purple-800',
  INTERVIEW:  'bg-violet-100 text-violet-800',
  OFFER:      'bg-amber-100 text-amber-800',
  HIRED:      'bg-green-100 text-green-800',
  REJECTED:   'bg-red-100 text-red-800',
}

const postingStatusStyle: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-blue-100 text-blue-800',
  CLOSED:    'bg-gray-200 text-gray-600',
}

export default function HRRecruitmentPage() {
  const userInfo = { name: 'Sarah Ahmed', role: 'HR Administrator' }
  const [selectedPosting, setSelectedPosting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredApplicants = applicants.filter(a => {
    const matchPosting = !selectedPosting || a.posting === postings.find(p => p.id === selectedPosting)?.title
    const matchSearch = search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.posting.toLowerCase().includes(search.toLowerCase())
    return matchPosting && matchSearch
  })

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage job postings and the hiring pipeline</p>
          </div>
          <Button>
            <Briefcase className="h-4 w-4 mr-2" /> New Job Posting
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Open Positions', value: postings.filter(p => p.status === 'PUBLISHED').length, color: 'bg-blue-50 border-blue-200 text-blue-800' },
            { label: 'Total Applicants', value: applicants.length, color: 'bg-purple-50 border-purple-200 text-purple-800' },
            { label: 'In Interview',    value: applicants.filter(a => a.stage === 'INTERVIEW').length, color: 'bg-violet-50 border-violet-200 text-violet-800' },
            { label: 'Pending Offer',   value: applicants.filter(a => a.stage === 'OFFER').length,     color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { label: 'Hired',           value: applicants.filter(a => a.stage === 'HIRED').length,     color: 'bg-green-50 border-green-200 text-green-800' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline chart + Job Postings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline (horizontal bars) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hiring Pipeline</CardTitle>
              <CardDescription>Applicants by stage (all postings)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineData} layout="vertical" barSize={28} margin={{ top: 5, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 4]} />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#6366f1" name="Applicants">
                    <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 600, fill: '#374151' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Job Postings list */}
          <Card>
            <CardHeader>
              <CardTitle>Job Postings</CardTitle>
              <CardDescription>Click to filter applicants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {postings.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPosting(selectedPosting === p.id ? null : p.id)}
                    className={`w-full text-left border rounded-lg px-3 py-2.5 transition-colors ${selectedPosting === p.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${postingStatusStyle[p.status]}`}>{p.status}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{p.dept} · Posted {p.posted}</p>
                      <p className="text-xs font-medium text-indigo-600">{p.applicants} applicants</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applicants Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Applicants</CardTitle>
                <CardDescription>{filteredApplicants.length} candidates{selectedPosting ? ' (filtered)' : ''}</CardDescription>
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
                {selectedPosting && (
                  <button onClick={() => setSelectedPosting(null)} className="text-xs text-red-600 hover:underline">Clear filter</button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Candidate','Position','Stage','Email','Applied','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map(a => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{a.name.split(' ').map(n=>n[0]).join('')}</span>
                          </div>
                          <span className="font-medium text-gray-900">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate">{a.posting}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stageStyle[a.stage]}`}>{a.stage}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{a.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{a.applied}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button className="text-xs text-primary hover:underline font-medium">View</button>
                          {a.stage !== 'HIRED' && a.stage !== 'REJECTED' && (
                            <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center">
                              Move <ChevronDown className="h-3 w-3 ml-0.5" />
                            </button>
                          )}
                        </div>
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
