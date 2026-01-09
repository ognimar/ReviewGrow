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
  console.log('MMS image URL:', imageUrl);

  try {
    const params = new URLSearchParams({
      to: cleanPhone,
      message: formattedMessage,
      from: senderName,
      subject: 'MMS',
      format: 'json',
    });

    if (imageUrl) {
      params.append('smil', createSmil(formattedMessage, imageUrl));
    }

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

function createSmil(text: string, imageUrl: string): string {
  return `<smil>
    <head>
      <layout>
        <root-layout width="320" height="480"/>
        <region id="Image" top="0" left="0" height="80%" width="100%" fit="meet"/>
        <region id="Text" top="80%" left="0" height="20%" width="100%" fit="scroll"/>
      </layout>
    </head>
    <body>
      <par dur="10s">
        <img src="${imageUrl}" region="Image"/>
        <text src="data:text/plain,${encodeURIComponent(text)}" region="Text"/>
      </par>
    </body>
  </smil>`;
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
