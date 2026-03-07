"use client"

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Home,
  Clock,
  Calendar,
  FileText,
  User,
  Download,
  Eye,
  PenTool,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { formatDate, formatDateTime } from '@/lib/utils'

const navigation = [
  { label: 'Dashboard', href: '/employee', icon: Home },
  { label: 'Attendance', href: '/employee/attendance', icon: Clock },
  { label: 'Leave', href: '/employee/leave', icon: Calendar },
  { label: 'Payslips', href: '/employee/payslips', icon: FileText },
  { label: 'Documents', href: '/employee/documents', icon: FileText },
  { label: 'Profile', href: '/employee/profile', icon: User },
]

export default function EmployeeDocumentsPage() {
  const userInfo = {
    name: 'Ahmed Ali',
    role: 'Software Engineer',
  }

  const [loading, setLoading] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  // Mock pending signatures
  const pendingSignatures = [
    {
      id: 'doc-1',
      title: 'Employment Contract - 2026',
      titleAr: 'عقد العمل - 2026',
      category: 'CONTRACT',
      uploadedBy: 'Sarah Ahmed',
      uploadedAt: '2026-02-01T10:00:00Z',
      stepOrder: 1,
      totalSteps: 4,
      approverRole: 'EMPLOYEE',
      description: 'Annual employment contract renewal',
    },
    {
      id: 'doc-2',
      title: 'NDA Agreement',
      category: 'AGREEMENT',
      uploadedBy: 'HR Department',
      uploadedAt: '2026-01-28T14:00:00Z',
      stepOrder: 1,
      totalSteps: 2,
      approverRole: 'EMPLOYEE',
      description: 'Non-disclosure agreement for new project',
    },
  ]

  // Mock document history
  const documentHistory = [
    {
      id: 'doc-3',
      title: 'Employment Contract - 2025',
      category: 'CONTRACT',
      status: 'SIGNED',
      signedAt: '2025-02-15T11:30:00Z',
      signatures: 4,
    },
    {
      id: 'doc-4',
      title: 'Work Permit',
      category: 'IQAMA',
      status: 'SIGNED',
      signedAt: '2025-01-10T09:00:00Z',
      expiryDate: '2026-01-10',
    },
    {
      id: 'doc-5',
      title: 'Medical Insurance',
      category: 'INSURANCE',
      status: 'SIGNED',
      signedAt: '2025-12-01T13:00:00Z',
      expiryDate: '2026-12-01',
    },
    {
      id: 'doc-6',
      title: 'Performance Review Q4 2025',
      category: 'OTHER',
      status: 'SIGNED',
      signedAt: '2025-12-20T16:00:00Z',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_SIGNATURE':
        return <Badge variant="warning">Pending Signature</Badge>
      case 'SIGNED':
        return <Badge variant="success">Signed</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    return <FileText className="h-4 w-4" />
  }

  const handleSign = async (documentId: string) => {
    setLoading(true)
    try {
      // In real app, capture signature from canvas
      const signatureData = 'data:image/png;base64,...' // Mock
      
      await apiClient.signDocument(documentId, signatureData)
      alert('Document signed successfully!')
      setShowSignatureModal(false)
      // Refresh documents
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to sign document')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (documentId: string) => {
    try {
      const blob = await apiClient.downloadDocument(documentId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'document.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert('Failed to download document')
    }
  }

  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">
            View and sign your employment documents
          </p>
        </div>

        {/* Pending Signatures Alert */}
        {pendingSignatures.length > 0 && (
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-yellow-900">
                    {pendingSignatures.length} Document{pendingSignatures.length > 1 ? 's' : ''} Awaiting Your Signature
                  </CardTitle>
                  <CardDescription className="text-yellow-700 mt-1">
                    Please review and sign the documents below
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Pending Signatures */}
        {pendingSignatures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Signatures</CardTitle>
              <CardDescription>Documents requiring your signature</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSignatures.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        {getCategoryIcon(doc.category)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                        {doc.titleAr && (
                          <p className="text-sm text-gray-600 mt-0.5" dir="rtl">
                            {doc.titleAr}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Uploaded by {doc.uploadedBy}</span>
                          <span>•</span>
                          <span>{formatDate(new Date(doc.uploadedAt))}</span>
                          <span>•</span>
                          <span>Step {doc.stepOrder} of {doc.totalSteps}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc)
                          setShowSignatureModal(true)
                        }}
                      >
                        <PenTool className="h-4 w-4 mr-1" />
                        Sign Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { category: 'CONTRACT', count: 2, color: 'blue' },
            { category: 'IQAMA', count: 1, color: 'green' },
            { category: 'INSURANCE', count: 1, color: 'purple' },
            { category: 'OTHER', count: 3, color: 'gray' },
          ].map((item) => (
            <Card key={item.category} className="hover-lift cursor-pointer">
              <CardHeader className="pb-3">
                <CardDescription>{item.category}</CardDescription>
                <CardTitle className="text-3xl">{item.count}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Document History */}
        <Card>
          <CardHeader>
            <CardTitle>Document History</CardTitle>
            <CardDescription>All your signed documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentHistory.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(doc.category)}
                        <span>{doc.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>{formatDate(new Date(doc.signedAt))}</TableCell>
                    <TableCell>
                      {doc.expiryDate ? (
                        <span className={
                          new Date(doc.expiryDate) < new Date()
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }>
                          {formatDate(new Date(doc.expiryDate))}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Signature Modal */}
        {showSignatureModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <CardTitle>Sign Document</CardTitle>
                <CardDescription>{selectedDocument.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    By signing this document, you acknowledge that you have read and agreed to its contents.
                  </p>
                  <p className="text-xs text-gray-600">
                    Your signature will be timestamped and recorded for legal purposes.
                  </p>
                </div>

                {/* Signature Canvas Placeholder */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white">
                  <div className="text-center text-gray-500">
                    <PenTool className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Signature Canvas</p>
                    <p className="text-xs mt-1">Draw your signature here</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowSignatureModal(false)
                      setSelectedDocument(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleSign(selectedDocument.id)}
                    loading={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Signature
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
