import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './server/routes/auth.js';
import activityRoutes from './server/routes/activities.js';
import dashboardRoutes from './server/routes/dashboard.js';
import leaderboardRoutes from './server/routes/leaderboard.js';
import goalsRoutes from './server/routes/goals.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
// Use a relaxed Helmet configuration to avoid blocking external CDN assets (e.g., Tailwind CSS CDN)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
// In dev, CRA proxy sets X-Forwarded-For; trust proxy avoids rate-limit validation error
if (process.env.NODE_ENV !== 'test') {
  app.set('trust proxy', 1);
}

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', authLimiter);

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: Using fallback JWT secret. Set JWT_SECRET in environment for production.');
}

// Only attempt DB connection outside of test environment
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carbon-tracker');
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      console.log('Proceeding with in-memory fallback storage.');
    }
  })();
}

// Load OpenAPI spec (soft fail, no log if file is absent)
let openapiDoc = null;
(() => {
  try {
    const candidates = [
      path.resolve(__dirname, '..', 'openapi.yaml'),
      path.join(__dirname, 'openapi.yaml')
    ];
    const specPath = candidates.find(p => fs.existsSync(p));
    if (!specPath) return; // silently skip when not present
    const specRaw = fs.readFileSync(specPath, 'utf-8');
    openapiDoc = yaml.load(specRaw);
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('OpenAPI spec not loaded:', e.message);
    }
  }
})();

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/goals', goalsRoutes);
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection?.readyState;
  const dbStatus = dbState === 1 ? 'connected' : (dbState === 2 ? 'connecting' : 'disconnected');
  res.json({ status: 'ok', db: dbStatus, time: new Date().toISOString() });
});
if (openapiDoc) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
}

// In production serve client build (skip during tests to speed up)
if (process.env.NODE_ENV !== 'test') {
  const buildDir = path.resolve(__dirname, '..', 'frontend', 'build');
  app.use(express.static(buildDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
}

export default app;
