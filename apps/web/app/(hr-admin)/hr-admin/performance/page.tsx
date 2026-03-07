"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { hrAdminNavigation } from '@/lib/navigation'

export default function HRAdminPerformancePage() {
  return (
    <ModulePage
      title="Performance Management"
      description="Oversee goals, reviews, and appraisal cycles."
      navigation={hrAdminNavigation}
      userInfo={{ name: 'Sarah Ahmed', role: 'HR Administrator' }}
      stats={[
        { label: 'Active Goals', value: '326', hint: 'Company-wide goal records' },
        { label: 'Pending Reviews', value: '28', hint: 'Awaiting manager completion' },
        { label: 'Completion Rate', value: '87%', hint: 'Current cycle progress' },
      ]}
      actions={[
        { title: 'Appraisal Cycle', description: 'Track ongoing performance reviews', status: 'Operational' },
        { title: 'Goal Progress', description: 'Monitor objective completion by team', status: 'Operational' },
      ]}
    />
  )
}



