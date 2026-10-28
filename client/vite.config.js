import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * During development every `/api` and `/uploads` request is proxied to the
 * Express server, so the browser only ever talks to one origin and CORS never
 * gets in the way. In production point VITE_API_URL at the deployed API.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind every interface rather than the default `localhost`. On machines
    // whose resolver puts IPv6 first, `localhost` binds the loopback `::1`
    // only, which makes http://127.0.0.1:5173 refuse connections for browsers,
    // preview proxies and tooling that resolve localhost to IPv4.
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
