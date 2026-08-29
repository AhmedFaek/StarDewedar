import * as repo from './contact.repository.js'
import { sendEmail } from '../../utils/mailer.js'
import { baseEmailTemplate } from '../../utils/email.template.js'

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

    return await sendEmail({
      subject: `New Contact Message - ${data.first_name} ${data.last_name}`,
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