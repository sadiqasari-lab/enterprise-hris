"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { gmNavigation } from '@/lib/navigation'

export default function GMAnalyticsPage() {
  return (
    <ModulePage
      title="Executive Analytics"
      description="Monitor strategic workforce and payroll trends."
      navigation={gmNavigation}
      userInfo={{ name: 'Khalid Al-Rahman', role: 'General Manager' }}
      stats={[
        { label: 'Workforce Growth', value: '+5.2%', hint: 'Compared to previous quarter' },
        { label: 'Retention', value: '95.8%', hint: 'Rolling 12 months' },
        { label: 'Attendance Rate', value: '96.5%', hint: 'Company-wide average' },
      ]}
      actions={[
        { title: 'Headcount Trends', description: 'Track department growth over time', status: 'Operational' },
        { title: 'Payroll Efficiency', description: 'Compare net payroll by period', status: 'Operational' },
        { title: 'Predictive Insights', description: 'Forecast hiring and cost needs', status: 'Ready' },
      ]}
    />
  )
}



