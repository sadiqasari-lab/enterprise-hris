"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CalendarClock, Download, Eye, FileText, PenLine, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { employeeNavigation } from '@/lib/navigation'
import { apiClient } from '@/lib/api/client'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentTable } from '@/components/documents/document-table'
import { DocumentUploadForm } from '@/components/documents/document-upload-form'
import { SignatureDialog } from '@/components/documents/signature-dialog'
import { DocumentItem, PendingSignatureItem } from '@/components/documents/types'

type PendingSignatureRow = PendingSignatureItem & { id: string }

const employeeUser = {
  name: 'Ahmed Ali',
  role: 'Employee',
}

const statusBadge = (status: string) => {
  if (status === 'SIGNED') return <Badge variant="success">Signed</Badge>
  if (status === 'PENDING_SIGNATURE') return <Badge variant="warning">Pending Signature</Badge>
  if (status === 'REJECTED') return <Badge variant="destructive">Rejected</Badge>
  if (status === 'DRAFT') return <Badge variant="info">Draft</Badge>
  return <Badge variant="outline">{status}</Badge>
}

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [pendingSignatures, setPendingSignatures] = useState<PendingSignatureItem[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [loadingPending, setLoadingPending] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'sign' | 'reject'>('sign')
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null)

  const refreshData = useCallback(async () => {
    setLoadingDocs(true)
    setLoadingPending(true)
    try {
      const [docResponse, pendingResponse] = await Promise.all([
        apiClient.getDocuments(),
        apiClient.getPendingSignatures(),
      ])
      setDocuments(docResponse?.data?.documents ?? [])
      setPendingSignatures(pendingResponse?.data?.documents ?? [])
    } finally {
      setLoadingDocs(false)
      setLoadingPending(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const handleUpload = useCallback(
    async (payload: {
      file: File
      title: string
      category: string
      employeeId?: string
      expiryDate?: string
      requireSignature: boolean
      allowDownload: boolean
    }) => {
      const formData = new FormData()
      formData.append('file', payload.file)
      formData.append('title', payload.title)
      formData.append('category', payload.category)
      formData.append('requireSignature', String(payload.requireSignature))
      formData.append('allowDownload', String(payload.allowDownload))
      if (payload.employeeId) formData.append('employeeId', payload.employeeId)
      if (payload.expiryDate) formData.append('expiryDate', payload.expiryDate)

      await apiClient.uploadDocument(formData)
      await refreshData()
    },
    [refreshData]
  )

  const handleDownload = useCallback(async (documentId: string) => {
    const blob = await apiClient.downloadDocument(documentId)
    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = 'document'
    link.click()
    window.URL.revokeObjectURL(url)
  }, [])

  const openSignatureDialog = useCallback((document: DocumentItem, mode: 'sign' | 'reject') => {
    setActiveDocument(document)
    setDialogMode(mode)
    setDialogOpen(true)
  }, [])

  const onDialogConfirm = useCallback(
    async (payload: { signatureData?: string; rejectionReason?: string }) => {
      if (!activeDocument) return
      if (dialogMode === 'sign' && payload.signatureData) {
        await apiClient.signDocument(activeDocument.id, payload.signatureData)
      }
      if (dialogMode === 'reject' && payload.rejectionReason) {
        await apiClient.rejectDocument(activeDocument.id, payload.rejectionReason)
      }
      await refreshData()
    },
    [activeDocument, dialogMode, refreshData]
  )

  const documentColumns = useMemo<ColumnDef<DocumentItem, unknown>[]>(
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDownload(row.original.id)}>
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => apiClient.getDocument(row.original.id)}>
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
            {row.original.status === 'PENDING_SIGNATURE' && (
              <Button size="sm" onClick={() => openSignatureDialog(row.original, 'sign')}>
                <PenLine className="mr-1 h-4 w-4" />
                Sign
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleDownload, openSignatureDialog]
  )

  const pendingColumns = useMemo<ColumnDef<PendingSignatureRow, unknown>[]>(
    () => [
      {
        id: 'title',
        header: 'Document',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.document.title}</div>
            <div className="text-xs text-gray-500">{row.original.approverRole}</div>
          </div>
        ),
      },
      {
        id: 'stepOrder',
        header: 'Step',
        cell: ({ row }) => <span className="text-sm">Step {row.original.stepOrder}</span>,
      },
      {
        id: 'pendingActions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => openSignatureDialog(row.original.document, 'sign')}>
              Approve
            </Button>
            <Button variant="destructive" size="sm" onClick={() => openSignatureDialog(row.original.document, 'reject')}>
              Reject
            </Button>
          </div>
        ),
      },
    ],
    [openSignatureDialog]
  )

  const pendingRows = useMemo(
    () =>
      pendingSignatures.map((item) => ({
        ...item,
        id: `${item.document.id}-${item.stepOrder}`,
      })),
    [pendingSignatures]
  )

  return (
    <DashboardLayout navigation={employeeNavigation} userInfo={employeeUser}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="mt-1 text-gray-600">Upload, review, and sign your HR documents.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DocumentUploadForm onUpload={handleUpload} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                {pendingSignatures.length} document(s) waiting for your action
              </div>
              <DocumentTable
                data={pendingRows}
                columns={pendingColumns}
                isLoading={loadingPending}
                emptyMessage="No pending signatures."
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentTable
              data={documents}
              columns={documentColumns}
              isLoading={loadingDocs}
              emptyMessage="No uploaded documents yet."
            />
          </CardContent>
        </Card>

        {activeDocument && (
          <SignatureDialog
            open={dialogOpen}
            mode={dialogMode}
            title={activeDocument.title}
            onOpenChange={setDialogOpen}
            onConfirm={onDialogConfirm}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
