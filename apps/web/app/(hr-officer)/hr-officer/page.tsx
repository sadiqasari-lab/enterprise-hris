"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { hrOfficerNavigation } from '@/lib/navigation'

export default function HROfficerDashboardPage() {
  return (
    <ModulePage
      title="HR Officer Workspace"
      description="Operational workspace for day-to-day HR execution."
      navigation={hrOfficerNavigation}
      userInfo={{ name: 'Fatima Hassan', role: 'HR Officer' }}
      stats={[
        { label: 'Open HR Tasks', value: '21', hint: 'Attendance, payroll, and onboarding' },
        { label: 'New Joiners', value: '4', hint: 'Current onboarding batch' },
        { label: 'Payroll Stage', value: 'Draft', hint: 'Current payroll cycle state' },
      ]}
      actions={[
        { title: 'Attendance Ops', description: 'Resolve attendance issues and corrections', status: 'Operational' },
        { title: 'Onboarding Tracking', description: 'Monitor completion for new hires', status: 'Operational' },
        { title: 'Payroll Preparation', description: 'Prepare cycle before HR Admin review', status: 'Operational' },
      ]}
    />
  )
}



