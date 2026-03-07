"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { managerNavigation } from '@/lib/navigation'

export default function ManagerPerformancePage() {
  return (
    <ModulePage
      title="Team Performance"
      description="Track goals, appraisals, and development plans."
      navigation={managerNavigation}
      userInfo={{ name: 'Ahmed Al-Farsi', role: 'Engineering Manager' }}
      stats={[
        { label: 'Goals In Progress', value: '19', hint: 'Across your team' },
        { label: 'Reviews Due', value: '5', hint: 'This appraisal cycle' },
      ]}
      actions={[
        { title: 'Goal Tracking', description: 'Monitor objective completion and blockers', status: 'Operational' },
        { title: 'Appraisal Reviews', description: 'Submit quarterly review outcomes', status: 'Operational' },
      ]}
    />
  )
}



