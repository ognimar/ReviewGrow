const SMSAPI_SMS_URL = 'https://api.smsapi.pl/sms.do';
const SMSAPI_MMS_URL = 'https://api.smsapi.pl/mms.do';

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function convertLinksToSmsapiFormat(message: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return message.replace(urlRegex, (url) => {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    return `[%goto:${cleanUrl}%]`;
  });
}

export async function sendSMS(phone: string, message: string, senderName: string = 'Info'): Promise<SendSMSResult> {
  const token = process.env.SMSAPI_TOKEN;
  
  if (!token) {
    return { success: false, error: 'SMSAPI token not configured' };
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  if (!cleanPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  const formattedMessage = convertLinksToSmsapiFormat(message);
  console.log('SMS message (original):', message);
  console.log('SMS message (formatted):', formattedMessage);

  try {
    const params = new URLSearchParams({
      to: cleanPhone,
      message: formattedMessage,
      from: senderName,
      format: 'json',
    });

    const response = await fetch(`${SMSAPI_SMS_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.error) {
      console.error('SMSAPI error:', data.error, data.message);
      return { success: false, error: data.message || data.error };
    }

    if (data.list && data.list.length > 0) {
      return { success: true, messageId: data.list[0].id };
    }

    return { success: true };
  } catch (error: any) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message || 'Failed to send SMS' };
  }
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

export async function sendMMS(
  phone: string, 
  message: string, 
  imageBuffer: Buffer,
  senderName: string = 'Info'
): Promise<SendSMSResult> {
  const token = process.env.SMSAPI_TOKEN;
  
  if (!token) {
    return { success: false, error: 'SMSAPI token not configured' };
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  if (!cleanPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  const cleanMessage = message.replace(/\{\{image\}\}/g, '').trim();
  const formattedMessage = convertLinksToSmsapiFormat(cleanMessage);
  
  console.log('MMS message:', formattedMessage);
  console.log('MMS image size:', imageBuffer.length, 'bytes');

  try {
    // Create SMIL with cid: format for Content-ID references
    const smil = `<?xml version="1.0"?><smil><head><meta name="author" content="CRG"/></head><body><par dur="5s"><image src="cid:image.jpg"/><text src="cid:text.txt"/></par></body></smil>`;

    // Create form data with files attached
    const formData = new FormData();
    formData.append('to', cleanPhone);
    formData.append('from', senderName);
    formData.append('subject', 'MMS');
    formData.append('smil', smil);
    formData.append('format', 'json');
    
    // Attach image as file with matching content-id
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file[0]', imageBlob, 'image.jpg');
    
    // Attach text as file with matching content-id
    const textBlob = new Blob([formattedMessage], { type: 'text/plain' });
    formData.append('file[1]', textBlob, 'text.txt');

    const response = await fetch(SMSAPI_MMS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      console.error('SMSAPI MMS error:', data.error, data.message);
      return { success: false, error: data.message || data.error };
    }

    if (data.list && data.list.length > 0) {
      return { success: true, messageId: data.list[0].id };
    }

    return { success: true };
  } catch (error: any) {
    console.error('MMS send error:', error);
    return { success: false, error: error.message || 'Failed to send MMS' };
  }
}

export async function sendBulkSMS(
  recipients: Array<{ phone: string; message: string }>,
  senderName: string = 'Info'
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, recipient.message, senderName);
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${recipient.phone}: ${result.error}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed, errors };
}
