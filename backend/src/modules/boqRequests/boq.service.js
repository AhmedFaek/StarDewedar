import * as repo from './boq.repository.js'
import { buildNotificationEmail } from '../../utils/email.template.js'
import { sendEmail } from '../../utils/mailer.js'
import cloudinary from '../../config/storage.js'
import env from '../../config/env.js'

// ── Cloudinary upload helper ──────────────────────────────────────────────────

const uploadToCloudinary = (file, folder = 'boq') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder },
            (error, result) => {
                if (error) return reject(error)
                resolve(result)
            }
        )
        stream.end(file.buffer)
    })
}

// ── Service functions ─────────────────────────────────────────────────────────

export const createBOQRequest = async (data, boqFileArray, supportingDocsArray) => {
    // BOQ file is required — validation already rejects missing file in controller
    const boqResult = await uploadToCloudinary(boqFileArray[0], 'boq/documents')

    // Supporting docs are optional
    let supportingUrls = []
    if (supportingDocsArray && supportingDocsArray.length > 0) {
        const uploads = await Promise.all(
            supportingDocsArray.map((f) => uploadToCloudinary(f, 'boq/supporting'))
        )
        supportingUrls = uploads.map((r) => r.secure_url)
    }

    const boqData = {
        ...data,
        status: 'pending',
        boq_file_url: boqResult.secure_url,
        supporting_docs_urls: supportingUrls.length > 0 ? JSON.stringify(supportingUrls) : null,
    }

    const boqRequest = await repo.create(boqData)

    await sendBOQRequestEmail(boqRequest)

    return boqRequest
}

export const sendBOQRequestEmail = async (boqRequest) => {
    try {
        const name        = boqRequest.name || 'Valued Customer'
        const company     = boqRequest.company_name
        const email       = boqRequest.email
        const phone       = boqRequest.phone
        const projectName = boqRequest.project_name
        const projectLoc  = boqRequest.project_location
        const projectType = boqRequest.project_type
        const boqUrl      = boqRequest.boq_file_url
        const status      = boqRequest.status || 'pending'
        const additionalReq = boqRequest.additional_requirements

        // Parse supporting docs JSON array
        let supportingDocs = []
        if (boqRequest.supporting_docs_urls) {
            try {
                supportingDocs = JSON.parse(boqRequest.supporting_docs_urls)
            } catch { /* ignore parse errors */ }
        }

        const requestInfo = [
            projectName ? { label: 'Project Name', value: projectName } : null,
            projectLoc  ? { label: 'Location', value: projectLoc } : null,
            projectType ? { label: 'Project Type', value: projectType } : null,
        ].filter(Boolean)

        const attachments = [
            boqUrl ? { label: 'BOQ Main Document', url: boqUrl } : null,
            ...supportingDocs.map((url, i) => ({
                label: `Supporting Document ${i + 1}`,
                url,
            })),
        ].filter(Boolean)

        const adminUrl = env.adminUrl ? `${env.adminUrl}/requests?tab=boq` : null

        const html = buildNotificationEmail({
            requestType: 'BOQ',
            customerInfo: {
                name,
                company,
                email,
                phone,
                status,
            },
            requestInfo,
            details: additionalReq,
            detailsTitle: 'Additional Requirements',
            attachments,
            customerEmail: email,
            logoUrl: env.logoUrl,
            adminUrl,
        })

        const subjectCompanyPart = company ? `${company} (${name})` : name

        return await sendEmail({
            subject: `New BOQ Request — ${subjectCompanyPart} — Star Dewedar`,
            html,
        })
    } catch (error) {
        console.error('❌ BOQ Email Error:', error)
        throw error
    }
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
