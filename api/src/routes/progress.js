// /api/progress: each learner's read topics, last topic and study days, so progress follows them across devices.
import { Router } from 'express';
import { read, update } from '../db.js';
import { attachUser, requireUser } from '../middleware/auth.js';
import { progressBody } from '../validation.js';

export const progressRoutes = Router();
progressRoutes.use(attachUser, requireUser);

const empty = () => ({ read: {}, last: null, days: [] });

progressRoutes.get('/', (req, res) => {
  res.json({ progress: read().progress[req.user.id] || empty() });
});

progressRoutes.put('/', (req, res) => {
  const progress = progressBody(req.body);
  update((db) => {
    db.progress[req.user.id] = progress;
  });
  res.json({ progress });
});
