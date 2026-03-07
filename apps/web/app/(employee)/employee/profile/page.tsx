"use client"

import { ModulePage } from '@/components/layout/ModulePage'
import { employeeNavigation } from '@/lib/navigation'

export default function EmployeeProfilePage() {
  return (
    <ModulePage
      title="My Profile"
      description="View and maintain your personal and employment information."
      navigation={employeeNavigation}
      userInfo={{ name: 'Ahmed Ali', role: 'Software Engineer' }}
      stats={[
        { label: 'Profile Completion', value: '92%', hint: 'Keep your details up to date' },
        { label: 'Documents Uploaded', value: '7', hint: 'Including IDs and certifications' },
      ]}
      actions={[
        { title: 'Personal Information', description: 'Update contact and personal details', status: 'Operational' },
        { title: 'Emergency Contacts', description: 'Maintain emergency contact records', status: 'Operational' },
        { title: 'Banking Details', description: 'Review payroll-linked bank account', status: 'Ready' },
      ]}
    />
  )
}


