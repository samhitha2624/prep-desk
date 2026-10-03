// API settings, read from environment variables (and api/.env when present).
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

export const API_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const envFile = resolve(API_ROOT, '.env');
if (existsSync(envFile) && typeof process.loadEnvFile === 'function') process.loadEnvFile(envFile);

const env = process.env;

export const isProduction = env.NODE_ENV === 'production';
export const port = Number(env.PORT) || 4000;
export const dataFile = resolve(API_ROOT, env.DATA_FILE || 'data/db.json');
export const seedDir = resolve(API_ROOT, 'data/seed');
export const webDist = resolve(API_ROOT, '../web/dist');
export const corsOrigin = env.CORS_ORIGIN || '';
export const adminEmails = (env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Signing secret for login cookies. Generated once for local development if not provided.
function loadSecret() {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  if (isProduction) throw new Error('AUTH_SECRET must be set in production.');
  const file = resolve(API_ROOT, 'data/.secret');
  if (existsSync(file)) return readFileSync(file, 'utf8').trim();
  const secret = randomBytes(32).toString('hex');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, secret);
  return secret;
}
export const authSecret = loadSecret();

export const SESSION_COOKIE = 'prepdesk_session';
export const SESSION_DAYS = 30;
