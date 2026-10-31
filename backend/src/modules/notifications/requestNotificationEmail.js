import {
    buildNotificationEmail,
    createSdcMonogramAttachment,
    formatDateTime,
    SDC_MONOGRAM_CID,
} from '../../utils/email.template.js'
import { sendEmail } from '../../utils/mailer.js'
import env from '../../config/env.js'

export const sendVisitRequestEmail = async (visitRequest) => {
    const name = visitRequest.name || 'Valued Customer'
    const email = visitRequest.email
    const phone = visitRequest.phone_number
    const whatsapp = visitRequest.whatsapp_number
    const factoryName = visitRequest.factory_name
    const factoryActivity = visitRequest.factory_activity
    const address = visitRequest.address
    const details = visitRequest.details
    const status = visitRequest.status || 'pending'
    const preferredDateFormatted = formatDateTime(visitRequest.preferred_date)
    const requestInfo = [
        factoryName ? { label: 'Factory Name', value: factoryName } : null,
        factoryActivity ? { label: 'Activity', value: factoryActivity } : null,
        address ? { label: 'Address', value: address } : null,
        whatsapp ? { label: 'WhatsApp', value: whatsapp } : null,
        preferredDateFormatted ? { label: 'Preferred Date', value: preferredDateFormatted } : null,
    ].filter(Boolean)
    const attachments = visitRequest.file_url
        ? [{ label: 'Uploaded Site / Project Document', url: visitRequest.file_url }]
        : []
    const adminUrl = env.adminUrl ? `${env.adminUrl}/requests?tab=visit` : null
    const html = buildNotificationEmail({
        requestType: 'VISIT',
        customerInfo: { name, email, phone, status },
        requestInfo,
        details,
        attachments,
        customerEmail: email,
        logoCid: SDC_MONOGRAM_CID,
        adminUrl,
    })

    return sendEmail({
        subject: `New Visit Request — ${name} — SDC`,
        html,
        attachments: [createSdcMonogramAttachment()],
    })
}

export const sendQuoteRequestEmail = async (quoteRequest) => {
    const firstName = quoteRequest.first_name || ''
    const lastName = quoteRequest.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim() || 'Valued Customer'
    const email = quoteRequest.email
    const phone = quoteRequest.phone
    const status = quoteRequest.status || 'pending'
    const productName = quoteRequest.product?.name_ar
        || quoteRequest.product?.name_en
        || quoteRequest.product_name_ar_snapshot
        || quoteRequest.product_name_en_snapshot
        || quoteRequest.custom_product_name
    const requestInfo = productName ? [{ label: 'Product', value: productName }] : []
    const attachments = quoteRequest.file_url
        ? [{ label: 'Uploaded Spec / Document', url: quoteRequest.file_url }]
        : []
    const adminUrl = env.adminUrl ? `${env.adminUrl}/requests?tab=quote` : null
    const html = buildNotificationEmail({
        requestType: 'QUOTE',
        customerInfo: { name: fullName, email, phone, status },
        requestInfo,
        details: quoteRequest.details,
        attachments,
        customerEmail: email,
        logoCid: SDC_MONOGRAM_CID,
        adminUrl,
    })

    return sendEmail({
        subject: `New Quote Request — ${fullName} — SDC`,
        html,
        attachments: [createSdcMonogramAttachment()],
    })
}

export const sendBOQRequestEmail = async (boqRequest) => {
    const name = boqRequest.name || 'Valued Customer'
    const company = boqRequest.company_name
    const email = boqRequest.email
    const phone = boqRequest.phone
    let supportingDocs = []
    if (boqRequest.supporting_docs_urls) {
        try {
            supportingDocs = JSON.parse(boqRequest.supporting_docs_urls)
        } catch (error) {
            if (!(error instanceof SyntaxError)) throw error
        }
    }
    const requestInfo = [
        boqRequest.project_name ? { label: 'Project Name', value: boqRequest.project_name } : null,
        boqRequest.project_location ? { label: 'Location', value: boqRequest.project_location } : null,
        boqRequest.project_type ? { label: 'Project Type', value: boqRequest.project_type } : null,
    ].filter(Boolean)
    const attachments = [
        boqRequest.boq_file_url ? { label: 'BOQ Main Document', url: boqRequest.boq_file_url } : null,
        ...supportingDocs.map((url, index) => ({
            label: `Supporting Document ${index + 1}`,
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
            status: boqRequest.status || 'pending',
        },
        requestInfo,
        details: boqRequest.additional_requirements,
        detailsTitle: 'Additional Requirements',
        attachments,
        customerEmail: email,
        logoCid: SDC_MONOGRAM_CID,
        adminUrl,
    })
    const subjectCompanyPart = company ? `${company} (${name})` : name

    return sendEmail({
        subject: `New BOQ Request — ${subjectCompanyPart} — SDC`,
        html,
        attachments: [createSdcMonogramAttachment()],
    })
}
