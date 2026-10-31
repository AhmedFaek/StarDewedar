import nodemailer from 'nodemailer'
import env from '../config/env.js'

/* ─── Shared Transporter Singleton ───────────────────────────────────────── */

export const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: {
        user: env.yahooEmail,
        pass: env.yahooPassword,
    },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 120_000,
})

/**
 * Send an email using the shared transporter.
 * @param {{ to?: string, subject: string, html: string, attachments?: Array }} options
 */
export const sendEmail = async ({ to, subject, html, attachments }) => {
    const mailOptions = {
        from: `"Star Dewedar Website" <${env.yahooEmail}>`,
        to: to || env.yahooEmail,
        subject,
        html,
    }

    if (Array.isArray(attachments) && attachments.length > 0) {
        mailOptions.attachments = attachments
    }

    try {
        return await transporter.sendMail(mailOptions)
    } catch (err) {
        const code = String(err?.code || '').toUpperCase()
        console.error('[mailer] Failed to send email', {
            event: 'email_delivery_failed',
            errorCode: /^[A-Z0-9_]{1,48}$/.test(code) ? code : 'EMAIL_DELIVERY_FAILED',
            errorName: /^[A-Za-z0-9_$]{1,64}$/.test(String(err?.name || ''))
                ? err.name
                : 'Error',
        })
        throw err
    }
}
