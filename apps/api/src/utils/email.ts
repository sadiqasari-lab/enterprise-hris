import nodemailer from 'nodemailer'
import { logger } from './logger'

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@hris.local'

function getTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  const transport = getTransport()
  if (!transport) {
    logger.warn(`SMTP not configured. Notification email to ${to}: ${subject}`)
    return
  }

  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  })
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const transport = getTransport()
  if (!transport) {
    logger.warn(`SMTP not configured. Password reset link for ${to}: ${resetLink}`)
    return
  }

  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Reset your HRIS password',
    text: `Use this link to reset your password: ${resetLink}`,
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  })
}
