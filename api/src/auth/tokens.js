// Signed session tokens: base64url(JSON payload) + "." + HMAC-SHA256 signature.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { authSecret, SESSION_DAYS } from '../config.js';

const sign = (body) => createHmac('sha256', authSecret).update(body).digest('base64url');

export function createToken(userId) {
  const payload = { sub: userId, exp: Date.now() + SESSION_DAYS * 86400000 };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

// Returns the user id, or null when the token is missing, tampered with or expired.
export function readToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature || '');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(body, 'base64url').toString());
    return exp > Date.now() ? sub : null;
  } catch {
    return null;
  }
}
