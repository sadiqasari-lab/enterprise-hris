"use client"

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SignatureDialogProps = {
  title: string
  open: boolean
  mode: 'sign' | 'reject'
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: { signatureData?: string; rejectionReason?: string }) => Promise<void>
}

export function SignatureDialog({
  title,
  open,
  mode,
  onOpenChange,
  onConfirm,
}: SignatureDialogProps) {
  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    try {
      if (mode === 'sign') {
        await onConfirm({
          signatureData: 'data:image/png;base64,placeholder-signature',
        })
      } else {
        await onConfirm({ rejectionReason })
      }
      setRejectionReason('')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {mode === 'sign' ? 'Approve & Sign Document' : 'Reject Document'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600">{title}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded p-1 hover:bg-gray-100" aria-label="Close dialog">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {mode === 'sign' ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-gray-600">
              <PenLine className="mb-2 h-5 w-5" />
              Signature capture placeholder. Hook this to `react-signature-canvas` in next step.
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection reason</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              loading={loading}
              variant={mode === 'sign' ? 'default' : 'destructive'}
              onClick={handleConfirm}
              disabled={mode === 'reject' && !rejectionReason.trim()}
            >
              {mode === 'sign' ? 'Confirm Signature' : 'Confirm Rejection'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

