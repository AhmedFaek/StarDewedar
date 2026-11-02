import * as repo from './quote.repository.js'
import { attemptInitialNotification } from '../notifications/notificationRecovery.service.js'
import { persistWithCloudinaryCleanup } from '../../utils/cloudinaryCleanup.js'
import { uploadRequestAttachment } from '../../utils/requestAttachmentUpload.js'
import { deleteRequestWithCleanup } from '../attachments/requestDeletion.service.js'

export const createQuoteRequest = async (data, file) => {
    // Set default status to 'pending'
    const quoteData = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        email: data.email,
        custom_product_name: data.custom_product_name,
        details: data.details,
        status: 'pending',
        product_id: data.product_id || null,
    }

    // Uploads happen before the request insert; nested Prisma creation persists both atomically.
    const uploadedAssets = []
    const attachments = []
    if (file) {
        const result = await uploadRequestAttachment(file, { folder: 'requests/quote' })
        uploadedAssets.push(result)
        attachments.push(result.attachment_data)
    }

    const quoteRequest = await persistWithCloudinaryCleanup(
        uploadedAssets,
        'QUOTE',
        () => repo.create(quoteData, attachments)
    )

    try {
        await attemptInitialNotification('quote', quoteRequest.id)
    } catch (error) {
        console.error('Request notification attempt could not be recorded', {
            event: 'request_notification_attempt_error',
            requestType: 'QUOTE',
            requestId: quoteRequest.id,
            errorCode: error?.code === 'P2025' ? 'REQUEST_NOT_FOUND' : 'NOTIFICATION_STATE_ERROR',
        })
    }

    return quoteRequest
}

export const getQuoteRequests = (options) => repo.findAll(options)

export const getQuoteRequestById = (id) => repo.findById(id)

export const getQuoteRequestsByEmail = (email, archived) => repo.findByEmail(email, archived)

export const getQuoteRequestsByStatus = (status, archived) => repo.findByStatus(status, archived)

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

export const deleteQuoteRequest = (id, confirmation) =>
    deleteRequestWithCleanup('QUOTE', id, confirmation)
