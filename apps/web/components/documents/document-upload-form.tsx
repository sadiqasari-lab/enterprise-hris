"use client"

import { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type UploadPayload = {
  file: File
  title: string
  category: string
  employeeId?: string
  expiryDate?: string
  requireSignature: boolean
  allowDownload: boolean
}

type DocumentUploadFormProps = {
  employeeOptions?: { id: string; label: string }[]
  onUpload: (payload: UploadPayload) => Promise<void>
}

export function DocumentUploadForm({ employeeOptions = [], onUpload }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('CONTRACT')
  const [employeeId, setEmployeeId] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [requireSignature, setRequireSignature] = useState(false)
  const [allowDownload, setAllowDownload] = useState(true)

  const dropzone = useDropzone({
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0] ?? null)
    },
  })

  const canSubmit = useMemo(() => Boolean(file && title.trim() && category), [file, title, category])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || !canSubmit) return
    setIsSubmitting(true)
    try {
      await onUpload({
        file,
        title: title.trim(),
        category,
        employeeId: employeeId || undefined,
        expiryDate: expiryDate || undefined,
        requireSignature,
        allowDownload,
      })
      setFile(null)
      setTitle('')
      setCategory('CONTRACT')
      setEmployeeId('')
      setExpiryDate('')
      setRequireSignature(false)
      setAllowDownload(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div
            {...dropzone.getRootProps()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary"
          >
            <input {...dropzone.getInputProps()} />
            <UploadCloud className="mx-auto h-8 w-8 text-gray-500" />
            <p className="mt-2 text-sm text-gray-700">Drag and drop or click to upload</p>
            <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC, DOCX</p>
            {file && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1 text-xs">
                <FileText className="h-3.5 w-3.5" />
                {file.name}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Document title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="CONTRACT">Contract</option>
              <option value="AGREEMENT">Agreement</option>
              <option value="POLICY">Policy</option>
              <option value="IQAMA">Iqama</option>
              <option value="INSURANCE">Insurance</option>
              <option value="OTHER">Other</option>
            </select>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Employee (optional)</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={requireSignature}
                onChange={(e) => setRequireSignature(e.target.checked)}
              />
              Require Signature
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
              />
              Allow Download
            </label>
          </div>

          <Button type="submit" loading={isSubmitting} disabled={!canSubmit}>
            Upload
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

