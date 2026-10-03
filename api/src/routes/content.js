// /api/content: everything learners read. Public, no login needed.
import { Router } from 'express';
import { read } from '../db.js';

export const contentRoutes = Router();

contentRoutes.get('/', (req, res) => {
  const { subjects, quizzes } = read();
  res.set('Cache-Control', 'no-cache');
  res.json({ subjects, quizzes });
});
