/*
 * Web app settings, from web/.env (see web/.env.example).
 *   VITE_API_URL     where the API lives (default /api, which the dev server forwards to localhost:4000)
 *   VITE_DEMO_MODE   true runs without the API: accounts, content and edits are kept in this browser only
 *   VITE_REQUIRE_LOGIN  true makes every page need an account
 */
const env = import.meta.env;

export const apiUrl = (env.VITE_API_URL || '/api').replace(/\/$/, '');
export const demoMode = env.VITE_DEMO_MODE === 'true';
export const requireLogin = env.VITE_REQUIRE_LOGIN === 'true';
