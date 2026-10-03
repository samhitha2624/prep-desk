// /api/auth: sign up, log in, log out, current user and profile name.
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { read, update } from '../db.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { attachUser, requireUser, publicUser, startSession, endSession } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { signupBody, loginBody, nameBody } from '../validation.js';
import { badRequest, conflict } from '../errors.js';

export const authRoutes = Router();
const limited = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// Creates the account but does not log in: the app sends people to the log in page next.
authRoutes.post('/signup', limited, async (req, res) => {
  const { name, email, password } = signupBody(req.body);
  if (read().users.some((u) => u.email === email)) throw conflict('email-in-use', 'An account with this email already exists. Log in instead.');
  const passwordHash = await hashPassword(password);
  const user = update((db) => {
    // Check again after the await, in case the same email signed up meanwhile.
    if (db.users.some((u) => u.email === email)) throw conflict('email-in-use', 'An account with this email already exists. Log in instead.');
    const created = { id: randomUUID(), name, email, role: db.users.length === 0 ? 'admin' : 'learner', passwordHash, createdAt: Date.now() };
    db.users.push(created);
    return created;
  });
  res.status(201).json({ user: publicUser(user) });
});

authRoutes.post('/login', limited, async (req, res) => {
  const { email, password } = loginBody(req.body);
  const user = read().users.find((u) => u.email === email);
  // Same message whether the email or the password is wrong, so accounts cannot be discovered.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw badRequest('wrong-credentials', 'That email and password do not match. Check them and try again.');
  }
  startSession(res, user.id);
  res.json({ user: publicUser(user) });
});

authRoutes.post('/logout', (req, res) => {
  endSession(res);
  res.json({ ok: true });
});

authRoutes.get('/me', attachUser, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

authRoutes.patch('/me', attachUser, requireUser, (req, res) => {
  const name = nameBody(req.body);
  const user = update((db) => {
    const u = db.users.find((x) => x.id === req.user.id);
    u.name = name;
    return u;
  });
  res.json({ user: publicUser(user) });
});
