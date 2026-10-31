import * as repo from './visit.repository.js';
import * as contactService from '../contactMessages/contact.service.js';
import { attemptInitialNotification } from '../notifications/notificationRecovery.service.js';
import {
    persistWithCloudinaryCleanup,
    validateCloudinaryUploadResult,
} from '../../utils/cloudinaryCleanup.js';
import cloudinary from '../../config/storage.js';

const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
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
    };

    // Handle optional file upload
    const uploadedAssets = [];
    if (file) {
        const result = await uploadToCloudinary(file)
        uploadedAssets.push(result);
        visitData.file_url = result.secure_url
    }

    const visitRequest = await persistWithCloudinaryCleanup(
        uploadedAssets,
        'VISIT',
        () => repo.create(visitData)
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
