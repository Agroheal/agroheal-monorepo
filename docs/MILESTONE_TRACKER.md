# AGROHEAL GREEN CARD ECOSYSTEM — MILESTONE TRACKER (M1–M4)

This tracker maps 1-to-1 with the finalized agreement from the **Executive WhatsApp Alignment (Sept 4–6, 2026)**, **SOW v1.3**, **PRD v1.2**, and **SRS v1.2**.

---

### COMMERCIAL TERMS & PAYMENT SCHEDULE
- **Total Contract Value (Milestones 1–4):** ₦3,800,000.00
- **Upfront Mobilization:** ₦500,000.00 *(PAID: ₦350k on Sept 5 + ₦150k on Sept 6)*
- **Milestone 3 Completion & Acceptance:** ₦1,000,000.00 *(Brings cumulative to ₦1.5M)*
- **Milestone 4 Completion & Acceptance:** ₦2,300,000.00 *(Final balance)*
- **Core Driver Growth Bonus:** ₦50.00 per verified Green Card registration automatically accrued to Developer (Elijah).
- **Milestone 5 (Marketplace Expansion):** Explicitly excluded from this phase; separately scoped and priced.

---

---

### 📌 PENDING OPERATIONAL DIRECTIVES & FOUNDER ACTION ITEMS
- [ ] **Agreement Dispatch (Reminder):** Developer (Elijah) to send formal legal agreement and sign-off.
- [ ] **Hosting Infrastructure Deployment:**
  - **Database & Auth:** Host on **Supabase** (PostgreSQL + Auth, shared variables for dev & staging).
  - **Express Server (`agroheal-server`):** Deploy to **Railway** (24/7 always-on, zero cold starts, webhook reliability).
  - **Frontends (`apps/web` & `apps/admin`):** Host on **Render** (Static Sites, 100% free forever).
- [ ] **Database Audit & Data Remediation:**
  - **Upload clean financial records:** Await finalized financial submissions from farm coordinators to overwrite dirty historical database records.
  - **Orphaned / No-Referral Account Resolution:** Map floating paying members to their designated farm groups and assign non-referred signups to Esther Adetayo.
  - **Comprehensive DB Audit:** Re-run forensic integrity audits on all remaining tables prior to launch.

## 🟢 MILESTONE 1: Foundation, Auth/RBAC, Registration & Base Structure
> **Focus:** Clean registration (₦2,000), digital Green Card generation, 6 user roles, sponsor genealogy base, course access, community links, and audit-event foundation.

- [x] **1.1 Six-Role RBAC System**
  - Roles: `member`, `coordinator`, `reviewer` (Farm Accountant), `admin`, `super_admin`, `support`.
  - Database schema & server-side authorization middleware (least privilege).
- [x] **1.2 Registration & Green Card Flow (BR-01)**
  - Registration fee: ₦2,000 verified payment.
  - Split: ₦1,000 referrer credit, ₦700 company administration, ₦300 Core Drivers pool (₦50 each for 6 drivers).
  - Fix admin offline activation button (currently prompts for ₦1,000 instead of ₦2,000 in `MembersPage.tsx`).
  - Unique Green Card member ID generation (`GC-YYYY-XXXXX`).
  - Downloadable soft copy of digital Green Card bearing name and card number.
- [x] **1.3 Sponsor Lineage Base (BR-05)**
  - Separate `sponsor/referrer` from `placement parent` in data model.
  - Capture affiliate link clicks and attach referrer at registration.
  - Display referrer name and phone number on Member Dashboard.
- [x] **1.4 Core Driver Growth Bonus Hook (SOW §4)**
  - ₦50 ledger accrual per verified Green Card registration to each of the 6 Core Drivers (including Elijah).
  - Withdrawable once minimum ₦2,000 threshold is reached.
- [x] **1.5 Learning & Course Library Access**
  - Database-driven curriculum (`courses`, `modules`, `lessons`).
  - Gated access to organic farming training materials for active Green Card holders.
- [x] **1.6 Community Links & Dashboard Shell**
  - Direct dashboard links to official LEAP WhatsApp & Telegram community channels.
  - Member Dashboard foundation displaying status, affiliate link, and referral counts.
- [x] **1.7 Audit Event Capture Infrastructure**
  - Implement `audit_events` table (actor, role, action, entity, before/after state, IP, timestamp).
- [x] **1.8 M1 Acceptance Verification**
  - ₦2,000 registration activates account, issues unique Green Card, and correctly credits ₦1k/₦700/₦300.
  - Six-role permissions verified across backend endpoints.
  - Learning library and community links accessible only to verified members.

---

## 🟡 MILESTONE 2: Activation, Network & Commission Core
> **Focus:** ₦10,000 Activation bundle (Mushroom Power + 1st Slot), Flutterwave/Paystack webhooks, 5×7 auto-placement, 7-level product commission engine (40% ceiling), 5-direct unlock rule, monthly PQV, and immutable wallet ledger.

