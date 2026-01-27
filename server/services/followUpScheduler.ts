import { getFirestore } from "../firebase";
import { sendSMS, sendMMS } from "./smsService";
import { personalizeImageFromUrl, uploadToFirebaseStorage } from "./imageService";
import { FieldValue } from "firebase-admin/firestore";

const PROCESS_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

interface FollowUpMessage {
  enabled: boolean;
  daysAfter: number;
  message: string;
}

interface FollowUpSettings {
  enabled: boolean;
  messages: FollowUpMessage[];
  templateId?: string;
}

function generateTrackingSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

async function processUserFollowUps(userId: string, userData: any, baseUrl: string): Promise<{ sent: number; failed: number }> {
  const db = getFirestore();
  if (!db) return { sent: 0, failed: 0 };

  const settings: FollowUpSettings = userData.followUpSettings;
  if (!settings?.enabled || !settings.messages?.length) {
    return { sent: 0, failed: 0 };
  }

  const validMessages = settings.messages.filter(m => 
    m && typeof m.enabled === 'boolean' && 
    typeof m.daysAfter === 'number' && m.daysAfter > 0 &&
    typeof m.message === 'string'
  );

  if (validMessages.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Fetch template if configured
  let template: any = null;
  if (settings.templateId) {
    const templateDoc = await db.collection('templates').doc(settings.templateId).get();
    if (templateDoc.exists) {
      template = templateDoc.data();
    }
  }

  const clientsSnapshot = await db.collection('clients')
    .where('ownerId', '==', userId)
    .where('status', 'in', ['SENT', 'CLICKED'])
    .get();

  if (clientsSnapshot.empty) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const now = Date.now();

  for (const clientDoc of clientsSnapshot.docs) {
    const client = clientDoc.data();
    const clientId = clientDoc.id;

    if (!client.lastSentAt || !client.phone) continue;

    const lastSentDate = new Date(client.lastSentAt).getTime();
    const followUpsSent = client.followUpsSent || 0;
    
    // Safety check: minimum 1 day between any follow-up messages
    const lastFollowUpDate = client.lastFollowUpAt ? new Date(client.lastFollowUpAt).getTime() : 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (lastFollowUpDate > 0 && (now - lastFollowUpDate) < oneDayMs) {
      console.log(`[FollowUp] Skipping ${client.name} - last follow-up was less than 24h ago`);
      continue;
    }

    for (let i = followUpsSent; i < settings.messages.length; i++) {
      const followUp = settings.messages[i];
      if (!followUp.enabled || !followUp.message) continue;

      const triggerDate = lastSentDate + (followUp.daysAfter * 24 * 60 * 60 * 1000);
      
      if (now >= triggerDate) {
        let trackingSlug = client.trackingSlug;
        if (!trackingSlug) {
          trackingSlug = generateTrackingSlug();
          await clientDoc.ref.update({ trackingSlug });
        }

        const trackingLink = `${baseUrl}/r/${trackingSlug}`;
        let personalizedMessage = followUp.message
          .replace(/\{\{name\}\}/g, client.name || 'Klient')
          .replace(/\{\{google_link\}\}/g, trackingLink);

        console.log(`[FollowUp] Sending follow-up #${i + 1} to ${client.name} (${client.phone})`);

        let result;
        
        // Check if message contains {{image}} and we have a template
        if (template && followUp.message.includes('{{image}}')) {
          try {
            // Generate personalized image
            const imageBuffer = await personalizeImageFromUrl(
              template.imageUrl,
              client.name || 'Klient',
              {
                x: parseInt(template.textX) || 50,
                y: parseInt(template.textY) || 100,
                fontSize: parseInt(template.fontSize) || 48,
                fontColor: template.fontColor || '#ffffff',
              },
              true // forMMS
            );
            
            // Upload image to Firebase Storage
            const { url: imageUrl } = await uploadToFirebaseStorage(
              imageBuffer,
              userId,
              `followup_${Date.now()}_${client.name?.replace(/\s+/g, '_') || 'client'}.jpg`
            );

            // Send MMS with image - upload text as file for SMIL
            const cleanMessage = personalizedMessage.replace(/\{\{image\}\}/g, '').trim();
            const textBuffer = Buffer.from(cleanMessage, 'utf-8');
            const { url: textUrl } = await uploadToFirebaseStorage(
              textBuffer,
              userId,
              `followup_${Date.now()}_${client.name?.replace(/\s+/g, '_') || 'client'}.txt`
            );
            
            result = await sendMMS(client.phone, cleanMessage, imageUrl, textUrl);
            console.log(`[FollowUp] Sent MMS with personalized image to ${client.name}`);
          } catch (e: any) {
            console.error(`[FollowUp] Failed to generate image for ${client.name}:`, e.message);
            // Fallback to SMS without image
            const cleanMessage = personalizedMessage.replace(/\{\{image\}\}/g, '').trim();
            result = await sendSMS(client.phone, cleanMessage);
          }
        } else {
          result = await sendSMS(client.phone, personalizedMessage);
        }

        if (result.success) {
          // Update client record
          await clientDoc.ref.update({
            followUpsSent: i + 1,
            lastFollowUpAt: new Date().toISOString(),
          });
          
          // Deduct credits from user's subscription
          await db.collection('users').doc(userId).update({
            'subscription.requestsUsed': FieldValue.increment(1),
            smsUsed: FieldValue.increment(1),
          });
          
          sent++;
          console.log(`[FollowUp] Successfully sent follow-up #${i + 1} to ${client.name} (1 credit used)`);
        } else {
          failed++;
          console.error(`[FollowUp] Failed to send follow-up to ${client.name}: ${result.error}`);
        }

        break;
      }
    }
  }

  return { sent, failed };
}

async function processAllUsers(): Promise<void> {
  console.log('[FollowUp] Starting scheduled follow-up processing...');
  
  const db = getFirestore();
  if (!db) {
    console.log('[FollowUp] Database not available, skipping');
    return;
  }

  const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';

  try {
    const usersSnapshot = await db.collection('users')
      .where('followUpSettings.enabled', '==', true)
      .get();

    console.log(`[FollowUp] Found ${usersSnapshot.size} users with follow-up enabled`);

    let totalSent = 0;
    let totalFailed = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const { sent, failed } = await processUserFollowUps(userDoc.id, userData, baseUrl);
      totalSent += sent;
      totalFailed += failed;
    }

    console.log(`[FollowUp] Completed. Sent ${totalSent} follow-ups, ${totalFailed} failed`);
  } catch (e: any) {
    console.error('[FollowUp] Error during scheduled processing:', e.message);
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startFollowUpScheduler(): void {
  if (schedulerInterval) {
    console.log('[FollowUp] Scheduler already running');
    return;
  }

  console.log(`[FollowUp] Starting scheduler (interval: ${PROCESS_INTERVAL_MS / 1000 / 60} minutes)`);
  
  setTimeout(() => {
    processAllUsers();
  }, 60000);

  schedulerInterval = setInterval(() => {
    processAllUsers();
  }, PROCESS_INTERVAL_MS);
}

export function stopFollowUpScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[FollowUp] Scheduler stopped');
  }
}

export { processAllUsers as runFollowUpNow };
