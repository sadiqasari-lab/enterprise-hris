"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import {
  CalendarClock,
  Download,
  FileText,
  Search,
  Trash2,
  UserCircle2,
  Workflow,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { hrAdminNavigation } from '@/lib/navigation'
import { apiClient } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DocumentTable } from '@/components/documents/document-table'
import { DocumentItem, DocumentFilters } from '@/components/documents/types'
import { formatDate } from '@/lib/utils'

const adminUser = {
  name: 'Sarah Ahmed',
  role: 'HR Administrator',
}

const statusBadge = (status: string) => {
  if (status === 'SIGNED') return <Badge variant="success">Signed</Badge>
  if (status === 'PENDING_SIGNATURE') return <Badge variant="warning">Pending Signature</Badge>
  if (status === 'REJECTED') return <Badge variant="destructive">Rejected</Badge>
  if (status === 'DRAFT') return <Badge variant="info">Draft</Badge>
  return <Badge variant="outline">{status}</Badge>
}

export default function HRAdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [expiring, setExpiring] = useState<DocumentItem[]>([])
  const [selectedRows, setSelectedRows] = useState<DocumentItem[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DocumentFilters>({
    category: '',
    status: '',
    employeeId: '',
    expiringWithinDays: undefined,
  })

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const query = {
        category: filters.category || undefined,
        status: filters.status || undefined,
        employeeId: filters.employeeId || undefined,
        expiringWithinDays: filters.expiringWithinDays || undefined,
      }
      const [allResponse, expiringResponse] = await Promise.all([
        apiClient.getDocuments(query),
        apiClient.getExpiringDocuments(30),
      ])
      setDocuments(allResponse?.data?.documents ?? [])
      setExpiring(expiringResponse?.data?.documents ?? [])
      const profileResponse = await apiClient.getProfile()
      setCurrentUserId(profileResponse?.data?.user?.id ?? '')
    } finally {
      setLoading(false)
    }
  }, [filters.category, filters.employeeId, filters.expiringWithinDays, filters.status])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDelete = useCallback(
    async (documentId: string) => {
      await apiClient.deleteDocument(documentId)
      await fetchDocuments()
    },
    [fetchDocuments]
  )

  const handleBulkDelete = useCallback(async () => {
    if (!selectedRows.length) return
    await Promise.all(selectedRows.map((document) => apiClient.deleteDocument(document.id)))
    setSelectedRows([])
    await fetchDocuments()
  }, [fetchDocuments, selectedRows])

  const handleBulkInitiate = useCallback(async () => {
    if (!selectedRows.length || !currentUserId) return
    await Promise.all(
      selectedRows.map((document) =>
        apiClient.initiateSignature(document.id, {
          steps: [{ order: 1, approverId: currentUserId, approverRole: 'HR_ADMIN' }],
        })
      )
    )
    await fetchDocuments()
  }, [currentUserId, fetchDocuments, selectedRows])

  const columns = useMemo<ColumnDef<DocumentItem, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        id: 'employee',
        header: 'Employee',
        cell: ({ row }) => {
          const employee = row.original.employee
          if (!employee) return <span className="text-sm text-gray-400">Unassigned</span>
          return (
            <div className="inline-flex items-center gap-2 text-sm">
              <UserCircle2 className="h-4 w-4 text-gray-500" />
              {employee.first_name} {employee.last_name}
            </div>
          )
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        accessorKey: 'expiry_date',
        header: 'Expiry',
        cell: ({ row }) =>
          row.original.expiry_date ? (
            <div className="inline-flex items-center gap-1 text-sm">
              <CalendarClock className="h-4 w-4 text-gray-500" />
              {formatDate(new Date(row.original.expiry_date))}
            </div>
          ) : (
            <span className="text-sm text-gray-400">No expiry</span>
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => apiClient.downloadDocument(row.original.id)}>
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [handleDelete]
  )

  return (
    <DashboardLayout navigation={hrAdminNavigation} userInfo={adminUser}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="mt-1 text-gray-600">Manage all employee documents, signatures, and expiry cycles.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Employee ID"
                  value={filters.employeeId ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, employeeId: event.target.value }))
                  }
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={filters.category ?? ''}
                onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="">All Categories</option>
                <option value="CONTRACT">Contract</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="POLICY">Policy</option>
                <option value="IQAMA">Iqama</option>
                <option value="INSURANCE">Insurance</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={filters.status ?? ''}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_SIGNATURE">Pending Signature</option>
                <option value="SIGNED">Signed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={fetchDocuments}>
                Refresh
              </Button>
              <Button variant="outline" onClick={handleBulkInitiate} disabled={!selectedRows.length}>
                <Workflow className="mr-1 h-4 w-4" />
                Initiate Signature ({selectedRows.length})
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={!selectedRows.length}>
                <Trash2 className="mr-1 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
            <DocumentTable
              data={documents}
              columns={columns}
              selectable
              isLoading={loading}
              onSelectionChange={setSelectedRows}
              emptyMessage="No documents match the selected filters."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentTable data={expiring} columns={columns} isLoading={loading} emptyMessage="No expiring documents." />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
