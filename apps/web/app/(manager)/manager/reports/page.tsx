"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { managerNavigation } from '@/lib/navigation'

export default function ManagerReportsPage() {
  return (
    <ModulePage
      title="Manager Reports"
      description="View team-level operational and performance metrics."
      navigation={managerNavigation}
      userInfo={{ name: 'Ahmed Al-Farsi', role: 'Engineering Manager' }}
      stats={[
        { label: 'Available Reports', value: '8', hint: 'Team-focused templates' },
        { label: 'Exports This Month', value: '14', hint: 'PDF and spreadsheet' },
      ]}
      actions={[
        { title: 'Attendance Summary', description: 'Team attendance and punctuality insights', status: 'Operational' },
        { title: 'Goal Performance', description: 'Objective completion per member', status: 'Operational' },
      ]}
    />
  )
}



