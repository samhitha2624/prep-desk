import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const seed = fileURLToPath(new URL('../api/data/seed', import.meta.url));

export default defineConfig({
  // Relative asset paths so the build works from the API server or any static host.
  base: './',
  resolve: {
    // The demo build (VITE_DEMO_MODE=true) bundles the API's seed content.
    alias: { '@seed': seed },
  },
  server: {
    port: 5173,
    // Lets the dev server read the seed files outside web/.
    fs: { allow: ['..'] },
    // In development, /api calls go to the API on port 4000.
    proxy: { '/api': 'http://localhost:4000' },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
