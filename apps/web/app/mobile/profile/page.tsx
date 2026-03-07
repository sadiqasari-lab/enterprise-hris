"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile/MobileShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { MobileProfileFormInput, validateMobileProfileInput } from './profile.validation'

const emptyForm: MobileProfileFormInput = {
  firstName: '',
  lastName: '',
  phone: '',
  nationality: '',
  dateOfBirth: '',
}

function toDateInput(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export default function MobileProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState<MobileProfileFormInput>(emptyForm)
  const [initialForm, setInitialForm] = useState<MobileProfileFormInput>(emptyForm)

  async function loadProfile() {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.getMobileProfile()
      const nextProfile = response.data
      setProfile(nextProfile)

      const mappedForm: MobileProfileFormInput = {
        firstName: nextProfile.employee?.firstName || '',
        lastName: nextProfile.employee?.lastName || '',
        phone: nextProfile.employee?.phone || '',
        nationality: nextProfile.employee?.nationality || '',
        dateOfBirth: toDateInput(nextProfile.employee?.dateOfBirth),
      }
      setForm(mappedForm)
      setInitialForm(mappedForm)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm])

  async function handleSave() {
    setError('')
    setSuccess('')

    const errors = validateMobileProfileInput(form)
    if (errors.length > 0) {
      setError(errors[0])
      return
    }

    setSaving(true)
    try {
      const response = await apiClient.updateMobileProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        nationality: form.nationality.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
      })

      const nextProfile = response.data
      setProfile(nextProfile)
      const nextForm: MobileProfileFormInput = {
        firstName: nextProfile.employee?.firstName || '',
        lastName: nextProfile.employee?.lastName || '',
        phone: nextProfile.employee?.phone || '',
        nationality: nextProfile.employee?.nationality || '',
        dateOfBirth: toDateInput(nextProfile.employee?.dateOfBirth),
      }
      setForm(nextForm)
      setInitialForm(nextForm)
      setSuccess(response.message || 'Profile updated successfully')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell title="My Profile" subtitle="View and update your basic employee details">
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account Info</CardTitle>
            <CardDescription>Employment and system-linked fields</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-600">Loading profile...</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Employee #</span>
                  <span className="font-medium text-gray-900">
                    {profile?.employee?.employeeNumber || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Work Email</span>
                  <span className="font-medium text-gray-900">{profile?.employee?.workEmail || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Department</span>
                  <span className="font-medium text-gray-900">
                    {profile?.employee?.department?.name || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Position</span>
                  <span className="font-medium text-gray-900">{profile?.employee?.position || '-'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Editable personal profile fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="mobile-profile-first-name" className="text-xs font-medium text-gray-600">First Name</label>
              <Input
                id="mobile-profile-first-name"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="mobile-profile-last-name" className="text-xs font-medium text-gray-600">Last Name</label>
              <Input
                id="mobile-profile-last-name"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="mobile-profile-phone" className="text-xs font-medium text-gray-600">Phone</label>
              <Input
                id="mobile-profile-phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+9665..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="mobile-profile-nationality" className="text-xs font-medium text-gray-600">Nationality</label>
              <Input
                id="mobile-profile-nationality"
                value={form.nationality}
                onChange={(e) => setForm((prev) => ({ ...prev, nationality: e.target.value }))}
                placeholder="Nationality"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="mobile-profile-date-of-birth" className="text-xs font-medium text-gray-600">Date of Birth</label>
              <Input
                id="mobile-profile-date-of-birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges || loading}
            >
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  )
}
