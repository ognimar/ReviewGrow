import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import cors from "cors";
import { getFirestore, getStorage, initializeFirebase, isAdmin } from "./firebase";
import { authenticate, requireAdmin, type AuthRequest } from "./middleware/auth";
import { parseCSV } from "./services/csvService";
import { generatePersonalizedImages } from "./services/imageService";
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

      res.json({ id: req.user!.uid, ...userDoc.data() });
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

      for (const client of clients) {
        const personalizedMessage = campaign.message.replace(/\{\{name\}\}/g, client.name || 'Customer');
        
        if (campaign.type === 'sms' && client.phone) {
          sentCount++;
        } else if (campaign.type === 'email' && client.email) {
          sentCount++;
        } else {
          failedCount++;
        }
      }

      await campaignRef.update({
        status: 'sent',
        sentAt: new Date().toISOString(),
        sentCount,
        failedCount,
      });

      const userRef = db.collection('users').doc(req.user!.uid);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data()!;
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

      res.json({
        smsLeft: userData?.smsLeft || 380,
        emailsLeft: userData?.emailsLeft || 1500,
        totalClients: userData?.totalClients || 0,
        totalSent: userData?.totalSent || 0,
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

  return httpServer;
}
