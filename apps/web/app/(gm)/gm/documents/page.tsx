"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { gmNavigation } from '@/lib/navigation'

export default function GMDocumentsPage() {
  return (
    <ModulePage
      title="Executive Documents"
      description="Access board-level HR and payroll documentation."
      navigation={gmNavigation}
      userInfo={{ name: 'Khalid Al-Rahman', role: 'General Manager' }}
      stats={[
        { label: 'Critical Documents', value: '18', hint: 'Policies and approvals' },
        { label: 'Pending Signatures', value: '2', hint: 'Require GM authorization' },
      ]}
      actions={[
        { title: 'Policy Approvals', description: 'Review and sign policy changes', status: 'Operational' },
        { title: 'Payroll Attachments', description: 'Open cycle-level payroll attachments', status: 'Operational' },
      ]}
    />
  )
}



