const SMSAPI_SMS_URL = 'https://api.smsapi.pl/sms.do';
const SMSAPI_MMS_URL = 'https://api.smsapi.pl/mms.do';

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Links are sent as plain URLs - SMSAPI handles them automatically

export async function sendSMS(phone: string, message: string, senderName?: string): Promise<SendSMSResult> {
  const token = process.env.SMSAPI_TOKEN;
  
  if (!token) {
    return { success: false, error: 'SMSAPI token not configured' };
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  if (!cleanPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  console.log('SMS message:', message);

  try {
    const params = new URLSearchParams();
    params.append('to', cleanPhone);
    params.append('message', message);
    // Don't set 'from' - let SMSAPI use default number (same as MMS)
    // This ensures both SMS and MMS come from the same phone number
    params.append('format', 'json');
    params.append('encoding', 'utf-8');

    const response = await fetch(SMSAPI_SMS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: params.toString(),
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
  textUrl?: string
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
  console.log('MMS text URL:', textUrl);

  try {
    // Create SMIL with image and text from external URL (text displays below image)
    let smil: string;
    if (textUrl) {
      // Text file provided - display text below image
      smil = `<smil><head><layout><root-layout backgroundColor="#FFFFFF" height="100%" width="100%"/><region id="Image" top="0" left="0" height="70%" width="100%" fit="meet"/><region id="Text" top="70%" left="0" height="30%" width="100%" fit="scroll"/></layout></head><body><par dur="5000ms"><img src="${imageUrl}" region="Image"/><text src="${textUrl}" region="Text"/></par></body></smil>`;
    } else {
      // No text file - just image
      smil = `<smil><head><layout><root-layout backgroundColor="#FFFFFF" height="100%" width="100%"/><region id="Image" top="0" left="0" height="100%" width="100%" fit="meet"/></layout></head><body><par dur="10000ms"><img src="${imageUrl}" region="Image"/></par></body></smil>`;
    }

    const params = new URLSearchParams();
    params.append('to', cleanPhone);
    params.append('subject', 'MMS');
    params.append('smil', smil);
    params.append('format', 'json');

    console.log('SMSAPI MMS request to:', SMSAPI_MMS_URL);
    
    const response = await fetch(SMSAPI_MMS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: params.toString(),
    });

    const data = await response.json();
    console.log('SMSAPI MMS response:', JSON.stringify(data));

    if (data.error) {
      console.error('SMSAPI MMS error:', data.error, data.message);
      return { success: false, error: data.message || data.error };
    }

    if (data.list && data.list.length > 0) {
      console.log('SMSAPI MMS success, messageId:', data.list[0].id);
      return { success: true, messageId: data.list[0].id };
    }

    return { success: true };
  } catch (error: any) {
    console.error('MMS send error:', error);
    return { success: false, error: error.message || 'Failed to send MMS' };
  }
}

export async function sendBulkSMS(
  recipients: Array<{ phone: string; message: string }>
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, recipient.message);
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
