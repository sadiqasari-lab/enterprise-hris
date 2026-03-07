import { PrismaClient } from '@hris/database'
import { sendNotificationEmail } from '../../utils/email'

const prisma = new PrismaClient()

type NotificationChannel = 'IN_APP' | 'EMAIL' | 'BOTH'

export interface NotificationPayload {
  companyId: string
  userIds: string[]
  title: string
  message: string
  type: string
  channel?: NotificationChannel
  metadata?: Record<string, any>
}

export class NotificationService {
  async notifyUsers(payload: NotificationPayload) {
    const channel = payload.channel || 'IN_APP'
    const data = payload.userIds.map((userId) => ({
      company_id: payload.companyId,
      user_id: userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      channel,
      metadata: payload.metadata || {},
    }))

    await prisma.notification.createMany({ data })

    if (channel === 'EMAIL' || channel === 'BOTH') {
      const users = await prisma.user.findMany({
        where: { id: { in: payload.userIds } },
        select: { email: true },
      })
      await Promise.all(
        users.map((u) =>
          sendNotificationEmail(
            u.email,
            payload.title,
            `<p>${payload.message}</p>`
          )
        )
      )
    }
  }

  async notifyRole(
    companyId: string,
    roleNames: string[],
    payload: Omit<NotificationPayload, 'userIds' | 'companyId'>
  ) {
    const users = await prisma.user.findMany({
      where: {
        company_id: companyId,
        user_roles: {
          some: {
            role: { name: { in: roleNames } },
          },
        },
      },
      select: { id: true },
    })

    if (users.length === 0) return
    return this.notifyUsers({
      companyId,
      userIds: users.map((u) => u.id),
      ...payload,
    })
  }

  async notifyEmployeesByEmployeeIds(
    companyId: string,
    employeeIds: string[],
    payload: Omit<NotificationPayload, 'userIds' | 'companyId'>
  ) {
    const users = await prisma.user.findMany({
      where: {
        company_id: companyId,
        employee_id: { in: employeeIds },
      },
      select: { id: true },
    })

    if (users.length === 0) return
    return this.notifyUsers({
      companyId,
      userIds: users.map((u) => u.id),
      ...payload,
    })
  }
}

export const notificationService = new NotificationService()
