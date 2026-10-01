# AgroHeal Development & Enhancement TODO

## High Priority (Immediate / ASAP)
- [ ] **Custom SMTP & Reliable Transactional Email Delivery (Top Priority)**:
  - **Custom SMTP Provider Setup**: Configure dedicated transactional email infrastructure (Resend, SendGrid, AWS SES, or custom SMTP) to eliminate Supabase default rate-limits (3-4 emails/hour restriction) and deliver emails from verified domain `@agroheal.com` / `@agroheal.ng`.
  - **Essential Automated Email Triggers**:
    - **Authentication**: High-deliverability signup verification, welcome email, and password recovery with direct magic tokens.
    - **Green Card Activation**: Instant branded congratulations receipt with Digital AGC Member ID, QR code, and personal referral link.
    - **Slot Purchase Receipts**: Immediate transaction receipt for online Flutterwave and offline admin approvals with project category and slot count.
    - **Farm Operations & Harvests**: Notifications to members when assigned to a farm cluster and when harvest dividends post to their wallets.
    - **Coordinator Alerts**: Instant notification to cluster coordinators when a new member is assigned to their farm group.
  - **Delivery Logging & Fallbacks**: Log delivery status to `audit_events` or notification tables; integrate In-App bell notification fallback.

- [x] **Tiered Green Card Pricing (₦1,000 Legacy vs. ₦2,000 Post-Sept 6 Accounts)**:
  - Added business rules `LEGACY_GREEN_CARD_FEE = 1000`, `GREEN_CARD_FEE = 2000`, and `LEGACY_CUTOFF_DATE = "2026-09-06T00:00:00.000Z"`.
  - Updated `isLegacyMember` and `getGreenCardFee` helpers in `@shared/businessRules` and re-exported in `@/lib/pricing`.
  - Web frontend dynamically checks registration date: passes ₦1,000 (legacy) or ₦2,000 (standard) to Flutterwave checkout, displays dynamic badges in `Subscribe.tsx`, `Checkout.tsx`, `NextStepModal.tsx`, `JourneyProgressionHeader.tsx`, and `Dashboard.tsx`.
  - Applied SQL migration `legacy_pricing_and_audit_trail.sql` to both **PROD** and **DEV** Supabase databases: `admin_activate_green_card` RPC dynamically checks `profiles.created_at`, records fee in `other_payments.metadata`, and writes to `audit_events`.

- [x] **Complete Administrative Audit Trail & Elimination of 1-Click Bypass**:
  - Removed unverified 1-click `[Issue]` bypass buttons from `MemberTable.tsx`, `MemberCard.tsx`, and `EditMemberDialog.tsx`.
  - Mandatory offline payment proof enforced: admins must use `IssueGreenCardDialog` requiring bank reference / NIP Session ID or uploaded receipt image.
  - Implemented centralized `recordAuditEvent` helper in `adminActions.ts` logging authorizing admin ID, email, role, full name, timestamp, and user agent.
  - Auditing active across: `activateGreenCard`, `creditSlots`, `createMember`, `updateMember` (with before/after diff), `resetPassword`, `updateConfig`, and `assignSlotsToFarmGroup`.
  - Upgraded `AdminAuditLogTable.tsx` with filter tabs (`All Events`, `💳 Green Cards`, `🌱 Slot Credits`, `👤 Member Accounts`, `🚜 Operations & Config`), rate tier tags (`₦1,000 • Legacy` vs `₦2,000 • Standard`), in-app receipt modal, and Excel export.

- [x] **Combined Onboarding Prompt (Green Card + Farm Slot Fast-Track)**:
  - Updated `NextStepModal.tsx` and `Subscribe.tsx` with toggle to optionally add 1 Farm Slot (₦5,000) at the time of Green Card registration.
  - Dynamically calculates bundled checkout (₦6,000 for legacy vs. ₦7,000 for new members) so users with budget can complete both steps simultaneously.

- [x] **Core Driver Growth Bonus Reversal & Database Calibration**:
  - Successfully reversed the unverified September offline activation bonuses (₦250 deducted across 35 ledger records) on PROD DB.
  - Reconciled core driver wallet balances; drivers retain only genuine referral earnings and historical balances.
  - Created auth account for the 7th driver (`gkygmr56@gmail.com` / Nathaniel Omokanye) to ensure clean distribution.

- [ ] **Custom SMTP & Reliable Transactional Email Delivery (Top Priority)**:

