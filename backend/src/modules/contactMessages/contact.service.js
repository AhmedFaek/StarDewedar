import * as repo from './contact.repository.js'
import env from '../../config/env.js'
import nodemailer from 'nodemailer'
import {baseEmailTemplate} from '../../utils/email.template.js'

const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,         // Use 465 for Yahoo
    secure: true,      // true for 465, false for other ports
    auth: {
        user: env.yahooEmail,
        pass: env.yahooPassword,
    },
    // Yahoo often requires these headers to avoid being flagged as spam/invalid
    tls: {
        rejectUnauthorized: false
    }
})

export const sendContactEmail = async (data) => {
  try {
    const content = `
      <div style="margin-bottom:20px;">
        <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>

        <p>
          <strong>Email:</strong>
          <a href="mailto:${data.email}" style="color:#2F2FE4;">
            ${data.email}
          </a>
        </p>

        <p><strong>Phone:</strong> ${data.phone_number || 'N/A'}</p>
        <p><strong>WhatsApp:</strong> ${data.whatsapp_number || 'N/A'}</p>
      </div>

      <div style="background:#f9f9f9; padding:15px; border-radius:8px;">
        <strong>Message:</strong>
        <p>${data.message}</p>
      </div>

      <div style="margin-top:25px;">
        <a href="mailto:${data.email}"
          style="display:inline-block;padding:12px 18px;background:#2F2FE4;color:#fff;text-decoration:none;border-radius:6px;">
          Reply to Customer
        </a>
      </div>
    `;

    const mailOptions = {
      from: `"Star Dewedar Website" <${env.yahooEmail}>`,
      to: env.yahooEmail,
      subject: `New Contact Message - ${data.first_name} ${data.last_name}`,
      html: baseEmailTemplate({
        title: "New Contact Message Received",
        content,
      }),
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("❌ Yahoo SMTP Error:", error);
    throw error;
  }
};

export const createContact = async (data) => {
    // 1. Persist to Database
    const message = await repo.createContactMessage(data)

    // 2. Trigger Email Notification
    await sendContactEmail(data)

    return message
}

export const getMessages = async () => {
    return repo.getAllMessages()
}