- [ ] **2.1 Wealth Creation Activation Bundle (BR-02)**
  - Mandatory ₦10,000 checkout: ₦5,000 Mushroom Power product + ₦5,000 first mushroom slot.
  - Option to purchase additional slots in ₦5,000 multiples.
  - Accounting separation: Product triggers 7-level MLM; Slot triggers ₦500 direct referral bonus only.
- [ ] **2.2 Dual Webhook & Idempotent Payment Integration**
  - Flutterwave webhook listener (`/api/v1/webhooks/flutterwave`) with `verif-hash` verification (fixing the "payments don't reflect" bug).
  - Paystack webhook listener (`/api/v1/webhooks/paystack`) with SHA-512 HMAC validation.
  - Idempotent order settlement: atomic database transactions for order status, slot allocation, farm records, and ledger credits.
- [ ] **2.3 5×7 Matrix Placement & Spillover Engine (BR-05)**
  - Geometric limits: L1 = 5, L2 = 25, L3 = 125, etc.
  - Automatic spillover (BFS left-to-right) when sponsor's direct 5 are filled.
  - Direct referral commissions ALWAYS credit to original sponsor, regardless of matrix placement depth.
  - Visual interactive organogram/tree viewer on Member Dashboard.
- [ ] **2.4 7-Level Product Commission Engine (PRD §9, BR-06)**
  - Direct retail seller: 12.0% (₦600 on ₦5,000 pack).
  - Level 1 upline: 5.0% (₦250).
  - Level 2 upline: 3.5% (₦175).
  - Level 3 upline: 3.0% (₦150).
  - Levels 4–7 upline: 2.5% each (₦125 each).
  - Leadership pool: 4.0% (₦200) accumulated running balance.
  - Sustainability reserve: 2.0% (₦100).
  - Strict enforcement of 40% maximum compensation ceiling.
- [ ] **2.5 Admin Commission Rate Configuration & Versioning**
  - Backend and admin UI to configure commission percentages per product with versioned audit history.
- [ ] **2.6 The "5-Direct Unlock" Rule Implementation**
  - Indirect/matrix commissions accrue in `status = 'LOCKED'`.
  - Automatic unlock to `AVAILABLE` once member achieves 5 direct active referrals.
- [ ] **2.7 Monthly PQV Tracking Engine (BR-07)**
  - ₦5,000 monthly personal purchase or verified customer sales requirement.
  - Month-end snapshotting: earnings frozen (not forfeited) if unqualified; unlocked upon subsequent qualification.
- [ ] **2.8 Immutable Double-Entry Wallet Sub-Ledger (BR-08, SRS §6)**
  - `wallet_ledger` table with discrete entries (`REFERRAL_BONUS`, `SLOT_BONUS`, `MATRIX_COMMISSION`, etc.).
  - User balance dynamically computed from ledger sums (`WHERE status = 'AVAILABLE'`).
  - Full transaction history and receipt breakdown on dashboard.
- [ ] **2.9 M2 Acceptance Verification**
  - ₦10,000 activation processes via webhooks idempotently without drops.
  - 7-level commissions calculate to exact kobo under 40% cap.
  - 6th referral auto-places into tree; sponsor receives direct credit.
  - Locked vs Available balances function properly based on 5-direct count.

---

## 🟠 MILESTONE 3: Group Farms, Production & Farm Accounting
> **Focus:** Automatic farm routing, coordinator dashboard in main app, production cycle state machine, maker-checker segregation, confirmed per-slot waterfall math (Cycle 1 & Cycle 2+), and cooperative bulk onboarding.

- [ ] **3.1 Referrer-Based Farm Resolution & Automatic Onboarding (BR-12)**
  - Member slots automatically routed to referrer's active Group Farm.
  - Holding queue for members whose referrer has no farm assigned.
  - Notification to member to contact coordinator and join farm WhatsApp group.
- [ ] **3.2 Cooperative & Group Bulk Onboarding (₦12,000 Package)**
  - Automatic creation of Group Farm for Cooperatives and institutions.
  - Bulk account provisioning with individual 5×7 placements and dashboard accounts.
- [ ] **3.3 Coordinator Experience in Standard Dashboard**
  - Role-gated coordinator portal inside main dashboard (retiring standalone `/:farmSlug` and `/dashboard/farm-admin`).
  - Read-only financial fields (coordinator cannot edit slot fees or delete members).
  - Correct Mushroom Village columns: `Slot Admin & Affiliate (₦1,500)` + `Farm Setup (₦3,500)` = `₦5,000 Total`.
- [ ] **3.4 Production Tracking & Operational Evidence**
  - Log substrate bags, transfer to fruiting house, mortality/losses, harvest batches (kg), and sales revenue.
  - Evidence upload: photos, videos, and operational documents.
  - Farm-level sales orders linked to inventory.
- [ ] **3.5 Production Cycle State Machine (SRS §9)**
  - Canonical states: `Draft` → `Validating` → `Pending Approval` → `Approved` → `Posted` → `Closed`.
- [ ] **3.6 Maker-Checker Segregation of Duties (SRS §5)**
  - Actor approving a cycle must differ from the creator/validator (rejection of self-approval).
