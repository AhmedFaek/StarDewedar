import * as repo from './boq.repository.js'
import { attemptInitialNotification } from '../notifications/notificationRecovery.service.js'
import {
    persistWithCloudinaryCleanup,
    settleCloudinaryUploads,
} from '../../utils/cloudinaryCleanup.js'
import { uploadRequestAttachment } from '../../utils/requestAttachmentUpload.js'

// ── Service functions ─────────────────────────────────────────────────────────

export const createBOQRequest = async (data, boqFileArray, supportingDocsArray) => {
    // BOQ file is required — validation already rejects missing file in controller
    const boqResult = await uploadRequestAttachment(boqFileArray[0], { folder: 'boq/documents' })
    let uploadedAssets = [boqResult]
    let attachments = [boqResult.attachment_data]

    // Supporting docs are optional
    if (supportingDocsArray && supportingDocsArray.length > 0) {
        const settledUploads = await settleCloudinaryUploads(
            supportingDocsArray.map((file) =>
                uploadRequestAttachment(file, { folder: 'boq/supporting' })
            ),
            uploadedAssets,
            'BOQ'
        )
        uploadedAssets = settledUploads.assets
        attachments = [
            ...attachments,
            ...settledUploads.results.map((result) => result.attachment_data),
        ]
    }

    const boqData = {
        ...data,
        status: 'pending',
    }

    const boqRequest = await persistWithCloudinaryCleanup(
        uploadedAssets,
        'BOQ',
        () => repo.create(boqData, attachments)
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
