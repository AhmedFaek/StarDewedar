import * as repo from './quote.repository.js'
import * as contactService from '../contactMessages/contact.service.js'
import { baseEmailTemplate } from '../../utils/email.template.js'
import { sendEmail } from '../../utils/mailer.js'
import cloudinary from '../../config/storage.js'
import { escapeHtml } from '../../utils/htmlEscaper.js';

const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { 
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) return reject(error)
                resolve(result)
            }
        )
        stream.end(file.buffer)
    })
}

export const createQuoteRequest = async (data, file) => {
    // Set default status to 'pending'
    const quoteData = {
        ...data,
        status: 'pending',
        product_id: data.product_id || null,
    }

    // Handle file upload if provided
    if (file) {
        const result = await uploadToCloudinary(file)
        quoteData.file_url = result.secure_url
    }

    // Create quote request in DB
    const quoteRequest = await repo.create(quoteData)

    // Send email notification to company
    await sendQuoteRequestEmail(quoteRequest)

    return quoteRequest
}

export const sendQuoteRequestEmail = async (quoteRequest) => {
    try {
        const firstName = escapeHtml(quoteRequest.first_name)
        const lastName = escapeHtml(quoteRequest.last_name)
        const email = escapeHtml(quoteRequest.email)
        const phone = escapeHtml(quoteRequest.phone)
        const status = escapeHtml(quoteRequest.status)
        const details = escapeHtml(quoteRequest.details)

        const productNameAr = quoteRequest.product ? escapeHtml(quoteRequest.product.name_ar) : null
        const customProductName = quoteRequest.custom_product_name ? escapeHtml(quoteRequest.custom_product_name) : null

        const productInfo = quoteRequest.product
            ? `<p><strong>Product:</strong> ${productNameAr}</p>`
            : `<p><strong>Custom Product:</strong> ${customProductName}</p>`;

        const fileUrl = quoteRequest.file_url ? escapeHtml(quoteRequest.file_url) : null
        const fileInfo = fileUrl
            ? `
        <p>
          <strong>File:</strong>
          <a href="${fileUrl}" style="color:#2F2FE4;">
            Download File
          </a>
        </p>
      `
            : "";

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
        <p><strong>Status:</strong> ${status}</p>
      </div>

      <div style="border-left:4px solid #2F2FE4; padding-left:12px; margin-bottom:20px;">
        ${productInfo}
      </div>

      <div style="background:#f4f6ff; padding:15px; border-radius:8px;">
        <strong>Details:</strong>
        <p>${details}</p>
      </div>

      ${fileInfo}

      <div style="margin-top:25px;">
        <a href="mailto:${email}"
          style="display:inline-block;padding:12px 18px;background:#2F2FE4;color:#fff;text-decoration:none;border-radius:6px;">
          Reply to Customer
        </a>
      </div>
    `;

        return await sendEmail({
            subject: `New Quote Request - ${firstName} ${lastName}`,
            html: baseEmailTemplate({
                title: "New Quote Request 💼",
                content,
            }),
        });
    } catch (error) {
        console.error("❌ Yahoo SMTP Error:", error);
        throw error;
    }
};

export const getQuoteRequests = (options) => repo.findAll(options)

export const getQuoteRequestById = (id) => repo.findById(id)

export const getQuoteRequestsByEmail = (email) => repo.findByEmail(email)

export const getQuoteRequestsByStatus = (status) => repo.findByStatus(status)

export const updateQuoteRequest = (id, data) => {
    const payload = {}
    if (data.status !== undefined) payload.status = data.status
    if (data.details !== undefined) payload.details = data.details
    if (data.first_name !== undefined) payload.first_name = data.first_name
    if (data.last_name !== undefined) payload.last_name = data.last_name
    if (data.phone !== undefined) payload.phone = data.phone
    if (data.email !== undefined) payload.email = data.email

    return repo.update(id, payload)
}

export const deleteQuoteRequest = (id) => {
    return repo.remove(id)
}
