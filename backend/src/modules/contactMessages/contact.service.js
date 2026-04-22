import * as repo from './contact.repository.js'
import env from '../../config/env.js'
import nodemailer from 'nodemailer'

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
        const mailOptions = {
            from: `"Star Dewedar Website" <${env.yahooEmail}>`,
            to: env.yahooEmail, // send to yourself (recommended)
            subject: `New Contact Message from ${data.first_name} ${data.last_name}`,

            html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height:1.6;">
          
          <h2 style="color: #2F2FE4;">New Contact Message Received</h2>
          
          <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>

          <p>
            <strong>Email:</strong> 
            <a href="mailto:${data.email}" style="color:#2F2FE4;">
              ${data.email}
            </a>
          </p>

          <p><strong>Phone:</strong> ${data.phone_number || 'N/A'}</p>
          <p><strong>WhatsApp:</strong> ${data.whatsapp_number || 'N/A'}</p>

          <hr style="border:0; border-top:1px solid #eee; margin:20px 0;" />

          <p><strong>Message:</strong></p>
          <p style="background:#f9f9f9; padding:15px; border-left:4px solid #2F2FE4;">
            ${data.message}
          </p>

          <div style="margin-top:25px;">
            <a 
              href="mailto:${data.email}?subject=Re: Your message to Star Dewedar"
              style="
                display:inline-block;
                padding:12px 18px;
                background:#2F2FE4;
                color:#ffffff;
                text-decoration:none;
                border-radius:6px;
                font-weight:bold;
              "
            >
              Reply to Customer
            </a>
          </div>

        </div>
      `,
        };

        const response = await transporter.sendMail(mailOptions);
        return response;
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