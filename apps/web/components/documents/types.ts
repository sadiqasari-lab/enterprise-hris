export type DocumentStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'SIGNED'
  | 'REJECTED'
  | 'EXPIRED'
  | string

export type DocumentItem = {
  id: string
  title: string
  title_ar?: string | null
  category: string
  status: DocumentStatus
  expiry_date?: string | null
  employee_id?: string | null
  employee?: {
    first_name?: string
    last_name?: string
    employee_number?: string
  } | null
  created_at?: string
}

export type PendingSignatureItem = {
  document: DocumentItem
  stepOrder: number
  approverRole: string
}

export type DocumentFilters = {
  category?: string
  status?: string
  employeeId?: string
  expiringWithinDays?: number
}

