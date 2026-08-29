import * as repo from './visit.repository.js';
import * as contactService from '../contactMessages/contact.service.js';
import { baseEmailTemplate } from '../../utils/email.template.js';
import env from '../../config/env.js';
import nodemailer from 'nodemailer';

export const createVisitRequest = async (data) => {
    const visitData = {
        ...data,
        status: 'pending',
        preferred_date: new Date(data.preferred_date),
    };

    const visitRequest = await repo.create(visitData);

    await sendVisitRequestEmail(visitRequest);

    return visitRequest;
};

const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,         
    secure: true,      
    auth: {
        user: env.yahooEmail,
        pass: env.yahooPassword,
    },
    tls: {
        rejectUnauthorized: false
    }
})

export const sendVisitRequestEmail = async (visitRequest) => {
    try {
        const content = `
      <div style="margin-bottom:20px;">
        <p><strong>Name:</strong> ${visitRequest.name}</p>

        <p>
          <strong>Email:</strong>
          <a href="mailto:${visitRequest.email}" style="color:#2F2FE4;">
            ${visitRequest.email}
          </a>
        </p>

        <p><strong>Phone:</strong> ${visitRequest.phone_number}</p>

        ${visitRequest.whatsapp_number
                ? `<p><strong>WhatsApp:</strong> ${visitRequest.whatsapp_number}</p>`
                : ''
            }
      </div>

      <div style="border-left:4px solid #2F2FE4; padding-left:12px; margin-bottom:20px;">
        <p><strong>Factory Name:</strong> ${visitRequest.factory_name}</p>
        <p><strong>Activity:</strong> ${visitRequest.factory_activity}</p>
        <p><strong>Address:</strong> ${visitRequest.address}</p>
      </div>

      <div style="background:#f4f6ff; padding:15px; border-radius:8px; margin-bottom:20px;">
        <p><strong>Preferred Date:</strong> ${new Date(
                visitRequest.preferred_date
            ).toLocaleString()}</p>
      </div>

      <div style="background:#f9f9f9; padding:15px; border-radius:8px;">
        <strong>Details:</strong>
        <p>${visitRequest.details}</p>
      </div>

      <div style="margin-top:25px;">
        <a href="mailto:${visitRequest.email}"
          style="display:inline-block;padding:12px 18px;background:#2F2FE4;color:#fff;text-decoration:none;border-radius:6px;">
          Reply to Customer
        </a>
      </div>
    `;

        const mailOptions = {
            from: `"Star Dewedar Website" <${env.yahooEmail}>`,
            to: env.yahooEmail,
            subject: `New Visit Request - ${visitRequest.name}`,
            html: baseEmailTemplate({
                title: 'New Visit Request 🏭',
                content,
            }),
        };

        return await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('❌ Yahoo SMTP Error:', error);
    }
};

export const getVisitRequests = () => repo.findAll()

export const getVisitRequestById = (id) => repo.findById(id)

export const getVisitRequestsByEmail = (email) => repo.findByEmail(email)

export const getVisitRequestsByStatus = (status) => repo.findByStatus(status)

export const updateVisitRequest = (id, data) => {
    const payload = {}
    if (data.status !== undefined) payload.status = data.status
    if (data.factory_name !== undefined) payload.factory_name = data.factory_name
    if (data.factory_activity !== undefined) payload.factory_activity = data.factory_activity
    if (data.name !== undefined) payload.name = data.name
    if (data.phone_number !== undefined) payload.phone_number = data.phone_number
    if (data.whatsapp_number !== undefined) payload.whatsapp_number = data.whatsapp_number
    if (data.email !== undefined) payload.email = data.email
    if (data.address !== undefined) payload.address = data.address
    if (data.preferred_date !== undefined) payload.preferred_date = new Date(data.preferred_date)
    if (data.details !== undefined) payload.details = data.details

    return repo.update(id, payload)
}

export const deleteVisitRequest = (id) => {
    return repo.remove(id)
}
