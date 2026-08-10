# Split — Cloudflare & Local Development Guide

This guide covers running Split locally during development and deploying to **Cloudflare Workers** (backend API) and **Cloudflare Pages** (frontend).

---

## Local Development

### Prerequisites

- **Node.js** v18+ and npm
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- Wrangler CLI installed (`npm install -g wrangler` or use `npx wrangler`)

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url> split
cd split
npm install            # installs root concurrently
npm run install:all    # installs backend + frontend dependencies
```

### 2. Backend Setup

```bash
cd backend

# Log into Cloudflare (one-time)
npx wrangler login

# Create a local D1 database (one-time)
npx wrangler d1 create split-db
# Copy the returned database_id into wrangler.toml

# Apply the database schema to the local D1
npm run db:local

# Set a JWT secret for local dev
# Edit wrangler.toml → replace the empty JWT_SECRET with a random string, e.g.:
# JWT_SECRET = "dev-secret-change-in-production"

# Start the backend dev server
npm run dev
# → Runs at http://localhost:8787
```

### 3. Frontend Setup

```bash
# In a separate terminal
cd frontend

# (Optional) Set API URL — defaults to http://localhost:8787
# Create frontend/.env.local if you need a different port:
#   NEXT_PUBLIC_API_URL=http://localhost:8787

npm run dev
# → Runs at http://localhost:3000
```

### 4. Run Both Together

From the project root:

```bash
npm run dev
```

This uses `concurrently` to start both servers in parallel.

### 5. First Admin User

1. Open **http://localhost:3000**
2. Register a new account — the **first registered user** is automatically:
   - Set as admin (`is_admin = 1`)
   - Auto-approved (`is_approved = 1`)
3. All subsequent registrations must be approved by this admin via the **Admin** tab

### 6. Testing the API Directly

```bash
# Register
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"secret123"}'

# Login (saves auth_token cookie to cookies.txt)
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"secret123"}' \
  -c cookies.txt

# Get dashboard (with auth cookie)
curl http://localhost:8787/api/users/me/dashboard -b cookies.txt
```

### 7. Helpful Local Dev Commands

```bash
cd backend

# Reset the local database
npx wrangler d1 execute split-db --local --command="DELETE FROM Friends; DELETE FROM ExpenseTags; DELETE FROM ExpenseSplits; DELETE FROM Expenses; DELETE FROM Tags; DELETE FROM Users;"

# Re-apply schema after reset
npm run db:local

# Inspect local D1 data
npx wrangler d1 execute split-db --local --command="SELECT * FROM Users;"

# Watch Worker logs
npx wrangler tail
```

---

## Architecture

```
┌──────────────────────────────┐     ┌──────────────────────────────┐
│       Cloudflare Pages       │     │     Cloudflare Workers        │
│  (Next.js static export)     │ ──► │  (Hono.js API on edge)        │
│  split.pages.dev             │     │  split-api.username.workers.dev│
└──────────────────────────────┘     └──────────────┬───────────────┘
                                                    │
                                          ┌─────────▼───────────┐
                                          │   Cloudflare D1      │
                                          │   (Serverless SQLite)│
                                          └─────────────────────┘
```

---

## 1. Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- Node.js v18+ and npm installed locally
- Wrangler CLI authenticated: `npx wrangler login`

---

## 2. Deploy the Backend (Cloudflare Workers + D1)

### 2.1 Create the D1 Database

```bash
cd backend
npx wrangler d1 create split-db
```

The command outputs a `database_id`. Copy it and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "split-db"
database_id = "abc123-def456-..."   # ← paste the ID here
```

### 2.2 Apply the Database Schema (Remote)

```bash
npm run db:remote
```

This runs `migrations/001_initial.sql` against your **production** D1 database, creating all tables (Users, Friends, Expenses, ExpenseSplits, Tags, ExpenseTags).

### 2.3 Set Environment Variables

Generate a strong random JWT secret and set it as a **secret** (not in `wrangler.toml` for production):

```bash
# Generate a random 64-character hex secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set it as a Cloudflare secret
npx wrangler secret put JWT_SECRET
# Paste the generated value when prompted
```

> **Why a secret?** `wrangler secret put` encrypts the value and stores it securely on Cloudflare's edge. The `JWT_SECRET` in `wrangler.toml` with `""` is only used for local development — for production, the Workers runtime will prefer the secret over the `vars` entry if both exist.

### 2.4 Deploy the Worker

