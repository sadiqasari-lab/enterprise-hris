"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { hrAdminNavigation } from '@/lib/navigation'

export default function HRAdminSettingsPage() {
  return (
    <ModulePage
      title="HR Settings"
      description="Configure policies, workflows, and role-based HR options."
      navigation={hrAdminNavigation}
      userInfo={{ name: 'Sarah Ahmed', role: 'HR Administrator' }}
      stats={[
        { label: 'Policy Sets', value: '9', hint: 'Attendance, leave, payroll rules' },
        { label: 'Automation Rules', value: '17', hint: 'Approval and notification flows' },
      ]}
      actions={[
        { title: 'Leave Policy Rules', description: 'Configure balances and approval matrix', status: 'Operational' },
        { title: 'Attendance Policy', description: 'Set grace periods and violation handling', status: 'Operational' },
        { title: 'Payroll Workflow', description: 'Define review and approval sequence', status: 'Operational' },
      ]}
    />
  )
}



