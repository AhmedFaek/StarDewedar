import * as repo from './boq.repository.js'
import { baseEmailTemplate } from '../../utils/email.template.js'
import { sendEmail } from '../../utils/mailer.js'
import { escapeHtml } from '../../utils/htmlEscaper.js'
import cloudinary from '../../config/storage.js'

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
        const name        = escapeHtml(boqRequest.name)
        const company     = escapeHtml(boqRequest.company_name)
        const email       = escapeHtml(boqRequest.email)
        const phone       = escapeHtml(boqRequest.phone)
        const projectName = escapeHtml(boqRequest.project_name)
        const projectLoc  = escapeHtml(boqRequest.project_location)
        const projectType = escapeHtml(boqRequest.project_type)
        const boqUrl      = escapeHtml(boqRequest.boq_file_url)

        const additionalReq = boqRequest.additional_requirements
            ? escapeHtml(boqRequest.additional_requirements)
            : null

        // Parse supporting docs JSON array
        let supportingDocs = []
        if (boqRequest.supporting_docs_urls) {
            try {
                supportingDocs = JSON.parse(boqRequest.supporting_docs_urls)
            } catch { /* ignore parse errors */ }
        }

        const supportingDocsHtml = supportingDocs.length > 0
            ? `
        <div style="margin-top:12px;">
          <strong>Supporting Documents (${supportingDocs.length}):</strong>
          <ul style="margin:8px 0 0; padding-left:20px;">
            ${supportingDocs.map((url, i) => `
              <li>
                <a href="${escapeHtml(url)}" style="color:#2F2FE4;">
                  Supporting Document ${i + 1}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `
            : ''

        const content = `
      <div style="margin-bottom:20px;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company}</p>

        <p>
          <strong>Email:</strong>
          <a href="mailto:${email}" style="color:#2F2FE4;">${email}</a>
        </p>

        <p><strong>Phone:</strong> ${phone}</p>
      </div>

      <div style="border-left:4px solid #2F2FE4; padding-left:12px; margin-bottom:20px;">
        <p><strong>Project Name:</strong> ${projectName}</p>
        <p><strong>Location:</strong> ${projectLoc}</p>
        <p><strong>Project Type:</strong> ${projectType}</p>
      </div>

      ${additionalReq
            ? `
        <div style="background:#f9f9f9; padding:15px; border-radius:8px; margin-bottom:20px;">
          <strong>Additional Requirements:</strong>
          <p>${additionalReq}</p>
        </div>
      `
            : ''}

      <div style="border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:20px;">
        <p><strong>BOQ File:</strong></p>
        <a href="${boqUrl}" style="display:inline-block; padding:8px 14px; background:#2F2FE4; color:#fff; text-decoration:none; border-radius:4px; margin-top:4px;">
          Download BOQ File
        </a>
        ${supportingDocsHtml}
      </div>

      <div style="margin-top:25px;">
        <a href="mailto:${email}"
          style="display:inline-block;padding:12px 18px;background:#2F2FE4;color:#fff;text-decoration:none;border-radius:6px;">
          Reply to Customer
        </a>
      </div>
    `

        return await sendEmail({
            subject: `New BOQ Request — ${company} (${name})`,
            html: baseEmailTemplate({
                title: 'New BOQ Request 📋',
                content,
            }),
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
