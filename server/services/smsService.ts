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

export async function sendMMS(
  phone: string, 
  message: string, 
  imageUrl: string,
  textUrl: string,
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
  
  console.log('MMS message:', cleanMessage);
  console.log('MMS image URL:', imageUrl);

  try {
    // Create SMIL with publicly accessible URLs (SMSAPI fetches them)
    const smil = `<smil><head><layout><root-layout backgroundColor="#FFFFFF" height="100%" width="100%"/><region id="Image" top="0" left="0" height="70%" width="100%" fit="meet"/><region id="Text" top="70%" left="0" height="30%" width="100%" fit="scroll"/></layout></head><body><par dur="5000ms"><img src="${imageUrl}" region="Image"/><text src="${textUrl}" region="Text"/></par></body></smil>`;

    const params = new URLSearchParams({
      to: cleanPhone,
      subject: 'MMS',
      smil: smil,
      format: 'json',
    });

    const response = await fetch(`${SMSAPI_MMS_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
