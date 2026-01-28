import sgMail from '@sendgrid/mail';
import { getFirestore } from "../firebase";
import { FieldValue } from "firebase-admin/firestore";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailRecipient {
  email: string;
  name: string;
  trackingSlug: string;
  clientId: string;
}

export interface EmailOptions {
  from: string;
  fromName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

function getBaseUrl(): string {
  return process.env.REPLIT_DOMAINS?.split(',')[0] 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
}

export async function sendEmail(
  to: string,
  toName: string,
  options: EmailOptions
): Promise<SendEmailResult> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured' };
  }

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid email address' };
  }

  try {
    const msg: any = {
      to: { email: to, name: toName },
      from: { email: options.from, name: options.fromName || 'Contact Review Grow' },
      subject: options.subject,
    };

    if (options.templateId) {
      msg.templateId = options.templateId;
      msg.dynamicTemplateData = options.dynamicTemplateData;
    } else {
      msg.html = options.htmlContent;
      if (options.textContent) {
        msg.text = options.textContent;
      }
    }

    msg.trackingSettings = {
      clickTracking: { enable: true, enableText: true },
      openTracking: { enable: true },
    };

    const [response] = await sgMail.send(msg);
    
    console.log(`[Email] Sent to ${to}, status: ${response.statusCode}`);
    
    return { 
      success: response.statusCode >= 200 && response.statusCode < 300,
      messageId: response.headers['x-message-id'] as string
    };
  } catch (error: any) {
    console.error('[Email] Send error:', error.response?.body || error.message);
    return { 
      success: false, 
      error: error.response?.body?.errors?.[0]?.message || error.message || 'Failed to send email' 
    };
  }
}

export async function sendPersonalizedEmail(
  recipient: EmailRecipient,
  subject: string,
  message: string,
  fromEmail: string,
  fromName: string,
  companyName?: string,
  googleReviewLink?: string
): Promise<SendEmailResult> {
  const baseUrl = getBaseUrl();
  const trackingLink = `${baseUrl}/r/${recipient.trackingSlug}`;
  
  let personalizedMessage = message
    .replace(/\{\{name\}\}/g, recipient.name || 'Klient')
    .replace(/\{\{first_name\}\}/g, recipient.name?.split(' ')[0] || 'Klient')
    .replace(/\{\{company_name\}\}/g, companyName || '')
    .replace(/\{\{google_link\}\}/g, trackingLink)
    .replace(/\{\{review_link\}\}/g, trackingLink);

  personalizedMessage = personalizedMessage.replace(/\{\{image\}\}/g, '');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 16px 0; }
    .button:hover { background-color: #047857; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    ${personalizedMessage.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
    <a href="${trackingLink}" class="button">Zostaw opinię</a>
    <div class="footer">
      <p>Ta wiadomość została wysłana przez ${companyName || fromName}</p>
      <p><a href="${baseUrl}/unsubscribe/${recipient.trackingSlug}">Wypisz się z listy mailingowej</a></p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `${personalizedMessage}\n\nZostaw opinię: ${trackingLink}\n\n---\nTa wiadomość została wysłana przez ${companyName || fromName}\nWypisz się: ${baseUrl}/unsubscribe/${recipient.trackingSlug}`;

  return sendEmail(recipient.email, recipient.name, {
    from: fromEmail,
    fromName: fromName,
    subject: subject.replace(/\{\{name\}\}/g, recipient.name || 'Klient'),
    htmlContent,
    textContent,
  });
}

export async function sendBulkEmails(
  recipients: EmailRecipient[],
  subject: string,
  message: string,
  fromEmail: string,
  fromName: string,
  userId: string,
  companyName?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const db = getFirestore();
  if (!db) {
    return { sent: 0, failed: 0, errors: ['Database not available'] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    if (!recipient.email || !recipient.email.includes('@')) {
      failed++;
      errors.push(`${recipient.name}: Invalid email address`);
      continue;
    }

    const result = await sendPersonalizedEmail(
      recipient,
      subject,
      message,
      fromEmail,
      fromName,
      companyName
    );

    if (result.success) {
      sent++;
      
      await db.collection('users').doc(userId).update({
        'subscription.requestsUsed': FieldValue.increment(1),
        emailUsed: FieldValue.increment(1),
      });
      
      await db.collection('clients').doc(recipient.clientId).update({
        lastEmailSentAt: new Date().toISOString(),
        emailStatus: 'SENT',
      });
    } else {
      failed++;
      if (result.error) {
        errors.push(`${recipient.email}: ${result.error}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed, errors };
}

export function isEmailConfigured(): boolean {
  return !!SENDGRID_API_KEY;
}
