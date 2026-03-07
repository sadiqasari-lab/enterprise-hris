"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { gmNavigation } from '@/lib/navigation'

export default function GMReportsPage() {
  return (
    <ModulePage
      title="Executive Reports"
      description="Review payroll, workforce, and compliance summaries."
      navigation={gmNavigation}
      userInfo={{ name: 'Khalid Al-Rahman', role: 'General Manager' }}
      stats={[
        { label: 'Open Reports', value: '12', hint: 'Across finance and HR' },
        { label: 'Pending Approval Items', value: '3', hint: 'Needs executive attention' },
        { label: 'Monthly Payroll', value: 'SAR 3.75M', hint: 'Current period' },
      ]}
      actions={[
        { title: 'Payroll Summary', description: 'Track approved and pending payroll cycles', status: 'Operational' },
        { title: 'Department Cost Report', description: 'Analyze compensation by department', status: 'Operational' },
        { title: 'Export Board Pack', description: 'Download leadership-ready report bundle', status: 'Ready' },
      ]}
    />
  )
}



