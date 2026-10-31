import * as repo from './boq.repository.js'
import { attemptInitialNotification } from '../notifications/notificationRecovery.service.js'
import {
    persistWithCloudinaryCleanup,
    settleCloudinaryUploads,
    validateCloudinaryUploadResult,
} from '../../utils/cloudinaryCleanup.js'
import cloudinary from '../../config/storage.js'

// ── Cloudinary upload helper ──────────────────────────────────────────────────

const uploadToCloudinary = (file, folder = 'boq') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder },
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

// ── Service functions ─────────────────────────────────────────────────────────

export const createBOQRequest = async (data, boqFileArray, supportingDocsArray) => {
    // BOQ file is required — validation already rejects missing file in controller
    const boqResult = await uploadToCloudinary(boqFileArray[0], 'boq/documents')
    let uploadedAssets = [boqResult]

    // Supporting docs are optional
    let supportingUrls = []
    if (supportingDocsArray && supportingDocsArray.length > 0) {
        const settledUploads = await settleCloudinaryUploads(
            supportingDocsArray.map((f) => uploadToCloudinary(f, 'boq/supporting')),
            uploadedAssets,
            'BOQ'
        )
        uploadedAssets = settledUploads.assets
        supportingUrls = settledUploads.results.map((r) => r.secure_url)
    }

    const boqData = {
        ...data,
        status: 'pending',
        boq_file_url: boqResult.secure_url,
        supporting_docs_urls: supportingUrls.length > 0 ? JSON.stringify(supportingUrls) : null,
    }

    const boqRequest = await persistWithCloudinaryCleanup(
        uploadedAssets,
        'BOQ',
        () => repo.create(boqData)
    )

    try {
        await attemptInitialNotification('boq', boqRequest.id)
    } catch (error) {
        console.error('Request notification attempt could not be recorded', {
            event: 'request_notification_attempt_error',
            requestType: 'BOQ',
            requestId: boqRequest.id,
            errorCode: error?.code === 'P2025' ? 'REQUEST_NOT_FOUND' : 'NOTIFICATION_STATE_ERROR',
        })
    }

    return boqRequest
}

export const getBOQRequests    = (options) => repo.findAll(options)
export const getBOQRequestById = (id) => repo.findById(id)
export const getBOQsByEmail    = (email) => repo.findByEmail(email)
export const getBOQsByStatus   = (status) => repo.findByStatus(status)

export const updateBOQRequest = (id, data) => {
    const payload = {}
    const fields = [
        'status', 'name', 'company_name', 'email', 'phone',
        'project_name', 'project_location', 'project_type', 'additional_requirements',
    ]
    fields.forEach((field) => {
        if (data[field] !== undefined) payload[field] = data[field]
    })
    return repo.update(id, payload)
}

export const deleteBOQRequest = (id) => repo.remove(id)
