"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { hrAdminNavigation } from '@/lib/navigation'

export default function HRAdminAttendancePage() {
  return (
    <ModulePage
      title="Attendance Management"
      description="Track attendance compliance and resolve exceptions."
      navigation={hrAdminNavigation}
      userInfo={{ name: 'Sarah Ahmed', role: 'HR Administrator' }}
      stats={[
        { label: 'Today Check-Ins', value: '243', hint: 'Out of 250 employees' },
        { label: 'Late Arrivals', value: '7', hint: 'Pending review' },
        { label: 'Open Corrections', value: '5', hint: 'Awaiting HR decision' },
      ]}
      actions={[
        { title: 'Attendance Exceptions', description: 'Review late/missing punches', status: 'Operational' },
        { title: 'Correction Requests', description: 'Approve or reject employee requests', status: 'Operational' },
      ]}
    />
  )
}



