"use client"

import React from 'react'
import { useEffect, useState } from 'react'
import { MobileShell } from '@/components/mobile/MobileShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, MapPin, RefreshCcw, Wifi } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import { formatFlags, getAttendanceStatusBadge } from './attendance.utils'

interface MobileAttendanceStatus {
  checkedIn: boolean
  canCheckIn: boolean
  canCheckOut: boolean
  defaultLocationId?: string | null
  openRecord?: any
  lastRecord?: any
}

export default function MobileAttendancePage() {
  const [status, setStatus] = useState<MobileAttendanceStatus | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [wifiSSID, setWifiSSID] = useState('')

  async function loadStatus() {
    const response = await apiClient.getMobileAttendanceStatus()
    setStatus(response.data)
  }

  async function loadHistory(filter?: string) {
    const response = await apiClient.getMobileAttendanceHistory({
      status: filter || undefined,
      page: 1,
      limit: 20,
    })
    setRecords(response.data.records || [])
  }

  async function refreshAll(filter?: string) {
    setLoading(true)
    setError('')
    try {
      await Promise.all([loadStatus(), loadHistory(filter)])
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAll()
  }, [])

  async function getCurrentGPS(): Promise<any | undefined> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return undefined
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            speed: position.coords.speed ?? undefined,
          }),
        () => resolve(undefined),
        { enableHighAccuracy: true, timeout: 7000 }
      )
    })
  }

  async function handleCheckIn() {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      const gps = await getCurrentGPS()
      const response = await apiClient.mobileCheckIn({
        locationId: status?.defaultLocationId || undefined,
        gps,
        wifiSSID: wifiSSID || undefined,
        deviceInfo: {
          model: typeof navigator !== 'undefined' ? navigator.platform : 'Web',
          os: 'Web',
          fingerprint: typeof navigator !== 'undefined' ? navigator.userAgent : 'web',
        },
      })

      if (!response.success) {
        setError(response.message || 'Check-in blocked')
      } else {
        setSuccess(response.message || 'Check-in successful')
      }

      await refreshAll(statusFilter)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Check-in failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCheckOut() {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiClient.mobileCheckOut()
      setSuccess(response.message || 'Check-out successful')
      await refreshAll(statusFilter)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Check-out failed')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <MobileShell title="Mobile Attendance" subtitle="Mark attendance and review daily history">
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Today Status</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAll(statusFilter)}
                loading={loading}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Live attendance state for your current shift</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !status ? (
              <p className="text-sm text-gray-600">Loading status...</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">State</span>
                  <Badge variant={status?.checkedIn ? 'success' : 'secondary'}>
                    {status?.checkedIn ? 'Checked In' : 'Not Checked In'}
                  </Badge>
                </div>

                {status?.openRecord && (
                  <>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600">Check-In Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDateTime(status.openRecord.check_in_time)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600">Location</span>
                      <span className="text-sm font-medium text-gray-900">
                        {status.openRecord.location?.name || 'Unknown'}
                      </span>
                    </div>
                  </>
                )}

                {status?.lastRecord && !status?.checkedIn && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-600">Last Activity</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(status.lastRecord.check_in_time)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mark Attendance</CardTitle>
            <CardDescription>GPS and device metadata are sent automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center">
                <Wifi className="h-3 w-3 mr-1" />
                WiFi SSID (optional)
              </label>
              <Input
                value={wifiSSID}
                onChange={(e) => setWifiSSID(e.target.value)}
                placeholder="Office_Network"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCheckIn}
                loading={actionLoading}
                disabled={!!status?.checkedIn}
                className="w-full"
              >
                Check In
              </Button>
              <Button
                variant="outline"
                onClick={handleCheckOut}
                loading={actionLoading}
                disabled={!status?.checkedIn}
                className="w-full"
              >
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">History</CardTitle>
              <select
                className="text-xs border rounded-md px-2 py-1"
                value={statusFilter}
                onChange={(e) => {
                  const next = e.target.value
                  setStatusFilter(next)
                  refreshAll(next)
                }}
              >
                <option value="">All</option>
                <option value="VALID">Valid</option>
                <option value="FLAGGED">Flagged</option>
                <option value="REJECTED">Rejected</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-sm text-gray-500">No attendance records found.</p>
            ) : (
              <div className="space-y-2">
                {records.map((record) => {
                  const badge = getAttendanceStatusBadge(record.status)
                  return (
                    <div
                      key={record.id}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                          {formatDateTime(record.check_in_time)}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {record.location?.name || 'Unknown location'}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Flags: {formatFlags(record.flags)}</p>
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
