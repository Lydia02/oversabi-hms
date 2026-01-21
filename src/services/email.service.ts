import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

interface RegistrationEmailData {
  firstName: string;
  lastName: string;
  uniqueId: string;
  role: 'doctor' | 'patient';
  email: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      // Check if email credentials are configured
      if (!config.email.user || !config.email.pass) {
        console.warn('⚠️  Email service: No email credentials configured. Emails will be skipped.');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        },
        // Add connection timeout to prevent hanging
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });

      this.isConfigured = true;

      // Test the connection on initialization (non-blocking)
      this.transporter.verify()
        .then(() => {
          console.log('✅ Email service: SMTP connection verified successfully');
        })
        .catch((error: Error) => {
          console.warn('⚠️  Email service warning: SMTP connection failed -', error.message);
          console.warn('📧 Emails may fail to send. Check your email configuration.');
          // Don't disable the service - still try to send emails
        });
    } catch (error: any) {
      console.error('❌ Email service initialization error:', error.message);
      this.isConfigured = false;
    }
  }

  private getRegistrationEmailTemplate(data: RegistrationEmailData): string {
    const roleDisplay = data.role === 'doctor' ? 'Doctor' : 'Patient';
    const roleColor = data.role === 'doctor' ? '#2563eb' : '#059669';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Oversabi</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, ${roleColor} 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Oversabi</h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Hospital Management System</p>
            </td>
          </tr>

          <!-- Success Icon -->
          <tr>
            <td align="center" style="padding: 30px 40px 10px;">
              <div style="width: 80px; height: 80px; background-color: #ecfdf5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✓</span>
              </div>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 24px; font-weight: 600;">Registration Successful!</h2>
              <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Welcome, <strong>${data.firstName} ${data.lastName}</strong>!<br>
                Your account has been created successfully as a <strong style="color: ${roleColor};">${roleDisplay}</strong>.
              </p>
            </td>
          </tr>

          <!-- User ID Box -->
          <tr>
            <td style="padding: 10px 40px 30px;">
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid ${roleColor}; border-radius: 12px; padding: 25px; text-align: center;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Unique Login ID</p>
                <p style="margin: 0; color: ${roleColor}; font-size: 36px; font-weight: 700; letter-spacing: 3px;">${data.uniqueId}</p>
              </div>
            </td>
          </tr>

          <!-- Important Notice -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important:</strong> Please save your User ID securely. You will need this ID along with your password to log in to your account.
                </p>
              </div>
            </td>
          </tr>

          <!-- Login Instructions -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">How to Login:</h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: ${roleColor}; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">1</span>
                        </td>
                        <td style="padding-left: 10px; color: #4b5563; font-size: 14px;">
                          Go to the Oversabi login page
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: ${roleColor}; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">2</span>
                        </td>
                        <td style="padding-left: 10px; color: #4b5563; font-size: 14px;">
                          Enter your User ID: <strong style="color: ${roleColor};">${data.uniqueId}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: ${roleColor}; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">3</span>
                        </td>
                        <td style="padding-left: 10px; color: #4b5563; font-size: 14px;">
                          Enter your password and click Login
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Need help? Contact our support team.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Oversabi Hospital Management System. All rights reserved.
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
  }

  async sendRegistrationEmail(data: RegistrationEmailData): Promise<boolean> {
    // If email is not configured, skip sending but don't crash
    if (!this.isConfigured || !this.transporter) {
      console.warn(`⚠️  Email service not configured. Skipping email to ${data.email}`);
      console.log(`📋 Registration details for ${data.email}:`);
      console.log(`   - Name: ${data.firstName} ${data.lastName}`);
      console.log(`   - Role: ${data.role}`);
      console.log(`   - Unique ID: ${data.uniqueId}`);
      return false;
    }

    try {
      console.log(`📧 Attempting to send registration email to ${data.email}...`);

      const htmlContent = this.getRegistrationEmailTemplate(data);
      const roleDisplay = data.role === 'doctor' ? 'Doctor' : 'Patient';

      const mailOptions = {
        from: `"Oversabi" <${config.email.from}>`,
        to: data.email,
        subject: `Welcome to Oversabi - Your ${roleDisplay} Account is Ready!`,
        html: htmlContent,
        text: `
Welcome to Oversabi, ${data.firstName} ${data.lastName}!

Your registration as a ${roleDisplay} was successful.

Your Unique Login ID: ${data.uniqueId}

IMPORTANT: Please save your User ID securely. You will need this ID along with your password to log in to your account.

How to Login:
1. Go to the Oversabi login page
2. Enter your User ID: ${data.uniqueId}
3. Enter your password and click Login

Need help? Contact our support team.

© ${new Date().getFullYear()} Oversabi Hospital Management System. All rights reserved.
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Registration email sent successfully to ${data.email}. Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send registration email:', error.message);
      // Log the registration details so they're not lost
      console.log(`📋 Registration details for ${data.email} (email failed):`);
      console.log(`   - Name: ${data.firstName} ${data.lastName}`);
      console.log(`   - Role: ${data.role}`);
      console.log(`   - Unique ID: ${data.uniqueId}`);
      // Return false but don't throw - registration should still succeed
      return false;
    }
  }
}

export const emailService = new EmailService();
