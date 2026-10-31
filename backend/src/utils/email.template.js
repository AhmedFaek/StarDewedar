import { escapeHtml } from './htmlEscaper.js'
import { fileURLToPath } from 'node:url'

export const SDC_MONOGRAM_CID = 'sdc-monogram@stardewedar.com'
export const createSdcMonogramAttachment = () => ({
  filename: 'sdc-monogram.png',
  path: fileURLToPath(new URL('../assets/sdc-monogram.png', import.meta.url)),
  cid: SDC_MONOGRAM_CID,
})

const requestTitles = {
  VISIT: 'New Visit Request',
  QUOTE: 'New Quote Request',
  BOQ: 'New BOQ Request',
  CONTACT: 'New Contact Message',
}

/**
 * Format a date/time into a consistent, readable format: "15 October 2026 at 2:30 PM"
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return escapeHtml(String(dateInput))

  const day = date.getDate()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()

  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const minutesStr = minutes < 10 ? '0' + minutes : String(minutes)

  return `${day} ${month} ${year} at ${hours}:${minutesStr} ${ampm}`
}

/**
 * Build a structured field row (label + value) for email tables.
 * Returns empty string if value is null, undefined, or empty string.
 */
const renderTableRow = (label, valueHtml, isLast = false) => {
  if (valueHtml === null || valueHtml === undefined || valueHtml === '') return ''
  const borderStyle = isLast ? '' : 'border-bottom: 1px solid #E5EBF0;'

  return `
    <tr>
      <td style="padding: 11px 12px 11px 0; width: 34%; vertical-align: top; font-size: 11px; font-weight: 700; color: #526579; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif; ${borderStyle}">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 11px 0 11px 12px; width: 66%; vertical-align: top; font-size: 14px; color: #102A43; line-height: 1.5; word-break: break-word; font-family: Arial, Helvetica, sans-serif; ${borderStyle}" dir="auto">
        ${valueHtml}
      </td>
    </tr>
  `
}

/**
 * Build section header.
 */
