"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { managerNavigation } from '@/lib/navigation'

export default function ManagerTeamPage() {
  return (
    <ModulePage
      title="My Team"
      description="Manage your direct reports and team structure."
      navigation={managerNavigation}
      userInfo={{ name: 'Ahmed Al-Farsi', role: 'Engineering Manager' }}
      stats={[
        { label: 'Direct Reports', value: '7', hint: 'Current team members' },
        { label: 'Open Team Requests', value: '4', hint: 'Access and workflow requests' },
      ]}
      actions={[
        { title: 'Team Directory', description: 'View roles, contacts, and reporting lines', status: 'Operational' },
        { title: 'One-on-One Tracking', description: 'Track manager-employee meeting cadence', status: 'Ready' },
      ]}
    />
  )
}



