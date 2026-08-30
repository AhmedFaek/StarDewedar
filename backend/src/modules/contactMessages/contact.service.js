import * as repo from './contact.repository.js'
import { sendEmail } from '../../utils/mailer.js'
import { baseEmailTemplate } from '../../utils/email.template.js'
import { escapeHtml } from '../../utils/htmlEscaper.js'

export const sendContactEmail = async (data) => {
  try {
    const firstName = escapeHtml(data.first_name)
    const lastName = escapeHtml(data.last_name)
    const email = escapeHtml(data.email)
    const phone = escapeHtml(data.phone_number || 'N/A')
    const whatsapp = escapeHtml(data.whatsapp_number || 'N/A')
    const message = escapeHtml(data.message)

    const content = `
      <div style="margin-bottom:20px;">
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>

        <p>
          <strong>Email:</strong>
          <a href="mailto:${email}" style="color:#2F2FE4;">
            ${email}
          </a>
        </p>

        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
      </div>

      <div style="background:#f9f9f9; padding:15px; border-radius:8px;">
        <strong>Message:</strong>
        <p>${message}</p>
      </div>

      <div style="margin-top:25px;">
        <a href="mailto:${email}"
          style="display:inline-block;padding:12px 18px;background:#2F2FE4;color:#fff;text-decoration:none;border-radius:6px;">
          Reply to Customer
        </a>
      </div>
    `;

    return await sendEmail({
      subject: `New Contact Message - ${firstName} ${lastName}`,
      html: baseEmailTemplate({
        title: "New Contact Message Received",
        content,
      }),
    });
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

export const getMessages = async (options) => {
    return repo.getAllMessages(options)
}