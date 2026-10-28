import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import env, { SERVER_ROOT } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { UPLOADS_DIR, UPLOADS_ROUTE } from './services/storage.service.js';

/**
 * Production React build. `npm run build` writes it to `<repo>/client/dist`,
 * and the Docker image copies the compiled client to the same path — so a
 * single container can serve both the SPA and the API.
 */
const CLIENT_DIST = path.resolve(SERVER_ROOT, '..', 'client', 'dist');
const CLIENT_INDEX = path.join(CLIENT_DIST, 'index.html');

export function createApp() {
  const app = express();

  // When the client has been built we serve it from this process, so the root
  // URL becomes the SPA instead of the API welcome JSON.
  const hasClientBuild = fs.existsSync(CLIENT_INDEX);

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Images are served from this origin and consumed by the Vite dev server
      // on a different port, so the default same-origin policy must be relaxed.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  const allowedOrigins = new Set(env.clientOrigins);

  // In development Vite may fall back to another port (5174, 5175, …) when the
  // default one is already taken. Accept any loopback origin there so the dev
  // server keeps working regardless of the port it ends up on.
  const isDevLoopbackOrigin = (origin) =>
    !env.isProduction &&
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(origin);

  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header (curl, Postman, server-to-server)
        // and declared dev origins are allowed; everything else is rejected.
        if (!origin || allowedOrigins.has(origin) || isDevLoopbackOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  // Locally stored uploads (STORAGE_DRIVER=local).
  app.use(
    UPLOADS_ROUTE,
    express.static(UPLOADS_DIR, {
      maxAge: '7d',
      setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    }),
  );

  // Compiled assets (hashed filenames) from the React build.
  if (hasClientBuild) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
  }

  // Without a build this origin is API-only, so the root documents the API.
  if (!hasClientBuild) {
    app.get('/', (_req, res) => {
      res.json({
        success: true,
        message: 'CivicFix API — Report It. Track It. Fix It.',
        data: { docs: '/api/health, /api/meta, /api/auth, /api/issues, /api/admin' },
      });
    });
  }

  app.use('/api', routes);

  // SPA history fallback, so deep links (e.g. /issues/<id>) survive a refresh.
  // Unknown API/uploads paths still reach the 404 handler below.
  if (hasClientBuild) {
    app.get('*', (req, res, next) => {
      const isApiPath =
        req.path.startsWith('/api') || req.path.startsWith(UPLOADS_ROUTE);
      if (isApiPath) return next();
      return res.sendFile(CLIENT_INDEX);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
