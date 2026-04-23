import * as repo from './quote.repository.js'
import * as contactService from '../contactMessages/contact.service.js'
import {baseEmailTemplate} from '../../utils/email.template.js'
import env from '../../config/env.js'
import nodemailer from 'nodemailer'
import cloudinary from '../../config/storage.js'

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

export const sendQuoteRequestEmail = async (quoteRequest) => {
    try {
        const productInfo = quoteRequest.product
            ? `<p><strong>Product:</strong> ${quoteRequest.product.name_ar}</p>`
            : `<p><strong>Custom Product:</strong> ${quoteRequest.custom_product_name}</p>`;

        const fileInfo = quoteRequest.file_url
            ? `
        <p>
          <strong>File:</strong>
          <a href="${quoteRequest.file_url}" style="color:#2F2FE4;">
            Download File
          </a>
        </p>
      `
            : "";

        const content = `
      <div style="margin-bottom:20px;">
        <p><strong>Name:</strong> ${quoteRequest.first_name} ${quoteRequest.last_name}</p>

        <p>
          <strong>Email:</strong>
          <a href="mailto:${quoteRequest.email}" style="color:#2F2FE4;">
            ${quoteRequest.email}
          </a>
        </p>

        <p><strong>Phone:</strong> ${quoteRequest.phone}</p>
        <p><strong>Status:</strong> ${quoteRequest.status}</p>
      </div>

      <div style="border-left:4px solid #2F2FE4; padding-left:12px; margin-bottom:20px;">
        ${productInfo}
      </div>

      <div style="background:#f4f6ff; padding:15px; border-radius:8px;">
        <strong>Details:</strong>
        <p>${quoteRequest.details}</p>
      </div>

      ${fileInfo}

      <div style="margin-top:25px;">
        <a href="mailto:${quoteRequest.email}"
          style="display:inline-block;padding:12px 18px;background:#2F2FE4;color:#fff;text-decoration:none;border-radius:6px;">
          Reply to Customer
        </a>
      </div>
    `;

        const mailOptions = {
            from: `"Star Dewedar Website" <${env.yahooEmail}>`,
            to: env.yahooEmail,
            subject: `New Quote Request - ${quoteRequest.first_name} ${quoteRequest.last_name}`,
            html: baseEmailTemplate({
                title: "New Quote Request 💼",
                content,
            }),
        };

        return await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("❌ Yahoo SMTP Error:", error);
        throw error;
    }
};

export const getQuoteRequests = () => repo.findAll()

export const getQuoteRequestById = (id) => repo.findById(id)

export const getQuoteRequestsByEmail = (email) => repo.findByEmail(email)

export const getQuoteRequestsByStatus = (status) => repo.findByStatus(status)

export const updateQuoteRequest = (id, data) => {
    return repo.update(id, data)
}

export const deleteQuoteRequest = (id) => {
    return repo.remove(id)
}
