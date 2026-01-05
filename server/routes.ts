import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import cors from "cors";
import { getFirestore, initializeFirebase, isAdmin } from "./firebase";
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
      const { name, type, clientIds, message, templateId, scheduled } = req.body;

      const db = getFirestore();
      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const campaignRef = await db.collection('campaigns').add({
        name,
        type,
        clientIds,
        message,
        templateId,
        scheduled,
        status: 'draft',
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
        .orderBy('createdAt', 'desc')
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
        success_url: `${process.env.BASE_URL || 'http://localhost:5000'}/billing?success=true`,
        cancel_url: `${process.env.BASE_URL || 'http://localhost:5000'}/billing?canceled=true`,
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

  return httpServer;
}
