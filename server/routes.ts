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
        batch.set(docRef, {
          ...client,
          ownerId: req.user!.uid,
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

      const clients = clientsSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, name: data.name, phone: data.phone, email: data.email };
      });
      
      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Get user's Google Business review link for {{google_link}} replacement
      const userDoc = await db.collection('users').doc(req.user!.uid).get();
      const userData = userDoc.data();
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
      const clientImageBuffers: Map<string, Buffer> = new Map();
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
            clientImageBuffers.set(client.id, imageBuffer);
            console.log(`Generated image for ${client.name}: ${imageBuffer.length} bytes`);
          } catch (e: any) {
            console.error(`Failed to generate image for ${client.name}:`, e.message);
          }
        }
        console.log(`Generated ${clientImageBuffers.size} personalized images`);
      }

      for (const client of clients) {
        let personalizedMessage = campaign.message
          .replace(/\{\{name\}\}/g, client.name || 'Customer')
          .replace(/\{\{google_link\}\}/g, googleReviewLink);
        
        // Get personalized image buffer if available
        const imageBuffer = clientImageBuffers.get(client.id);
        
        if (campaign.type === 'sms' && client.phone) {
          let result;
          if (imageBuffer && campaign.message.includes('{{image}}')) {
            // Use MMS for messages with personalized images
            result = await sendMMS(client.phone, personalizedMessage, imageBuffer);
          } else {
            // Use regular SMS (remove {{image}} placeholder if present but no image)
            const cleanMessage = personalizedMessage.replace(/\{\{image\}\}/g, '').trim();
            result = await sendSMS(client.phone, cleanMessage);
          }
          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            errors.push(`${client.name}: ${result.error}`);
          }
        } else if (campaign.type === 'email' && client.email) {
          sentCount++;
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

      const userRef = db.collection('users').doc(req.user!.uid);
      if (userData) {
        if (campaign.type === 'sms') {
          await userRef.update({ smsUsed: (userData.smsUsed || 0) + sentCount });
        } else {
          await userRef.update({ emailUsed: (userData.emailUsed || 0) + sentCount });
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

      const smsQuota = userData?.smsQuota || 0;
      const smsUsed = userData?.smsUsed || 0;
      const emailQuota = userData?.emailQuota || 0;
      const emailUsed = userData?.emailUsed || 0;

      res.json({
        smsLeft: Math.max(0, smsQuota - smsUsed),
        emailsLeft: Math.max(0, emailQuota - emailUsed),
        totalClients: clientsSnapshot.size,
        totalSent: smsUsed + emailUsed,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Stripe Checkout
  app.post("/api/billing/checkout", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const { plan } = req.body;

      const prices = {
        monthly: { amount: 9900, interval: 'month' as const },
        yearly: { amount: 96000, interval: 'year' as const },
      };

      const selectedPrice = prices[plan as keyof typeof prices];
      if (!selectedPrice) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'pln',
              product_data: {
                name: plan === 'yearly' ? 'Pro Plan (Annual)' : 'Monthly Plan',
              },
              unit_amount: selectedPrice.amount,
              recurring: selectedPrice.interval === 'month' ? { interval: 'month' } : undefined,
            },
            quantity: 1,
          },
        ],
        mode: plan === 'yearly' ? 'payment' : 'subscription',
        success_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/billing?success=true`,
        cancel_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/billing?canceled=true`,
        metadata: {
          userId: req.user!.uid,
          plan,
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
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

  return httpServer;
}
