# AgroHeal Admin Dashboard — Comprehensive Launch Edit Audit & Forensic Report

**Date**: October 4, 2026  
**Auditor**: Antigravity Assistant  
**Target Environments**:  
- **Admin App**: `agroheal-fe/apps/admin` (Vite + React + Tailwind + Radix UI)  
- **Admin Backend**: `agroheal-server/src/routes/v1/admin.routes.ts` & modules  
- **Authoritative Database**: Supabase PostgreSQL Production (`ptowfacejneezksyhntk`)  
- **Audit Mandate**: Forensic review of all pages, data sources, rendering pipelines, database queries, and ledger integrity. **Findings and architectural remediation only — no code modifications until approved.**

---

## 1. Executive Summary & High-Impact Critical Findings

A exhaustive audit across all 11 admin pages, data hooks, client API clients, backend Express admin endpoints, and the live production database (`ptowfacejneezksyhntk`) revealed **six fundamental architectural disconnects** that prevent the Admin Dashboard from functioning accurately in a live production launch:

| # | Severity | Component / Area | Critical Finding Summary |
|---|---|---|---|
| **1** | **CRITICAL** | **Courses & Academy** (`CoursesAdminPage.tsx`) | The page hardcodes **4 dummy placeholder courses** with inactive buttons. The live web application (`apps/web/src/helpers/courses.ts`) has **24 fully published agricultural masterclasses** with real video curricula and lesson modules that are completely missing from the admin interface. |
| **2** | **CRITICAL** | **Backend Admin Stats & Treasury** (`admin.routes.ts`) | `GET /api/v1/admin/stats` and `GET /api/v1/admin/treasury-audit` execute `supabaseAdmin.from("subscriptions").select("slots")`. The `subscriptions` table **has no `slots` column** (slots reside in `slot_subscriptions`). This causes both endpoints to throw HTTP 500 errors, forcing the Treasury page to display **₦0 Gross Inflows** and **₦0 Payouts**. |
| **3** | **CRITICAL** | **Payments & Inflows Log** (`PaymentsPage.tsx`, `useAdminMembers.ts`) | Admin transaction logs query `other_payments` and `slot_subscriptions`. The `other_payments` table was abandoned on **September 27, 2026**. All live payments since September 28 and all 73 paid checkout transactions in October reside in `transactions`. Because `transactions` is never queried, **all online ₦2,000 Green Card purchases and combo orders are completely invisible** in the Admin Transactions table. |
| **4** | **CRITICAL** | **Leaderboard & Ranks** (`LeaderboardPage.tsx`, `useAdminMembers.ts`) | In `useAdminMembers.ts`, `m.referred_by` (UUID) is overwritten with the referrer's `full_name`. In `LeaderboardPage.tsx`, referral lookup matches against `m.id` (UUID). Because names never match UUIDs, **every single member on the platform calculates 0 direct referrals**, causing the Leaderboard and Leadership Pool qualifications to render empty or zeroed out. |
| **5** | **CRITICAL** | **Farm Production & Cycles** (`FarmAssignmentsPage.tsx`, `cycles.controller.ts`) | The "Production & Harvest Cycles" tab and Express backend routes query `farm_cycles`. **The `farm_cycles` (and `harvest_cycles`) table does NOT exist in the production database**. Loading or drafting a harvest cycle throws a PostgreSQL relation error. |
| **6** | **CRITICAL** | **Financial Ledger Violations in Manual Actions** (`adminActions.ts`, `CoreDriversPage.tsx`) | Manual slot crediting in `adminActions.ts` inserts legacy ₦1,000/₦3,500/₦500 splits into `other_payments` and **fails to write statutory 10% sponsor referral bonuses and ₦50 Core Driver distributions into `wallet_ledger`**. The payout button in `CoreDriversPage.tsx` inserts raw DEBIT records into `wallet_ledger` without `reference_id`, without `balance_after`, without updating `profiles.wallet_balance`, and without creating a `withdrawals` record. |

---

## 2. Page-by-Page Forensic Audit

---

