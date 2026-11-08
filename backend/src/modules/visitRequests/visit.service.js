import * as repo from './visit.repository.js';
import { attemptInitialNotification } from '../notifications/notificationRecovery.service.js';
import { persistWithCloudinaryCleanup } from '../../utils/cloudinaryCleanup.js';
import { uploadRequestAttachment } from '../../utils/requestAttachmentUpload.js';
import { deleteRequestWithCleanup } from '../attachments/requestDeletion.service.js'

export const createVisitRequest = async (data, file) => {
    const visitData = {
        factory_name: data.factory_name,
        factory_activity: data.factory_activity,
        name: data.name,
        phone_number: data.phone_number,
        whatsapp_number: data.whatsapp_number,
        email: data.email,
        address: data.address,
        status: 'pending',
        preferred_date: new Date(data.preferred_date),
        details: data.details,
        ...(data.user_id ? { user_id: data.user_id } : {}),
    };

    // Uploads happen before the request insert; nested Prisma creation persists both atomically.
    const uploadedAssets = [];
    const attachments = [];
    if (file) {
        const result = await uploadRequestAttachment(file, { folder: 'requests/visit' })
        uploadedAssets.push(result);
        attachments.push(result.attachment_data);
    }

    const visitRequest = await persistWithCloudinaryCleanup(
        uploadedAssets,
        'VISIT',
        () => repo.create(visitData, attachments)
    );

    try {
        await attemptInitialNotification('visit', visitRequest.id);
    } catch (error) {
        console.error('Request notification attempt could not be recorded', {
            event: 'request_notification_attempt_error',
            requestType: 'VISIT',
            requestId: visitRequest.id,
            errorCode: error?.code === 'P2025' ? 'REQUEST_NOT_FOUND' : 'NOTIFICATION_STATE_ERROR',
        });
    }

    return visitRequest;
};

export const getVisitRequests = (options) => repo.findAll(options)

export const getVisitRequestById = (id) => repo.findById(id)

export const getVisitRequestsByEmail = (email, archived) => repo.findByEmail(email, archived)

export const getVisitRequestsByStatus = (status, archived) => repo.findByStatus(status, archived)

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

export const deleteVisitRequest = (id, confirmation) =>
    deleteRequestWithCleanup('VISIT', id, confirmation)
