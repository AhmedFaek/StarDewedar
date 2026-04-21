import * as repo from './contact.repository.js'
import env from '../../config/env.js'

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.gmailEmail,
        pass: env.gmailPassword,
    },
})

export const sendContactEmail = async (data) => {
    try {
        const mailOptions = {
            from: `"Star Dewedar System" <stardewedar.system@gmail.com>`,
            to: 'info@stardewedar.com',
            replyTo: data.email,
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
        }

        const response = await transporter.sendMail(mailOptions)
        console.log('Email sent:', response)

        return response
    } catch (error) {
        console.error('Gmail Email Error:', error)
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