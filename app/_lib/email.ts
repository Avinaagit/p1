import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create reusable transporter
const createTransporter = () => {
  // For development, you can use Gmail, SendGrid, or Ethereal
  // For production, configure with your SMTP settings
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Employee Pulse'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    // console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// Survey invitation email template
export function generateSurveyInvitationEmail(
  recipientName: string,
  surveyTitle: string,
  surveyId: string,
  surveyDescription?: string
) {
  const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/surveys/${surveyId}`;

  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Судалгааны урилга</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📊 Судалгааны урилга</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Сайн уу <strong>${recipientName}</strong>,
              </p>

              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Та доорх судалгаанд оролцохыг урьж байна:
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px;">${surveyTitle}</h2>
                ${surveyDescription ? `<p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">${surveyDescription}</p>` : ''}
              </div>

              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 20px 0;">
                Таны санал бодол манай байгууллагын хөгжилд чухал ач холбогдолтой. Судалгаа 1-3 минут үргэлжилнэ.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${surveyUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      🚀 Судалгаанд оролцох
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #9ca3af; margin: 20px 0 0 0; text-align: center;">
                Эсвэл энэ холбоосыг хуулж хөтчдөө нээнэ үү:<br/>
                <a href="${surveyUrl}" style="color: #667eea; word-break: break-all;">${surveyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                Энэхүү и-мэйл нь автоматаар илгээгдсэн болно.<br/>
                © 2026 Employee Pulse. Бүх эрх хуулиар хамгаалагдсан.
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

// Bulk email sending function
export async function sendBulkSurveyInvitations(
  recipients: Array<{ email: string; firstName: string; lastName: string }>,
  surveyTitle: string,
  surveyId: string,
  surveyDescription?: string
) {
  const results = {
    total: recipients.length,
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const recipient of recipients) {
    const recipientName = `${recipient.firstName} ${recipient.lastName}`;
    const html = generateSurveyInvitationEmail(
      recipientName,
      surveyTitle,
      surveyId,
      surveyDescription
    );

    const result = await sendEmail({
      to: recipient.email,
      subject: `📊 Судалгааны урилга: ${surveyTitle}`,
      html,
    });

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`${recipient.email}: ${result.error}`);
    }

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
