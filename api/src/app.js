// Builds the Express app. Kept separate from server.js so tests can start it on any port.
import express from 'express';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { corsOrigin, webDist } from './config.js';
import { authRoutes } from './routes/auth.js';
import { contentRoutes } from './routes/content.js';
import { progressRoutes } from './routes/progress.js';
import { adminRoutes } from './routes/admin.js';
import { errorHandler } from './errors.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  // Basic security headers.
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' });
    next();
  });

  // Only needed when the web app is served from a different domain than the API.
  if (corsOrigin) {
    app.use('/api', (req, res, next) => {
      if (req.headers.origin === corsOrigin) {
        res.set({
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          Vary: 'Origin',
        });
      }
      if (req.method === 'OPTIONS') return res.sendStatus(204);
      next();
    });
  }

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', (req, res) => res.status(404).json({ error: { code: 'not-found', message: 'No such API route.' } }));
  // Serve the built web app from web/dist once `npm run build` has made it, so one server runs everything.
  // In production, serve the built web app from web/dist when it exists.
  if (existsSync(join(webDist, 'index.html'))) {
    app.use(express.static(webDist));
    app.get('/', (req, res) => res.sendFile(join(webDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
