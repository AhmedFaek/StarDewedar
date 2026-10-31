import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'
import nodemailer from 'nodemailer'

Object.assign(process.env, {
    PORT: '0',
    DATABASE_URL: '******localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const [
    { sendBOQRequestEmail, sendQuoteRequestEmail, sendVisitRequestEmail },
    { sendContactEmail },
    { transporter },
    { createSdcMonogramAttachment, SDC_MONOGRAM_CID },
] = await Promise.all([
    import('../src/modules/notifications/requestNotificationEmail.js'),
    import('../src/modules/contactMessages/contact.service.js'),
    import('../src/utils/mailer.js'),
    import('../src/utils/email.template.js'),
])

test('company notification email flows embed the SDC monogram and retain request details', async (t) => {
    const sentMessages = []
    t.mock.method(transporter, 'sendMail', async (message) => {
        sentMessages.push(message)
        return { messageId: `notification-${sentMessages.length}` }
    })

    await sendVisitRequestEmail({
        name: 'Visit Customer',
        email: 'visit@example.invalid',
        phone_number: '01287879794',
        whatsapp_number: '+201287879794',
        factory_name: 'Visit Factory',
        factory_activity: 'Manufacturing',
        address: 'Visit Street',
        preferred_date: '2030-01-02T03:04:05.000Z',
        details: 'Visit details <script>alert(1)</script>',
        status: 'pending',
        file_url: 'https://files.example.invalid/visit.pdf',
    })
    await sendQuoteRequestEmail({
        first_name: 'Quote',
        last_name: 'Customer',
        email: 'quote@example.invalid',
        phone: '01287879794',
        custom_product_name: 'Quote Product',
        details: 'Quote details',
        file_url: 'https://files.example.invalid/quote.pdf',
    })
    await sendBOQRequestEmail({
        name: 'BOQ Customer',
        company_name: 'BOQ Company',
        email: 'boq@example.invalid',
        phone: '+201287879794',
        project_name: 'BOQ Project',
        project_location: 'Project Location',
        project_type: 'commercial',
        additional_requirements: 'BOQ requirements',
        boq_file_url: 'https://files.example.invalid/boq.xlsx',
        supporting_docs_urls: JSON.stringify(['https://files.example.invalid/support.pdf']),
    })
    await sendContactEmail({
        first_name: 'Contact',
        last_name: 'Customer',
        email: 'contact@example.invalid',
        phone_number: '01287879794',
        whatsapp_number: '+201287879794',
        message: 'Contact message details <script>alert(1)</script>',
    })

    assert.equal(sentMessages.length, 4)
    for (const message of sentMessages) {
        assert.match(message.html, /src="cid:sdc-monogram@stardewedar\.com"/)
        assert.match(message.html, /alt="SDC — STAR DEWEDAR Company"/)
        assert.match(message.html, /STAR DEWEDAR Company/)
        assert.match(message.html, /General Contracting &amp; Engineering/)
        assert.match(message.html, /background-color: #F3F6F9/)
        assert.match(message.html, /#1B75BA/)
        assert.match(message.html, /#102A43/)
        assert.doesNotMatch(message.html, /linear-gradient|#f9e454|#000e24|logo_z7m4wy/)
        assert.equal(message.attachments.length, 1)
        assert.equal(message.attachments[0].filename, 'sdc-monogram.png')
        assert.equal(message.attachments[0].cid, SDC_MONOGRAM_CID)
        assert.equal(existsSync(message.attachments[0].path), true)
    }

    const [visit, quote, boq, contact] = sentMessages
    assert.match(visit.html, /New Visit Request/)
    assert.match(visit.html, /Visit Factory/)
    assert.match(visit.html, /Visit details &lt;script&gt;alert\(1\)&lt;\/script&gt;/)
    assert.doesNotMatch(visit.html, /<script>/)
    assert.match(visit.html, /Uploaded Site \/ Project Document/)
    assert.match(quote.html, /New Quote Request/)
    assert.match(quote.html, /Quote Product/)
    assert.match(quote.html, /Quote details/)
    assert.match(quote.html, /Uploaded Spec \/ Document/)
    assert.match(boq.html, /New BOQ Request/)
    assert.match(boq.html, /BOQ Company/)
    assert.match(boq.html, /Project Location/)
    assert.match(boq.html, /BOQ requirements/)
    assert.match(boq.html, /Supporting Document 1/)
    assert.match(contact.html, /New Contact Message/)
    assert.match(contact.html, /Contact message details &lt;script&gt;alert\(1\)&lt;\/script&gt;/)
    assert.doesNotMatch(contact.html, /<script>/)
    assert.match(contact.html, /WhatsApp/)
})

test('bundled SDC monogram is embedded as an inline MIME image with the referenced CID', async () => {
    const attachment = createSdcMonogramAttachment()
    const image = readFileSync(attachment.path)

    assert.equal(attachment.filename, 'sdc-monogram.png')
    assert.equal(attachment.cid, SDC_MONOGRAM_CID)
    assert.equal(statSync(attachment.path).size > 0, true)
    assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))

    const previewTransport = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: 'unix',
    })
    const { message } = await previewTransport.sendMail({
        from: 'sdc@example.invalid',
        to: 'admin@example.invalid',
        subject: 'Inline logo verification',
        html: `<img src="cid:${SDC_MONOGRAM_CID}" alt="SDC" />`,
        attachments: [attachment],
    })
    const mime = message.toString('utf8')

    assert.match(mime, /Content-ID: <sdc-monogram@stardewedar\.com>/i)
    assert.match(mime, /Content-Disposition: inline; filename=sdc-monogram\.png/i)
    assert.match(mime, /src="cid:sdc-monogram@stardewedar\.com"/)
})
