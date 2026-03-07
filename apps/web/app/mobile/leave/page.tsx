"use client"

import React, { useEffect, useState } from 'react'
import { MobileShell } from '@/components/mobile/MobileShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api/client'
import { formatDate } from '@/lib/utils'
import { getLeaveStatusBadge, MobileLeaveRequestForm, validateMobileLeaveRequest } from './leave.utils'

const initialForm: MobileLeaveRequestForm = {
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  reason: '',
}

export default function MobileLeavePage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [balances, setBalances] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState<MobileLeaveRequestForm>(initialForm)

  async function loadAll(nextStatus?: string) {
    setLoading(true)
    setError('')
    try {
      const [typesRes, balancesRes, requestsRes] = await Promise.all([
        apiClient.getMobileLeaveTypes(),
        apiClient.getMobileLeaveBalances(new Date().getFullYear()),
        apiClient.getMobileLeaveRequests({
          status: nextStatus || undefined,
          page: 1,
          limit: 20,
        }),
      ])

      setLeaveTypes(typesRes.data.leaveTypes || [])
      setBalances(balancesRes.data.balances || [])
      setRequests(requestsRes.data.requests || [])
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load leave data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleSubmitLeaveRequest() {
    setError('')
    setSuccess('')

    const errors = validateMobileLeaveRequest(form)
    if (errors.length > 0) {
      setError(errors[0])
      return
    }

    setSubmitting(true)
    try {
      const response = await apiClient.mobileCreateLeaveRequest({
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim() || undefined,
      })
      setSuccess(response.message || 'Leave request submitted')
      setForm(initialForm)
      await loadAll(statusFilter)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancelRequest(requestId: string) {
    setError('')
    setSuccess('')
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Cancel this leave request?')
      if (!confirmed) return
    }

    try {
      const response = await apiClient.mobileCancelLeaveRequest(requestId)
      setSuccess(response.message || 'Leave request cancelled')
      await loadAll(statusFilter)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to cancel leave request')
    }
  }

  return (
    <MobileShell title="Leave" subtitle="Submit, track, and cancel your leave requests">
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Leave Balances</CardTitle>
            <CardDescription>Current year remaining leave days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && balances.length === 0 ? (
              <p className="text-sm text-gray-600">Loading balances...</p>
            ) : balances.length === 0 ? (
              <p className="text-sm text-gray-600">No leave balances found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {balances.map((balance) => (
                  <div key={balance.id} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-600">{balance.leave_type?.name || 'Leave Type'}</p>
                    <p className="text-lg font-bold text-gray-900">{balance.remaining_days}</p>
                    <p className="text-[11px] text-gray-500">Remaining days</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request Leave</CardTitle>
            <CardDescription>Submit a new leave application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="mobile-leave-type" className="text-xs font-medium text-gray-600">Leave Type</label>
              <select
                id="mobile-leave-type"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.leaveTypeId}
                onChange={(e) => setForm((prev) => ({ ...prev, leaveTypeId: e.target.value }))}
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label htmlFor="mobile-leave-start" className="text-xs font-medium text-gray-600">Start Date</label>
                <Input
                  id="mobile-leave-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="mobile-leave-end" className="text-xs font-medium text-gray-600">End Date</label>
                <Input
                  id="mobile-leave-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="mobile-leave-reason" className="text-xs font-medium text-gray-600">Reason (Optional)</label>
              <textarea
                id="mobile-leave-reason"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={3}
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Brief leave reason"
              />
            </div>
            <Button className="w-full" onClick={handleSubmitLeaveRequest} loading={submitting}>
              Submit Leave Request
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Requests</CardTitle>
              <select
                className="text-xs border rounded-md px-2 py-1"
                value={statusFilter}
                onChange={(e) => {
                  const next = e.target.value
                  setStatusFilter(next)
                  loadAll(next)
                }}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <CardDescription>Track leave status and cancel pending requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && requests.length === 0 ? (
              <p className="text-sm text-gray-600">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-gray-600">No leave requests found.</p>
            ) : (
              <div className="space-y-2">
                {requests.map((request) => {
                  const badge = getLeaveStatusBadge(request.status)
                  return (
                    <div key={request.id} className="rounded-md border border-gray-200 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {request.leave_type?.name || request.leave_type_id}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {formatDate(new Date(request.start_date))} - {formatDate(new Date(request.end_date))}
                      </p>
                      <p className="text-xs text-gray-500">Days: {request.total_days}</p>
                      {request.reason && <p className="mt-1 text-xs text-gray-600">Reason: {request.reason}</p>}
                      {request.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  )
}
