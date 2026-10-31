import * as repo from './contact.repository.js'
import { sendEmail } from '../../utils/mailer.js'
import {
    buildNotificationEmail,
    createSdcMonogramAttachment,
    SDC_MONOGRAM_CID,
} from '../../utils/email.template.js'

export const sendContactEmail = async (data) => {
  try {
    const firstName = data.first_name
    const lastName = data.last_name
    const fullName = `${firstName} ${lastName}`.trim()
    const html = buildNotificationEmail({
      requestType: 'CONTACT',
      customerInfo: {
        name: fullName,
        email: data.email,
        phone: data.phone_number,
      },
      requestInfo: data.whatsapp_number
        ? [{ label: 'WhatsApp', value: data.whatsapp_number }]
        : [],
      details: data.message,
      detailsTitle: 'Message',
      customerEmail: data.email,
      logoCid: SDC_MONOGRAM_CID,
    })

    return await sendEmail({
      subject: `New Contact Message — ${fullName} — SDC`,
      html,
      attachments: [createSdcMonogramAttachment()],
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