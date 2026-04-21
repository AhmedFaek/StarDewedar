import * as repo from './contact.repository.js'
import env from '../../config/env.js'

import { Resend } from 'resend'

const resend = new Resend(env.resendApiKey)

export const sendContactEmail = async (data) => {
    try {
        const response = await resend.emails.send({
            from: 'Star Dewedar <onboarding@resend.dev>', 
            to: 'info@stardewedar.com',
            reply_to: data.email, 
            subject: 'New Contact Message',
            html: `
        <h2>New Contact Message</h2>

        <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone_number || 'N/A'}</p>
        <p><strong>WhatsApp:</strong> ${data.whatsapp_number || 'N/A'}</p>

        <hr/>

        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `,
        })
        console.log('Email sent:', response)

        return response
    } catch (error) {
        console.error('Resend Email Error:', error)
        throw error
    }
}

export const createContact = async (data) => {
    // 1. Save in DB
    const message = await repo.createContactMessage(data)

    // 2. Send Email to Company
    await sendContactEmail(data)

    return message
}

export const getMessages = async () => {
    return repo.getAllMessages()
}