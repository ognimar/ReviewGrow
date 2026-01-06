import { getFirestore } from "../firebase";
import { getReviews, refreshAccessToken, replyToReview } from "./googleBusinessService";
import { generateAIReply } from "./aiReplyService";
import { FieldValue } from "firebase-admin/firestore";

const PROCESS_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

async function processUserReviews(userId: string, userData: any): Promise<{ processed: number; replied: number }> {
  const db = getFirestore();
  if (!db) return { processed: 0, replied: 0 };

  const settings = userData.autoReplySettings;
  if (!settings?.enabled) return { processed: 0, replied: 0 };

  const locationName = userData.googleBusiness?.locationName;
  if (!locationName) return { processed: 0, replied: 0 };

  let accessToken = userData.googleTokens?.accessToken;
  if (!accessToken) return { processed: 0, replied: 0 };

  // Refresh token if expired
  if (userData.googleTokens.expiresAt && userData.googleTokens.expiresAt < Date.now()) {
    try {
      const tokens = await refreshAccessToken(userData.googleTokens.refreshToken);
      accessToken = tokens.access_token!;
      await db.collection('users').doc(userId).update({
        'googleTokens.accessToken': accessToken,
        'googleTokens.expiresAt': tokens.expiry_date || Date.now() + 3600000,
      });
    } catch (e) {
      console.error(`[AutoReply] Token refresh failed for user ${userId}`);
      return { processed: 0, replied: 0 };
    }
  }

  try {
    const reviewsData = await getReviews(accessToken, locationName);
    const reviews = reviewsData.reviews || [];
    const repliedReviews = userData.repliedReviews || [];

    let processed = 0;
    let replied = 0;

    for (const review of reviews) {
      if (repliedReviews.includes(review.name) || review.reviewReply) {
        continue;
      }

      const stars = parseInt(review.starRating?.replace('STAR_RATING_', '') || '0');
      if (stars < settings.minStars) {
        continue;
      }

      processed++;

      try {
        const replyText = await generateAIReply(
          {
            reviewText: review.comment || '',
            authorName: review.reviewer?.displayName || 'Klient',
            stars,
          },
          settings
        );

        const result = await replyToReview(accessToken, review.name, replyText);

        if (result.success) {
          await db.collection('users').doc(userId).update({
            repliedReviews: FieldValue.arrayUnion(review.name),
          });
          replied++;
          console.log(`[AutoReply] Replied to review ${review.name} for user ${userId}`);
        }
      } catch (e: any) {
        console.error(`[AutoReply] Failed to reply to review ${review.name}:`, e.message);
      }
    }

    return { processed, replied };
  } catch (e: any) {
    console.error(`[AutoReply] Failed to fetch reviews for user ${userId}:`, e.message);
    return { processed: 0, replied: 0 };
  }
}

async function processAllUsers(): Promise<void> {
  console.log('[AutoReply] Starting scheduled review processing...');
  
  const db = getFirestore();
  if (!db) {
    console.log('[AutoReply] Database not available, skipping');
    return;
  }

  try {
    // Get all users with auto-reply enabled
    const usersSnapshot = await db.collection('users')
      .where('autoReplySettings.enabled', '==', true)
      .get();

    console.log(`[AutoReply] Found ${usersSnapshot.size} users with auto-reply enabled`);

    let totalProcessed = 0;
    let totalReplied = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const { processed, replied } = await processUserReviews(userDoc.id, userData);
      totalProcessed += processed;
      totalReplied += replied;
    }

    console.log(`[AutoReply] Completed. Processed ${totalProcessed} reviews, replied to ${totalReplied}`);
  } catch (e: any) {
    console.error('[AutoReply] Error during scheduled processing:', e.message);
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startAutoReplyScheduler(): void {
  if (schedulerInterval) {
    console.log('[AutoReply] Scheduler already running');
    return;
  }

  console.log(`[AutoReply] Starting scheduler (interval: ${PROCESS_INTERVAL_MS / 1000 / 60} minutes)`);
  
  // Run immediately on startup (after 30 seconds delay to let everything initialize)
  setTimeout(() => {
    processAllUsers();
  }, 30000);

  // Then run every 2 hours
  schedulerInterval = setInterval(() => {
    processAllUsers();
  }, PROCESS_INTERVAL_MS);
}

export function stopAutoReplyScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[AutoReply] Scheduler stopped');
  }
}
