import * as repo from './quote.repository.js'
import * as contactService from '../contactMessages/contact.service.js'
import { buildNotificationEmail } from '../../utils/email.template.js'
import { sendEmail } from '../../utils/mailer.js'
import {
    persistWithCloudinaryCleanup,
    validateCloudinaryUploadResult,
} from '../../utils/cloudinaryCleanup.js'
import cloudinary from '../../config/storage.js'
import env from '../../config/env.js'

const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { 
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) return reject(error)
                try {
                    resolve(validateCloudinaryUploadResult(result))
                } catch (validationError) {
                    reject(validationError)
                }
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
    const uploadedAssets = []
    if (file) {
        const result = await uploadToCloudinary(file)
        uploadedAssets.push(result)
        quoteData.file_url = result.secure_url
    }

    const quoteRequest = await persistWithCloudinaryCleanup(
        uploadedAssets,
        'QUOTE',
        () => repo.create(quoteData)
    )

    try {
        await sendQuoteRequestEmail(quoteRequest)
    } catch (error) {
        console.error('Request notification email failed', {
            event: 'request_notification_email_failed',
            requestType: 'QUOTE',
            requestId: quoteRequest.id,
            errorCode: error?.code,
            errorName: error?.name,
        })
    }

    return quoteRequest
}

export const sendQuoteRequestEmail = async (quoteRequest) => {
    try {
        const firstName = quoteRequest.first_name || ''
        const lastName = quoteRequest.last_name || ''
        const fullName = `${firstName} ${lastName}`.trim() || 'Valued Customer'
        const email = quoteRequest.email
        const phone = quoteRequest.phone
        const status = quoteRequest.status || 'pending'
        const details = quoteRequest.details

        const productName = quoteRequest.product
            ? (quoteRequest.product.name_ar || quoteRequest.product.name_en)
            : quoteRequest.custom_product_name

        const requestInfo = [
            productName ? { label: 'Product', value: productName } : null,
        ].filter(Boolean)

        const attachments = quoteRequest.file_url
            ? [{ label: 'Uploaded Spec / Document', url: quoteRequest.file_url }]
            : []

        const adminUrl = env.adminUrl ? `${env.adminUrl}/requests?tab=quote` : null

        const html = buildNotificationEmail({
            requestType: 'QUOTE',
            customerInfo: {
                name: fullName,
                email,
                phone,
                status,
            },
            requestInfo,
            details,
            attachments,
            customerEmail: email,
            logoUrl: env.logoUrl,
            adminUrl,
        })

        return await sendEmail({
            subject: `New Quote Request — ${fullName} — Star Dewedar`,
            html,
        })
    } catch (error) {
        throw error
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
