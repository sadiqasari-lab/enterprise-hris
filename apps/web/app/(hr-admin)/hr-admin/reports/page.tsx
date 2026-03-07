"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { hrAdminNavigation } from '@/lib/navigation'

export default function HRAdminReportsPage() {
  return (
    <ModulePage
      title="HR Reports"
      description="Generate workforce, leave, attendance, and payroll reports."
      navigation={hrAdminNavigation}
      userInfo={{ name: 'Sarah Ahmed', role: 'HR Administrator' }}
      stats={[
        { label: 'Saved Report Templates', value: '22', hint: 'Reusable report presets' },
        { label: 'Generated This Month', value: '64', hint: 'Exported reports' },
      ]}
      actions={[
        { title: 'Workforce Summary', description: 'Headcount and attrition insights', status: 'Operational' },
        { title: 'Attendance Report', description: 'Department-wise attendance metrics', status: 'Operational' },
        { title: 'Payroll Analytics', description: 'Cost trends and payouts by cycle', status: 'Operational' },
      ]}
    />
  )
}



