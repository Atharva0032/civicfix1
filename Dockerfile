# syntax=docker/dockerfile:1

###############################################################################
# CivicFix — single-image deployment (Render, Fly, Railway, any Docker host).
#
# Stage 1 compiles the React client. Stage 2 runs the Express API, which also
# serves that build from `client/dist`. The SPA therefore calls the API on its
# own origin (/api), so one container + one port is all that is needed.
#
# Requires at runtime (Render → Environment):
#   MONGO_URI    MongoDB connection string, e.g. MongoDB Atlas. Render has no
#                managed MongoDB, and production refuses to start without it.
#   JWT_SECRET   Random string, at least 32 characters.
#   CLIENT_ORIGIN  Public URL of this service, e.g. https://civicfix.onrender.com
#                  (browsers send an Origin header even for same-origin POSTs).
###############################################################################

# ---------------------------------------------------------------------------
# Stage 1 — build the React client
# ---------------------------------------------------------------------------
FROM node:22-alpine AS client-build

WORKDIR /app/client

# Copied first so the install layer is cached until the lockfile changes.
COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./

# VITE_API_URL is deliberately NOT set: the bundle then requests `/api` on its
# own origin, which is this same container.
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — production API + compiled SPA
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app/server

# The in-memory MongoDB helper is a devDependency and is intentionally left out
# of the image; production always talks to MONGO_URI.
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server/ ./

# Compiled client from stage 1, placed where the API looks for it:
# SERVER_ROOT/../client/dist
COPY --from=client-build /app/client/dist /app/client/dist

# `uploads/` is where STORAGE_DRIVER=local writes images. Hand the tree to the
# unprivileged `node` user so the app can create files at runtime.
RUN mkdir -p uploads && chown -R node:node /app

USER node

# Render injects its own PORT; 5000 keeps `docker run` working out of the box.
ENV PORT=5000
EXPOSE 5000

# Lets `docker run` report a broken container early. Render uses its own
# Health Check Path setting instead (/api/health).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
