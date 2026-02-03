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

  // Use same follow-up settings as SMS
  const smsSettings = userData.followUpSettings;
  const emailSettings = userData.emailFollowUpSettings;
  
  // Check if follow-ups are enabled (using SMS settings)
  if (!smsSettings?.enabled) {
    return { sent: 0, failed: 0 };
  }
  
  // Get follow-up count from SMS settings
  const followUpCount = smsSettings.followUpCount ?? smsSettings.messages?.filter((m: any) => m?.enabled)?.length ?? 2;
  if (followUpCount <= 0) {
    return { sent: 0, failed: 0 };
  }

  // Use default sender address
  const fromEmail = 'feedback@reviewgrow.eu';
  const fromName = emailSettings?.fromName || userData?.displayName || 'Review Grow';
  const companyName = emailSettings?.companyName || userData?.googleBusiness?.title;
  
  // Default follow-up message template (same as SMS followUpScheduler.ts line 70)
  const defaultFollowUpMessage = "Cześć {{name}}, chcieliśmy szybko sprawdzić. Bardzo docenimy Twoją opinię! {{google_link}}";
  const defaultSubject = "Prosimy o opinię";

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

    // Skip clients without email or with opt-out/bounced status
    if (!client.email || client.emailStatus === 'OPT_OUT' || client.emailStatus === 'BOUNCED') {
      continue;
    }
    
    // Skip if follow-ups not enabled for this client
    if (!client.followUpsEnabled) {
      continue;
    }

    // Use lastSentAt as the trigger point (when initial campaign was sent)
    const lastSentAt = client.lastSentAt ? new Date(client.lastSentAt).getTime() : 0;
    if (!lastSentAt) continue;

    const emailFollowUpsSent = client.emailFollowUpsSent || 0;
    
    // Check daily limit - don't send more than 1 follow-up per day
    const lastEmailFollowUpAt = client.lastEmailFollowUpAt ? new Date(client.lastEmailFollowUpAt).getTime() : 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (lastEmailFollowUpAt > 0 && (now - lastEmailFollowUpAt) < oneDayMs) {
      continue;
    }
    
    // Skip if already sent all follow-ups (use same count as SMS)
    if (emailFollowUpsSent >= followUpCount) {
      continue;
    }

    // Use same timing as SMS: (followUpNumber) * 3 days (matches line 130 in followUpScheduler.ts)
    const nextFollowUpIndex = emailFollowUpsSent;
    const daysAfter = (nextFollowUpIndex + 1) * 3;
    const triggerDate = lastSentAt + (daysAfter * 24 * 60 * 60 * 1000);
    
    // Get message from settings.messages array (same as SMS) or use default
    const followUp = smsSettings.messages?.[nextFollowUpIndex];
    const followUpMessage = followUp?.message || defaultFollowUpMessage;
    
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

      console.log(`[EmailFollowUp] Sending email follow-up #${nextFollowUpIndex + 1} to ${client.name} (${client.email}), ${daysAfter} days after campaign`);

      const result = await sendPersonalizedEmail(
        {
          email: client.email,
          name: client.name || 'Klient',
          trackingSlug,
          clientId,
        },
        defaultSubject,
        followUpMessage,
        fromEmail,
        fromName,
        companyName
      );

      if (result.success) {
        await clientDoc.ref.update({
          emailFollowUpsSent: nextFollowUpIndex + 1,
          lastEmailFollowUpAt: new Date().toISOString(),
          emailStatus: 'SENT',
        });
        
        await db.collection('users').doc(userId).update({
          'subscription.requestsUsed': FieldValue.increment(1),
          emailUsed: FieldValue.increment(1),
        });
        
        sent++;
        console.log(`[EmailFollowUp] Successfully sent email follow-up #${nextFollowUpIndex + 1} to ${client.name} (1 credit used)`);
      } else {
        failed++;
        console.error(`[EmailFollowUp] Failed to send to ${client.name}: ${result.error}`);
        
        if (result.error?.includes('bounce') || result.error?.includes('invalid')) {
          await clientDoc.ref.update({ emailStatus: 'BOUNCED' });
        }
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
    // Query users with SMS follow-ups enabled (email uses same settings)
    const usersSnapshot = await db.collection('users')
      .where('followUpSettings.enabled', '==', true)
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
