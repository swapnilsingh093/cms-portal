const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Get or initialize nodemailer transporter
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return cachedTransporter;
  }

  // Fallback for development: Ethereal test account or mock
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`[EmailService] Initialized Ethereal test account: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Could not connect to Ethereal, falling back to console mock:', err.message);
    // Console fallback logger transporter
    cachedTransporter = {
      sendMail: async (mailOptions) => {
        console.log('\n--- 📧 MOCK EMAIL DISPATCHED ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Text / Body: ${mailOptions.text || '(HTML Email)'}`);
        console.log('--------------------------------\n');
        return { messageId: 'mock-' + Date.now() };
      }
    };
    return cachedTransporter;
  }
}

/**
 * Send Welcome Email on Account Creation
 */
async function sendWelcomeEmail({ to, name }) {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"CMS Portal" <noreply@cmsportal.local>';
    const siteUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 32px 28px; border-bottom: 1px solid #334155; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: #38bdf8; font-weight: 700; letter-spacing: -0.5px;">CMS Portal</h1>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Welcome to your content platform</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #f1f5f9;">Hello ${name || 'there'}, 👋</h2>
          <p style="color: #cbd5e1; font-size: 14.5px; line-height: 1.6; margin: 0 0 20px 0;">
            Your account has been successfully created! You now have access to explore, comment, and engage with all media, posts, and videos on CMS Portal.
          </p>
          <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13.5px; color: #bae6fd;">
              <strong>Your Registered Email:</strong> ${to}
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/login" style="background: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
              Sign In to Your Account →
            </a>
          </div>
          <p style="color: #64748b; font-size: 12.5px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #1e293b; padding-top: 18px;">
            If you did not register for this account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Welcome to CMS Portal, ${name || 'Friend'}!`,
      text: `Hello ${name}!\n\nWelcome to CMS Portal. Your account has been registered with ${to}.\n\nLog in here: ${siteUrl}/login`,
      html
    });

    if (nodemailer.getTestMessageUrl && info && info.messageId && !process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EmailService] Welcome Email Preview URL: ${previewUrl}`);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending welcome email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Password Reset Token Email
 */
async function sendPasswordResetEmail({ to, name, resetUrl, resetToken }) {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"CMS Portal" <noreply@cmsportal.local>';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 32px 28px; border-bottom: 1px solid #334155; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: #38bdf8; font-weight: 700; letter-spacing: -0.5px;">CMS Portal</h1>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Password Reset Request</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #f1f5f9;">Hello ${name || 'there'},</h2>
          <p style="color: #cbd5e1; font-size: 14.5px; line-height: 1.6; margin: 0 0 20px 0;">
            We received a request to reset the password for your account associated with <strong>${to}</strong>.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 13px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
              Reset Your Password →
            </a>
          </div>
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 14px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #fca5a5;">
              ⏱ <strong>Note:</strong> This link is only valid for <strong>1 hour</strong>. After that, you will need to request a new password reset.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0;">
            If the button doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="color: #38bdf8; font-size: 12px; word-break: break-all; background: rgba(255, 255, 255, 0.04); padding: 10px; border-radius: 6px;">
            ${resetUrl}
          </p>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #1e293b; padding-top: 18px;">
            If you did not request a password reset, please ignore this email or contact the administrator immediately. Your password will not change until you click the link and set a new one.
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: 'Password Reset Request - CMS Portal',
      text: `Hello ${name}!\n\nYou requested a password reset for CMS Portal.\n\nPlease visit this link within 1 hour to set a new password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html
    });

    if (nodemailer.getTestMessageUrl && info && info.messageId && !process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EmailService] Password Reset Email Preview URL: ${previewUrl}`);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending reset email:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
};
