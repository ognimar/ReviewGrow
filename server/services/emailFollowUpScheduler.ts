import { getFirestore } from "../firebase";
import { sendPersonalizedEmail, isEmailConfigured } from "./emailService";
import { FieldValue } from "firebase-admin/firestore";

const PROCESS_INTERVAL_MS = 60 * 60 * 1000;

interface EmailFollowUpMessage {
  enabled: boolean;
  daysAfter: number;
  subject: string;
  message: string;
}

interface EmailFollowUpSettings {
  enabled: boolean;
  messages: EmailFollowUpMessage[];
  fromEmail: string;
  fromName: string;
  companyName?: string;
}

function generateTrackingSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

async function processUserEmailFollowUps(userId: string, userData: any): Promise<{ sent: number; failed: number }> {
  const db = getFirestore();
  if (!db) return { sent: 0, failed: 0 };

  const subscription = userData?.subscription;
  const allowedStatuses = ['active', 'canceling'];
  if (!subscription || !allowedStatuses.includes(subscription.status)) {
    console.log(`[EmailFollowUp] Skipping user ${userId} - subscription status: ${subscription?.status || 'none'}`);
    return { sent: 0, failed: 0 };
  }
  
  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
  if (expiresAt && expiresAt < new Date()) {
    console.log(`[EmailFollowUp] Skipping user ${userId} - subscription expired`);
    return { sent: 0, failed: 0 };
  }
  
  const requestsUsed = subscription.requestsUsed || 0;
  const requestLimit = subscription.requestLimit || 0;
  if (requestsUsed >= requestLimit) {
    console.log(`[EmailFollowUp] Skipping user ${userId} - request limit reached (${requestsUsed}/${requestLimit})`);
    return { sent: 0, failed: 0 };
  }

  const settings: EmailFollowUpSettings = userData.emailFollowUpSettings;
  if (!settings?.enabled || !settings.messages?.length) {
    return { sent: 0, failed: 0 };
  }

  if (!settings.fromEmail) {
    console.log(`[EmailFollowUp] Skipping user ${userId} - no fromEmail configured`);
    return { sent: 0, failed: 0 };
  }

  const validMessages = settings.messages.filter(m => 
    m && typeof m.enabled === 'boolean' && 
    typeof m.daysAfter === 'number' && m.daysAfter > 0 &&
    typeof m.message === 'string' && typeof m.subject === 'string'
  );

  if (validMessages.length === 0) {
    return { sent: 0, failed: 0 };
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

    if (!client.email || client.emailStatus === 'OPT_OUT' || client.emailStatus === 'BOUNCED') {
      continue;
    }

    const lastEmailSentAt = client.lastEmailSentAt 
      ? new Date(client.lastEmailSentAt).getTime() 
      : (client.lastSentAt ? new Date(client.lastSentAt).getTime() : 0);
    
    if (!lastEmailSentAt) continue;

    const emailFollowUpsSent = client.emailFollowUpsSent || 0;
    
    const lastEmailFollowUpAt = client.lastEmailFollowUpAt ? new Date(client.lastEmailFollowUpAt).getTime() : 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (lastEmailFollowUpAt > 0 && (now - lastEmailFollowUpAt) < oneDayMs) {
      continue;
    }

    for (let i = emailFollowUpsSent; i < settings.messages.length; i++) {
      const followUp = settings.messages[i];
      if (!followUp.enabled || !followUp.message || !followUp.subject) continue;

      const triggerDate = lastEmailSentAt + (followUp.daysAfter * 24 * 60 * 60 * 1000);
      
      if (now >= triggerDate) {
        // Re-check credit limit before each send (atomic check)
        const userRefresh = await db.collection('users').doc(userId).get();
        const freshSub = userRefresh.data()?.subscription;
        if (freshSub && (freshSub.requestsUsed || 0) >= (freshSub.requestLimit || 0)) {
          console.log(`[EmailFollowUp] Stopping for ${userId} - credit limit reached during processing`);
          break;
        }

        let trackingSlug = client.trackingSlug;
        if (!trackingSlug) {
          trackingSlug = generateTrackingSlug();
          await clientDoc.ref.update({ trackingSlug });
        }

        console.log(`[EmailFollowUp] Sending email follow-up #${i + 1} to ${client.name} (${client.email})`);

        const result = await sendPersonalizedEmail(
          {
            email: client.email,
            name: client.name || 'Klient',
            trackingSlug,
            clientId,
          },
          followUp.subject,
          followUp.message,
          settings.fromEmail,
          settings.fromName || 'Contact Review Grow',
          settings.companyName
        );

        if (result.success) {
          await clientDoc.ref.update({
            emailFollowUpsSent: i + 1,
            lastEmailFollowUpAt: new Date().toISOString(),
            emailStatus: 'SENT',
          });
          
          await db.collection('users').doc(userId).update({
            'subscription.requestsUsed': FieldValue.increment(1),
            emailUsed: FieldValue.increment(1),
          });
          
          sent++;
          console.log(`[EmailFollowUp] Successfully sent email follow-up #${i + 1} to ${client.name} (1 credit used)`);
        } else {
          failed++;
          console.error(`[EmailFollowUp] Failed to send to ${client.name}: ${result.error}`);
          
          if (result.error?.includes('bounce') || result.error?.includes('invalid')) {
            await clientDoc.ref.update({ emailStatus: 'BOUNCED' });
          }
        }

        break;
      }
    }
  }

  return { sent, failed };
}

async function processAllUsersEmailFollowUps(): Promise<void> {
  console.log('[EmailFollowUp] Starting scheduled email follow-up processing...');
  
  if (!isEmailConfigured()) {
    console.log('[EmailFollowUp] SendGrid not configured, skipping');
    return;
  }

  const db = getFirestore();
  if (!db) {
    console.log('[EmailFollowUp] Database not available, skipping');
    return;
  }

  try {
    const usersSnapshot = await db.collection('users')
      .where('emailFollowUpSettings.enabled', '==', true)
      .get();

    console.log(`[EmailFollowUp] Found ${usersSnapshot.size} users with email follow-up enabled`);

    let totalSent = 0;
    let totalFailed = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const { sent, failed } = await processUserEmailFollowUps(userDoc.id, userData);
      totalSent += sent;
      totalFailed += failed;
    }

    console.log(`[EmailFollowUp] Completed. Sent ${totalSent} emails, ${totalFailed} failed`);
  } catch (e: any) {
    console.error('[EmailFollowUp] Error during scheduled processing:', e.message);
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startEmailFollowUpScheduler(): void {
  if (schedulerInterval) {
    console.log('[EmailFollowUp] Scheduler already running');
    return;
  }

  console.log(`[EmailFollowUp] Starting scheduler (interval: ${PROCESS_INTERVAL_MS / 1000 / 60} minutes)`);
  
  setTimeout(() => {
    processAllUsersEmailFollowUps();
  }, 90000);

  schedulerInterval = setInterval(() => {
    processAllUsersEmailFollowUps();
  }, PROCESS_INTERVAL_MS);
}

export function stopEmailFollowUpScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[EmailFollowUp] Scheduler stopped');
  }
}

export { processAllUsersEmailFollowUps as runEmailFollowUpNow };
