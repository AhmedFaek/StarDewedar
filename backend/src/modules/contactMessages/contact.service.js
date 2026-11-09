import * as repo from './contact.repository.js'
import { sendEmail } from '../../utils/mailer.js'
import {
    buildNotificationEmail,
    createSdcMonogramAttachment,
    SDC_MONOGRAM_CID,
} from '../../utils/email.template.js'
import { sanitizeEmailText } from '../../utils/htmlEscaper.js'

export const sendContactEmail = async (data) => {
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

  return sendEmail({
    subject: `New Contact Message — ${sanitizeEmailText(fullName, 60)} — SDC`,
    html,
    attachments: [createSdcMonogramAttachment()],
  })
}

export const createContact = async (data) => {
    // 1. Persist to Database
    const message = await repo.createContactMessage(data)

    try {
        await sendContactEmail(data)
    } catch (error) {
        console.error('Contact staff notification failed', {
            event: 'contact_notification_failed',
            contactId: message.id,
            errorName: typeof error?.name === 'string' ? error.name : 'Error',
        })
        // TODO: Send a staff alert when the notification alert hook is available.
    }

    return message
}

export const getMessages = async (options) => {
    return repo.getAllMessages(options)
}