import * as repo from './visit.repository.js';
import * as contactService from '../contactMessages/contact.service.js';
import { baseEmailTemplate } from '../../utils/email.template.js';
import { sendEmail } from '../../utils/mailer.js';
import { escapeHtml } from '../../utils/htmlEscaper.js';

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

export const sendVisitRequestEmail = async (visitRequest) => {
    try {
        const name = escapeHtml(visitRequest.name);
        const email = escapeHtml(visitRequest.email);
        const phone = escapeHtml(visitRequest.phone_number);
        const whatsapp = visitRequest.whatsapp_number ? escapeHtml(visitRequest.whatsapp_number) : null;
        const factoryName = escapeHtml(visitRequest.factory_name);
        const factoryActivity = escapeHtml(visitRequest.factory_activity);
        const address = escapeHtml(visitRequest.address);
        const details = escapeHtml(visitRequest.details);

        const content = `
      <div style="margin-bottom:20px;">
        <p><strong>Name:</strong> ${name}</p>

        <p>
          <strong>Email:</strong>
          <a href="mailto:${email}" style="color:#2F2FE4;">
            ${email}
          </a>
        </p>

        <p><strong>Phone:</strong> ${phone}</p>

        ${whatsapp
                ? `<p><strong>WhatsApp:</strong> ${whatsapp}</p>`
                : ''
            }
      </div>

      <div style="border-left:4px solid #2F2FE4; padding-left:12px; margin-bottom:20px;">
        <p><strong>Factory Name:</strong> ${factoryName}</p>
        <p><strong>Activity:</strong> ${factoryActivity}</p>
        <p><strong>Address:</strong> ${address}</p>
      </div>

      <div style="background:#f4f6ff; padding:15px; border-radius:8px; margin-bottom:20px;">
        <p><strong>Preferred Date:</strong> ${new Date(
                visitRequest.preferred_date
            ).toLocaleString()}</p>
      </div>

      <div style="background:#f9f9f9; padding:15px; border-radius:8px;">
        <strong>Details:</strong>
        <p>${details}</p>
      </div>

      <div style="margin-top:25px;">
        <a href="mailto:${email}"
          style="display:inline-block;padding:12px 18px;background:#2F2FE4;color:#fff;text-decoration:none;border-radius:6px;">
          Reply to Customer
        </a>
      </div>
    `;

        return await sendEmail({
            subject: `New Visit Request - ${name}`,
            html: baseEmailTemplate({
                title: 'New Visit Request 🏭',
                content,
            }),
        });
    } catch (error) {
        console.error('❌ Yahoo SMTP Error:', error);
        throw error;
    }
};

export const getVisitRequests = (options) => repo.findAll(options)

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
