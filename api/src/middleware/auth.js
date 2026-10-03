// Reads the session cookie and attaches req.user. requireUser and requireAdmin guard routes.
import { SESSION_COOKIE, SESSION_DAYS, isProduction, adminEmails } from '../config.js';
import { readToken, createToken } from '../auth/tokens.js';
import { read } from '../db.js';
import { unauthorized, forbidden } from '../errors.js';

export const isAdmin = (user) => Boolean(user && (user.role === 'admin' || adminEmails.includes(user.email)));

// What the browser is allowed to see about a user.
export const publicUser = (u) =>
  u ? { id: u.id, name: u.name, email: u.email, role: isAdmin(u) ? 'admin' : 'learner', createdAt: u.createdAt } : null;

export function attachUser(req, res, next) {
  const id = readToken(req.cookies?.[SESSION_COOKIE]);
  req.user = id ? read().users.find((u) => u.id === id) || null : null;
  next();
}

export function requireUser(req, res, next) {
  next(req.user ? undefined : unauthorized());
}

export function requireAdmin(req, res, next) {
  if (!req.user) return next(unauthorized());
  next(isAdmin(req.user) ? undefined : forbidden());
}

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
});

export function startSession(res, userId) {
  res.cookie(SESSION_COOKIE, createToken(userId), { ...cookieOptions(), maxAge: SESSION_DAYS * 86400000 });
}

export function endSession(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}