const renderSectionHeader = (title) => {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0 12px 0; border-collapse: collapse;">
      <tr>
        <td style="background-color: #F3F6F9; border-left: 3px solid #1B75BA; padding: 9px 12px; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #102A43; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">
          ${escapeHtml(title)}
        </td>
      </tr>
    </table>
  `
}

/**
 * Build the unified Star Dewedar transactional notification email.
 *
 * @param {Object} options
 * @param {'QUOTE'|'VISIT'|'BOQ'|string} options.requestType - Type of request (QUOTE, VISIT, BOQ)
 * @param {Object} options.customerInfo - Customer details { name, email, phone, status, company }
 * @param {Array<{ label: string, value: any, isHtml?: boolean }>} [options.requestInfo] - Dynamic request-specific key-value pairs
 * @param {string} [options.details] - Long message or requirements text
 * @param {string} [options.detailsTitle] - Section title for details block (default: "Details")
 * @param {Array<{ label: string, url: string }>} [options.attachments] - Array of attachment objects
 * @param {string} [options.customerEmail] - Customer email for the reply mailto CTA
 * @param {string} [options.logoCid] - Content-ID for the inline SDC monogram attachment
 * @param {string} [options.adminUrl] - Admin dashboard deep link URL
 * @returns {string} Full HTML email document
 */
export const buildNotificationEmail = ({
  requestType = 'REQUEST',
  customerInfo = {},
  requestInfo = [],
  details = null,
  detailsTitle = 'Details',
  attachments = [],
  customerEmail = '',
  logoCid = SDC_MONOGRAM_CID,
  adminUrl = null,
}) => {
  const currentYear = new Date().getFullYear()

  // 1. Customer Information Rows
  const statusBadge = customerInfo.status
    ? `<span style="display: inline-block; background-color: #EAF3FA; color: #102A43; border: 1px solid #B9D7EC; padding: 3px 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">${escapeHtml(customerInfo.status)}</span>`
    : ''

  const emailValue = customerInfo.email
    ? `<a href="mailto:${escapeHtml(customerInfo.email)}" style="color: #1B75BA; text-decoration: underline; word-break: break-all;">${escapeHtml(customerInfo.email)}</a>`
    : ''

  const phoneValue = customerInfo.phone
    ? `<a href="tel:${escapeHtml(customerInfo.phone)}" style="color: #102A43; text-decoration: none;">${escapeHtml(customerInfo.phone)}</a>`
    : ''

  const customerRows = [
    customerInfo.name ? renderTableRow('Name', escapeHtml(customerInfo.name)) : '',
    customerInfo.company ? renderTableRow('Company', escapeHtml(customerInfo.company)) : '',
    emailValue ? renderTableRow('Email', emailValue) : '',
    phoneValue ? renderTableRow('Phone', phoneValue) : '',
    statusBadge ? renderTableRow('Status', statusBadge, true) : '',
  ].filter(Boolean).join('')

  // 2. Request Information Rows
  const validRequestFields = (requestInfo || []).filter(
    (item) => item && item.value !== null && item.value !== undefined && String(item.value).trim() !== ''
  )

  const requestRows = validRequestFields.map((item, index) => {
    const isLast = index === validRequestFields.length - 1
    const valueHtml = item.isHtml ? item.value : escapeHtml(String(item.value))
    return renderTableRow(item.label, valueHtml, isLast)
  }).join('')

  // 3. Details Block
  const detailsHtml = (details && String(details).trim().length > 0)
    ? `
      ${renderSectionHeader(detailsTitle)}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; background-color: #F3F6F9; border: 1px solid #E5EBF0; border-left: 3px solid #1B75BA;">
        <tr><td style="padding: 14px 16px; font-size: 14px; line-height: 1.7; color: #334E68; white-space: pre-wrap; word-break: break-word; font-family: Arial, Helvetica, sans-serif;" dir="auto">${escapeHtml(String(details).trim())}</td></tr>
      </table>
    `
    : ''

  // 4. Attachments Block
  const validAttachments = (attachments || []).filter((att) => att && att.url)
  const attachmentsHtml = validAttachments.length > 0
    ? `
      ${renderSectionHeader('Attachments')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #E5EBF0; background-color: #F3F6F9;">
        ${validAttachments.map((att, i) => `
          <tr style="${i < validAttachments.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
            <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #102A43; font-family: Arial, Helvetica, sans-serif; word-break: break-word;">
              ${escapeHtml(att.label || `Attachment ${i + 1}`)}
            </td>
            <td align="right" style="padding: 10px 14px; white-space: nowrap;">
              <a href="${escapeHtml(att.url)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #1B75BA; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; text-decoration: none; padding: 8px 12px; font-family: Arial, Helvetica, sans-serif;">
                Download &rarr;
              </a>
            </td>
          </tr>
        `).join('')}
      </table>
    `
    : ''

  // 5. Actions / CTA Block
  const replyEmail = customerEmail || customerInfo.email
  const primaryCta = adminUrl
    ? `
      <a href="${escapeHtml(adminUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #1B75BA; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; text-decoration: none; padding: 13px 20px; border: 1px solid #1B75BA; font-family: Arial, Helvetica, sans-serif; margin-right: 12px; margin-bottom: 8px;">
        View Request &rarr;
      </a>
    `
    : ''

  const secondaryCta = replyEmail
    ? `
      <a href="mailto:${escapeHtml(replyEmail)}" style="display: inline-block; background-color: #ffffff; color: #102A43; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-decoration: none; padding: 12px 20px; border: 1px solid #B9C9D6; font-family: Arial, Helvetica, sans-serif; margin-bottom: 8px;">
        Reply to Customer
      </a>
    `
    : ''

  const ctaBlock = (primaryCta || secondaryCta)
    ? `
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        ${primaryCta}
        ${secondaryCta}
      </div>
    `
    : ''

  // 6. Header Logo / Wordmark
  const title = requestTitles[requestType] || `New ${requestType} Request`
  const logoHtml = logoCid
    ? `
      <img src="cid:${escapeHtml(logoCid)}" alt="SDC — STAR DEWEDAR Company" width="176" height="53" style="display: block; width: 176px; height: 53px; border: 0; outline: none; text-decoration: none;" />
    `
    : `
      <div style="color: #102A43; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">
        SDC
      </div>
    `

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>${escapeHtml(title)} — SDC</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      margin: 0;
      padding: 0;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .content-padding {
        padding: 24px 18px !important;
      }
      .header-padding {
        padding: 24px 18px !important;
      }
      .footer-padding {
        padding: 20px 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F6F9; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F6F9; width: 100%; margin: 0; padding: 32px 12px;">
    <tr>
      <td align="center" valign="top">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border: 1px solid #E5EBF0; border-collapse: collapse;">

          <!-- Brand Header -->
          <tr>
            <td class="header-padding" style="background-color: #FFFFFF; padding: 24px 32px; border-bottom: 1px solid #E5EBF0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    ${logoHtml}
                    <p style="color: #526579; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; margin: 8px 0 0 0; font-family: Arial, Helvetica, sans-serif;">
                      STAR DEWEDAR Company &nbsp;|&nbsp; General Contracting &amp; Engineering
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="height: 3px; background-color: #1B75BA; line-height: 3px; font-size: 3px;">&nbsp;</td>
          </tr>

          <!-- Request Header & Type Badge -->
          <tr>
            <td class="content-padding" style="padding: 28px 32px 16px 32px; background-color: #FFFFFF;">
              <h1 style="font-size: 22px; line-height: 1.3; font-weight: 700; color: #102A43; margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif;">
                ${escapeHtml(title)}
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #526579; font-family: Arial, Helvetica, sans-serif;">
                A new submission has been received through the SDC website.
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="content-padding" style="padding: 0 32px 32px 32px; background-color: #FFFFFF;">

              <!-- Customer Information -->
              ${renderSectionHeader('Customer Information')}
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                ${customerRows}
              </table>

              <!-- Request Information (if any) -->
              ${requestRows ? `
                ${renderSectionHeader('Request Information')}
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                  ${requestRows}
                </table>
              ` : ''}

              <!-- Details Section (if provided) -->
              ${detailsHtml}

              <!-- Attachments Section (if provided) -->
              ${attachmentsHtml}

              <!-- CTAs -->
              ${ctaBlock}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-padding" style="background-color: #102A43; padding: 24px 32px; text-align: center;">
              <p style="color: #FFFFFF; font-size: 13px; font-weight: 700; letter-spacing: 0.8px; margin: 0 0 4px 0; font-family: Arial, Helvetica, sans-serif;">
                STAR DEWEDAR Company
              </p>
              <p style="color: #D7E3EC; font-size: 11px; margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif;">
                General Contracting &amp; Engineering
              </p>
              <p style="color: #D7E3EC; font-size: 11px; line-height: 1.5; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;">
                This is an automated notification from the SDC website.
              </p>
              <p style="color: #B9C9D6; font-size: 10px; margin: 0; font-family: Arial, Helvetica, sans-serif;">
                &copy; ${currentYear} SDC. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
