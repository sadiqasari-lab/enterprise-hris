"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { hrAdminNavigation } from '@/lib/navigation'

export default function HRAdminDocumentsPage() {
  return (
    <ModulePage
      title="Document Management"
      description="Manage contracts, compliance files, and employee documents."
      navigation={hrAdminNavigation}
      userInfo={{ name: 'Sarah Ahmed', role: 'HR Administrator' }}
      stats={[
        { label: 'Active Documents', value: '1,248', hint: 'Across all categories' },
        { label: 'Expiring Soon', value: '14', hint: 'Within the next 30 days' },
      ]}
      actions={[
        { title: 'Document Vault', description: 'Centralized search and filtering', status: 'Operational' },
        { title: 'Expiry Monitoring', description: 'Track expiring compliance documents', status: 'Operational' },
      ]}
    />
  )
}



