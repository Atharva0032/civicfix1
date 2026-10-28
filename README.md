# CivicFix — Smart City Issue Reporter

**Report It. Track It. Fix It.**

CivicFix is a full-stack civic engagement platform that connects citizens with their municipal
authorities. Citizens report real-world problems — potholes, garbage overflow, broken
streetlights, water leakage, damaged roads and drainage issues — while administrators triage,
assign, track and resolve them from a dedicated operations dashboard.

Every number, chart and counter in the application is computed from live database records.
There are no hardcoded statistics.

---

## Table of contents

1. [Feature overview](#1-feature-overview)
2. [Technology stack](#2-technology-stack)
3. [Project structure](#3-project-structure)
4. [Quick start](#4-quick-start)
5. [Demo accounts](#5-demo-accounts)
6. [Environment variables](#6-environment-variables)
7. [API documentation](#7-api-documentation)
8. [Data models](#8-data-models)
9. [Security](#9-security)
10. [Testing](#10-testing)
11. [Production notes](#11-production-notes)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Feature overview

### Public
- **Landing page** with the headline *"Make Your City Better, One Report at a Time."*, live
  counters pulled from the database, a live map preview and the most recent public reports.
- **Explore issues** — search, filter by category / status / priority, and sort by newest,
  priority or most supported.
- **Interactive map** (Leaflet + OpenStreetMap) with status-coloured markers, popups, and
  category / status filters.
- **Complaint detail page** with a full status timeline and photo gallery.

### Citizen
- Secure registration and login.
- Report an issue: title, description, category, photo upload with preview, address, map-based
  location picker, coordinates and priority.
- Personal dashboard with totals, open / in-progress / resolved counts and recent reports.
- **My Reports** — search, filter, edit or withdraw a complaint while it is still `submitted`.
- **Community support** — upvote a complaint once; duplicate votes are rejected, and the
  supporter count can be sorted on.
- **Notification centre** — submission, acknowledgement, status changes, resolution, rejection
  and administrative notes.

### Administrator
- Protected dashboard with total / pending / in-progress / resolved counts and a resolution rate
  derived from real records.
- Charts: complaints by category, complaints over time (created vs. resolved), status
  distribution, priority distribution and department workload.
- Complaint management table with search, filters (category, status, priority, department, date
  range), sorting, pagination and CSV export.
- Manage a complaint: change status (with note, resolution note or optional proof photo) and
  assign a department and/or officer.
- Departments, citizens and analytics views.

### Status workflow

```
Submitted ──▶ Acknowledged ──▶ In Progress ──▶ Resolved
     │              │               │
     └──────────────┴───────────────┴──────────▶ Rejected (with reason)
```

Citizens can never change an administrative status; they may only edit or withdraw their own
complaint while it is still `submitted`.

---

## 2. Technology stack

| Layer          | Technology                                                              |
| -------------- | ----------------------------------------------------------------------- |
| Frontend       | React 18, Vite 5, React Router 6                                        |
| Styling        | Tailwind CSS 3 (custom navy / primary / teal design tokens)             |
| Maps           | Leaflet 1.9 + react-leaflet 4, OpenStreetMap tiles                      |
| Charts         | Recharts 2                                                              |
| Icons          | Lucide React                                                            |
| Backend        | Node.js (ESM), Express 4                                                |
| Database       | MongoDB with Mongoose 8                                                 |
| Auth           | JWT (`jsonwebtoken`) + `bcryptjs` password hashing                      |
| Validation     | Zod                                                                     |
| Uploads        | Multer — local disk in development, Cloudinary in production (optional) |
| Security       | helmet, cors, express-rate-limit, compression, morgan                   |
| Testing        | Vitest + Supertest + mongodb-memory-server                              |

### Zero-configuration database

You do **not** need MongoDB installed to run this locally. When `MONGO_URI` is empty the server
starts a self-managed MongoDB instance via `mongodb-memory-server`, downloads a `mongod` binary
once, and persists the data to `server/.mongo-data` on a pinned port (`27777`) with the
WiredTiger storage engine. The seed script and the dev server therefore share one database that
survives restarts. Set `MONGO_URI` (e.g. a MongoDB Atlas connection string) for anything real.

---

## 3. Project structure

```
CIVIFIX/
├── README.md
├── client/                             # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js              # navy / primary / teal design tokens
│   ├── vite.config.js                  # proxies /api and /uploads -> :5000
│   ├── .env.example
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx                    # entry point + provider composition
│       ├── App.jsx                     # route tree (public / citizen / admin)
│       ├── index.css
│       ├── components/
│       │   ├── charts/                 # Recharts wrappers: category, timeline,
│       │   │                           #   status donut, priority, department
│       │   ├── issues/                 # IssueCard, IssueFilters, StatusTimeline,
│       │   │                           #   PhotoGallery, CategoryIcon
│       │   ├── layout/                 # PublicNavbar, Footer, Sidebar, Topbar,
│       │   │                           #   DashboardLayout, NotificationBell, UserMenu
│       │   ├── map/                    # IssueMap, LocationPicker, markerIcon
│       │   ├── notifications/          # NotificationList
│       │   ├── routing/                # ProtectedRoute, PublicOnlyRoute
│       │   └── ui/                     # Button, Card, Badge, Modal, FormControls,
│       │                               #   Pagination, Feedback (skeletons/empty states)
│       ├── context/                    # Auth, Toast, Meta, Notification providers
│       ├── hooks/                      # useApi, useDebouncedValue, useDocumentTitle
│       ├── lib/                        # api client, constants, formatters, cn, navigation
│       └── pages/
│           ├── LandingPage.jsx
│           ├── HowItWorksPage.jsx
│           ├── ExplorePage.jsx
│           ├── MapPage.jsx
│           ├── IssueDetailPage.jsx
│           ├── ReportIssuePage.jsx
│           ├── NotFoundPage.jsx
│           ├── auth/                   # LoginPage, RegisterPage
│           ├── dashboard/              # CitizenDashboard, MyReports,
│           │                           #   Notifications, Profile
│           └── admin/                  # AdminDashboard, AdminIssues,
│                                       #   AdminDepartments, AdminCitizens,
│                                       #   AdminAnalytics
└── server/                             # Express + MongoDB backend
    ├── package.json
    ├── vitest.config.js
    ├── .env.example
    ├── tests/
    │   ├── helpers/                    # testDb, factories
    │   ├── auth.test.js                # registration, login, RBAC
    │   ├── issues.test.js              # issue creation + validation
    │   └── admin.test.js               # admin-only endpoints
    └── src/
        ├── index.js                    # bootstrap (connect DB, listen)
        ├── app.js                      # express app + middleware pipeline
        ├── config/
        │   ├── env.js                  # validated environment accessor
        │   └── db.js                   # Mongo connection / local memory server
        ├── models/                     # User, Issue, Notification
        ├── validators/                 # Zod schemas (auth, issue, notification)
        ├── middleware/                 # auth, validate, upload, rateLimit, error
        ├── services/                   # issue, stats, notification, storage
        ├── controllers/                # auth, issues, admin, notifications
        ├── routes/                     # system, auth, issue, admin, notification
        ├── seed/seed.js                # demo data seeding script
        └── utils/                      # ApiError, asyncHandler, complaintId,
                                        #   pagination, token, constants
```

---

## 4. Quick start

### Prerequisites

- **Node.js 18.18 or newer** (`node --version`)
- **npm 9+**
- MongoDB is **optional** — see [Zero-configuration database](#zero-configuration-database).

### Step 1 — Install dependencies

Open a terminal in the project root and install both workspaces:

```powershell
cd server
npm install

cd ..\client
npm install
```

### Step 2 — Configure the environment

```powershell
cd ..\server
Copy-Item .env.example .env

cd ..\client
Copy-Item .env.example .env
```

The defaults work immediately for local development. Before running anything real, generate a
JWT secret and put it in `server/.env`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> If `JWT_SECRET` is missing the server logs a loud warning and falls back to an insecure
> development secret. Never deploy in that state.

### Step 3 — Seed the demo database

```powershell
cd ..\server
npm run seed:fresh
```

You should see a report like:

```
   Users ................ 7
   Complaints ........... 18 (18 created this run)
   Notifications ........ 20
```

`seed:fresh` wipes and repopulates. Use `npm run seed` to seed only when the database is empty.
Seeding refuses to run when `NODE_ENV=production`.

### Step 4 — Run the application

Open **two terminals**.

Terminal A — backend (http://localhost:5000):

```powershell
cd server
npm run dev
```

Terminal B — frontend (http://localhost:5173):

```powershell
cd client
npm run dev
```

Vite proxies `/api` and `/uploads` to the backend, so the browser only ever talks to one origin.
Open **http://localhost:5173** — the dev server also opens the browser for you.

### Step 5 — Sign in

Log in with any account from [Demo accounts](#5-demo-accounts). The login screen has a
**demo credentials** panel with one-click fill buttons.

---

## 5. Demo accounts

Every seeded account uses the password **`CivicFix@123`** (configurable via
`SEED_DEFAULT_PASSWORD`).

| Role            | Email                              |
| --------------- | ---------------------------------- |
| Administrator   | `admin@civicfix.dev`               |
| Ward officer    | `officer.roads@civicfix.dev`       |
| Ward officer    | `officer.sanitation@civicfix.dev`  |
| Citizen         | `ananya@civicfix.dev`              |
| Citizen         | `rohan@civicfix.dev`               |
| Citizen         | `meera@civicfix.dev`               |
| Citizen         | `imran@civicfix.dev`               |

> These are **development-only** credentials. Change or remove every account before deploying.
> There is no public administrator registration — admin accounts are created by the seed script
> only, and the registration endpoint ignores any client-supplied `role`.

The seed produces 18 realistic complaints spread across all seven categories and every status,
each with photo references, coordinates, status history and notifications.

---

## 6. Environment variables

### `server/.env`

| Variable                 | Default                     | Description                                                          |
| ------------------------ | --------------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`               | `development`               | `production` refuses in-memory DB and relaxes nothing                |
| `PORT`                   | `5000`                      | HTTP port                                                            |
| `CLIENT_ORIGIN`          | `http://localhost:5173`     | Comma-separated CORS allow-list                                      |
| `PUBLIC_API_URL`         | `http://localhost:5000`     | Base URL used to build absolute upload URLs                          |
| `MONGO_URI`              | *(empty)*                   | Empty → local persisted memory server. Set for Atlas / self-hosted.  |
| `MEMORY_DB_PORT`         | `27777`                     | Port of the local memory server                                      |
| `JWT_SECRET`             | *(insecure fallback)*       | **Required in production.** 32+ random characters                    |
| `JWT_EXPIRES_IN`         | `7d`                        | Token lifetime                                                       |
| `STORAGE_DRIVER`         | `local`                     | `local` (disk) or `cloudinary`                                       |
| `MAX_UPLOAD_MB`          | `5`                         | Per-file upload limit                                                |
| `CLOUDINARY_CLOUD_NAME`  | *(empty)*                   | Only when `STORAGE_DRIVER=cloudinary`                                |
| `CLOUDINARY_API_KEY`     | *(empty)*                   | Only when `STORAGE_DRIVER=cloudinary`                                |
| `CLOUDINARY_API_SECRET`  | *(empty)*                   | Only when `STORAGE_DRIVER=cloudinary`                                |
| `CLOUDINARY_FOLDER`      | `civicfix`                  | Cloudinary folder prefix                                             |
| `RATE_LIMIT_AUTH_MAX`    | `20`                        | Auth requests per window per IP                                      |
| `RATE_LIMIT_WRITE_MAX`   | `60`                        | Write requests per window per IP                                     |
| `SEED_DEFAULT_PASSWORD`  | `CivicFix@123`              | Password assigned to seeded accounts                                 |

### `client/.env`

| Variable        | Default     | Description                                                                 |
| --------------- | ----------- | --------------------------------------------------------------------------- |
| `VITE_API_URL`  | *(empty)*   | Empty → Vite proxies `/api`. Set to the deployed API URL when hosted apart.  |
| `VITE_APP_NAME` | `CivicFix`  | Display name                                                                |

### Image uploads without Cloudinary

`STORAGE_DRIVER=local` (the default) stores uploaded photos under `server/uploads/` and serves
them at `/uploads/<file>`. This is a fully working local-development alternative that requires no
credentials. Switch to Cloudinary by setting `STORAGE_DRIVER=cloudinary` and filling in the three
Cloudinary credentials.

---

## 7. API documentation

Base URL: `http://localhost:5000/api`

All responses share one envelope:

```json
{ "success": true, "data": {}, "meta": {}, "message": "Optional human message" }
```

Errors:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed. Please check the highlighted fields.",
  "details": [{ "field": "title", "message": "Title must be at least 5 characters." }]
}
```

List endpoints return `meta`:

```json
{ "page": 1, "limit": 12, "total": 18, "totalPages": 2, "hasNextPage": true, "hasPrevPage": false }
```

Authenticated requests send `Authorization: Bearer <token>`.

### System

| Method | Endpoint      | Auth | Description                                     |
| ------ | ------------- | ---- | ----------------------------------------------- |
| GET    | `/health`     | —    | Liveness probe incl. database state             |
| GET    | `/meta`       | —    | Canonical categories, statuses, priorities, depts |
| GET    | `/stats`      | —    | Public landing-page counters (live data)        |

### Authentication

| Method | Endpoint         | Auth | Description                                          |
| ------ | ---------------- | ---- | ---------------------------------------------------- |
| POST   | `/auth/register` | —    | Create a **citizen** account (role is ignored)       |
| POST   | `/auth/login`    | —    | Exchange credentials for a JWT                       |
| POST   | `/auth/logout`   | —    | Stateless; client discards the token                 |
| GET    | `/auth/me`       | ✅   | Current profile                                      |
| PATCH  | `/auth/me`       | ✅   | Update `name`, `phone`, `avatarUrl`                  |
| GET    | `/auth/admin-check` | ✅ admin | RBAC probe used by the tests                     |

**Register body**

```json
{
  "name": "Ananya Deshmukh",
  "email": "ananya@civicfix.dev",
  "password": "CivicFix@123",
  "phone": "+91 98200 11223"
}
```

Password rules: 8–72 characters, at least one letter and one number.

### Issues

| Method | Endpoint              | Auth      | Description                                        |
| ------ | --------------------- | --------- | -------------------------------------------------- |
| GET    | `/issues`             | optional  | Paginated, filterable list                         |
| GET    | `/issues/map`         | optional  | Lightweight marker payload for the map             |
| GET    | `/issues/stats/me`    | ✅        | The caller's own dashboard counters                |
| POST   | `/issues`             | ✅        | Create a complaint (multipart, `photos[]`)          |
| GET    | `/issues/:id`         | optional  | Single complaint by ID or complaint number         |
| PATCH  | `/issues/:id`         | ✅ owner  | Edit own complaint while `submitted`               |
| DELETE | `/issues/:id`         | ✅ owner  | Withdraw own complaint while `submitted`           |
| POST   | `/issues/:id/upvote`  | ✅        | Support a complaint (idempotent — one vote each)    |
| DELETE | `/issues/:id/upvote`  | ✅        | Remove your support                                |

**`GET /issues` query parameters**

| Parameter      | Values                                                              |
| -------------- | ------------------------------------------------------------------- |
| `page`, `limit`| Integers; `limit` max 100 (default 12)                              |
| `status`       | `submitted`, `acknowledged`, `in_progress`, `resolved`, `rejected` (comma-separated) |
| `category`     | `roads`, `garbage`, `water`, `electricity`, `drainage`, `public_safety`, `other` |
| `priority`     | `low`, `medium`, `high`, `urgent`                                    |
| `department`   | Department name                                                     |
| `search`       | Free text over title / description / complaint number               |
| `sortBy`       | `createdAt`, `updatedAt`, `priority`, `supporters`, `status`         |
| `order`        | `asc`, `desc`                                                       |
| `mine`         | `true` → only the caller's complaints                               |
| `assignedToMe` | `true` → assigned to the caller                                     |
| `open`         | `true` → statuses that are not resolved / rejected                  |
| `from`, `to`   | ISO dates for the created-at range                                  |

**Create a complaint** — `POST /issues`, `multipart/form-data`:

| Field         | Required | Notes                                        |
| ------------- | -------- | -------------------------------------------- |
| `title`       | ✅       | 5–140 characters                             |
| `description` | ✅       | 10–2000 characters                           |
| `category`    | ✅       | One of the seven categories                  |
| `address`     | ✅       | 5–240 characters                             |
| `lat`, `lng`  | ✅       | Valid coordinates                            |
| `area`, `city`, `pincode` | — | Optional locality details             |
| `priority`    | —        | Omitted → derived from category rules        |
| `photos`      | —        | Up to 5 images, each ≤ `MAX_UPLOAD_MB`       |

Response `201`:

```json
{
  "success": true,
  "message": "Complaint CIV-261028-4LHK registered. Thank you for reporting.",
  "data": { "id": "...", "complaintId": "CIV-261028-4LHK", "status": "submitted" }
}
```

Every complaint receives a unique human-readable ID in the form `CIV-YYMMDD-XXXX` (unambiguous
alphabet, unique index, collision retry).

### Administration

All admin routes require `authenticate` + `requireAdmin`; the role is read from the database on
every request, never from the token or the request body.

| Method | Endpoint                          | Description                                    |
| ------ | --------------------------------- | ---------------------------------------------- |
| GET    | `/admin/stats`                    | Dashboard aggregates (`?days=30`)              |
| GET    | `/admin/issues`                   | Full list, same filters as `/issues`           |
| PATCH  | `/admin/issues/:id/status`        | Change status (+ note / resolution / proof)    |
| PATCH  | `/admin/issues/:id/assign`        | Assign department and/or officer               |
| DELETE | `/admin/issues/:id`               | Remove any complaint                           |
| GET    | `/admin/administrators`           | Officers available for assignment              |
| GET    | `/admin/departments`              | Departments with derived stats                 |
| GET    | `/admin/citizens`                 | Citizen directory                              |

**`GET /admin/stats`** returns `totals`, `resolutionRate`, `rejectionRate`,
`averageResolutionHours`, `byStatus`, `byCategory`, `byPriority`, `byDepartment`, `timeline` and
`windowDays` — all aggregated in MongoDB from real records.

**Status update body**

```json
{
  "status": "resolved",
  "note": "Team dispatched and repaired the pothole.",
  "resolutionNote": "Cold-mix asphalt applied; surface compacted.",
  "rejectionReason": ""
}
```

`resolutionNote` is required when resolving; `rejectionReason` is required when rejecting. An
optional proof photo may be uploaded as `proof` (`multipart/form-data`).

**Assignment body**

```json
{ "department": "Public Works Department", "assignedTo": "<userId|null>", "note": "Routed to zone 3." }
```

Every status change and assignment appends to the complaint's `statusHistory` and notifies the
reporting citizen.

### Notifications

| Method | Endpoint                        | Description                          |
| ------ | ------------------------------- | ------------------------------------ |
| GET    | `/notifications`                | Paginated list (unread filter)       |
| GET    | `/notifications/unread-count`   | Badge count                          |
| PATCH  | `/notifications/read-all`       | Mark everything as read              |
| PATCH  | `/notifications/:id/read`       | Mark one as read                     |
| DELETE | `/notifications/:id`            | Delete one                           |

### HTTP status codes

| Code | Meaning                                                       |
| ---- | ------------------------------------------------------------- |
| 200  | Success                                                       |
| 201  | Resource created                                              |
| 400  | Malformed request                                             |
| 401  | Missing or invalid token                                      |
| 403  | Authenticated but not permitted (e.g. citizen → admin route)  |
| 404  | Resource not found                                            |
| 409  | Conflict (duplicate email, already-registered complaint)      |
| 422  | Validation failed — see `details`                             |
| 429  | Rate limit exceeded                                           |
| 500  | Unexpected server error                                       |

---

## 8. Data models

### User

| Field        | Type     | Notes                                            |
| ------------ | -------- | ------------------------------------------------ |
| `name`       | String   | 2–80 characters                                  |
| `email`      | String   | Unique, lowercased, indexed                      |
| `password`   | String   | bcrypt hash, `select: false` — never serialised  |
| `role`       | String   | `citizen` \| `admin`                             |
| `phone`      | String   | Optional                                         |
| `avatarUrl`  | String   | Optional                                         |
| `department` | String   | Administrators only                              |
| `lastLoginAt`| Date     | Updated on successful login                      |
| `createdAt`  | Date     | Timestamp                                        |

### Issue

| Field              | Type       | Notes                                                       |
| ------------------ | ---------- | ----------------------------------------------------------- |
| `complaintId`      | String     | **Unique** `CIV-YYMMDD-XXXX`                                |
| `title`            | String     | 5–140 characters                                            |
| `description`      | String     | 10–2000 characters                                          |
| `category`         | String     | One of seven categories                                     |
| `photos`           | Subdoc[]   | `{ url, publicId, uploadedAt }` — maximum 5                 |
| `location`         | Object     | `{ address, area, city, pincode, lat, lng }`, all validated  |
| `reportedBy`       | ObjectId   | → `User`                                                    |
| `status`           | String     | `submitted` \| `acknowledged` \| `in_progress` \| `resolved` \| `rejected` |
| `priority`         | String     | `low` \| `medium` \| `high` \| `urgent` + numeric `priorityWeight` for correct sorting |
| `assignedDepartment` | String   | Municipal department                                        |
| `assignedTo`       | ObjectId   | → `User` (officer)                                          |
| `upvotes`          | ObjectId[] | One entry per supporting citizen (`select: false`)          |
| `upvoteCount`      | Number     | Denormalised counter for sorting                            |
| `statusHistory`    | Subdoc[]   | `{ status, note, changedBy, changedByName, changedAt }`     |
| `resolution`       | Object     | `{ note, proofPhotos, resolvedBy, resolvedByName, resolvedAt }` |
| `rejectionReason`  | String     | Populated when rejected                                     |
| `createdAt` / `updatedAt` | Date | Automatic timestamps                                      |

**Indexes:** `complaintId` (unique), `status`, `category`, `priority`, `priorityWeight`,
`reportedBy`, `upvoteCount`, `assignedDepartment`, plus the compound indexes
`{status, createdAt}`, `{category, createdAt}`, `{priority, createdAt}`, `{reportedBy, createdAt}`,
`{upvoteCount, createdAt}`, `{assignedDepartment, status}` and `{createdAt}`.

### Notification

| Field        | Type     | Notes                                                        |
| ------------ | -------- | ------------------------------------------------------------ |
| `recipient`  | ObjectId | → `User` (indexed)                                           |
| `title`      | String   | Required, max 160 characters                                 |
| `message`    | String   | Required, max 600 characters                                 |
| `type`       | String   | `submission`, `acknowledged`, `in_progress`, `resolved`, `rejected`, `note`, `system` |
| `issue`      | ObjectId | → `Issue`, nullable                                          |
| `issueComplaintId` | String | Denormalised `CIV-…` so the UI can link without a populate |
| `issueTitle` | String   | Denormalised complaint title                                 |
| `read`       | Boolean  | Unread filter + badge count (indexed)                        |
| `readAt`     | Date     | When it was marked read                                      |
| `createdAt`  | Date     | Timestamp (no `updatedAt`)                                   |

**Indexes:** `recipient`, `read`, `{recipient, read, createdAt}` and `{recipient, createdAt}`.

---

## 9. Security

- **Password hashing** — bcrypt (`bcryptjs`) with a per-user salt. Hashes are `select: false` and
  stripped by `toJSON`, so they can never leak through an API response.
- **JWT** — signed with `JWT_SECRET`; the token carries only the user ID. The role and account
  state are re-read from the database on **every** request, so a revoked or demoted account loses
  access immediately.
- **Role-based authorization** — `requireAdmin` guards the whole `/api/admin` router. A citizen
  receives `403 Forbidden` (verified live).
- **No self-promotion** — public registration hard-codes `citizen`; the Zod schema does not accept
  a `role` field, so an injected `role: "admin"` is silently ignored (covered by a test).
- **Ownership enforcement** — citizens may only edit or withdraw their **own** complaint, and only
  while its status is `submitted`. Administrative status changes via `PATCH /issues/:id` are
  rejected with `403`.
- **Input validation** — every request body, query string and route parameter is parsed by a Zod
  schema; unknown enum values and out-of-range numbers are refused before reaching a controller.
- **Rate limiting** — stricter limits on `/auth/*` (login, register) and on all write endpoints
  (complaint creation, upvotes, updates).
- **Upload validation** — MIME type and extension allow-list plus a hard size ceiling
  (`MAX_UPLOAD_MB`); files are held in memory until validated.
- **Hardening** — `helmet` security headers, an explicit CORS allow-list, `compression`, and a
  centralised error handler that never leaks stack traces in production.
- **Secrets** — all credentials live in `.env` (git-ignored); `.env.example` documents every key
  without containing real values.

---

## 10. Testing

The backend ships with a Vitest + Supertest suite covering authentication, issue creation and
role-based access control:

```powershell
cd server
npm test          # single run
npm run test:watch
```

Current result:

```
 Test Files  3 passed (3)
      Tests  48 passed (48)
```

Coverage includes:

- `auth.test.js` — registration, duplicate email (`409`), login, wrong password (`401`),
  `/auth/me`, hash never leaked, client-supplied admin role ignored, citizen blocked from the
  admin probe, administrator allowed through.
- `issues.test.js` — authenticated creation, validation failures (`422`), unique complaint IDs,
  listing/pagination, ownership rules.
- `admin.test.js` — admin-only stats/list, status transitions, assignment rules, notifications
  generated by status changes.

The suite spins up an isolated in-memory MongoDB per run, so it never touches your development
data.

Frontend production build check:

```powershell
cd client
npx vite build
```

---

## 11. Production notes

1. Set `NODE_ENV=production` — the server then refuses to start an in-memory database and stops
   exposing stack traces.
2. Set a real `MONGO_URI` (MongoDB Atlas or self-hosted) and a strong `JWT_SECRET`.
3. Point `CLIENT_ORIGIN` at your deployed frontend origin and `PUBLIC_API_URL` at your public API
   URL.
4. Set `STORAGE_DRIVER=cloudinary` with real credentials, or mount a persistent volume at
   `server/uploads` and serve it behind a CDN.
5. Do **not** run the seed script in production. Provision administrator accounts explicitly and
   rotate the demo credentials.
6. Build the frontend with `npm run build` in `client/` and serve `client/dist` from a static host
   or CDN, setting `VITE_API_URL` to the deployed API at build time.

---

## 12. Troubleshooting

**`Local MongoDB helper unavailable` / `MONGO_URI must be configured`**
Run `npm install` inside `server/` so `mongodb-memory-server` is present, or set `MONGO_URI` in
`server/.env`. The first local start downloads a `mongod` binary and can take a few minutes.

**Seeding seems to do nothing**
Use `npm run seed:fresh` to wipe and repopulate. Plain `npm run seed` intentionally skips a
database that already contains data.

**Frontend shows "Cannot reach the CivicFix API"**
The backend is not running. Start it with `npm run dev` in `server/` and confirm
http://localhost:5000/api/health returns `{"success":true,...}`.

**Port already in use**
Change `PORT` in `server/.env` (and update the proxy target in `client/vite.config.js`), or stop
the process holding the port.

**Map tiles do not load**
Leaflet pulls tiles from OpenStreetMap, so an internet connection is required. Marker icons are
rendered as inline SVG and therefore always display.

**Uploads fail**
Confirm the file is an allowed image type and smaller than `MAX_UPLOAD_MB` (default 5 MB).

---

Built for a college / national-level hackathon demonstration — **Report It. Track It. Fix It.**