- [x] **Farm Coordinator Role Permissions & Isolation**:
  - Farm Coordinators strictly prohibited from assigning slots; slot allocation is exclusively reserved for Platform Administrators.
  - Coordinators empowered to log daily farm expenses and produce harvest sales revenue (`farm_sales`).

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
  - **Monthly PQV Qualification Reminders**: Gentle nudge alerts before month-end for members nearing the ₦10,000 PQV threshold.

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
- [x] **Founding Legacy Balances Justification, Reusable Pagination & Unified Checkout Flow (COMPLETED)**:
  - **Free Founding Green Card Status**: Verified all 35 founding members hold lifetime Green Card status without registration fee.
  - **Preserved Founding Balances**: Historical referral earnings and slot bonuses preserved in the immutable Founding Vault (`FOUNDING-REF-ARCHIVE` and `FOUNDING-SLOT-ARCHIVE`).
  - **Matrix & Withdrawal Unlock Rule**: Enforced compulsory Mushroom Power 100g (₦5,000) activation + 1 Farm Slot (₦5,000) subscription for legacy members to access automated matrix tree spillovers and bank withdrawals.
  - **Reusable Pagination Engine**: Built `DataPagination` component in `apps/web/src/components/ui/pagination.tsx` and paginated `TransactionLedger.tsx` at 10 items per page with responsive page links and item counter.
  - **Bundle Itemization & Farm Name Deduplication**: Refactored ₦10k (Free GC), ₦11k (Legacy GC), and ₦12k (Standard GC) transactions to display explicit package contents and cleaned duplicated `"Mushroom Farm, Mushroom Farm"` descriptions.
  - **Production Day 1 Crop Stage**: Reset all 6 farm cycles on production database to `stage = 'PLANNING'` with zero yield and zero false harvest distributions.
  - **Unified Webhook Financial Engine**: Automated Green Card activation, sequential AGC member ID assignment, ₦1,000 sponsor referral bounty, 6 Core Drivers growth pool (₦50 × 6 = ₦300), ₦500 slot bonus, and 40% product commission distribution in `webhooks.controller.ts`.
- [x] **Universal 5×7 Organogram, Aerial View & Production Settlement (COMPLETED)**:
  - **Universal Matrix Organogram**: Organized 552 active profiles into the 5×7 community tree under Esther Adetayo as Apex Root (Depth 0) with direct legs and downstream tree linkage. Pacesetters Farm designated as default/fallback farm group.
  - **Fullscreen Level 1 Default & Aerial View Canvas**: Initialized fullscreen level boundaries to Level 1 to Level 1 (`1` to `1`). Interactive drill-down (Root + 5 legs) maintained as default. Added "Aerial View" panoramic multi-tier canvas displaying all downline nodes across chosen levels with zoom (`40%`–`180%`) and horizontal panning.
  - **Overview Quick-Checkout Tile #1 Inverse Contrast**: Converted tile #1 into a high-contrast filled emerald/forest container with gold/amber badges and icons, white metric values, and prominent action buttons.
  - **Dynamic Network Action Heading**: Replaced hardcoded prompt with member-aware messaging (prompting legacy members without Mushroom Power to activate for ₦5,000).
  - **Wallet Payment Deactivation**: Commented out wallet balance payment in `Checkout.tsx` and locked `canSubscribeWithWallet = false` in `TransactionLedger.tsx`.
  - **Kabiru Samaila (Tx #337) Production Settlement**: Reconciled payment reference `090405260930115509805004909080` (Transaction ID `SLOT_337_1790765447617`). Transaction 337 marked paid for ₦12,000 Combo, Member ID `GC-2026-02546` assigned, active Green Card provisioned, Pacesetters Mushroom Village slot and Mushroom Power 100g order created. Complete double-entry ledger distributions credited to sponsor Taiwo (₦1,000 referral + ₦500 slot) and all 6 Core Drivers (₦50 each).
  - **Live vs. Legacy Wallet Ledger Isolation**: Isolated `/api/v1/wallet/summary` to strictly tally live double-entry `wallet_ledger` credits, ensuring Esther Bola's live wallet reads exactly ₦2,700 while preserving historical ₦12,000 referral earnings in the legacy Founding Vault. Restricted "Wallet Ledger" vs. "Orders & Receipts" sub-tabs to Live mode.
  - **Strict Content & Copy Fidelity Enshrined**: Added Rule 5 to `AGENTS.md` strictly prohibiting unsolicited marketing copy, invented text, or unauthorized business rules.
- [x] **Continuous Connected Matrix Branches & Farm Slot Deduplication (COMPLETED)**:
  - **Seamless Touching Matrix Tree Branches**: Built recursive `MatrixTreeNode` rendering continuous, connected CSS crossbars (50% left-arm / 50% right-arm) and vertical drop stems that seamlessly join parent and child nodes across all downline levels without pixel gaps at any zoom level or resolution. Available across both the Fullscreen Panoramic Canvas and Dashboard Organogram embed.
  - **Farm Cluster Rollup & Deduplication**: Grouped slot subscriptions by `farm_id` in `useFarmStore.ts` with aggregated `slots_held` and `fruiting_bags`. Reconciled Esther Adetayo's allocations across Gingertown (2 slots) and Mushroom Village (1 slot), eliminating duplicate farm cards and double-counted metrics.


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
    - Enable farm-specific referral links (e.g., `https://agroheal.solutions/signup?ref=CODE&farm=sustenance-mushroom` or `https://agroheal.solutions/farm/:farmSlug?ref=CODE`).
    - Explicitly locks the invited member into that specific farm group upon registration and slot checkout, eliminating ambiguity for community leaders.
  - **Hybrid Resolution Strategy**:
    - If `farm` query parameter exists in the signup/checkout URL, bind directly to that specific farm group (Option B).
    - If `farm` parameter is omitted, fall back to the dynamic auto-assignment resolver following the sponsor's lineage (Option A).


