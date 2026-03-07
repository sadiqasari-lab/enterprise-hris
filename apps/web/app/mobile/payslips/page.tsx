"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile/MobileShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'
import { getPayslipPeriodLabel, toDisplayEntries } from './payslip.utils'

export default function MobilePayslipsPage() {
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [payslips, setPayslips] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)

  async function loadPayslips() {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.getMobilePayslips()
      setPayslips(response.data.payslips || [])
      setSummary(response.data.summary || null)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load payslips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayslips()
  }, [])

  async function handleViewDetails(cycleId: string) {
    setSelectedCycleId(cycleId)
    setDetailLoading(true)
    setError('')
    try {
      const response = await apiClient.getMobilePayslipDetail(cycleId)
      setSelectedPayslip(response.data.payslip)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load payslip details')
    } finally {
      setDetailLoading(false)
    }
  }

  const allowanceEntries = useMemo(
    () => toDisplayEntries(selectedPayslip?.allowances),
    [selectedPayslip]
  )
  const deductionEntries = useMemo(
    () => toDisplayEntries(selectedPayslip?.deductions),
    [selectedPayslip]
  )

  return (
    <MobileShell title="Payslips" subtitle="Review salary history and details">
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Summary</CardTitle>
            <CardDescription>Aggregated payslip totals</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !summary ? (
              <p className="text-sm text-gray-600">Loading summary...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-600">Total Net</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(summary?.totalNet || 0)}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-600">Total Gross</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(summary?.totalGross || 0)}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-600">Deductions</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(summary?.totalDeductions || 0)}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-600">Payslip Count</p>
                  <p className="font-semibold text-gray-900">{summary?.count || 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payslip History</CardTitle>
            <CardDescription>Tap any payslip to load detailed earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && payslips.length === 0 ? (
              <p className="text-sm text-gray-600">Loading payslips...</p>
            ) : payslips.length === 0 ? (
              <p className="text-sm text-gray-600">No payslips available.</p>
            ) : (
              <div className="space-y-2">
                {payslips.map((record) => (
                  <div key={record.id} className="rounded-md border border-gray-200 px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{getPayslipPeriodLabel(record)}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                      <span>Net: {formatCurrency(record.net_salary || 0)}</span>
                      <span>Gross: {formatCurrency(record.gross_salary || 0)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleViewDetails(record.cycle_id)}
                      loading={detailLoading && selectedCycleId === record.cycle_id}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPayslip && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payslip Details</CardTitle>
              <CardDescription>{getPayslipPeriodLabel(selectedPayslip)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Basic Salary</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedPayslip.basic_salary || 0)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-gray-600">Overtime</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedPayslip.overtime_amount || 0)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-gray-600">Bonuses</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedPayslip.bonuses || 0)}
                  </span>
                </div>
              </div>

              {allowanceEntries.length > 0 && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-700">Allowances</p>
                  {allowanceEntries.map((entry) => (
                    <div key={entry.key} className="mt-1 flex items-center justify-between">
                      <span className="text-gray-600">{entry.key}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              )}

              {deductionEntries.length > 0 && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-700">Deductions</p>
                  {deductionEntries.map((entry) => (
                    <div key={entry.key} className="mt-1 flex items-center justify-between">
                      <span className="text-gray-600">{entry.key}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-md border border-gray-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Gross Salary</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedPayslip.gross_salary || 0)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-gray-600">Total Deductions</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedPayslip.total_deductions || 0)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-gray-600">Net Salary</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedPayslip.net_salary || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileShell>
  )
}
