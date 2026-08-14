import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';

import { initSocketIO } from './services/socketService.js';
import { wafInspectionMiddleware, targetOriginProxy, proxyRateLimiter } from './middleware/proxyMiddleware.js';
import adminRouter from './routes/adminRoutes.js';
import { SettingsModel } from './models/Settings.js';

// Fix Node.js Windows DNS SRV Resolution Issue (ECONNREFUSED _mongodb._tcp)
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

// 1. Load Environment Variables
dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4001;

// Global CORS Setup
app.use(cors({ origin: '*' }));

// Parse Body for REST Admin API and Inspection Pipeline
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.IO Server
initSocketIO(httpServer);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SentinelAI WAF Reverse Proxy Core',
    timestamp: new Date().toISOString()
  });
});

// Admin REST API Routes
app.use('/api/admin', adminRouter);

// WAF Inspection & Reverse Proxy Middleware Pipeline
app.use(proxyRateLimiter);
app.use(wafInspectionMiddleware);
app.use(targetOriginProxy);

/**
 * 2. Async MongoDB Atlas Connection Function
 * Connects directly using Mongoose and process.env.MONGODB_URI (or MONGO_URI fallback)
 */
export async function connectDB(): Promise<void> {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoURI) {
    const errorMsg = 'MONGODB_URI is not defined in environment variables (.env file). Please set MONGODB_URI in backend/.env';
    console.error(`[MongoDB Atlas] Connection Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      family: 4, // Force IPv4 to bypass Windows DNS SRV ECONNREFUSED
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB Atlas] Successfully connected to database: ${conn.connection.name} (Host: ${conn.connection.host})`);
  } catch (err: any) {
    console.error(`[MongoDB Atlas] Connection Failed: ${err.message}`);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.error('[MongoDB Atlas] Tip: If DNS SRV fails, verify Google DNS (8.8.8.8) is reachable and your IP is allowed in MongoDB Atlas Network Access (0.0.0.0/0).');
    }
    throw err;
  }
}

/**
 * 3. Bootstrap Function: Connects DB first, seeds default settings, and starts server listening
 */
async function bootstrap() {
  try {
    // Connect to MongoDB Atlas before starting listening
    await connectDB();

    // Seed default settings if collection is empty
    const settingsCount = await SettingsModel.countDocuments();
    if (settingsCount === 0) {
      await SettingsModel.create({
        protectionMode: 'Active Blocking',
        confidenceThreshold: 0.65,
        modelVersion: 'Sentinel-Transformer-v3.4.2-Live',
        lastRetrained: 'Today at 04:00 UTC'
      });
      console.log('[Sentinel WAF Core] Initialized default WAF Settings in MongoDB Atlas.');
    }
  } catch (err: any) {
    console.error('[Sentinel WAF Core] Fatal error during database startup. Server will not start:', err.message);
    process.exit(1);
  }

  // Server starts listening on process.env.PORT (default 4001)
  httpServer.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🛡️  SentinelAI WAF Proxy Core listening on http://localhost:${PORT}`);
    console.log(`🔗 Target Protected Origin App: ${process.env.TARGET_ORIGIN_URL || 'http://127.0.0.1:3000'}`);
    console.log(`📊 Admin REST API & WebSockets: http://localhost:${PORT}/api/admin`);
    console.log(`=======================================================`);
  });
}

bootstrap();
