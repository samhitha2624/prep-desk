// The one place the app talks to data: the real API, or the in-browser demo when VITE_DEMO_MODE=true.
// The demo code (and its bundled seed content) loads only in demo builds.
import { createApiBackend } from './api-backend.js';

export let backend = null;

export async function initBackend() {
  // Read the flag directly so Vite drops the demo chunk from API builds.
  backend = import.meta.env.VITE_DEMO_MODE === 'true' ? (await import('./demo-backend.js')).createDemoBackend() : createApiBackend();
  return backend;
}