- [ ] **3.7 Confirmed Per-Slot Distribution Waterfall (BR-14, BR-16)**
  - **Cycle 1 (3 Months):** ₦5,000 revenue/slot. 0% member payout; 10% company, 90% reinvestment.
  - **Cycle 2+ (Quarterly):** ₦10,000 gross revenue/slot. ₦4,000 continuation deducted. ₦6,000 net split:
    - 40% (₦2,400) Farm Slot Owners
    - 10% (₦600) Coordinator
    - 10% (₦600) Agroheal Company
    - 20% (₦1,200) Gingertown Expansion Pool
    - 20% (₦1,200) Organic FoodNation Pool
  - Farm accounts update automatically when revenue is entered; payouts post to member ledgers.
- [ ] **3.8 M3 Acceptance Verification**
  - Production cycle progresses through maker-checker states without privilege bypass.
  - Harvest payouts calculate and post traceably per slot held.
  - Coordinator views are strictly isolated and financial figures are tamper-proof.

---

## 🔴 MILESTONE 4: Treasury, Bulk Payouts, Governance & Financial Intelligence
> **Focus:** ₦2,000 minimum withdrawals, Paystack/Flutterwave Transfers, Option A Platform Retained Margin & Liquidity Monitoring, admin exception queues, financial reconciliation, fraud controls, full audit reporting UI, and system completion.

- [ ] **4.1 Bank Withdrawal & Disbursal Engine (BR-09, SRS §9)**
  - Minimum withdrawal threshold: ₦2,000 available balance.
  - Bank account verification API (name matching against user profile via Paystack/Flutterwave Resolve Account API).
  - Payout state machine: `Requested` → `Review` → `Approved` → `Processing` → `Paid` / `Failed` / `Reversed`.
  - Payout integration via Paystack & Flutterwave Transfer APIs (batch transfer support with atomic rollback on gateway failure).
  - Immutable debit posting to `wallet_ledger` upon payout dispatch with gateway transfer reference tracking.
- [ ] **4.2 Option A: Platform Retained Operating Margin & Treasury Intelligence**
  - **Accounting Model (FinTech SaaS):** Platform admin revenues (₦700 per Green Card registration, ₦1,000 per slot setup/maintenance fee, and 10% harvest management company share) are recognized directly as **Corporate Retained Operating Margin / Platform Equity** rather than accumulating in a personal user wallet.
  - **Admin Visual Representation (Super Admin Treasury Dashboard):**
    - **Gross Platform Inflows:** Cumulative cash collected across Paystack, Flutterwave, and verified bank transfers.
    - **Member Wallet Liabilities:** Aggregate sum of all unwithdrawn member wallet balances (`SELECT SUM(balance) FROM user_wallets WHERE balance > 0`).
    - **Net Retained Company Operating Profit:** Cumulative company profit retained after deducting commissions, capex pools, and affiliate payouts.
    - **Liquidity Coverage Ratio (LCR):** Real-time gauge: `(Available Gateway Cash / Member Wallet Liabilities) × 100%`.
  - **Pre-Payout Solvency Shield:** Automated safety check in the Payout Engine ensuring corporate accounts maintain ≥ 100% liquidity reserve for all pending withdrawals before any disbursal batch is dispatched.
- [ ] **4.3 Product Return & Commission Clawback Engine**
  - Negative ledger adjustments for reversed/returned orders.
  - Automatic deficit offset against subsequent member earnings.
- [ ] **4.4 Admin Governance & Order Exception Queue**
  - Exception management queue for pending, failed, duplicate, and unassigned transactions.
  - Manual override and correction tools with mandatory audit justifications.
- [ ] **4.5 Full Financial Reconciliation Intelligence**
  - Gateway receipts vs Orders vs Commissions vs Farm Allocations vs Bank Payouts reconciliation report.
  - Automated anomaly and imbalance detection.
- [ ] **4.6 Fraud & Risk Controls**
  - Detection of rapid duplicate registrations, multiple accounts on single bank details, and circular referral rings.
- [ ] **4.7 Audit Reporting UI & CSV Export**
  - Full-featured admin audit viewer with search, filters, and CSV/Excel export.
- [ ] **4.8 Final Member, Coordinator & Admin Dashboard Polishing**
  - System notification center (in-app + webhooks/email alerts).
  - Final visual cleanups, error states, and responsive mobile optimization.
- [ ] **4.9 M4 Acceptance Verification**
  - End-to-end withdrawal flow completes with bank callback verification.
  - Reconciliation dashboard matches ledger to gateway balances with zero leakage.
  - Complete regression and acceptance sign-off.

---

## 🟣 MILESTONE 5: Marketplace Expansion *(SEPARATELY SCOPED)*
> **Status:** Excluded from the ₦3.8M Phase 1–4 agreement. To be scoped and contracted independently upon completion of Milestone 4.
- Full product catalogue & inventory management
- Multi-farm sourcing by State & LGA
- Customer ordering, checkout & fulfilment
- Delivery / logistics integration (Shiip, GIG, Kwik)
- Geolocation tracking
- Advanced marketplace analytics