```bash
npx wrangler deploy
```

You should see output like:

```
✨ Deployed split-api (xx seconds)
https://split-api.your-username.workers.dev
```

Note the URL — you'll need it for the frontend.

### 2.5 Set CORS_ORIGIN

Update `CORS_ORIGIN` in `wrangler.toml` to match your Pages URL, then redeploy:

```toml
[vars]
JWT_SECRET = ""                              # overridden by wrangler secret
CORS_ORIGIN = "https://split.pages.dev"       # ← your Pages URL
```

```bash
npx wrangler deploy
```

Alternatively, set it as a secret:

```bash
npx wrangler secret put CORS_ORIGIN
# Enter: https://split.pages.dev
```

---

## 3. Deploy the Frontend (Cloudflare Pages)

### 3.1 Set the API URL

Create a `.env.local` in the frontend folder:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://split-api.your-username.workers.dev
```

> This tells the frontend where to find your deployed API. Without this, the default fallback is `http://localhost:8787` (which only works locally).

### 3.2 Build the Static Export

```bash
cd frontend
npm run build
```

This produces a static site in `frontend/out/`.

### 3.3 Deploy to Cloudflare Pages

**Option A — Via Wrangler:**

```bash
npx wrangler pages deploy out --project-name=split
```

Follow the prompts. The first run will create the Pages project.

**Option B — Via Cloudflare Dashboard:**

1. Go to **Workers & Pages** → **Pages** → **Create a project**
2. Connect your Git repository (GitHub/GitLab) or upload the `out/` folder manually
3. Set the build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Environment variable:** `NEXT_PUBLIC_API_URL` = `https://split-api.your-username.workers.dev`
4. Deploy

After deployment, your site is live at `https://split.pages.dev` (or your custom domain).

### 3.4 Update CORS (if needed)

If your Pages custom domain differs from the default, redeploy the backend with the updated `CORS_ORIGIN`.

---

## 4. Post-Deployment: First Admin

1. Open your deployed frontend URL
2. **Register** the first account — it's automatically granted admin and auto-approved
3. All subsequent registrations will require this admin to approve them via the **Admin** tab

---

## 5. Environment Variable Reference

| Variable              | Where                             | Purpose                                         |
| --------------------- | --------------------------------- | ----------------------------------------------- |
| `JWT_SECRET`          | Backend (wrangler secret)         | HS256 signing key for JWTs. Keep secret!        |
| `CORS_ORIGIN`         | Backend (wrangler.toml or secret) | Allowed origin for CORS. Set to your Pages URL. |
| `NEXT_PUBLIC_API_URL` | Frontend (.env.local)             | URL of the deployed Worker API.                 |

---

## 6. Quick Commands Reference

| Task                      | Command (run from `backend/`)         |
| ------------------------- | ------------------------------------- |
| Login to Cloudflare       | `npx wrangler login`                  |
| Create D1 database        | `npx wrangler d1 create split-db`     |
| Apply schema (local)      | `npm run db:local`                    |
| Apply schema (production) | `npm run db:remote`                   |
| Set a secret              | `npx wrangler secret put SECRET_NAME` |
| List secrets              | `npx wrangler secret list`            |
| Deploy worker             | `npx wrangler deploy`                 |
| Tail live logs            | `npx wrangler tail`                   |

---

## 7. Custom Domain (Optional)

**For the Worker:**

1. In Cloudflare Dashboard → **Workers & Pages** → `split-api` → **Triggers** → **Custom Domains**
2. Add a domain like `api.split.example.com`

**For Pages:**

1. In Cloudflare Dashboard → **Workers & Pages** → `split` → **Custom Domains**
2. Add a domain like `split.example.com`

After binding custom domains, update `CORS_ORIGIN` and `NEXT_PUBLIC_API_URL` accordingly and redeploy.

---

## 8. Troubleshooting

| Problem                      | Likely Fix                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| **Frontend can't reach API** | Check `NEXT_PUBLIC_API_URL` matches your Worker URL exactly (no trailing slash)       |
| **CORS errors in browser**   | Ensure `CORS_ORIGIN` in the backend matches the frontend origin                       |
| **401 Unauthorized**         | JWT_SECRET mismatch between local and deployed — ensure `wrangler secret put` was run |
| **Database errors**          | Run `npm run db:remote` to verify the schema was applied to the remote D1 database    |
| **Worker crashes on deploy** | Check `npx wrangler tail` for runtime errors in production                            |
