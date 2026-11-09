import { SDC_MONOGRAM_CID } from './email.template.js'
import { escapeHtml, sanitizeEmailText } from './htmlEscaper.js'

/**
 * Corporate HTML email template for email verification code.
 * Matches the unified SDC transactional email design system.
 *
 * @param {{ code: string, name?: string, expiresInMinutes?: number, logoCid?: string }} opts
 * @returns {string} Full HTML document
 */
export const verificationEmailTemplate = ({
  code,
  name,
  expiresInMinutes = 15,
  logoCid = SDC_MONOGRAM_CID,
}) => {
  const currentYear = new Date().getFullYear()
  const safeName = sanitizeEmailText(name, 40, { ellipsis: true })
  const nameSpan = safeName
    ? `<span dir="auto" style="unicode-bidi:isolate">${escapeHtml(safeName)}</span>`
    : '<span dir="auto" style="unicode-bidi:isolate">Customer</span>'
  const greeting = safeName ? `Hello ${nameSpan},` : 'Hello,'
  const registeredAs = nameSpan
  const safeCode = escapeHtml(sanitizeEmailText(code, 32))
  const safeExpiresInMinutes = escapeHtml(sanitizeEmailText(expiresInMinutes, 16))

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
  <title>Verify Your Email Address — SDC</title>
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

          <!-- Body Content -->
          <tr>
            <td class="content-padding" style="padding: 28px 32px 32px 32px; background-color: #FFFFFF;">
              <h1 style="font-size: 22px; line-height: 1.3; font-weight: 700; color: #102A43; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">
                Verify Your Email Address
              </h1>

              <p style="color: #102A43; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">
                ${greeting}
              </p>

              <p style="color: #526579; font-size: 14px; line-height: 1.7; margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif;">
                Thank you for registering with Star Dewedar. Please use the following 6-digit verification code to complete your registration:
              </p>

              <!-- Verification Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0; border-collapse: collapse;">
                <tr>
                  <td align="center" style="background-color: #EAF3FA; border: 1px solid #1B75BA; padding: 24px 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #1B75BA; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">
                      Verification Code
                    </p>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size:36px; font-weight: 700; letter-spacing: 8px; color: #102A43;" data-testid="verification-code">
                      ${safeCode}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0; border-collapse: collapse; background-color: #F3F6F9; border: 1px solid #E5EBF0; border-left: 3px solid #1B75BA;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #102A43; font-family: Arial, Helvetica, sans-serif;">
                    This code will expire in <strong>${safeExpiresInMinutes} minutes</strong>. Never share this code with anyone.
                  </td>
                </tr>
              </table>

              <p style="color: #102A43; font-size: 14px; line-height: 1.7; margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif;">
                Registered as ${registeredAs}.
              </p>

              <p style="color: #526579; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">
                If you didn't create this account, you can safely ignore this email.
              </p>

              <div style="color: #526579; font-size: 14px; line-height: 1.7; margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif;">
                <p style="margin: 0;">Use the most recent code we sent you.</p>
                <p style="margin: 0;">Can't find it? Check your spam folder.</p>
              </div>

              <div dir="rtl" lang="ar" style="color: #526579; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0; padding: 14px 16px; background-color: #F3F6F9; border: 1px solid #E5EBF0; text-align: right; font-family: Arial, Helvetica, sans-serif;">
                <p style="margin: 0;">تم إنشاء الحساب باسم ${registeredAs}.</p>
                <p style="margin: 0;">إذا لم تنشئ هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.</p>
                <p style="margin: 0;">استخدم أحدث رمز أرسلناه إليك.</p>
                <p style="margin: 0;">لم تجده؟ تحقّق من مجلد البريد العشوائي.</p>
              </div>

              <p style="color: #526579; font-size: 13px; line-height: 1.6; margin: 0; font-family: Arial, Helvetica, sans-serif;">
                If you did not attempt to register an account with Star Dewedar, please disregard this email.
              </p>
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
                This is an automated security verification. Please do not reply.
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
</html>`.trim()
}
