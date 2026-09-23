# AgroHeal Development & Enhancement TODO

## High Priority (Immediate / ASAP)
- [x] **Downloadable Digital Green Card (PDF / PNG & Apple/Google Wallet)**:
  - Added "Download Card" button and high-resolution 2400×1512 PNG canvas export on `/dashboard/profile/green-card` and `/verify-card/:memberId`.
  - Added scannable dynamic QR code, lifetime validity, member name, and AGC member ID.
  - Added mobile wallet pass modal support.

- [x] **Plug Course & Green Card Access Security Leaks**:
  - Updated `RequireSubscription.tsx` to strictly check `.eq("plan", "green_card")` and `.eq("status", "active")` with valid expiration date.
  - Fixed `Checkout.tsx` to stop auto-granting free Green Card subscriptions.
  - Restricted manual activations to authorized admin workflow.

- [x] **Overhaul & Elevate Digital Green Card (AGC) Graphic Design**:
  - Interactive 3D card tilt/perspective on mouse move, holographic glare, and smooth flip animation.
  - Verification badge, AGC identifier format, and live status.

- [x] **State Management Overhaul (Zustand Architecture)**:
  - Installed `zustand@^5.0.15` in `apps/web`.
  - Built unified reactive stores: `useUserStore.ts`, `useFarmStore.ts`, `useWalletStore.ts`.
  - Pruned redundant multi-table queries and page-reload workarounds across dashboard components.

- [x] **Strict Upload Constraints & Admin Offline Bank Transfer Verification**:
  - Uploads restricted strictly to `JPEG` (`.jpg`, `.jpeg`) and `PNG` (`.png`) with strict $\le 5\text{MB}$ size limit.
  - Provisioned `payment_receipts` bucket in Supabase storage.
  - Added Bank Reference, Payment Date, Receipt Upload, and Audit Notes to `SlotCreditorForm` and `IssueGreenCardDialog`.
  - Integrated `AdminAuditLogTable` into `PaymentsPage` querying native `audit_events`.

- [x] **Database Schema Fixes & Checkout Guard**:
  - Resolved `kin_details.kin_address` Not-Null violation by altering Postgres schema to `DEFAULT 'Not Provided'` on DEV & PROD.
  - Checkout form locks verified account email, auto-prefills `full_name` and `phone` from profile, and disables payment buttons until valid contact details are provided.

- [x] **Copy Rewrite Proposal**:
  - Documented complete side-by-side comparison in `docs/COPY_REWRITE_PROPOSAL.md` based on founder presentation deck. Awaiting final review before text extraction into `data/` folder.

- [ ] **Automated Multi-Channel Notification Engine (In-App Bell / SMS / WhatsApp / Email)**:
  - **Coordinator Slot Purchase Alerts**: Instant real-time alerts when a member purchases and is assigned slots in their farm cluster.
  - **Harvest Close & Dividend Payout Alerts**: Automated alerts to verified slot owners when a harvest cycle closes and funds post to wallets.
  - **MLM Commission & Spillover Alerts**: Push/SMS/Email notifications when direct bonuses or matrix commissions are earned.
  - **Treasury & Withdrawal Status Alerts**: Instant notifications when bank withdrawal requests are queued, approved by Solvency Shield, and disbursed.
  - **Monthly PQV Qualification Reminders**: Gentle nudge alerts before month-end for members nearing the ₦5,000 PQV threshold.

---

## Data Architecture & Category Separation Rule
> [!IMPORTANT]
> **Strict Category Isolation**:
> 1. All slot subscriptions (`slot_subscriptions`) and fee records (`other_payments`) MUST carry their explicit `project_category` (`Mushroom Village`, `Gingertown`, `Organic FoodNation`).
> 2. `farm_records` rows are keyed per member **AND** per `farm_id` (each linked to a specific `farm_groups` entry with its own `project_category`).
> 3. If a member holds slots across multiple programs (e.g. 240 Mushroom + 50 Ginger), they have separate, distinct rows per farm group and category. They are NEVER combined or jumbled into a generic total.
> 4. Payment Gateway is strictly **Flutterwave ONLY** (Paystack completely deprecated). Webhooks do not auto-insert into `farm_records`.

---

## Active Roadmap & Progression (Completed)
- [x] Integrate Intelligent "Stubborn" Next-Step Progression Modal (Green Card → Farm Slot → 5 Directs).
- [x] Matrix Directs + 1 level unlocking rule applied across all calculation & modal surfaces.
- [x] Admin Programmable Next-Step Modal Configuration via `system_configs`.
- [x] Unified Calculator / Simulation Shell across Producer Network and Consumer Network.
- [x] Sidebar Brand Header & integrated profile logout controls.
- [x] Multi-level 5×7 Producer Network and 3-Tier Consumer Network matrix logic.

---

## Future Architecture & Enhancements (TODO for Later)
- [ ] **Farm Production Cycle Transparency & Yield Statements (Member Dashboard)**:
  - Dynamically display detailed biological and financial cycle data on `FarmCycleTracker.tsx` / `MyFarmSlots.tsx` when an admin or coordinator updates a cycle's stage:
    - **Cultivation (`PLANNING` / `GROWING`)**: Render biological progress (planting start date, estimated harvest window, total cluster bags in production, and member's allocated bags at $2\times\text{slots}$).
    - **Harvest & Audit (`HARVESTING` / `AUDITING`)**: Render real-time cluster harvest metrics (actual total kg harvested, gross produce revenue, continuation cost deduction, and net distributable profit pool).
    - **Dividend Distribution (`DISTRIBUTED`)**: Render the member's exact 40% proportional dividend statement (dividend per slot, total payout amount, distribution date, and wallet credit status).

- [ ] **Transaction History & Ledger Parity for Farm Contributions**:
  - In `TransactionLedger.tsx`, display the month count and coverage breakdown (`p.months`) alongside `farm_setup`, `farm_support`, and `absentee_fine` contributions.
  - Bridge historical contributions from `farm_records` (`months_farm_setup`, `months_farm_support`, `absentee_fine`) into the unified wallet transaction ledger so pre-web historical payments are visible to members in their transaction history.

- [ ] **Group Farm Assignment Mechanism: Dynamic Auto-Assign Resolver vs. Farm Group Embedded in Referral URL**:
  - **Option A (Dynamic Auto-Assign Resolver)**:
    - When a new member purchases a farm slot, the backend resolver checks the sponsor's group farm and assigns the member to the sponsor's first unfilled/unmaxed cluster (up to the 1,000-slot cap).
    - If the sponsor's current farm cluster is full (1,000 slots), automatically roll over and allocate into the next active cluster within the same community or region.
  - **Option B (Farm Group Embedded in Referral URL)**:
    - Enable farm-specific referral links (e.g., `https://agroheal.org/signup?ref=CODE&farm=sustenance-mushroom` or `https://agroheal.org/farm/:farmSlug?ref=CODE`).
    - Explicitly locks the invited member into that specific farm group upon registration and slot checkout, eliminating ambiguity for community leaders.
  - **Hybrid Resolution Strategy**:
    - If `farm` query parameter exists in the signup/checkout URL, bind directly to that specific farm group (Option B).
    - If `farm` parameter is omitted, fall back to the dynamic auto-assignment resolver following the sponsor's lineage (Option A).


