# Zackconnect Node.js backend

REST API for the static Zackconnect website. The API uses Express and MySQL and can serve the frontend from the sibling `my-webapp` folder.

## Requirements

- Node.js 20 or later
- A MySQL 8.0+ server (local or hosted)

## Run locally

1. Create a MySQL database, for example: `CREATE DATABASE zackconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`.
2. Copy `.env.example` to `.env` and set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, and a random `JWT_SECRET` of at least 32 characters. Keep `.env` private.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000/` (or `/login.html` or `/signup.html`). The backend serves the sibling frontend on the same origin, so do not open the HTML directly with `file://`.
5. The API is available at `http://localhost:3000/api`; check `GET /api/health` for database readiness.

Do not commit `.env`. The backend creates its MySQL tables at startup and fails if MySQL is unavailable or the signing secret is missing or invalid. Set `CLIENT_STATIC_DIR` if the frontend is not in the sibling `my-webapp` folder.

## Deploy the API to Vercel

The Express API can be deployed as a Vercel Function from this repository. Import the backend repository into Vercel with the repository root as the project root; Vercel detects `src/server.js` as the Express entry point. The separate static frontend project remains hosted independently, since Vercel Functions do not serve this app's `express.static()` files.

In the Vercel backend project's environment settings, configure `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, and a new `JWT_SECRET` of at least 32 characters. Use a hosted MySQL database reachable over the network; `localhost` and `127.0.0.1` refer to the function environment, not a developer computer. Also set `CLIENT_ORIGIN` to the exact frontend origin, for example `https://my-webapp-khaki.vercel.app`, and optionally `JWT_EXPIRES_IN=7d`. Do not set `CLIENT_STATIC_DIR` or `PORT` for the Vercel deployment.

After deploying the API, point the frontend's `window.ZACKCONNECT_API_URL` at the API deployment URL followed by `/api`, then redeploy the frontend. For local development, run `npm run dev` as usual.

## Create an administrator

Register the admin account through `POST /api/auth/register`, then promote it and set its administrator password:

```powershell
npm run create-admin -- admin@example.com "use-a-long-unique-password"
```

The CLI changes only that existing account. Admin-only routes require a valid bearer token for an account with the `admin` role.

## API

All JSON request and response bodies use `application/json`. Authenticated routes use `Authorization: Bearer <token>`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | API and MySQL readiness |
| POST | `/api/auth/register` | Public | Create customer account (`name`, `email`, `phone`, `password`) |
| POST | `/api/auth/login` | Public | Sign in (`email`, `password`) |
| GET | `/api/auth/me` | Signed in | Get current account |
| GET | `/api/catalog/bundles`, `/cars`, `/tricycles` | Public | Read catalog items |
| POST | `/api/catalog/:category` | Admin | Create `{ "item": { "id": "...", ... } }` |
| PUT | `/api/catalog/:category/:id` | Admin | Replace a catalog item |
| DELETE | `/api/catalog/:category/:id` | Admin | Delete a catalog item |
| POST | `/api/enquiries` | Public | Submit `name`, `phone`, `email`, `service`, `message` |
| GET | `/api/enquiries` | Admin | List enquiries |
| PATCH | `/api/enquiries/:id/status` | Admin | Set status to `Pending`, `In Progress`, or `Completed` |
| POST | `/api/projects` | Public | Submit `name`, `email`, `phone`, `projectName`, `description`; optionally `briefName` and `briefMediaId` |
| GET | `/api/projects` | Admin | List software project requests |
| POST | `/api/support/messages` | Public | Send `name`, `phone`, `text` |
| GET | `/api/support/messages?phone=...` | Admin | List support messages, optionally for one phone |
| POST | `/api/support/messages/:phone/reply` | Admin | Send a reply with `text` |

The API persists data in MySQL. On first startup, it seeds the 36 default bundle offers used by the website if the bundle catalog is empty. The Data Bundles page reads prices from this catalog, and the admin bundle editor creates, updates, and deletes shared catalog records through the API. The frontend uses `http://localhost:3000/api` by default; set `window.ZACKCONNECT_API_URL` before `script.js` when the API is hosted elsewhere.

Bundle checkout is not yet connected to a payment provider: clicking Pay does not charge a customer or create a paid order. The payment-reference and tracking controls on the page also need payment/order APIs and provider credentials before they can work. Uploaded file bytes are not stored by this API: project brief metadata can be submitted, but the existing browser-only IndexedDB media upload must be migrated to a server-side file store separately.
