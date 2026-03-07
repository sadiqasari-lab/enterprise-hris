var mockNotificationCreateMany = jest.fn()
var mockUserFindMany = jest.fn()

var mockSendNotificationEmail = jest.fn()

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    notification: {
      createMany: mockNotificationCreateMany,
    },
    user: {
      findMany: mockUserFindMany,
    },
  })),
}))

jest.mock('../../../utils/email', () => ({
  sendNotificationEmail: mockSendNotificationEmail,
}))

import { NotificationService } from '../notification.service'

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new NotificationService()
  })

  it('notifyUsers creates in-app notifications for all userIds', async () => {
    mockUserFindMany.mockResolvedValue([{ email: 'a@b.com' }, { email: 'b@b.com' }])

    await service.notifyUsers({
      companyId: 'c-1',
      userIds: ['u-1', 'u-2'],
      title: 'Test',
      message: 'Hello',
      type: 'SYSTEM',
      channel: 'IN_APP',
    })

    expect(mockNotificationCreateMany).toHaveBeenCalledWith({
      data: [
        {
          company_id: 'c-1',
          user_id: 'u-1',
          title: 'Test',
          message: 'Hello',
          type: 'SYSTEM',
          channel: 'IN_APP',
          metadata: {},
        },
        {
          company_id: 'c-1',
          user_id: 'u-2',
          title: 'Test',
          message: 'Hello',
          type: 'SYSTEM',
          channel: 'IN_APP',
          metadata: {},
        },
      ],
    })
    expect(mockSendNotificationEmail).not.toHaveBeenCalled()
  })

  it('notifyUsers sends emails when channel is EMAIL', async () => {
    mockUserFindMany.mockResolvedValue([{ email: 'a@b.com' }, { email: 'b@b.com' }])

    await service.notifyUsers({
      companyId: 'c-1',
      userIds: ['u-1', 'u-2'],
      title: 'Email',
      message: 'Body',
      type: 'SYSTEM',
      channel: 'EMAIL',
    })

    expect(mockSendNotificationEmail).toHaveBeenCalledTimes(2)
  })

  it('notifyUsers sends emails when channel is BOTH', async () => {
    mockUserFindMany.mockResolvedValue([{ email: 'a@b.com' }])

    await service.notifyUsers({
      companyId: 'c-1',
      userIds: ['u-1'],
      title: 'Both',
      message: 'Body',
      type: 'SYSTEM',
      channel: 'BOTH',
    })

    expect(mockSendNotificationEmail).toHaveBeenCalledTimes(1)
  })

  it('notifyUsers does NOT send emails when channel is IN_APP', async () => {
    await service.notifyUsers({
      companyId: 'c-1',
      userIds: ['u-1'],
      title: 'In app',
      message: 'Only',
      type: 'SYSTEM',
      channel: 'IN_APP',
    })

    expect(mockSendNotificationEmail).not.toHaveBeenCalled()
  })

  it('notifyRole resolves users by role and calls notifyUsers', async () => {
    mockUserFindMany.mockResolvedValue([{ id: 'u-1' }, { id: 'u-2' }])

    const spy = jest.spyOn(service, 'notifyUsers').mockResolvedValue(undefined)

    await service.notifyRole('c-1', ['HR_ADMIN'], {
      title: 'Role',
      message: 'Notify',
      type: 'SYSTEM',
      channel: 'IN_APP',
    })

    expect(mockUserFindMany).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith({
      companyId: 'c-1',
      userIds: ['u-1', 'u-2'],
      title: 'Role',
      message: 'Notify',
      type: 'SYSTEM',
      channel: 'IN_APP',
    })
  })

  it('notifyRole does nothing when no users found for role', async () => {
    mockUserFindMany.mockResolvedValue([])

    const spy = jest.spyOn(service, 'notifyUsers').mockResolvedValue(undefined)

    await service.notifyRole('c-1', ['HR_ADMIN'], {
      title: 'Role',
      message: 'Notify',
      type: 'SYSTEM',
    })

    expect(spy).not.toHaveBeenCalled()
  })

  it('notifyEmployeesByEmployeeIds resolves users by employee_id and calls notifyUsers', async () => {
    mockUserFindMany.mockResolvedValue([{ id: 'u-10' }])

    const spy = jest.spyOn(service, 'notifyUsers').mockResolvedValue(undefined)

    await service.notifyEmployeesByEmployeeIds('c-1', ['e-1'], {
      title: 'Payslip',
      message: 'Available',
      type: 'PAYROLL',
      channel: 'BOTH',
    })

    expect(mockUserFindMany).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith({
      companyId: 'c-1',
      userIds: ['u-10'],
      title: 'Payslip',
      message: 'Available',
      type: 'PAYROLL',
      channel: 'BOTH',
    })
  })

  it('notifyEmployeesByEmployeeIds does nothing when no users found', async () => {
    mockUserFindMany.mockResolvedValue([])

    const spy = jest.spyOn(service, 'notifyUsers').mockResolvedValue(undefined)

    await service.notifyEmployeesByEmployeeIds('c-1', ['e-1'], {
      title: 'Payslip',
      message: 'Available',
      type: 'PAYROLL',
    })

    expect(spy).not.toHaveBeenCalled()
  })
})
