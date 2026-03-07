export interface MobileProfileFormInput {
  firstName: string
  lastName: string
  phone: string
  nationality: string
  dateOfBirth: string
}

export function validateMobileProfileInput(input: MobileProfileFormInput): string[] {
  const errors: string[] = []

  if (!input.firstName.trim()) {
    errors.push('First name is required')
  }

  if (!input.lastName.trim()) {
    errors.push('Last name is required')
  }

  if (input.firstName.trim().length > 80) {
    errors.push('First name is too long')
  }

  if (input.lastName.trim().length > 80) {
    errors.push('Last name is too long')
  }

  if (input.phone.trim().length > 32) {
    errors.push('Phone number is too long')
  }

  if (input.nationality.trim().length > 64) {
    errors.push('Nationality is too long')
  }

  return errors
}
