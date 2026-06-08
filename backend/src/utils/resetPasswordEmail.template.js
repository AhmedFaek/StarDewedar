/**
 * Professional HTML email template for password reset.
 * @param {{ resetUrl: string, expiresInMinutes?: number }} opts
 * @returns {string} Full HTML document
 */
export const resetPasswordEmailTemplate = ({ resetUrl, expiresInMinutes = 15 }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); padding:32px 40px; text-align:center;">
                            <h1 style="color:#e8b540; margin:0; font-size:28px; font-weight:700; letter-spacing:1px;">
                                &#9733; Star Dewedar
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="color:#1a1a2e; margin:0 0 16px; font-size:22px;">
                                Password Reset Request
                            </h2>

                            <p style="color:#555; font-size:15px; line-height:1.7; margin:0 0 24px;">
                                We received a request to reset the password for your account.
                                Click the button below to set a new password.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 32px;">
                                        <a href="${resetUrl}"
                                           style="display:inline-block; background:linear-gradient(135deg,#e8b540 0%,#d4a032 100%); color:#1a1a2e; text-decoration:none; padding:14px 40px; border-radius:8px; font-size:16px; font-weight:600; letter-spacing:0.5px;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry Notice -->
                            <div style="background-color:#fff8e1; border-left:4px solid #e8b540; padding:16px 20px; border-radius:0 8px 8px 0; margin-bottom:24px;">
                                <p style="color:#795500; font-size:14px; margin:0;">
                                    &#9201; This link will expire in <strong>${expiresInMinutes} minutes</strong>.
                                    If you did not request this, please ignore this email &mdash; your password will remain unchanged.
                                </p>
                            </div>

                            <!-- Fallback URL -->
                            <p style="color:#888; font-size:13px; line-height:1.6; margin:0;">
                                If the button above doesn&rsquo;t work, copy and paste this URL into your browser:
                            </p>
                            <p style="color:#1a73e8; font-size:13px; word-break:break-all; margin:8px 0 0;">
                                ${resetUrl}
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
                                This is an automated message. Please do not reply.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
}
