import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import cors from "cors";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore, getStorage, initializeFirebase, isAdmin } from "./firebase";
import { authenticate, requireAdmin, type AuthRequest } from "./middleware/auth";
import { parseCSV } from "./services/csvService";
import { generatePersonalizedImages } from "./services/imageService";
import { sendSMS, sendMMS } from "./services/smsService";
import { generateAuthUrl, exchangeCodeForTokens, getAccounts, getLocations, getReviews, generateReviewLink, refreshAccessToken, replyToReview } from "./services/googleBusinessService";
import { generateAIReply } from "./services/aiReplyService";
import { personalizeImageFromUrl, uploadToFirebaseStorage, deleteFromFirebaseStorage, extractStoragePathFromUrl } from "./services/imageService";
import Stripe from "stripe";

const upload = multer({ storage: multer.memoryStorage() });

// Generate unique tracking slug (6 chars alphanumeric)
function generateTrackingSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Client Status Types
type ClientStatus = 'NEW' | 'SENT' | 'CLICKED' | 'PENDING_REVIEW' | 'RESPONDED';

// Initialize Stripe only if API key is available
let stripe: Stripe | null = null;
if (process.env.OMNISEND_STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.OMNISEND_STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize Firebase
  initializeFirebase();
  
  // Enable CORS for development
  app.use(cors());

  // User Sync - creates/updates user document in Firestore after Firebase Auth
  app.post("/api/auth/sync", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const user = req.user!;
      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();

      const userData = {
        email: user.email,
        displayName: user.email?.split('@')[0] || 'User',
        isAdmin: isAdmin(user.email || ''),
        lastLogin: new Date().toISOString(),
      };

      if (!userDoc.exists) {
        await userRef.set({
          ...userData,
          createdAt: new Date().toISOString(),
          smsQuota: 500,
          emailQuota: 2000,
          smsUsed: 0,
          emailUsed: 0,
          subscription: null,
        });
      } else {
        await userRef.update(userData);
      }

      const updatedDoc = await userRef.get();
      res.json({ 
        success: true, 
        user: { id: user.uid, ...updatedDoc.data() }
      });
    } catch (error) {
      console.error('User sync error:', error);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // Get current user profile
  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data()!;
      const { googleTokens, ...safeUserData } = userData;
      res.json({ id: req.user!.uid, ...safeUserData });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });
  
  // CSV Import
  app.post("/api/clients/import", authenticate, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const { valid, errors } = parseCSV(csvContent);

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const batch = db.batch();
      const clientsRef = db.collection('clients');

      valid.forEach(client => {
        const docRef = clientsRef.doc();
        const trackingSlug = generateTrackingSlug();
        batch.set(docRef, {
          ...client,
          ownerId: req.user!.uid,
          status: 'NEW',
          trackingSlug,
          createdAt: new Date().toISOString(),
        });
      });

      await batch.commit();

      res.json({
        success: true,
        imported: valid.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ error: 'Failed to import CSV' });
    }
  });

  // Update Client
  app.patch("/api/clients/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { name, phone, email } = req.body;
      
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const clientRef = db.collection('clients').doc(req.params.id);
      const clientDoc = await clientRef.get();

      if (!clientDoc.exists) {
        return res.status(404).json({ error: 'Client not found' });
      }

      if (clientDoc.data()?.ownerId !== req.user!.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updates: Record<string, string> = {};
      if (name !== undefined) updates.name = name.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (email !== undefined) updates.email = email.trim().toLowerCase();

      await clientRef.update(updates);

      res.json({ success: true });
    } catch (error) {
      console.error('Update client error:', error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  });

  // Delete Client
  app.delete("/api/clients/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const clientRef = db.collection('clients').doc(req.params.id);
      const clientDoc = await clientRef.get();

      if (!clientDoc.exists) {
        return res.status(404).json({ error: 'Client not found' });
      }

      if (clientDoc.data()?.ownerId !== req.user!.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await clientRef.delete();
      res.json({ success: true });
    } catch (error) {
      console.error('Delete client error:', error);
      res.status(500).json({ error: 'Failed to delete client' });
    }
  });

  // Get Clients
  app.get("/api/clients", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const snapshot = await db.collection('clients')
        .where('ownerId', '==', req.user!.uid)
        .get();

      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(clients);
    } catch (error) {
      console.error('Get clients error:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  });

  // Create Campaign
  app.post("/api/campaigns", authenticate, async (req: AuthRequest, res) => {
    try {
      const { name, type, message, templateId, scheduled } = req.body;

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const clientsSnapshot = await db.collection('clients')
        .where('ownerId', '==', req.user!.uid)
        .get();
      
      const recipientCount = clientsSnapshot.size;

      const campaignRef = await db.collection('campaigns').add({
        name,
        type,
        message,
        templateId: templateId || null,
        scheduled: scheduled || null,
        status: 'draft',
        recipientCount,
        sentCount: 0,
        failedCount: 0,
        ownerId: req.user!.uid,
        createdAt: new Date().toISOString(),
      });

      res.json({ id: campaignRef.id, success: true });
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  });

  // Get Campaigns
  app.get("/api/campaigns", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const snapshot = await db.collection('campaigns')
        .where('ownerId', '==', req.user!.uid)
        .get();

      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(campaigns);
    } catch (error) {
      console.error('Get campaigns error:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  // Delete Campaign
  app.delete("/api/campaigns/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const campaignRef = db.collection('campaigns').doc(req.params.id);
      const campaignDoc = await campaignRef.get();

      if (!campaignDoc.exists) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaignDoc.data()?.ownerId !== req.user!.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await campaignRef.delete();
      res.json({ success: true });
    } catch (error) {
      console.error('Delete campaign error:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  });

  // Send Campaign
  app.post("/api/campaigns/:id/send", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      // Get clients first to count recipients for quota validation
      const preClientSnapshot = await db.collection('clients')
        .where('ownerId', '==', req.user!.uid)
        .get();
      
      const totalRecipients = preClientSnapshot.size;

      // Use transaction for atomic quota check and reservation (for non-admins)
      const userRef = db.collection('users').doc(req.user!.uid);
      let userData: any = null;
      
      if (!req.user?.isAdmin) {
        try {
          await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            userData = userDoc.data();
            const subscription = userData?.subscription;
            
            // Allow 'active' and 'canceling' (paid until period end), block others
            const allowedStatuses = ['active', 'canceling'];
            if (!subscription || !allowedStatuses.includes(subscription.status)) {
              if (subscription?.status === 'past_due') {
                throw new Error('PAYMENT_PAST_DUE');
              } else if (subscription?.status === 'unpaid') {
                throw new Error('PAYMENT_UNPAID');
              } else if (subscription?.status === 'canceled') {
                throw new Error('SUBSCRIPTION_CANCELED');
              }
              throw new Error('SUBSCRIPTION_REQUIRED');
            }

            // Check if subscription is expired
            const expiresAt = new Date(subscription.expiresAt);
            if (expiresAt < new Date()) {
              transaction.update(userRef, { 'subscription.status': 'expired' });
              throw new Error('SUBSCRIPTION_EXPIRED');
            }

            // Check request limit atomically
            const requestsUsed = subscription.requestsUsed || 0;
            const requestLimit = subscription.requestLimit || 0;
            const projectedUsage = requestsUsed + totalRecipients;
            
            if (projectedUsage > requestLimit) {
              throw new Error(`LIMIT_EXCEEDED:${totalRecipients}:${requestLimit - requestsUsed}`);
            }

            // Reserve the quota atomically by incrementing requestsUsed immediately
            transaction.update(userRef, {
              'subscription.requestsUsed': FieldValue.increment(totalRecipients),
            });
          });
        } catch (txError: any) {
          if (txError.message === 'SUBSCRIPTION_REQUIRED') {
            return res.status(403).json({ error: 'Aktywna subskrypcja jest wymagana. Przejdź do strony Płatności, aby wybrać plan.' });
          } else if (txError.message === 'SUBSCRIPTION_EXPIRED') {
            return res.status(403).json({ error: 'Twoja subskrypcja wygasła. Odnów subskrypcję, aby kontynuować.' });
          } else if (txError.message === 'PAYMENT_PAST_DUE') {
            return res.status(403).json({ error: 'Występuje problem z płatnością. Zaktualizuj metodę płatności w panelu Stripe, aby kontynuować wysyłkę kampanii.' });
          } else if (txError.message === 'PAYMENT_UNPAID') {
            return res.status(403).json({ error: 'Twoja płatność nie powiodła się. Wysyłka kampanii została zablokowana. Zaktualizuj metodę płatności, aby odblokować.' });
          } else if (txError.message === 'SUBSCRIPTION_CANCELED') {
            return res.status(403).json({ error: 'Twoja subskrypcja została anulowana. Wykup nowy plan, aby kontynuować.' });
          } else if (txError.message.startsWith('LIMIT_EXCEEDED:')) {
            const parts = txError.message.split(':');
            return res.status(403).json({ 
              error: `Limit requestów nie pozwala wysłać do ${parts[1]} odbiorców. Pozostało: ${parts[2]} requestów. Ulepsz plan lub zmniejsz liczbę odbiorców.` 
            });
          }
          throw txError;
        }
      } else {
        // For admins, just fetch user data without quota check
        const userDoc = await userRef.get();
        userData = userDoc.data();
      }

      const campaignRef = db.collection('campaigns').doc(req.params.id);
      const campaignDoc = await campaignRef.get();

      if (!campaignDoc.exists) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const campaign = campaignDoc.data()!;
      if (campaign.ownerId !== req.user!.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Allow resending campaigns

      const clientsSnapshot = await db.collection('clients')
        .where('ownerId', '==', req.user!.uid)
        .get();

      // Filter out RESPONDED clients and apply frequency capping (3 days)
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const clients = clientsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            name: data.name, 
            phone: data.phone, 
            email: data.email,
            status: data.status,
            trackingSlug: data.trackingSlug,
            lastSentAt: data.lastSentAt,
          };
        })
        .filter(client => {
          // Exclude RESPONDED clients
          if (client.status === 'RESPONDED') return false;
          
          // Frequency capping: skip SENT/CLICKED if sent within last 3 days
          if ((client.status === 'SENT' || client.status === 'CLICKED') && client.lastSentAt) {
            const lastSent = new Date(client.lastSentAt);
            if (lastSent > threeDaysAgo) return false;
          }
          
          return true;
        });
      
      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Get Google Business review link from userData (already fetched above)
      const googleReviewLink = userData?.googleBusiness?.reviewLink || '';

      // Get template settings if templateId is set
      let template: any = null;
      if (campaign.templateId) {
        const templateDoc = await db.collection('templates').doc(campaign.templateId).get();
        if (templateDoc.exists) {
          template = templateDoc.data();
        }
      }

      // Pre-generate personalized images if template is selected and message contains {{image}}
      const clientImageUrls: Map<string, string> = new Map();
      if (template && campaign.message.includes('{{image}}')) {
        console.log(`Generating personalized images for ${clients.length} clients...`);
        for (const client of clients) {
          try {
            const imageBuffer = await personalizeImageFromUrl(
              template.imageUrl,
              client.name || 'Customer',
              {
                x: parseInt(template.textX) || 50,
                y: parseInt(template.textY) || 100,
                fontSize: parseInt(template.fontSize) || 48,
                fontColor: template.fontColor || '#ffffff',
              },
              true // forMMS - compress for MMS size limits (<100KB)
            );
            // Upload to Firebase Storage to get public URL
            const { url: imageUrl } = await uploadToFirebaseStorage(
              imageBuffer,
              req.user!.uid,
              `campaign_${campaign.name.replace(/\s+/g, '_')}_${client.name?.replace(/\s+/g, '_') || 'client'}.jpg`
            );
            clientImageUrls.set(client.id, imageUrl);
            console.log(`Generated image for ${client.name}: ${imageBuffer.length} bytes -> ${imageUrl}`);
          } catch (e: any) {
            console.error(`Failed to generate image for ${client.name}:`, e.message);
          }
        }
        console.log(`Generated ${clientImageUrls.size} personalized images`);
      }

      // Get base URL for tracking links
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';

      for (const client of clients) {
        // Ensure client has a tracking slug (generate if missing for older clients)
        let trackingSlug = client.trackingSlug;
        if (!trackingSlug) {
          trackingSlug = generateTrackingSlug();
          // Update client with new tracking slug
          await db.collection('clients').doc(client.id).update({ trackingSlug });
        }
        
        // Always use short tracking link - never include external URLs in SMS (SMSAPI blocks them)
        const trackingLink = `${baseUrl}/r/${trackingSlug}`;
        
        let personalizedMessage = campaign.message
          .replace(/\{\{name\}\}/g, client.name || 'Customer')
          .replace(/\{\{google_link\}\}/g, trackingLink);
        
        // Get personalized image URL if available
        const imageUrl = clientImageUrls.get(client.id);
        
        if (campaign.type === 'sms' && client.phone) {
          let result;
          if (imageUrl && campaign.message.includes('{{image}}')) {
            // Use MMS for messages with personalized images
            // Upload text message as file for SMIL
            const cleanMessage = personalizedMessage.replace(/\{\{image\}\}/g, '').trim();
            const textBuffer = Buffer.from(cleanMessage, 'utf-8');
            const { url: textUrl } = await uploadToFirebaseStorage(
              textBuffer,
              req.user!.uid,
              `campaign_${campaign.name.replace(/\s+/g, '_')}_${client.name?.replace(/\s+/g, '_') || 'client'}.txt`
            );
            result = await sendMMS(client.phone, personalizedMessage, imageUrl, textUrl);
          } else {
            // Use regular SMS (remove {{image}} placeholder if present but no image)
            const cleanMessage = personalizedMessage.replace(/\{\{image\}\}/g, '').trim();
            result = await sendSMS(client.phone, cleanMessage);
          }
          if (result.success) {
            sentCount++;
            // Update client status to SENT and record timestamp
            await db.collection('clients').doc(client.id).update({
              status: 'SENT',
              lastSentAt: new Date().toISOString(),
            });
          } else {
            failedCount++;
            errors.push(`${client.name}: ${result.error}`);
          }
        } else if (campaign.type === 'email' && client.email) {
          sentCount++;
          // Update client status to SENT for email too
          await db.collection('clients').doc(client.id).update({
            status: 'SENT',
            lastSentAt: new Date().toISOString(),
          });
        } else {
          failedCount++;
        }
      }

      if (errors.length > 0) {
        console.log('SMS errors:', errors);
      }

      await campaignRef.update({
        status: 'sent',
        sentAt: new Date().toISOString(),
        sentCount,
        failedCount,
      });

      // Update SMS/Email usage counters (quota already reserved in transaction above)
      if (userData) {
        const updates: any = {};
        
        if (campaign.type === 'sms') {
          updates.smsUsed = FieldValue.increment(sentCount);
        } else {
          updates.emailUsed = FieldValue.increment(sentCount);
        }
        
        // Note: subscription.requestsUsed was already atomically incremented in the transaction
        // We do NOT increment it here to avoid double-counting
        
        if (Object.keys(updates).length > 0) {
          await userRef.update(updates);
        }
      }

      res.json({ 
        success: true, 
        sentCount, 
        failedCount,
        message: `Campaign sent to ${sentCount} recipients` 
      });
    } catch (error) {
      console.error('Send campaign error:', error);
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  });

  // Get Single Campaign
  app.get("/api/campaigns/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const campaignDoc = await db.collection('campaigns').doc(req.params.id).get();

      if (!campaignDoc.exists) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const campaign = campaignDoc.data()!;
      if (campaign.ownerId !== req.user!.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      res.json({ id: campaignDoc.id, ...campaign });
    } catch (error) {
      console.error('Get campaign error:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  });

  // Get User Stats
  app.get("/api/stats", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      const clientsSnapshot = await db.collection('clients')
        .where('ownerId', '==', req.user!.uid)
        .get();

      // Get subscription-based quotas
      const subscription = userData?.subscription;
      const hasActiveSubscription = subscription && subscription.status === 'active';
      
      // Check if subscription is expired
      const isExpired = subscription && new Date(subscription.expiresAt) < new Date();
      
      const requestLimit = hasActiveSubscription && !isExpired ? (subscription.requestLimit || 0) : 0;
      const requestsUsed = hasActiveSubscription ? (subscription.requestsUsed || 0) : 0;
      const requestsRemaining = Math.max(0, requestLimit - requestsUsed);

      // Legacy SMS/Email counters (for display purposes)
      const smsUsed = userData?.smsUsed || 0;
      const emailUsed = userData?.emailUsed || 0;

      res.json({
        // Subscription-based quotas (primary)
        hasSubscription: hasActiveSubscription && !isExpired,
        requestLimit,
        requestsUsed,
        requestsRemaining,
        planId: hasActiveSubscription ? subscription.planId : null,
        // Legacy counters (for backwards compatibility)
        smsLeft: requestsRemaining,
        emailsLeft: requestsRemaining,
        smsUsed,
        emailUsed,
        totalClients: clientsSnapshot.size,
        totalSent: smsUsed + emailUsed,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Initialize default subscription plans if not exist
  async function initializeSubscriptionPlans() {
    const db = getFirestore();
    if (!db) return;

    const plansRef = db.collection('subscriptionPlans');
    const snapshot = await plansRef.get();
    
    if (snapshot.empty) {
      const defaultPlans = [
        {
          id: 'starter',
          name: 'Starter',
          monthlyPrice: 11900, // 119.00 PLN in grosze
          yearlyPrice: 119900, // 1199.00 PLN (10 months price for annual)
          requestLimit: 50,
          order: 1,
          features: ['50 requestów/mies', 'Personalizowane obrazy', 'Kampanie SMS/Email'],
        },
        {
          id: 'growth',
          name: 'Growth',
          monthlyPrice: 19900, // 199.00 PLN
          yearlyPrice: 199900, // 1999.00 PLN
          requestLimit: 100,
          order: 2,
          features: ['100 requestów/mies', 'Personalizowane obrazy', 'Kampanie SMS/Email', 'Priorytetowe wsparcie'],
        },
        {
          id: 'pro',
          name: 'Pro',
          monthlyPrice: 39900, // 399.00 PLN
          yearlyPrice: 399900, // 3999.00 PLN
          requestLimit: 300,
          order: 3,
          features: ['300 requestów/mies', 'Personalizowane obrazy', 'Kampanie SMS/Email', 'Priorytetowe wsparcie', 'Dedykowany opiekun'],
        },
      ];

      for (const plan of defaultPlans) {
        await plansRef.doc(plan.id).set(plan);
      }
      console.log('Default subscription plans initialized');
    }
  }

  // Initialize plans on startup
  initializeSubscriptionPlans().catch(console.error);

  // ===== REVIEW FUNNEL TRACKING ENDPOINTS =====

  // Get tracking data by slug (public - for landing page)
  app.get("/api/track/:slug", async (req, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const { slug } = req.params;
      const snapshot = await db.collection('clients')
        .where('trackingSlug', '==', slug)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Link not found' });
      }

      const clientDoc = snapshot.docs[0];
      const clientData = clientDoc.data();

      // Get owner's Google Business placeId
      const userDoc = await db.collection('users').doc(clientData.ownerId).get();
      const userData = userDoc.data();
      const placeId = userData?.googleBusiness?.placeId || null;
      const businessName = userData?.googleBusiness?.title || '';

      res.json({
        clientId: clientDoc.id,
        name: clientData.name,
        status: clientData.status,
        placeId,
        businessName,
      });
    } catch (error) {
      console.error('Get tracking data error:', error);
      res.status(500).json({ error: 'Failed to get tracking data' });
    }
  });

  // Update client status from tracking (public - for landing page)
  app.post("/api/track/:slug/status", async (req, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const { slug } = req.params;
      const { status, rating, complaint } = req.body;

      // Validate status
      const validStatuses: ClientStatus[] = ['CLICKED', 'PENDING_REVIEW', 'RESPONDED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const snapshot = await db.collection('clients')
        .where('trackingSlug', '==', slug)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Link not found' });
      }

      const clientDoc = snapshot.docs[0];
      const updateData: any = { status };

      // If low rating (1-3), store complaint and mark as saved customer
      if (rating && rating <= 3) {
        updateData.lastComplaint = {
          rating,
          message: complaint || '',
          createdAt: new Date().toISOString(),
        };
        updateData.status = 'RESPONDED'; // Mark as responded (internally)
        updateData.savedCustomer = true; // Flag for "saved" metric
        updateData.respondedAt = new Date().toISOString();
      }

      await clientDoc.ref.update(updateData);

      res.json({ success: true, status: updateData.status });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // Verify if review was submitted (called after user returns from Google)
  app.post("/api/track/:slug/verify-review", async (req, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const { slug } = req.params;

      const snapshot = await db.collection('clients')
        .where('trackingSlug', '==', slug)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Link not found' });
      }

      const clientDoc = snapshot.docs[0];
      const clientData = clientDoc.data();

      // Mark as RESPONDED when user returns from Google review page
      // We assume they completed the review since they were redirected there
      await clientDoc.ref.update({ 
        status: 'RESPONDED', 
        respondedAt: new Date().toISOString(),
      });
      
      res.json({ verified: true, method: 'assumed' });
    } catch (error) {
      console.error('Verify review error:', error);
      res.status(500).json({ error: 'Failed to verify review' });
    }
  });

  // Get funnel statistics for dashboard
  app.get("/api/funnel-stats", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const clientsSnapshot = await db.collection('clients')
        .where('ownerId', '==', req.user!.uid)
        .get();

      const stats = {
        total: 0,
        new: 0,
        sent: 0,
        clicked: 0,
        pendingReview: 0,
        responded: 0,
        savedCustomers: 0, // Those who gave 1-3 stars internally
      };

      clientsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        stats.total++;
        
        switch (data.status) {
          case 'NEW': stats.new++; break;
          case 'SENT': stats.sent++; break;
          case 'CLICKED': stats.clicked++; break;
          case 'PENDING_REVIEW': stats.pendingReview++; break;
          case 'RESPONDED': 
            stats.responded++; 
            if (data.savedCustomer) stats.savedCustomers++;
            break;
        }
      });

      // Calculate conversion rate (SENT → RESPONDED)
      const conversionRate = stats.sent > 0 
        ? Math.round((stats.responded / stats.sent) * 100) 
        : 0;

      res.json({ ...stats, conversionRate });
    } catch (error) {
      console.error('Get funnel stats error:', error);
      res.status(500).json({ error: 'Failed to fetch funnel stats' });
    }
  });

  // ===== END REVIEW FUNNEL TRACKING =====

  // Get subscription plans (public)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const snapshot = await db.collection('subscriptionPlans').orderBy('order').get();
      const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(plans);
    } catch (error) {
      console.error('Get plans error:', error);
      res.status(500).json({ error: 'Failed to fetch plans' });
    }
  });

  // Admin: Update subscription plan
  app.patch("/api/admin/subscription-plans/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, monthlyPrice, yearlyPrice, requestLimit, features } = req.body;
      const planId = req.params.id;

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const planRef = db.collection('subscriptionPlans').doc(planId);
      const planDoc = await planRef.get();

      if (!planDoc.exists) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (monthlyPrice !== undefined) updateData.monthlyPrice = monthlyPrice;
      if (yearlyPrice !== undefined) updateData.yearlyPrice = yearlyPrice;
      if (requestLimit !== undefined) updateData.requestLimit = requestLimit;
      if (features !== undefined) updateData.features = features;

      await planRef.update(updateData);
      res.json({ success: true });
    } catch (error) {
      console.error('Update plan error:', error);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  });

  // Stripe Checkout with dynamic plans
  app.post("/api/billing/checkout", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const { planId, billingCycle } = req.body; // planId: 'starter'|'growth'|'pro', billingCycle: 'monthly'|'yearly'

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      // Get plan from Firestore
      const planDoc = await db.collection('subscriptionPlans').doc(planId).get();
      if (!planDoc.exists) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      const plan = planDoc.data()!;
      const isYearly = billingCycle === 'yearly';
      const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'pln',
              product_data: {
                name: `${plan.name} (${isYearly ? 'Roczny' : 'Miesięczny'})`,
                description: `${plan.requestLimit} requestów/${isYearly ? 'rok' : 'miesiąc'}`,
              },
              unit_amount: amount,
              recurring: isYearly ? undefined : { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: isYearly ? 'payment' : 'subscription',
        success_url: `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/billing?canceled=true`,
        customer_email: req.user!.email || undefined,
        metadata: {
          userId: req.user!.uid,
          planId,
          billingCycle,
          requestLimit: plan.requestLimit.toString(),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Stripe Customer Portal - for managing subscription, payment methods, invoices
  app.post("/api/billing/portal", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      // Get user's Stripe customer ID
      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();
      
      let customerId = userData?.stripeCustomerId;
      
      // If no customer ID stored, try to find by email or create new
      if (!customerId) {
        const customers = await stripe.customers.list({
          email: req.user!.email || undefined,
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: req.user!.email || undefined,
            metadata: { userId: req.user!.uid },
          });
          customerId = customer.id;
        }
        
        // Save customer ID for future use
        await db.collection('users').doc(req.user!.uid).update({
          stripeCustomerId: customerId,
        });
      }

      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/billing`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error('Stripe portal error:', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  // Stripe Webhook
  app.post("/api/billing/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
      return res.status(503).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        // For development without webhook secret
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const db = getFirestore();
    if (!db) {
      return res.status(503).send('Database not available');
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.metadata?.userId;
          const planId = session.metadata?.planId;
          const billingCycle = session.metadata?.billingCycle;
          const requestLimit = parseInt(session.metadata?.requestLimit || '0');

          if (userId && planId) {
            const isYearly = billingCycle === 'yearly';
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1));

            await db.collection('users').doc(userId).update({
              subscription: {
                planId,
                billingCycle,
                status: 'active',
                requestLimit,
                requestsUsed: 0,
                startedAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
                stripeSessionId: session.id,
                stripeSubscriptionId: session.subscription || null,
                stripeCustomerId: session.customer || null,
              },
              stripeCustomerId: session.customer || null,
            });
            console.log(`Subscription activated for user ${userId}: ${planId} (${billingCycle})`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          // Find user by subscription ID
          const usersUpdatedSnapshot = await db.collection('users')
            .where('subscription.stripeSubscriptionId', '==', subscription.id)
            .get();

          for (const doc of usersUpdatedSnapshot.docs) {
            const updates: any = {};
            
            // Priority: past_due/unpaid takes precedence over canceling
            // Handle status changes from Stripe (payment issues take priority)
            if (subscription.status === 'past_due') {
              updates['subscription.status'] = 'past_due';
              console.log(`Subscription past_due for user ${doc.id}`);
            } else if (subscription.status === 'unpaid') {
              updates['subscription.status'] = 'unpaid';
              console.log(`Subscription unpaid for user ${doc.id}`);
            } else if (subscription.cancel_at_period_end) {
              // Handle cancel_at_period_end - user requested cancellation
              updates['subscription.status'] = 'canceling';
              updates['subscription.cancelAt'] = new Date(subscription.cancel_at * 1000).toISOString();
              console.log(`Subscription marked as canceling for user ${doc.id}, will expire at ${updates['subscription.cancelAt']}`);
            } else if (subscription.status === 'active') {
              // Reactivated or still active (no cancel pending)
              updates['subscription.status'] = 'active';
              updates['subscription.cancelAt'] = null;
              console.log(`Subscription active for user ${doc.id}`);
            }
            
            // Update plan limits if changed (upgrade/downgrade)
            if (subscription.items?.data?.[0]?.price?.metadata?.requestLimit) {
              updates['subscription.requestLimit'] = parseInt(subscription.items.data[0].price.metadata.requestLimit);
              console.log(`Updated request limit to ${updates['subscription.requestLimit']} for user ${doc.id}`);
            }
            
            if (Object.keys(updates).length > 0) {
              await doc.ref.update(updates);
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          // Handle subscription cancellation (final)
          const usersDeletedSnapshot = await db.collection('users')
            .where('subscription.stripeSubscriptionId', '==', subscription.id)
            .get();

          for (const doc of usersDeletedSnapshot.docs) {
            await doc.ref.update({
              'subscription.status': 'canceled',
              'subscription.canceledAt': new Date().toISOString(),
            });
            console.log(`Subscription canceled for user ${doc.id}`);
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          // Find user by customer ID or subscription ID
          const subscriptionId = invoice.subscription;
          if (subscriptionId) {
            const usersFailedSnapshot = await db.collection('users')
              .where('subscription.stripeSubscriptionId', '==', subscriptionId)
              .get();

            for (const doc of usersFailedSnapshot.docs) {
              await doc.ref.update({
                'subscription.status': 'past_due',
                'subscription.lastPaymentFailedAt': new Date().toISOString(),
              });
              console.log(`Payment failed for user ${doc.id}, status set to past_due`);
            }
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription;
          if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
            // Recurring payment succeeded - extend subscription
            const usersSuccessSnapshot = await db.collection('users')
              .where('subscription.stripeSubscriptionId', '==', subscriptionId)
              .get();

            for (const doc of usersSuccessSnapshot.docs) {
              const userData = doc.data();
              const currentExpiry = new Date(userData.subscription?.expiresAt || new Date());
              const newExpiry = new Date(currentExpiry);
              newExpiry.setMonth(newExpiry.getMonth() + 1);
              
              await doc.ref.update({
                'subscription.status': 'active',
                'subscription.expiresAt': newExpiry.toISOString(),
                'subscription.requestsUsed': 0, // Reset usage for new billing cycle
                'subscription.lastPaymentFailedAt': null,
              });
              console.log(`Recurring payment succeeded for user ${doc.id}, subscription extended to ${newExpiry.toISOString()}`);
            }
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Webhook processing failed');
    }
  });

  // Get user subscription status
  // Verify and activate subscription from session (fallback for webhook)
  app.post("/api/billing/verify-session", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      // Check if user already has an active subscription
      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();
      if (userData?.subscription?.status === 'active') {
        return res.json({ success: true, message: 'Subscription already active' });
      }

      // Retrieve session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Payment not completed' });
      }

      // Verify the session belongs to this user
      if (session.metadata?.userId !== req.user!.uid) {
        return res.status(403).json({ error: 'Session does not belong to this user' });
      }

      const planId = session.metadata?.planId;
      const billingCycle = session.metadata?.billingCycle;
      const requestLimit = parseInt(session.metadata?.requestLimit || '0');

      if (!planId) {
        return res.status(400).json({ error: 'Invalid session metadata' });
      }

      const isYearly = billingCycle === 'yearly';
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1));

      await db.collection('users').doc(req.user!.uid).update({
        subscription: {
          planId,
          billingCycle,
          status: 'active',
          requestLimit,
          requestsUsed: 0,
          startedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          stripeSessionId: session.id,
          stripeSubscriptionId: session.subscription || null,
        },
      });

      console.log(`Subscription activated via verify-session for user ${req.user!.uid}: ${planId} (${billingCycle})`);
      res.json({ success: true, planId, requestLimit });
    } catch (error: any) {
      console.error('Verify session error:', error);
      res.status(500).json({ error: error.message || 'Failed to verify session' });
    }
  });

  app.get("/api/billing/status", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      let subscription = userData?.subscription || null;

      // Sync subscription status from Stripe if we have a subscriptionId
      if (stripe && subscription?.stripeSubscriptionId) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
          const updates: any = {};
          let needsUpdate = false;
          
          // Sync cancel_at_period_end status
          if (stripeSubscription.cancel_at_period_end && subscription.status !== 'canceling') {
            updates['subscription.status'] = 'canceling';
            updates['subscription.cancelAt'] = stripeSubscription.cancel_at 
              ? new Date(stripeSubscription.cancel_at * 1000).toISOString() 
              : null;
            needsUpdate = true;
          } else if (!stripeSubscription.cancel_at_period_end && subscription.status === 'canceling') {
            // User reactivated subscription
            updates['subscription.status'] = 'active';
            updates['subscription.cancelAt'] = null;
            needsUpdate = true;
          }
          
          // Sync Stripe status changes (past_due, unpaid, canceled)
          if (stripeSubscription.status === 'past_due' && subscription.status !== 'past_due') {
            updates['subscription.status'] = 'past_due';
            needsUpdate = true;
          } else if (stripeSubscription.status === 'unpaid' && subscription.status !== 'unpaid') {
            updates['subscription.status'] = 'unpaid';
            needsUpdate = true;
          } else if (stripeSubscription.status === 'canceled' && subscription.status !== 'canceled') {
            updates['subscription.status'] = 'canceled';
            updates['subscription.canceledAt'] = new Date().toISOString();
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            await db.collection('users').doc(req.user!.uid).update(updates);
            // Apply updates to subscription object for response
            if (updates['subscription.status']) subscription.status = updates['subscription.status'];
            if (updates['subscription.cancelAt']) subscription.cancelAt = updates['subscription.cancelAt'];
            if (updates['subscription.canceledAt']) subscription.canceledAt = updates['subscription.canceledAt'];
            console.log(`Synced subscription status from Stripe for user ${req.user!.uid}: ${JSON.stringify(updates)}`);
          }
        } catch (stripeError: any) {
          // Subscription might have been deleted in Stripe
          if (stripeError.code === 'resource_missing') {
            await db.collection('users').doc(req.user!.uid).update({
              'subscription.status': 'canceled',
              'subscription.canceledAt': new Date().toISOString(),
            });
            subscription.status = 'canceled';
            console.log(`Subscription not found in Stripe, marked as canceled for user ${req.user!.uid}`);
          } else {
            console.error('Stripe sync error:', stripeError.message);
          }
        }
      }

      // Check if subscription is expired
      if (subscription && subscription.expiresAt) {
        const expiresAt = new Date(subscription.expiresAt);
        if (expiresAt < new Date() && subscription.status === 'active') {
          // Auto-expire subscription
          await db.collection('users').doc(req.user!.uid).update({
            'subscription.status': 'expired',
          });
          subscription.status = 'expired';
        }
      }

      res.json({ subscription });
    } catch (error) {
      console.error('Get billing status error:', error);
      res.status(500).json({ error: 'Failed to fetch billing status' });
    }
  });

  // Create Template
  app.post("/api/templates", authenticate, upload.single('image'), async (req: AuthRequest, res) => {
    try {
      const { name, textX, textY, fontSize, fontColor } = req.body;

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      let imageUrl = '';
      if (req.file) {
        if (!process.env.OMNISEND_FIREBASE_STORAGE_BUCKET) {
          return res.status(400).json({ 
            error: 'Image storage not configured. Please set up Firebase Storage bucket.' 
          });
        }
        
        const storage = getStorage();
        if (!storage) {
          return res.status(503).json({ error: 'Storage service not available' });
        }
        
        try {
          const bucket = storage.bucket(process.env.OMNISEND_FIREBASE_STORAGE_BUCKET);
          const filename = `templates/${req.user!.uid}/${Date.now()}_${req.file.originalname}`;
          const file = bucket.file(filename);
          
          await file.save(req.file.buffer, {
            contentType: req.file.mimetype,
          });
          await file.makePublic();
          imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        } catch (storageError: any) {
          console.error('Storage upload error:', storageError);
          return res.status(500).json({ 
            error: 'Failed to upload image. Please check storage bucket configuration.' 
          });
        }
      }

      const templateRef = await db.collection('templates').add({
        name,
        imageUrl,
        textX: parseInt(textX) || 50,
        textY: parseInt(textY) || 50,
        fontSize: parseInt(fontSize) || 40,
        fontColor: fontColor || '#ffffff',
        ownerId: req.user!.uid,
        createdAt: new Date().toISOString(),
      });

      res.json({ id: templateRef.id, success: true });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  // Get Templates
  app.get("/api/templates", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const snapshot = await db.collection('templates')
        .where('ownerId', '==', req.user!.uid)
        .get();

      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(templates);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // Delete Template
  app.delete("/api/templates/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const templateRef = db.collection('templates').doc(req.params.id);
      const templateDoc = await templateRef.get();

      if (!templateDoc.exists) {
        return res.status(404).json({ error: 'Template not found' });
      }

      if (templateDoc.data()?.ownerId !== req.user!.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Delete the image from Firebase Storage
      const templateData = templateDoc.data();
      if (templateData?.imageUrl) {
        const storagePath = extractStoragePathFromUrl(templateData.imageUrl);
        if (storagePath) {
          try {
            await deleteFromFirebaseStorage(storagePath);
          } catch (e) {
            console.error('Failed to delete template image from storage:', e);
          }
        }
      }

      await templateRef.delete();
      res.json({ success: true });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Admin: Get All Users
  app.get("/api/admin/users", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const snapshot = await db.collection('users').get();
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin: Update User (ban, add quota)
  app.patch("/api/admin/users/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { action, value } = req.body;
      const userId = req.params.id;

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data()!;

      switch (action) {
        case 'ban':
          await userRef.update({ banned: true });
          break;
        case 'unban':
          await userRef.update({ banned: false });
          break;
        case 'addSms': {
          const amount = parseInt(value, 10);
          if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid quota amount' });
          }
          const newSmsQuota = (userData.smsQuota || 0) + amount;
          await userRef.update({ smsQuota: newSmsQuota });
          break;
        }
        case 'addEmail': {
          const amount = parseInt(value, 10);
          if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid quota amount' });
          }
          const newEmailQuota = (userData.emailQuota || 0) + amount;
          await userRef.update({ emailQuota: newEmailQuota });
          break;
        }
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Google Business OAuth - Start
  app.get("/api/auth/google/business", authenticate, async (req: AuthRequest, res) => {
    try {
      const state = req.user!.uid;
      const authUrl = generateAuthUrl(state);
      res.json({ authUrl });
    } catch (error) {
      console.error('Google auth URL error:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  });

  // Google Business OAuth - Callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.redirect('/?error=missing_params');
      }

      const tokens = await exchangeCodeForTokens(code as string);
      const userId = state as string;

      const db = getFirestore();
      if (!db) {
        return res.redirect('/?error=db_unavailable');
      }

      await db.collection('users').doc(userId).update({
        googleTokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date,
        },
      });

      res.redirect('/settings?connected=google');
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Get Google Business Accounts
  app.get("/api/google/accounts", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      if (!userData?.googleTokens?.accessToken) {
        return res.status(401).json({ error: 'Google not connected' });
      }

      let accessToken = userData.googleTokens.accessToken;
      
      if (userData.googleTokens.expiresAt < Date.now()) {
        const newTokens = await refreshAccessToken(userData.googleTokens.refreshToken);
        accessToken = newTokens.access_token!;
        await db.collection('users').doc(req.user!.uid).update({
          'googleTokens.accessToken': accessToken,
          'googleTokens.expiresAt': newTokens.expiry_date,
        });
      }

      const accounts = await getAccounts(accessToken);
      res.json(accounts);
    } catch (error: any) {
      console.error('Get Google accounts error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch accounts' });
    }
  });

  // Get Google Business Locations
  app.get("/api/google/locations/:accountName", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      if (!userData?.googleTokens?.accessToken) {
        return res.status(401).json({ error: 'Google not connected' });
      }

      let accessToken = userData.googleTokens.accessToken;
      
      if (userData.googleTokens.expiresAt < Date.now()) {
        const newTokens = await refreshAccessToken(userData.googleTokens.refreshToken);
        accessToken = newTokens.access_token!;
        await db.collection('users').doc(req.user!.uid).update({
          'googleTokens.accessToken': accessToken,
          'googleTokens.expiresAt': newTokens.expiry_date,
        });
      }

      const locations = await getLocations(accessToken, req.params.accountName);
      res.json(locations);
    } catch (error: any) {
      console.error('Get locations error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch locations' });
    }
  });

  // Save selected Google Business Location
  app.post("/api/google/location", authenticate, async (req: AuthRequest, res) => {
    try {
      const { locationName, placeId, title, address } = req.body;

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const reviewLink = generateReviewLink(placeId);

      await db.collection('users').doc(req.user!.uid).update({
        googleBusiness: {
          locationName,
          placeId,
          title,
          address,
          reviewLink,
          connectedAt: new Date().toISOString(),
        },
      });

      res.json({ success: true, reviewLink });
    } catch (error) {
      console.error('Save location error:', error);
      res.status(500).json({ error: 'Failed to save location' });
    }
  });

  // Get Google Business Reviews
  app.get("/api/google/reviews", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      if (!userData?.googleTokens?.accessToken || !userData?.googleBusiness?.locationName) {
        return res.status(401).json({ error: 'Google Business not connected' });
      }

      let accessToken = userData.googleTokens.accessToken;
      
      if (userData.googleTokens.expiresAt < Date.now()) {
        const newTokens = await refreshAccessToken(userData.googleTokens.refreshToken);
        accessToken = newTokens.access_token!;
        await db.collection('users').doc(req.user!.uid).update({
          'googleTokens.accessToken': accessToken,
          'googleTokens.expiresAt': newTokens.expiry_date,
        });
      }

      const reviews = await getReviews(accessToken, userData.googleBusiness.locationName);
      res.json(reviews);
    } catch (error: any) {
      console.error('Get reviews error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
    }
  });

  // Get Google Business Status
  app.get("/api/google/status", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      const isConnected = !!userData?.googleTokens?.accessToken;
      const businessInfo = userData?.googleBusiness || null;

      res.json({
        connected: isConnected,
        business: businessInfo,
      });
    } catch (error) {
      console.error('Get Google status error:', error);
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  });

  // Disconnect Google Business
  app.delete("/api/google/disconnect", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      await db.collection('users').doc(req.user!.uid).update({
        googleTokens: FieldValue.delete(),
        googleBusiness: FieldValue.delete(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect' });
    }
  });

  // Get AI auto-reply settings
  app.get("/api/google/auto-reply/settings", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      const settings = userData?.autoReplySettings || {
        enabled: false,
        minStars: 4,
        instructions: '',
      };

      res.json(settings);
    } catch (error) {
      console.error('Get auto-reply settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update AI auto-reply settings
  app.put("/api/google/auto-reply/settings", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const { enabled, minStars, instructions } = req.body;

      await db.collection('users').doc(req.user!.uid).update({
        autoReplySettings: {
          enabled: !!enabled,
          minStars: Math.max(1, Math.min(5, minStars || 4)),
          instructions: instructions || '',
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Update auto-reply settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Process reviews and auto-reply
  app.post("/api/google/auto-reply/process", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      if (!userData?.googleTokens?.accessToken) {
        return res.status(400).json({ error: 'Google Business not connected' });
      }

      const settings = userData?.autoReplySettings;
      if (!settings?.enabled) {
        return res.status(400).json({ error: 'Auto-reply is disabled' });
      }

      const locationName = userData?.googleBusiness?.locationName;
      if (!locationName) {
        return res.status(400).json({ error: 'No location selected' });
      }

      let accessToken = userData.googleTokens.accessToken;
      
      // Refresh token if needed
      if (userData.googleTokens.expiresAt && userData.googleTokens.expiresAt < Date.now()) {
        try {
          const tokens = await refreshAccessToken(userData.googleTokens.refreshToken);
          accessToken = tokens.access_token!;
          await db.collection('users').doc(req.user!.uid).update({
            'googleTokens.accessToken': accessToken,
            'googleTokens.expiresAt': tokens.expiry_date || Date.now() + 3600000,
          });
        } catch (e) {
          return res.status(401).json({ error: 'Token refresh failed' });
        }
      }

      // Fetch reviews
      const reviewsData = await getReviews(accessToken, locationName);
      const reviews = reviewsData.reviews || [];

      const repliedReviews = userData.repliedReviews || [];
      const results: { reviewName: string; success: boolean; error?: string }[] = [];

      for (const review of reviews) {
        // Skip if already replied or has a reply
        if (repliedReviews.includes(review.name) || review.reviewReply) {
          continue;
        }

        // Check star rating
        const stars = parseInt(review.starRating?.replace('STAR_RATING_', '') || '0');
        if (stars < settings.minStars) {
          continue;
        }

        try {
          // Generate AI reply
          const replyText = await generateAIReply(
            {
              reviewText: review.comment || '',
              authorName: review.reviewer?.displayName || 'Klient',
              stars,
            },
            settings
          );

          // Post reply
          const result = await replyToReview(accessToken, review.name, replyText);
          
          if (result.success) {
            // Track replied review
            await db.collection('users').doc(req.user!.uid).update({
              repliedReviews: FieldValue.arrayUnion(review.name),
            });
          }

          results.push({ reviewName: review.name, success: result.success, error: result.error });
        } catch (e: any) {
          results.push({ reviewName: review.name, success: false, error: e.message });
        }
      }

      res.json({ 
        processed: results.length,
        results,
      });
    } catch (error: any) {
      console.error('Process reviews error:', error);
      res.status(500).json({ error: error.message || 'Failed to process reviews' });
    }
  });

  // Get follow-up settings
  app.get("/api/follow-up/settings", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      const defaultMessages = Array(5).fill(null).map((_, i) => ({
        enabled: false,
        daysAfter: (i + 1) * 3,
        message: '',
      }));

      const rawSettings = userData?.followUpSettings || { enabled: false, messages: [] };
      
      const normalizedMessages = Array(5).fill(null).map((_, i) => {
        const msg = rawSettings.messages?.[i];
        return {
          enabled: !!msg?.enabled,
          daysAfter: (typeof msg?.daysAfter === 'number' && msg.daysAfter > 0) ? msg.daysAfter : (i + 1) * 3,
          message: typeof msg?.message === 'string' ? msg.message : '',
        };
      });

      res.json({
        enabled: !!rawSettings.enabled,
        messages: normalizedMessages,
        templateId: rawSettings.templateId || null,
      });
    } catch (error) {
      console.error('Get follow-up settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update follow-up settings
  app.put("/api/follow-up/settings", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const { enabled, messages, templateId } = req.body;

      if (!Array.isArray(messages) || messages.length > 5) {
        return res.status(400).json({ error: 'Invalid messages format' });
      }

      const validatedMessages = messages.slice(0, 5).map((msg: any) => ({
        enabled: !!msg.enabled,
        daysAfter: Math.max(1, Math.min(30, parseInt(msg.daysAfter) || 3)),
        message: (msg.message || '').slice(0, 500),
      }));

      await db.collection('users').doc(req.user!.uid).update({
        followUpSettings: {
          enabled: !!enabled,
          messages: validatedMessages,
          templateId: templateId || null,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Update follow-up settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Manually trigger follow-up processing for current user
  app.post("/api/follow-up/process", authenticate, async (req: AuthRequest, res) => {
    try {
      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();

      if (!userData?.followUpSettings?.enabled) {
        return res.status(400).json({ error: 'Follow-up nie jest włączony' });
      }

      const baseUrl = `https://${req.get('host')}`;

      const clientsSnapshot = await db.collection('clients')
        .where('ownerId', '==', req.user!.uid)
        .where('status', 'in', ['SENT', 'CLICKED'])
        .get();

      let sent = 0;
      let failed = 0;
      const now = Date.now();

      for (const clientDoc of clientsSnapshot.docs) {
        const client = clientDoc.data();
        if (!client.lastSentAt || !client.phone) continue;

        const lastSentDate = new Date(client.lastSentAt).getTime();
        const followUpsSent = client.followUpsSent || 0;
        const messages = userData.followUpSettings.messages || [];

        for (let i = followUpsSent; i < messages.length; i++) {
          const followUp = messages[i];
          if (!followUp.enabled || !followUp.message) continue;

          const triggerDate = lastSentDate + (followUp.daysAfter * 24 * 60 * 60 * 1000);
          
          if (now >= triggerDate) {
            let trackingSlug = client.trackingSlug;
            if (!trackingSlug) {
              trackingSlug = Math.random().toString(36).substring(2, 8);
              await clientDoc.ref.update({ trackingSlug });
            }

            const trackingLink = `${baseUrl}/r/${trackingSlug}`;
            let personalizedMessage = followUp.message
              .replace(/\{\{name\}\}/g, client.name || 'Klient')
              .replace(/\{\{google_link\}\}/g, trackingLink);

            const result = await sendSMS(client.phone, personalizedMessage);

            if (result.success) {
              await clientDoc.ref.update({
                followUpsSent: i + 1,
                lastFollowUpAt: new Date().toISOString(),
              });
              sent++;
            } else {
              failed++;
            }
            break;
          }
        }
      }

      res.json({ success: true, sent, failed, eligible: clientsSnapshot.size });
    } catch (error: any) {
      console.error('Process follow-ups error:', error);
      res.status(500).json({ error: error.message || 'Failed to process follow-ups' });
    }
  });

  return httpServer;
}
