const nodemailer = require('nodemailer');

/**
 * Configure email transporter based on environment variables.
 * Supports SMTP (Gmail, SendGrid, Mailgun, Brevo, AWS SES, custom SMTP).
 */
function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a password reset email to the user.
 * Falls back safely to console simulation if SMTP credentials are not yet set.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.resetUrl - Full password reset URL
 * @param {number} options.expiresInMinutes - Expiry duration
 */
async function sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes = 30 }) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || '"AURA Fine Jewellery" <concierge@aura-jewellery.com>';
  const recipientName = name ? name.trim() : 'Valued Client';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your AURA Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0a08; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #ede8df;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0a08; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #14120e; border: 1px solid #2d261b; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px; border-bottom: 1px solid #221c13;">
              <div style="font-size: 20px; color: #c9a45c; margin-bottom: 6px;">♦</div>
              <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #c9a45c; font-weight: 600;">AURA Fine Jewellery</p>
              <h1 style="margin: 0; font-size: 22px; font-weight: 400; letter-spacing: 0.04em; color: #fdfaf4;">Password Reset Request</h1>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #d4cec3;">
                Dear ${recipientName},
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #a9a193;">
                We received a request to reset the password for your AURA account. Click the button below to select a new secure password:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #c9a45c; color: #0b0a08; font-weight: 600; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 4px; box-shadow: 0 4px 14px rgba(201, 164, 92, 0.35);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 12px; font-size: 12px; line-height: 1.5; color: #8a8275;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; word-break: break-all; color: #c9a45c;">
                <a href="${resetUrl}" style="color: #c9a45c; text-decoration: underline;">${resetUrl}</a>
              </p>

              <!-- Security Warning -->
              <div style="background-color: #1a1712; border-left: 3px solid #c9a45c; padding: 12px 16px; border-radius: 0 4px 4px 0; margin-top: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #b8b0a2;">
                  <strong>Security Notice:</strong> This link is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once. If you did not request this change, please ignore this email; your existing password remains completely secure.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px; background-color: #0f0d0a; border-top: 1px solid #221c13; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.08em; color: #6e675b; text-transform: uppercase;">
                AURA Client Concierge &bull; Encrypted &amp; Secure
              </p>
              <p style="margin: 0; font-size: 11px; color: #524d43;">
                &copy; ${new Date().getFullYear()} AURA Fine Jewellery. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
AURA Fine Jewellery — Password Reset Request

Dear ${recipientName},

We received a request to reset the password for your AURA account.

To choose a new password, visit the following link:
${resetUrl}

This link is valid for ${expiresInMinutes} minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

— AURA Client Concierge
  `.trim();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject: 'Reset Your AURA Account Password',
        text: textContent,
        html: htmlContent,
      });
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.error('Failed to send password reset email via SMTP:', err.message);
      // In development or if SMTP fails, log link for local testing ease
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n[DEV FALLBACK] Password Reset URL for ${to}:\n${resetUrl}\n`);
      }
      return { success: false, error: err.message, simulated: false };
    }
  } else {
    // Development / fallback mode when SMTP env vars are not set
    console.log(`\n============================================================`);
    console.log(`[AURA DEV EMAIL SIMULATION] Password Reset Link`);
    console.log(`To: ${to} (${recipientName})`);
    console.log(`Expires in: ${expiresInMinutes} minutes`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`============================================================\n`);

    return {
      success: true,
      simulated: true,
      message: 'SMTP credentials not configured; reset link logged to server console.',
    };
  }
}

module.exports = {
  sendPasswordResetEmail,
};

