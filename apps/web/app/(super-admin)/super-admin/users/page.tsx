"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { superAdminNavigation } from '@/lib/navigation'

export default function SuperAdminUsersPage() {
  return (
    <ModulePage
      title="Global User Administration"
      description="Administer cross-company user accounts and role access."
      navigation={superAdminNavigation}
      userInfo={{ name: 'Super Admin', role: 'System Administrator' }}
      stats={[
        { label: 'Total Platform Users', value: '512', hint: 'Across all companies' },
        { label: 'Locked Accounts', value: '4', hint: 'Require admin review' },
      ]}
      actions={[
        { title: 'Role Assignment', description: 'Grant and revoke elevated privileges', status: 'Operational' },
        { title: 'Account Recovery', description: 'Unlock and reactivate accounts', status: 'Operational' },
      ]}
    />
  )
}



