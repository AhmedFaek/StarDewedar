import * as repo from './visit.repository.js';
import * as contactService from '../contactMessages/contact.service.js';
import { buildNotificationEmail, formatDateTime } from '../../utils/email.template.js';
import { sendEmail } from '../../utils/mailer.js';
import {
    persistWithCloudinaryCleanup,
    validateCloudinaryUploadResult,
} from '../../utils/cloudinaryCleanup.js';
import cloudinary from '../../config/storage.js';
import env from '../../config/env.js';

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
        await sendVisitRequestEmail(visitRequest);
    } catch (error) {
        console.error('Request notification email failed', {
            event: 'request_notification_email_failed',
            requestType: 'VISIT',
            requestId: visitRequest.id,
            errorCode: error?.code,
            errorName: error?.name,
        });
    }

    return visitRequest;
};

export const sendVisitRequestEmail = async (visitRequest) => {
    try {
        const name = visitRequest.name || 'Valued Customer';
        const email = visitRequest.email;
        const phone = visitRequest.phone_number;
        const whatsapp = visitRequest.whatsapp_number;
        const factoryName = visitRequest.factory_name;
        const factoryActivity = visitRequest.factory_activity;
        const address = visitRequest.address;
        const details = visitRequest.details;
        const status = visitRequest.status || 'pending';

        const preferredDateFormatted = formatDateTime(visitRequest.preferred_date);

        const requestInfo = [
            factoryName ? { label: 'Factory Name', value: factoryName } : null,
            factoryActivity ? { label: 'Activity', value: factoryActivity } : null,
            address ? { label: 'Address', value: address } : null,
            whatsapp ? { label: 'WhatsApp', value: whatsapp } : null,
            preferredDateFormatted ? { label: 'Preferred Date', value: preferredDateFormatted } : null,
        ].filter(Boolean);

        const attachments = visitRequest.file_url
            ? [{ label: 'Uploaded Site / Project Document', url: visitRequest.file_url }]
            : [];

        const adminUrl = env.adminUrl ? `${env.adminUrl}/requests?tab=visit` : null;

        const html = buildNotificationEmail({
            requestType: 'VISIT',
            customerInfo: {
                name,
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
        });

        return await sendEmail({
            subject: `New Visit Request — ${name} — Star Dewedar`,
            html,
        });
    } catch (error) {
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
