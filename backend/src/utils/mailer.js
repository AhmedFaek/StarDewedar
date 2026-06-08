import nodemailer from 'nodemailer'
import env from '../config/env.js'

/* ─── Yahoo SMTP transporter ─────────────────────────────────────────────── */

const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: env.yahooEmail,
        pass: env.yahooPassword,
    },
})

/**
 * Send an email using the configured transporter.
 * @param {{ to: string, subject: string, html: string }} options
 */
export const sendEmail = async ({ to, subject, html }) => {
    await transporter.sendMail({
        from: `"Star Dewedar" <${env.yahooEmail}>`,
        to,
        subject,
        html,
    })
}
