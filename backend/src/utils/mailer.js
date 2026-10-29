import nodemailer from 'nodemailer'
import env from '../config/env.js'

const MAIL_TIMEOUT_MS = 20_000

/* ─── Shared Transporter Singleton ───────────────────────────────────────── */

export const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: {
        user: env.yahooEmail,
        pass: env.yahooPassword,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: MAIL_TIMEOUT_MS,
})

const withTimeout = (promise, ms, message) => {
    let timer
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = setTimeout(() => {
                const err = new Error(message)
                err.code = 'EMAIL_TIMEOUT'
                reject(err)
            }, ms)
        }),
    ]).finally(() => clearTimeout(timer))
}

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
        return await withTimeout(
            transporter.sendMail(mailOptions),
            MAIL_TIMEOUT_MS,
            'Email send timed out. Please try again.'
        )
    } catch (err) {
        console.error('[mailer] Failed to send email', {
            event: 'email_delivery_failed',
            code: err.code,
            command: err.command,
        })
        throw err
    }
}