### Page 1: Academy & CMS (`CoursesAdminPage.tsx`)
- **Route**: `/courses`
- **File**: [`agroheal-fe/apps/admin/src/pages/CoursesAdminPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/CoursesAdminPage.tsx)
- **Current Data Source**: Hardcoded local constant `INITIAL_COURSES` containing 4 entries.
- **Will It Show?**: Yes, but it displays **completely fake mock data** that has no connection to the real system.
- **Detailed Findings**:
  1. **Only 4 Dummy Courses**: Lists "Commercial Mushroom Cultivation Masterclass", "Ginger & Spices Processing Blueprint", "Organic Food Security & Soil Ecology", and "LEAP Cluster Farming & Farm Group Leadership".
  2. **Authoritative Source of Truth Has 24 Courses**: In `apps/web/src/helpers/courses.ts` and `apps/web/src/helpers/coursesDetails.ts`, there are **24 real agricultural masterclasses** with real video IDs and practical modules:
     - 100-Day Container Garden Challenge
     - Introduction to Organic Farming
     - Biofertilizers Production
     - Composting
     - Black Soldier Fly Larvae
     - Organic Fertilizer Production
     - Biochar Production
     - Organic Pesticide Production
     - Organic Garden Practicals
     - Mushroom Farming
     - Tomato Farming
     - Ugu Farming
     - Pepper Farming
     - Shoko, Tete and Ewedu Farming
     - Maize Farming
     - Cucumber Farming
     - Watermelon Farming
     - Broiler Chicken Farming
     - Sweet Potato Farming
     - Yam Farming
     - Cassava Farming
     - Beans Farming
     - Soybeans Farming
     - Ginger and Pepper Webinar
  3. **Broken Actions**:
     - "Create New Course" button has no `onClick` handler (dead UI).
     - "Edit Modules" button has no `onClick` handler (dead UI).
     - "Preview" button opens `https://agroheal.solutions/dashboard/courses/${c.slug}`, but the mock slugs (`c.slug`) don't match web routes and produce 404 errors.
  4. **Enrolled Members Metric**: Hardcoded numbers (`245`, `118`, `84`, `35`) instead of real active Green Card holders from the database.
- **Required Launch Fix**:
  - Re-export `COURSESDATA` from `@shared` or import directly from `helpers/courses.ts`.
  - Render all 24 authoritative courses categorized by sector (Bio-Inputs, Vegetables, Tubers, Grains, Fungi, Poultry, Challenges).
  - Calculate real enrolled members dynamically (total active Green Card members who have access: 565 members).
  - Wire the preview button to the correct member course slug route (`/dashboard/courses/:slug`).

---

### Page 2: Executive Dashboard (`DashboardPage.tsx`)
- **Route**: `/`
- **File**: [`agroheal-fe/apps/admin/src/pages/DashboardPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/DashboardPage.tsx)
- **Current Data Source**:
  - Primary: `adminApiClient.admin.getStats()` -> Express `GET /api/v1/admin/stats`
  - Fallback: Local calculations from `useAdminMembers()`
- **Will It Show?**: The cards show data, but **the backend API call fails on every single load**, forcing a fallback to client-side heuristics.
- **Detailed Findings**:
  1. **Backend Query Bug**: In `agroheal-server/src/routes/v1/admin.routes.ts` (line 211):
     ```ts
     supabaseAdmin.from("subscriptions").select("slots")
     ```
     In Postgres, `subscriptions` only has: `[id, user_id, plan, status, started_at, expires_at, created_at, updated_at]`. The query throws PostgreSQL error `42703 (column subscriptions.slots does not exist)`.
  2. **Active Slots Under-Count**: In client fallback, `activeSlots` sums `paymentLogs` where `type === 'slot_subscription'`. It misses any slots provisioned in combo purchases or manual activations that weren't mirrored in `slot_subscriptions`.
  3. **Green Card Holders Metric**: `members.filter(m => m.has_green_card).length` uses flawed `has_green_card` logic from `useAdminMembers.ts` (which ignores 518 members whose IDs start with `GC-`), showing inaccurate counts.
- **Required Launch Fix**:
  - Fix `admin.routes.ts` line 211 to query `supabaseAdmin.from("slot_subscriptions").select("slots").eq("status", "active")`.
  - Return true aggregate counts from `profiles` (`count where is_green_card_holder = true`).

---

### Page 3: Members Directory (`MembersPage.tsx` & `useAdminMembers.ts`)
- **Route**: `/members`
- **File**: [`agroheal-fe/apps/admin/src/pages/MembersPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/MembersPage.tsx)
- **Hook**: [`agroheal-fe/apps/admin/src/hooks/useAdminMembers.ts`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/hooks/useAdminMembers.ts)
- **Current Data Source**:
  - `supabase.rpc("get_admin_members")` (fallback to `supabase.from("profiles").select("*")`)
  - `supabase.from("slot_subscriptions").select("*")`
  - `supabase.from("other_payments").select("*")`
  - `supabase.from("subscriptions").select("*").eq("plan", "green_card")`
- **Will It Show?**: Yes, member cards and tables render, but **member status and referrer mapping are corrupt**.
- **Detailed Findings**:
  1. **The Green Card Detection Flaw (Line 96)**:
     ```ts
     const hasGreenCard = Boolean(userGreenCard || (p.member_id && p.member_id.startsWith("AGC-")));
     ```
     - In the live database:
       - Total profiles: 601
       - `is_green_card_holder = true`: **565 members**
       - `member_id` starting with `GC-`: **518 members**
       - `member_id` starting with `AGC-`: **47 members**
     - Legacy members registered with `GC-2026-XXXXX` whose row in `subscriptions` has an expired date or was provisioned directly in `profiles` are misclassified as **"Pending"** Green Card activation!
     - The check completely ignores `p.is_green_card_holder` and `p.has_greencard`.
  2. **Referrer Name Destruction Bug (Lines 129–132)**:
     ```ts
     const nameById = new Map(mappedMembers.map((m) => [m.id, m.full_name]));
     const membersWithReferrerNames = mappedMembers.map((m) =>
       m.referred_by ? { ...m, referred_by: nameById.get(m.referred_by) || "Unknown Referrer" } : m,
     );
     ```
     - This mutates `m.referred_by` from a UUID (or referral code) into a human name (e.g., "Taiwo Babalola").
     - Downstream consumers that expect an ID or referral code (such as `LeaderboardPage.tsx`) fail completely.
  3. **Excel Export (`handleExportExcel`)**:
     - Exports columns `Mushroom Village Slots`, `Gingertown Slots`, `Organic FoodNation Slots`.
     - Because `slot_subscriptions` has category casing variations ("Mushroom Village", "mushroom", "Mushroom Village Flagship"), the filter `p.category?.toLowerCase().includes("mushroom")` works partially, but missed categories default to 0.
- **Required Launch Fix**:
  - Update `hasGreenCard` detection in `useAdminMembers.ts` to:
    ```ts
    const hasGreenCard = Boolean(
      p.is_green_card_holder === true ||
      p.has_greencard === true ||
      userGreenCard ||
      (p.member_id && (p.member_id.startsWith("GC-") || p.member_id.startsWith("AGC-")))
    );
    ```
  - Preserve the raw `referred_by_id` on the `Member` object so ID lookups don't break, while exposing `referred_by_name` as a distinct display property.

---

### Page 4: Leaderboard & Ranks (`LeaderboardPage.tsx`)
- **Route**: `/leaderboard`
- **File**: [`agroheal-fe/apps/admin/src/pages/LeaderboardPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/LeaderboardPage.tsx)
- **Current Data Source**: `members` array from `useAdminMembers()`.
- **Will It Show?**: **NO — all members show 0 direct referrals**. The leaderboard is completely dead.
- **Detailed Findings**:
  1. **Referral Attribution Root Cause**:
     - `referralCounts` (lines 38–45) reads `ref = m.referred_by?.trim().toUpperCase()`.
     - Because `useAdminMembers.ts` replaced `referred_by` with the referrer's `full_name`, `ref` is "TAIWO BABALOLA".
     - `codeToId` only maps `referral_code` and `member_id` to `id` (UUID).
     - It does NOT map names to IDs.
     - So `sponsorId` remains "TAIWO BABALOLA".
     - `counts.set("TAIWO BABALOLA", count)` increments the name key.
     - Then line 53 checks `referralCounts.get(m.id)` where `m.id` is a UUID (`0459d8be-eccd-...`).
     - `referralCounts.get(UUID)` is ALWAYS `undefined` (0)!
  2. **Cascading Failures**:
     - "Top Referrer" widget displays "None (0)".
     - "Qualified Leaders (>= 5 referrals)" displays 0.
     - Sorting by "Most Direct Referrals" or "Leadership Pool" has zero effect.
- **Required Launch Fix**:
  - Use `raw_referred_by` (UUID) or `referral_code` directly from profile records to build the graph:
    `sponsorId = codeToId.get(m.raw_referred_by) || m.raw_referred_by;`
  - Populate both `m.id`, `m.referral_code`, and `m.member_id` in the lookup map.

---

### Page 5: Farm Operations & Harvest Management (`FarmAssignmentsPage.tsx`)
- **Route**: `/farm-assignments`
- **File**: [`agroheal-fe/apps/admin/src/pages/FarmAssignmentsPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/FarmAssignmentsPage.tsx)
- **Current Data Source**:
  - Tab 1 (Cycles): `supabase.from("farm_cycles").select("*")` & `adminApiClient.cycles.*`
  - Tab 2 (Gaps): `useFarmAssignmentGaps.ts` (`farm_records` vs `slot_subscriptions`)
- **Will It Show?**:
  - Tab 1: **FAILS WITH POSTGRES ERROR**.
  - Tab 2: Renders gaps, but farm assignment mutations use obsolete fee splits.
- **Detailed Findings**:
  1. **Missing `farm_cycles` Table**:
     - Production Postgres table check confirmed: **`farm_cycles` DOES NOT EXIST**.
     - Loading Tab 1 issues `SELECT * FROM farm_cycles` which fails.
     - Clicking "Draft Harvest Yield" calls Express `POST /api/v1/cycles/draft` which tries to insert into `farm_cycles` and throws HTTP 500.
  2. **Cluster Mismatch**:
     - `AUTHORITATIVE_CLUSTERS` lists 6 hardcoded items: `OY-MUSH-01` (Mushroom Village 1), `OG-POTA-01`, `KD-GING-01`, `OG-CASS-01`, `OS-MAIZ-01`, `EN-VEGE-01`.
     - In the database, `farm_groups` contains 9 physical groups with coordinators (`pioneers`, `sustenance`, `goshen`, `favoured`, `pacesetters`, `alpha`, etc.).
  3. **Outdated Split Formula in `farmAssignment.ts`**:
     - Lines 71–72 write `months_farm_setup = String(newTotal * 3500)` and `months_farm_support = String(newTotal * 500)` instead of standard unified ₦5,000 slot pricing.
- **Required Launch Fix**:
  - Execute database migration to create `farm_cycles` table with Maker-Checker audit columns (`stage`, `yield_kg`, `gross_revenue`, `continuation_cost`, `distributable_balance`, `status`, `drafted_by`, `approved_by`).
  - Query real physical farm groups from `farm_groups` table instead of hardcoded clusters.

---

### Page 6: Transactions & Inflows Log (`PaymentsPage.tsx` & `PaymentsLogTable.tsx`)
- **Route**: `/payments`
- **File**: [`agroheal-fe/apps/admin/src/pages/PaymentsPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/PaymentsPage.tsx)
- **Current Data Source**: `paymentLogs` from `useAdminMembers()` (combining `slot_subscriptions` and `other_payments`).
- **Will It Show?**: It shows records, but **it is missing all online payments from the past 7 days**.
- **Detailed Findings**:
  1. **Abandoned `other_payments` Table**:
     - `other_payments` has 358 rows. The newest row in `other_payments` is dated **September 27, 2026**.
     - Since September 28, all live payments go into **`transactions`** (219 rows, 73 successful paid).
     - Because `useAdminMembers.ts` queries `other_payments` and never queries `transactions`, **no online Green Card payment made in October 2026 appears in the Admin Transactions table**.
  2. **RLS Blocker on `transactions`**:
     - Inspecting `pg_policies` on production database revealed:
       - Policy: `"Users can create own checkout"` (`INSERT` where `auth.uid() = user_id`)
       - Policy: `"Users can view own checkout"` (`SELECT` where `auth.uid() = user_id`)
       - **There is NO Admin RLS policy on `transactions`!**
     - If the admin client queries `supabase.from("transactions").select("*")`, Supabase returns only the admin's personal rows.
- **Required Launch Fix**:
  - Add Admin RLS policy:
    ```sql
    CREATE POLICY "Admins can view all transactions"
      ON public.transactions FOR SELECT
      USING (is_admin(auth.uid()));
    ```
  - Or add an admin backend endpoint `GET /api/v1/admin/transactions` that returns unified transactions with member details using `supabaseAdmin`.
  - Update `useAdminMembers.ts` to merge `transactions` into `paymentLogs`.

---

### Page 7: Treasury & Solvency (`TreasuryPage.tsx`)
- **Route**: `/treasury`
- **File**: [`agroheal-fe/apps/admin/src/pages/TreasuryPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/TreasuryPage.tsx)
- **Current Data Source**:
  - `adminApiClient.admin.getTreasuryAudit()` -> Express `GET /api/v1/admin/treasury-audit`
  - `adminApiClient.withdrawals.listWithdrawals()` -> Express `GET /api/v1/admin/withdrawals`
- **Will It Show?**: **FAILS — Balance Sheet displays ₦0 Gross Inflows and ₦0 Payouts**.
- **Detailed Findings**:
  1. **Backend Query Bug**: In `agroheal-server/src/routes/v1/admin.routes.ts` (line 244):
     ```ts
     supabaseAdmin.from("subscriptions").select("slots")
     ```
     Throws PostgreSQL error `42703 (column subscriptions.slots does not exist)`.
  2. **Client Fallback Result**:
     - `auditData` remains `null`.
     - Line 261 renders: `₦{(auditData?.totalInflows || 0).toLocaleString()}` -> **₦0**.
     - Line 287 renders: `₦{(auditData?.totalWithdrawnDisbursals || 0).toLocaleString()}` -> **₦0**.
  3. **Solvency Shield Works but has No Live Inflow Context**:
     - The LCR calculation in `treasury.service.ts` works when `liquidBankBalance` is input manually, but lacks the real inflow denominator because the audit payload fails to load.
- **Required Launch Fix**:
  - Fix `admin.routes.ts` line 244 to query `slot_subscriptions` for slots.
  - Query total successful inflow sum from `transactions` where `status IN ('paid', 'successful')`.

---

### Page 8: Core Drivers Pool (`CoreDriversPage.tsx`)
- **Route**: `/core-drivers`
- **File**: [`agroheal-fe/apps/admin/src/pages/CoreDriversPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/CoreDriversPage.tsx)
- **Current Data Source**: Local `STATIC_CORE_DRIVERS` array merged with `profiles` and `wallet_ledger` (category `CORE_DRIVER_BONUS`).
- **Will It Show?**: Yes, but it has **driver count discrepancy** and a **critical ledger mutation bug**.
- **Detailed Findings**:
  1. **7 Drivers vs 6 Authoritative Drivers**:
     - `CoreDriversPage.tsx` defines 7 drivers, including Nathaniel Omokanye (`gkygmr56@gmail.com`).
     - However, backend services (`member.service.ts`, `advance.service.ts`), test suites, and `AGENTS.md` Rule 4 explicitly define **strictly 6 Core Drivers** (Elijah, Esther, Taiwo, David, Fortune, Tony) sharing a ₦300 pool (6 × ₦50).
     - Adding a 7th driver with ₦50 share creates a ₦350 pool that leaks ₦50 per Green Card.
  2. **Corrupting Payout Handler (`handleTriggerPayout`)**:
     - Lines 236–245 insert a raw DEBIT into `wallet_ledger`:
       ```ts
       await supabase.from("wallet_ledger").insert([{
         user_id: selectedDriverForPayout.profileId,
         amount: payoutAmount,
         entry_type: "DEBIT",
         category: "WITHDRAWAL",
         status: "PENDING",
         description: `Core Driver Growth Bonus Payout to ${selectedDriverForPayout.name}`,
       }]);
       ```
     - **Missing Fields**: `reference_id` (violates deterministic reference rule), `balance_before`, `balance_after`.
     - **No Balance Sync**: It does NOT decrement `profiles.wallet_balance`.
     - **No Withdrawal Record**: It does NOT insert into `withdrawals` table, so the payout never reaches the bank disbursal queue on `TreasuryPage.tsx`!
- **Required Launch Fix**:
  - Align `STATIC_CORE_DRIVERS` to strictly match the 6 canonical drivers.
  - Route payouts through `withdrawals` table and the atomic ledger service, updating `wallet_balance` and setting a deterministic reference `CD-PAYOUT-<driverId>-<timestamp>`.

---

### Page 9: System Settings & Configs (`SettingsPage.tsx`)
- **Route**: `/settings`
- **File**: [`agroheal-fe/apps/admin/src/pages/SettingsPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/SettingsPage.tsx)
- **Subcomponents**:
  - `PlatformEconomicsEditor.tsx`
  - `NextStepModalConfigEditor.tsx`
  - `LegalDocEditor.tsx`
- **Current Data Source**: Express `/api/v1/admin/configs` and direct Supabase `system_configs` table.
- **Will It Show?**: Yes, works as expected.
- **Detailed Findings**:
  1. Table `system_configs` exists and has RLS policies enabling admins to modify it.
  2. In `NextStepModalConfigEditor.tsx`, the hardcoded fallback text contains legacy text ("₦2,000 One-Time Lifetime Membership" is correct, but check benefits wording for complete alignment with current packages).
  3. Support users are correctly locked in read-only mode (`isReadOnly = isSupport`).

---

### Page 10: Sign In & Authentication Guard (`LoginPage.tsx`, `useAdminAuth.ts`, `AdminProtectedRoute.tsx`)
- **Route**: `/signin`
- **File**: [`agroheal-fe/apps/admin/src/pages/LoginPage.tsx`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/admin/src/pages/LoginPage.tsx)
- **Current Data Source**: Supabase Auth + `profiles.role` check via `canAccessAdminPortal`.
- **Will It Show?**: Yes.
- **Detailed Findings**:
  1. Properly restricts access to authorized roles: `admin`, `super_admin`, `support`, `coordinator`, `reviewer`, and `developerelijah360@gmail.com`.
  2. Redirects authenticated admin users from `/signin` to `/`.
  3. Unauthenticated requests to protected admin routes redirect to `/signin`.

---

## 3. Database Schema & RLS Policy Gap Analysis

Direct audit against the production PostgreSQL instance (`ptowfacejneezksyhntk`):

| Database Object | Status in Prod | Impact on Admin Dashboard |
|---|---|---|
| `farm_cycles` / `harvest_cycles` | **MISSING** | `FarmAssignmentsPage.tsx` and `cycles.controller.ts` crash on load / draft. |
| `dividends` | **MISSING** | Dividend distributions from harvest waterfalls cannot persist. |
| `corporate_advance_ledger` | **MISSING** | Corporate advance sweeps cannot track member recovery. |
| `subscriptions.slots` column | **MISSING** (Column does not exist) | Backend `admin/stats` and `admin/treasury-audit` crash with 500 error. |
| `transactions` Admin RLS Policy | **MISSING** (Only user-self policy exists) | Direct Supabase queries from Admin frontend cannot read all platform transactions. |
| `withdrawals` Admin RLS Policy | **MISSING** (Only user-self policy exists) | Direct Supabase queries cannot read all withdrawals (mitigated by Express API). |
| `system_configs` | **EXISTS** (2 rows) | Works properly for platform economics and legal agreements. |

---

## 4. Financial Ledger Integrity Invariants (Rule 4 Compliance Audit)

Under **Rule 4 of `AGENTS.md`**, every manual credit must satisfy complete double-entry financial distributions:

1. **`creditSlots` in `adminActions.ts` (lines 345–390)**:
   - **Current Flaw**: When crediting slots offline, it inserts into `slot_subscriptions` and `other_payments`.
   - **Missing Distributions**:
     - Direct Sponsor 10% Referral Bonus (₦500 per slot) is **NOT** credited to `wallet_ledger`.
     - Core Drivers ₦50 bonus is **NOT** credited to `wallet_ledger`.
     - Solvency parity is broken between leased slots and ledger liabilities.
2. **`handleTriggerPayout` in `CoreDriversPage.tsx` (lines 235–255)**:
   - **Current Flaw**: Inserts a raw DEBIT into `wallet_ledger` without `reference_id`, without `balance_after`, without updating `profiles.wallet_balance`, and without creating a `withdrawals` record.
3. **`activateGreenCard` fallback in `adminActions.ts` (lines 566–602)**:
   - When the DB RPC is bypassed and the Edge Function is unreachable, the fallback inserts directly into `subscriptions` and `other_payments` without executing double-entry ledger distribution for the direct sponsor (₦1,000) or Core Drivers (6 × ₦50).

---

## 5. Prioritized Implementation Roadmap (To Be Executed Upon User Approval)

### Phase 1: Database Migration & RLS Security Gate
1. Create table `farm_cycles` on production database with all maker-checker columns (`farm_group_id`, `cycle_number`, `stage`, `gross_revenue`, `continuation_cost`, `distributable_balance`, `status`, `drafted_by`, `approved_by`).
2. Add Admin SELECT RLS policy on `public.transactions`:
   ```sql
   CREATE POLICY "Admins can view all transactions"
     ON public.transactions FOR SELECT
     USING (is_admin(auth.uid()));
   ```
3. Add Admin SELECT RLS policy on `public.withdrawals`.

### Phase 2: Backend Admin API Route Fixes (`agroheal-server`)
1. Fix `agroheal-server/src/routes/v1/admin.routes.ts`:
   - Replace `supabaseAdmin.from("subscriptions").select("slots")` with `supabaseAdmin.from("slot_subscriptions").select("slots").eq("status", "active")`.
   - In `treasury-audit`, compute gross platform inflows from `transactions` where `status IN ('paid', 'successful')`.
2. Add unified transactions endpoint `GET /api/v1/admin/transactions` with member profile joins, pagination, and status filters.

### Phase 3: Frontend Data Hook & State Synchronization (`agroheal-fe`)
1. **Fix `useAdminMembers.ts`**:
   - Update `hasGreenCard` detection to include `p.is_green_card_holder === true`, `p.has_greencard === true`, and `p.member_id.startsWith("GC-")`.
   - Preserve `raw_referred_by` (UUID) on the member object so downstream components do not receive string names.
   - Query both `slot_subscriptions` and `transactions` to construct the unified `paymentLogs` list.
2. **Fix `LeaderboardPage.tsx`**:
   - Update referral mapping logic to correctly match member UUIDs, restoring the Leaderboard and Top Referrer stats.
3. **Fix `CoursesAdminPage.tsx`**:
   - Replace 4 dummy courses with the **24 actual published courses** from `apps/web/src/helpers/courses.ts`.
   - Connect live lesson counts and real preview URLs.
4. **Fix `CoreDriversPage.tsx`**:
   - Align `STATIC_CORE_DRIVERS` to the strictly 6 authoritative drivers.
   - Replace raw ledger insert with atomic withdrawal disbursal flow.

---

## 6. Verification Protocol

Once implementation is approved:
1. `npm run typecheck` on `agroheal-server` must exit with 0 errors.
2. `npm run web:typecheck` and `npm run admin:typecheck` on `agroheal-fe` must exit with 0 errors.
3. All admin pages must load in browser with zero console errors or failed network requests.
4. Git push strictly gated until user explicitly gives the command "push".
