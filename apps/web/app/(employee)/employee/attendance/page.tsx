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
  Clock,
  Calendar,
  FileText,
  User,
  MapPin,
  Camera,
  Wifi,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { formatDate, formatTime } from '@/lib/utils'

const navigation = [
  { label: 'Dashboard', href: '/employee', icon: Home },
  { label: 'Attendance', href: '/employee/attendance', icon: Clock },
  { label: 'Leave', href: '/employee/leave', icon: Calendar },
  { label: 'Payslips', href: '/employee/payslips', icon: FileText },
  { label: 'Documents', href: '/employee/documents', icon: FileText },
  { label: 'Profile', href: '/employee/profile', icon: User },
]

export default function EmployeeAttendancePage() {
  const userInfo = {
    name: 'Ahmed Ali',
    role: 'Software Engineer',
  }

  const [loading, setLoading] = useState(false)
  const [checkInStatus, setCheckInStatus] = useState<'checked-out' | 'checked-in'>('checked-out')
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null)
  const [records, setRecords] = useState<any[]>([])

  // Mock data
  const monthStats = {
    present: 20,
    late: 2,
    absent: 1,
    early_leave: 1,
    total: 23,
  }

  const todayRecord = {
    checkInTime: '08:25 AM',
    location: 'Main Office',
    status: 'VALID',
  }

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation(position),
        (error) => console.error('Error getting location:', error)
      )
    }

    // Fetch attendance records
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await apiClient.getAttendanceRecords()
      setRecords(response.data.records || [])
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      // In real app, capture selfie from camera
      const selfieData = 'data:image/png;base64,...' // Mock

      const response = await apiClient.checkIn({
        locationId: 'main-office-id',
        gps: currentLocation ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
        } : undefined,
        selfie: selfieData,
        wifiSSID: 'Office_Network', // Get from device
        deviceInfo: {
          model: navigator.userAgent,
          os: 'Web',
        },
      })

      if (response.success) {
        setCheckInStatus('checked-in')
        fetchRecords()
        alert('Check-in successful!')
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const response = await apiClient.checkOut()
      if (response.success) {
        setCheckInStatus('checked-out')
        fetchRecords()
        alert('Check-out successful!')
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Check-out failed')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return <Badge variant="success">Valid</Badge>
      case 'FLAGGED':
        return <Badge variant="warning">Flagged</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">
            Track your daily attendance and view history
          </p>
        </div>

        {/* Check-In Card */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-6 w-6 mr-2 text-primary" />
              {checkInStatus === 'checked-out' ? 'Check In' : 'Checked In'}
            </CardTitle>
            <CardDescription>
              {checkInStatus === 'checked-out'
                ? 'Mark your attendance for today'
                : `You checked in today at ${todayRecord.checkInTime}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkInStatus === 'checked-out' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-xs text-gray-600">
                        {currentLocation ? 'GPS Ready' : 'Getting location...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Camera className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">Selfie</p>
                      <p className="text-xs text-gray-600">Camera ready</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Wifi className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">WiFi</p>
                      <p className="text-xs text-gray-600">Connected</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCheckIn}
                  loading={loading}
                  className="w-full h-14 text-lg"
                  disabled={!currentLocation}
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Check In Now
                </Button>
                {!currentLocation && (
                  <p className="text-sm text-center text-gray-600">
                    Please enable location services to check in
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">
                          Checked in at {todayRecord.checkInTime}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Location: {todayRecord.location}
                        </p>
                        <p className="text-sm text-green-700">
                          Status: {getStatusBadge(todayRecord.status)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCheckOut}
                  loading={loading}
                  variant="outline"
                  className="w-full h-14 text-lg"
                >
                  Check Out
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* This Month Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Days</CardDescription>
              <CardTitle className="text-3xl">{monthStats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Present</CardDescription>
              <CardTitle className="text-3xl text-green-600">{monthStats.present}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Late</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{monthStats.late}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Absent</CardDescription>
              <CardTitle className="text-3xl text-red-600">{monthStats.absent}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Early Leave</CardDescription>
              <CardTitle className="text-3xl text-orange-600">{monthStats.early_leave}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your recent attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    date: '2026-02-02',
                    checkIn: '08:25',
                    checkOut: '-',
                    duration: '-',
                    status: 'VALID',
                  },
                  {
                    date: '2026-02-01',
                    checkIn: '08:30',
                    checkOut: '17:15',
                    duration: '8h 45m',
                    status: 'VALID',
                  },
                  {
                    date: '2026-01-31',
                    checkIn: '09:05',
                    checkOut: '17:30',
                    duration: '8h 25m',
                    status: 'FLAGGED',
                    flags: ['LATE_CHECKIN'],
                  },
                  {
                    date: '2026-01-30',
                    checkIn: '08:20',
                    checkOut: '17:00',
                    duration: '8h 40m',
                    status: 'VALID',
                  },
                  {
                    date: '2026-01-29',
                    checkIn: '08:28',
                    checkOut: '-',
                    duration: '-',
                    status: 'FLAGGED',
                    flags: ['MISSING_CHECKOUT'],
                  },
                ].map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {formatDate(new Date(record.date))}
                    </TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut}</TableCell>
                    <TableCell>{record.duration}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      {record.status === 'FLAGGED' && (
                        <Button variant="outline" size="sm">
                          Request Correction
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
