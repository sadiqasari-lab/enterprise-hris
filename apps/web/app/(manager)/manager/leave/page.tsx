"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { managerNavigation } from '@/lib/navigation'

export default function ManagerLeavePage() {
  return (
    <ModulePage
      title="Leave Approvals"
      description="Approve, reject, and monitor team leave requests."
      navigation={managerNavigation}
      userInfo={{ name: 'Ahmed Al-Farsi', role: 'Engineering Manager' }}
      stats={[
        { label: 'Pending Requests', value: '3', hint: 'Needs your decision' },
        { label: 'Approved This Month', value: '11', hint: 'Team requests approved' },
      ]}
      actions={[
        { title: 'Approval Queue', description: 'Review leave requests in chronological order', status: 'Operational' },
        { title: 'Team Availability View', description: 'Check overlap and capacity impact', status: 'Operational' },
      ]}
    />
  )
}



