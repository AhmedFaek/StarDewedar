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
})

/**
 * Send an email using the shared transporter.
 * @param {{ to?: string, subject: string, html: string }} options
 */
export const sendEmail = async ({ to, subject, html }) => {
    return await transporter.sendMail({
        from: `"Star Dewedar Website" <${env.yahooEmail}>`,
        to: to || env.yahooEmail,
        subject,
        html,
    })
}
