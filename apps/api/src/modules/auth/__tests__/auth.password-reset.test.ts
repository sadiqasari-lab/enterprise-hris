import crypto from 'crypto'
import { ApiError } from '../../../middleware/errorHandler'

var mockUserFindUnique = jest.fn()
var mockUserUpdate = jest.fn()
var mockPasswordResetTokenDeleteMany = jest.fn()
var mockPasswordResetTokenCreate = jest.fn()
var mockPasswordResetTokenFindFirst = jest.fn()
var mockPasswordResetTokenUpdate = jest.fn()
var mockTransaction = jest.fn()

var mockValidateStrength = jest.fn()
var mockHash = jest.fn()
var mockCompare = jest.fn()

var mockSendPasswordResetEmail = jest.fn()

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    passwordResetToken: {
      deleteMany: mockPasswordResetTokenDeleteMany,
      create: mockPasswordResetTokenCreate,
      findFirst: mockPasswordResetTokenFindFirst,
      update: mockPasswordResetTokenUpdate,
    },
    $transaction: mockTransaction,
  })),
}))

jest.mock('@hris/auth', () => ({
  JWTService: jest.fn().mockImplementation(() => ({
    generateTokenPair: jest.fn(),
    verifyRefreshToken: jest.fn(),
  })),
  PasswordService: jest.fn().mockImplementation(() => ({
    validateStrength: mockValidateStrength,
    hash: mockHash,
    compare: mockCompare,
  })),
}))

jest.mock('../../../utils/email', () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}))

import { AuthService } from '../auth.service'

describe('AuthService password reset flow', () => {
  let service: AuthService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AuthService()
    mockValidateStrength.mockReturnValue({ isValid: true, errors: [] })
    mockHash.mockResolvedValue('new-hash')
    mockTransaction.mockResolvedValue(undefined)
    delete process.env.WEB_APP_URL
  })

  it('requestPasswordReset returns generic message when email not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    const result = await service.requestPasswordReset('missing@company.com')

    expect(result.message).toBe('If the email exists, a reset link has been sent')
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    expect(mockPasswordResetTokenDeleteMany).not.toHaveBeenCalled()
    expect(mockPasswordResetTokenCreate).not.toHaveBeenCalled()
  })

  it('requestPasswordReset returns generic message when user is inactive', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'inactive@company.com',
      is_active: false,
    })

    const result = await service.requestPasswordReset('inactive@company.com')

    expect(result.message).toBe('If the email exists, a reset link has been sent')
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    expect(mockPasswordResetTokenDeleteMany).not.toHaveBeenCalled()
    expect(mockPasswordResetTokenCreate).not.toHaveBeenCalled()
  })

  it('requestPasswordReset generates token, stores hash, and sends email', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'active@company.com',
      is_active: true,
    })
    process.env.WEB_APP_URL = 'http://app.test'

    const tokenBytes = Buffer.from('a'.repeat(64), 'hex')
    jest.spyOn(crypto, 'randomBytes').mockImplementation(() => tokenBytes as unknown as Buffer)
    const expectedToken = tokenBytes.toString('hex')
    const expectedHash = crypto.createHash('sha256').update(expectedToken).digest('hex')

    const result = await service.requestPasswordReset('active@company.com')

    expect(result.message).toBe('If the email exists, a reset link has been sent')
    expect(mockPasswordResetTokenCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 'user-1',
        token_hash: expectedHash,
        expires_at: expect.any(Date),
      }),
    })
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      'active@company.com',
      `http://app.test/auth/reset-password?token=${expectedToken}`
    )
  })

  it('requestPasswordReset deletes old tokens before creating new one', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-2',
      email: 'active@company.com',
      is_active: true,
    })

    await service.requestPasswordReset('active@company.com')

    const deleteOrder = mockPasswordResetTokenDeleteMany.mock.invocationCallOrder[0]
    const createOrder = mockPasswordResetTokenCreate.mock.invocationCallOrder[0]
    expect(deleteOrder).toBeLessThan(createOrder)
  })

  it('resetPassword throws 400 for invalid/expired token', async () => {
    mockPasswordResetTokenFindFirst.mockResolvedValue(null)

    await expect(service.resetPassword('bad-token', 'StrongPass1!')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired reset token',
    })
  })

  it('resetPassword throws 400 for already used token', async () => {
    mockPasswordResetTokenFindFirst.mockResolvedValue(null)

    await expect(service.resetPassword('used-token', 'StrongPass1!')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired reset token',
    })
  })

  it('resetPassword updates password hash and marks token as used', async () => {
    mockUserUpdate.mockReturnValue('user-update-op')
    mockPasswordResetTokenUpdate.mockReturnValue('token-update-op')
    mockPasswordResetTokenFindFirst.mockResolvedValue({
      id: 'token-1',
      user_id: 'user-1',
      user: { is_active: true },
    })

    await service.resetPassword('good-token', 'StrongPass1!')

    expect(mockHash).toHaveBeenCalledWith('StrongPass1!')
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password_hash: 'new-hash' },
    })
    expect(mockPasswordResetTokenUpdate).toHaveBeenCalledWith({
      where: { id: 'token-1' },
      data: { used_at: expect.any(Date) },
    })
    expect(mockTransaction).toHaveBeenCalledWith(['user-update-op', 'token-update-op'])
  })

  it('resetPassword throws 400 for weak password', async () => {
    mockValidateStrength.mockReturnValue({
      isValid: false,
      errors: ['Password must be at least 8 characters long'],
    })

    await expect(service.resetPassword('token', 'weak')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Password must be at least 8 characters long',
    })
    expect(mockPasswordResetTokenFindFirst).not.toHaveBeenCalled()
  })
})
