# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Agroheal LEAP (`agroheal-mvp`) — a React/TypeScript/Supabase agriculture education and farm management SPA. Users subscribe to a yearly platform membership to access organic farming courses, a farm-slot marketplace with recurring billing, group farm accounting, and a referral system.

## Commands

Package manager is **yarn** (`packageManager: yarn@1.22.19` in package.json — the README says `npm`, but `yarn.lock` is the lockfile actually committed; use yarn).

```bash
yarn install          # install deps
yarn dev               # start dev server at http://localhost:5174 (HMR)
yarn build              # vite build (production bundle to dist/) — does NOT type-check first
yarn typecheck          # tsc -b — run this separately; build will not catch type errors
yarn lint                # eslint . (flat config: typescript-eslint + react-hooks + react-refresh)
yarn preview            # serve the production build locally
```

There is no test framework configured in this repo (no Jest/Vitest/Playwright/Cypress, no `*.test.*` files). Don't assume one exists.

Run `yarn typecheck` and `yarn lint` before considering frontend work done — CI-equivalent checks aren't wired into `yarn build`.

## Environment variables

Local `.env` (gitignored), consumed via `import.meta.env` and re-exported from `src/config/Index.ts`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PAYSTACK_PUBLIC_KEYS
VITE_FLUTTERWAVE_PUBLIC_KEY
```

Note: the README documents `VITE_PAYSTACK_KEYS` — the actual variable read in code (`src/config/Index.ts`) is `VITE_PAYSTACK_PUBLIC_KEYS`. Trust the code over the README on env var names.

Supabase Edge Functions need their own server-side secrets set via `supabase secrets set` (not in the frontend `.env`): `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`.

## Architecture

**Everything is client-side except Supabase.** There is no custom backend server — the React SPA talks directly to Supabase (Postgres + Auth + PostgREST) from the browser, and any privileged logic (payment verification, webhooks, cron-style jobs) lives in Supabase Edge Functions (Deno) under `supabase/functions/`.

### Routing (`src/main.tsx`)

Single `createBrowserRouter` tree with three branches:

1. **Public** — wrapped in `Layout` (`src/components/layout/Layout.tsx`, Header+Footer): `/`, `/about`, `/signin`, `/signup`, `/legal`, `/forgot-password`, `/reset-password`. Signup does not require email verification — `supabase.auth.signUp()` succeeds and the user is routed straight to `/dashboard`.
2. **Group farm** — `/:farmSlug` renders `FarmManagement` directly (no shared layout). Looks up a `farm_groups` row by `slug`, gates edit rights on `coordinator_id === auth.uid()`. This route is currently registered **twice** in `main.tsx` — harmless duplication but worth cleaning up if touching that file.
3. **Authenticated** — wrapped in `ProtectedRoute` (`src/routes/ProtectedRoutes.tsx`) + `DashboardLayout` (`src/components/layout/DashboardLayout.tsx`, sidebar nav):
   - `/subscribe` — only requires a session (no active subscription yet).
   - `/dashboard/*` — additionally wrapped in `RequireSubscription` (`src/page/website/dashboard/RequireSubscription.tsx`), which queries `subscriptions` for a row with `status === "active"` and `expires_at` in the future, else redirects to `/subscribe`.

Two-tier auth guarding: **session** (`ProtectedRoute` → `useAuth`, redirects to `/signin`) is separate from **entitlement** (`RequireSubscription`, redirects to `/subscribe`). New gated pages must be added under the `/dashboard` route's `children` to inherit both guards — adding a top-level route bypasses subscription gating.

`DashboardLayout`'s `navItems` array is the source of truth for the sidebar; a route can exist without a nav entry (e.g. `withdrawals` is routed-but-commented-out / hidden).

### Supabase Edge Functions (`supabase/functions/`)

Deployed independently via the Supabase CLI (`supabase functions deploy`), not part of the Vite build:

| Function | Purpose |
|---|---|
| `verify-payment` | Verifies a Paystack/Flutterwave **platform subscription** payment; upserts `subscriptions`, ensures `profiles` row, calls `increment_referral_earnings` RPC, logs to `payment_logs`. |
| `verify-slot-payment` | Verifies a **farm slot** payment; updates `checkout`, inserts `slot_subscriptions`/`payment_logs`; uses `try_acquire_lock`/`release_lock` RPCs around the Flutterwave path for concurrency safety. |
| `paystack-webhook` | HMAC-validated Paystack webhook — `charge.success`/`charge.failed` for subscriptions, `transfer.success`/`transfer.failed` for `withdrawals`. |
| `monthly-slot-payment` | Webhook handler for recurring slot payments (references prefixed `SLOT_`). |
| `process-monthly-payments` | Cron-style job that suspends overdue `slot_subscriptions`. |
| `get-user-email-by-id`, `get-user-id-by-email` | Lookup helpers backed by SQL functions in `supabase/sql/`. |
| `withdrawals` | Withdrawal-related processing (frontend route for this is currently commented out/hidden). |

Payments always go through server-side verification in an Edge Function — never trust a client-reported payment status.

### Payments

Both **Paystack** and **Flutterwave** SDKs are loaded as `<script>` tags in `index.html` (not npm packages) and used for both platform subscriptions and farm-slot checkout. Client code initiates the charge; the corresponding Edge Function verifies it server-side before any database state changes.

### Auth

`src/hooks/useAuth.ts` wraps `supabase.auth.getSession()` + `onAuthStateChange` into `{ session, loading }`. This is the single source of truth for auth state — don't call `supabase.auth.getSession()` ad hoc in components that need reactive session state.

### UI layer

- `src/components/ui/` — shadcn/ui primitives (new-york style, see `components.json`), built on Radix UI. Path aliases (`@/components`, `@/lib`, `@/hooks`, `@/lib/utils`) are defined there and mirrored in `vite.config.ts`'s `@` → `./src` alias.
- Chakra UI (`@chakra-ui/react`) is also a dependency, used sparingly alongside shadcn (e.g. `Spinner`) — don't assume the whole UI layer is one system.
- Two toast systems coexist: shadcn's `use-toast`/`toast.tsx`/`toaster.tsx`, and a separate `showToast` (`src/components/ui/ToastComponent.tsx`) driven by `react-hot-toast`'s `<Toaster />`. Check which one a page already uses before adding toasts to it rather than mixing both.
- `src/components/webComponents/` — marketing/landing-page sections (Hero, FAQ, Testimonials, CTA, etc.), composed on `Home.tsx`.

### Data/content helpers

`src/helpers/` holds static, hand-authored content (course catalogue in `courses.ts`/`coursesDetails.ts`, dashboard/marketing copy) — these are not Supabase-backed; course content is not in the database.

### Group farm feature

`src/page/group-farm/` (`FarmManagement`, `FarmLogin`, `FarmRecords`) is a newer, semi-standalone feature accessed via the public `/:farmSlug` slug route rather than under `/dashboard`. Only `FarmManagement` is currently wired into the router. It operates on `farm_groups` and per-record farm data with hardcoded rate constants (`FARM_SETUP_RATE`, `FARM_SUPPORT_RATE`) — not fetched from config/DB.

### Observability

Sentry (`@sentry/react`) is initialized in `src/main.tsx` with browser tracing + session replay, DSN hardcoded inline (not env-based). Vercel Analytics (`<Analytics />`) is mounted alongside the router root.

### Deployment

Production (`agroheal.solutions`) is actually served from **Render** (confirmed via the `rndr-id` response header), behind Cloudflare — not Vercel, despite the repo also containing a `vercel.json` (present but apparently unused by the current deployment; treat it as stale unless you confirm otherwise).

Render's static-site hosting does **not** read a `public/_redirects` file (that's a Netlify convention — confirmed by testing: it gets served back as a literal downloadable file, not consumed as routing config). SPA fallback is currently active via a **Rewrite rule configured directly in the Render dashboard** for this service (Settings → Redirects/Rewrites: source `/*` → destination `/index.html` → type **Rewrite**, not Redirect — Redirect would change the browser's URL to `/index.html` and break client-side routing, which is what happened before the type was corrected). Verified working: direct-loading `/signup?ref=CODE` and other client-side routes now returns the real `index.html` shell (HTTP 200) instead of a 404, and legitimate static assets are unaffected. A `render.yaml` also exists at the repo root with the equivalent config as a version-controlled reference, but it's the dashboard rule that's confirmed active — treat `render.yaml` as unverified unless this service is confirmed to be Blueprint-synced.

## Critical Memory & Content Boundaries

- **NEVER ADD NEW CONTENT OR FEATURES WITHOUT EXPLICIT USER APPROVAL**: Do not invent, fabricate, or add dummy/speculative job postings, pricing packages, business copy, mockups, or new features without explicit user instruction. If details are not provided, ask the user or keep the UI in a clean, minimal neutral state (e.g. "not actively hiring", "contact us").
