import * as repo from './quote.repository.js'
import * as contactService from '../contactMessages/contact.service.js'
import { attemptInitialNotification } from '../notifications/notificationRecovery.service.js'
import {
    persistWithCloudinaryCleanup,
    validateCloudinaryUploadResult,
} from '../../utils/cloudinaryCleanup.js'
import cloudinary from '../../config/storage.js'

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
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        email: data.email,
        custom_product_name: data.custom_product_name,
        details: data.details,
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
