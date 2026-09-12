import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, '../assets/logo.png');

/**
 * Returns the inline attachments for the verification email.
 */
export const getVerificationEmailAttachments = () => [
  {
    filename: 'logo.png',
    path: LOGO_PATH,
    cid: 'stardewedar-logo',
  },
];

/**
 * Professional HTML email template for email verification code.
 * Matches Star Dewedar branding (navy #1a1a2e, gold #e8b540).
 * 
 * @param {{ code: string, name?: string, expiresInMinutes?: number }} opts
 * @returns {string} Full HTML document
 */
export const verificationEmailTemplate = ({ code, name, expiresInMinutes = 15 }) => {
  const greeting = name ? `Hello ${name},` : 'Hello,';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); padding:28px 40px; text-align:center;">
                            <table align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 14px auto;">
                                <tr>
                                    <td align="center" style="background-color:#ffffff; padding:10px 24px; border-radius:12px; display:inline-block; box-shadow:0 3px 10px rgba(0,0,0,0.15);">
                                        <img src="cid:stardewedar-logo" alt="Star Dewedar" width="210" style="display:block; max-height:68px; width:auto; border:0;" />
                                    </td>
                                </tr>
                            </table>
                            <h1 style="color:#e8b540; margin:0; font-size:24px; font-weight:700; letter-spacing:0.5px;">
                                Star Dewedar
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="color:#1a1a2e; margin:0 0 16px; font-size:22px;">
                                Verify Your Email Address
                            </h2>

                            <p style="color:#555; font-size:15px; line-height:1.7; margin:0 0 20px;">
                                ${greeting}
                            </p>

                            <p style="color:#555; font-size:15px; line-height:1.7; margin:0 0 28px;">
                                Thank you for registering with Star Dewedar. Please use the following 6-digit verification code to complete your registration:
                            </p>

                            <!-- Verification Code Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:10px 0 28px;">
                                        <div style="display:inline-block; background-color:#f8f9fa; border:2px dashed #e8b540; border-radius:12px; padding:18px 36px; text-align:center;">
                                            <span style="font-family:'Courier New',Courier,monospace; font-size:36px; font-weight:700; letter-spacing:8px; color:#1a1a2e;">
                                                ${code}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry Notice -->
                            <div style="background-color:#fff8e1; border-left:4px solid #e8b540; padding:16px 20px; border-radius:0 8px 8px 0; margin-bottom:24px;">
                                <p style="color:#795500; font-size:14px; margin:0; line-height:1.5;">
                                    &#9201; This code will expire in <strong>${expiresInMinutes} minutes</strong>.
                                    Never share this code with anyone.
                                </p>
                            </div>

                            <p style="color:#888; font-size:13px; line-height:1.6; margin:0;">
                                If you did not attempt to register an account with Star Dewedar, please disregard this email.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8f8fa; padding:24px 40px; text-align:center; border-top:1px solid #eee;">
                            <p style="color:#999; font-size:12px; margin:0;">
                                &copy; ${new Date().getFullYear()} Star Dewedar. All rights reserved.
                            </p>
                            <p style="color:#bbb; font-size:11px; margin:8px 0 0;">
                                This is an automated security verification. Please do not reply.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
};
