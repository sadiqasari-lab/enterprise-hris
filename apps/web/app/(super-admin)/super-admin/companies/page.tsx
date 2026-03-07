"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { superAdminNavigation } from '@/lib/navigation'

export default function SuperAdminCompaniesPage() {
  return (
    <ModulePage
      title="Company Management"
      description="Manage tenant companies, subscriptions, and lifecycle."
      navigation={superAdminNavigation}
      userInfo={{ name: 'Super Admin', role: 'System Administrator' }}
      stats={[
        { label: 'Active Companies', value: '3', hint: 'Multi-tenant deployments' },
        { label: 'Pending Onboarding', value: '1', hint: 'Awaiting configuration' },
      ]}
      actions={[
        { title: 'Tenant Configuration', description: 'Set company-level defaults and policies', status: 'Operational' },
        { title: 'Subscription Control', description: 'Manage plan and feature allocations', status: 'Ready' },
      ]}
    />
  )
}



