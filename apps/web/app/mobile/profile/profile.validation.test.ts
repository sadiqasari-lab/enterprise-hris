import { describe, expect, it } from 'vitest'
import { validateMobileProfileInput } from './profile.validation'

describe('validateMobileProfileInput', () => {
  it('returns no errors for valid profile input', () => {
    const errors = validateMobileProfileInput({
      firstName: 'Aisha',
      lastName: 'Ali',
      phone: '+966500000000',
      nationality: 'Saudi',
      dateOfBirth: '1995-05-01',
    })

    expect(errors).toEqual([])
  })

  it('returns required field errors', () => {
    const errors = validateMobileProfileInput({
      firstName: '   ',
      lastName: '',
      phone: '',
      nationality: '',
      dateOfBirth: '',
    })

    expect(errors).toContain('First name is required')
    expect(errors).toContain('Last name is required')
  })
})
