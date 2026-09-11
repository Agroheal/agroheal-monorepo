# AGROHEAL ROADMAP, MILESTONE TRACKER & FOUNDERS CHECKLIST

*Comprehensive tracking of commercial agreements, engineering milestones (M1–M4), legal review checklists, and founders' operational decisions.*

---

## 1. Commercial Terms & Payment Schedule

- **Total Contract Value (Milestones 1–4):** ₦3,800,000.00
- **Upfront Mobilization:** ₦500,000.00 *(PAID: ₦350k on Sept 5 + ₦150k on Sept 6)*
- **Milestone 3 Completion & Acceptance:** ₦1,000,000.00 *(Brings cumulative to ₦1.5M)*
- **Milestone 4 Completion & Acceptance:** ₦2,300,000.00 *(Final balance)*
- **Core Driver Growth Bonus:** ₦50.00 per verified Green Card registration automatically accrued to Developer (Elijah).
- **Milestone 5 (Marketplace Expansion):** Explicitly excluded from this phase; separately scoped and priced.

---

## 2. Founders Pre-Launch Action Items & Legal Checklist

All legal clauses and customer-facing terms in [apps/web/src/page/website/Legal.tsx](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/web/src/page/website/Legal.tsx) must be reviewed and vetted by founders and legal counsel:

### 2.1. Legal Governance Suite Review (`/legal`, `/privacy`, `/terms`)
- [ ] **Section 1: Platform Terms of Service & General Conditions** (`#terms`)
  - Corporate registration details of Agroheal Solutions Ltd. and non-banking / non-deposit status.
  - Member eligibility, single-account rules, and KYC enforcement.
- [ ] **Section 2: LEAP Group Farming & Practical Cluster Agreement** (`#agreement`)
  - ₦5,000 slot setup fee allocation (₦1,400 bags, ₦2,100 fruiting house/HR, ₦500 sponsor honorarium, ₦1,000 admin).
  - Validation of Cycle 1 (Months 1–3) capacity building (doubling 2→4 bags, 90% reinvested, 10% company, ₦0 cash payout).
  - Validation of Cycle 2+ quarterly waterfall (₦10,000 revenue - ₦4,000 continuation = ₦6,000 distributable: 40% farm owners, 20% Gingertown, 20% FoodNation, 10% Company, 10% Coordinator).
  - Mature 3-farm model (80% farm owners, 10% coordinator, 10% company).
- [ ] **Section 3: Community Affiliate & 7-Level Product Commission Terms** (`#affiliate`)
  - ₦2,000 Green Card registration (₦1,000 referrer, ₦1,000 company admin).
  - ₦10,000 Wealth Creation Activation (₦5,000 Mushroom Power welcome product + ₦5,000 compulsory first farm slot).
  - 7-level product commission engine (40% ceiling: 12% retail, 5% L1, 3.5% L2, 3% L3, 2.5% L4–L7, 4% leadership pool, 2% sustainability reserve, 0.5% company margin).
  - **Matrix Downline Structure Confirmation (Geometric 5→25 vs. Linear 5-5-5-5-5-5-5)**:
    - *Option A (Geometric Exponential 5×7):* 5 → 25 → 125 → 625 → 3,125 → 15,625 → 78,125 (total 97,655 members across 7 levels).
    - *Option B (Linear / Fixed 5 Per Level):* 5 → 5 → 5 → 5 → 5 → 5 → 5 (total 35 members across 7 levels).
    - *Action needed:* Founders to confirm which model governs commission compression, spillover allocation, and organogram tree rendering.
  - Confirmation that farm slots do NOT generate multilevel commissions — only flat 10% (₦500) direct bonus.
  - Monthly qualification: ₦5,000 PQV (purchases + retail sales); unqualified earnings held indefinitely in wallet ledger.
  - Withdrawal requirements: 5 direct referrals + ₦5,000 PQV within 30 days for multilevel network withdrawals; direct referral bonuses withdrawable at ₦2,000 minimum.
- [ ] **Section 4: Wallet, Non-Deposit Policy & Balance Reinvestment** (`#wallet`)
  - Non-custodial earnings ledger specification and prohibition of direct fiat cash deposits.
  - Minimum external bank withdrawal threshold (₦2,000) and NUBAN KYC account verification.
- [ ] **Section 5: Agricultural & Biological Risk Disclosure** (`#risk`)
  - Statutory disclosure regarding non-guaranteed financial returns and biological variability.
  - Force majeure and severe climatic events protection clauses.
- [ ] **Section 6: Privacy Policy & NDPR Compliance** (`#privacy`)
  - Nigeria Data Protection Regulation (NDPR) and NDPA compliance confirmation.
  - Next-of-Kin succession transfer mechanism for practical farm slots and accrued ledger balances.

### 2.2. Marketing Copy & Public Website Review
- [ ] **Homepage ([apps/web/src/page/website/Home.tsx](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/web/src/page/website/Home.tsx))**:
  - Review hero value proposition ("Cut food costs by over 50%").
  - Validate all promotional copy, course previews, and harvest-sharing claims.
- [ ] **About Page ([apps/web/src/page/website/About.tsx](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/web/src/page/website/About.tsx))**:
  - Review mission, vision, and "Our Story" narrative to align with company founders.
- [ ] **Careers Page ([apps/web/src/page/website/Careers.tsx](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/apps/web/src/page/website/Careers.tsx))**:
  - Currently set to "No Open Roles at This Time". If hiring begins, supply exact job descriptions.

---

## 3. Engineering Milestones (M1–M4)

### 🟢 MILESTONE 1: Foundation, Auth/RBAC, Registration & Base Structure (COMPLETED)
- [x] **1.1 Six-Role RBAC System:** Roles `member`, `coordinator`, `reviewer`, `admin`, `super_admin`, `support` implemented across API and database.
- [x] **1.2 Registration & Green Card Flow:** ₦2,000 payment flow, unique member ID generation (`GC-YYYY-XXXXX`), downloadable digital card.
- [x] **1.3 Sponsor Lineage Base:** Separate `sponsor_id` from `placement_parent_id`.
- [x] **1.4 Core Driver Growth Bonus Hook:** ₦50 ledger accrual per verified Green Card registration.
- [x] **1.5 Learning & Course Library Access:** Gated agronomy LMS curriculum for Green Card holders.
- [x] **1.6 Community Links & Dashboard Shell:** Verified member portal with community links and wallet HUD.
- [x] **1.7 Audit Event Capture Infrastructure:** Immutable `audit_events` table for tracking administrative changes.

### 🟡 MILESTONE 2: Activation, Network & Commission Core (IN PROGRESS)
- [x] **2.1 Wealth Creation Activation Bundle:** ₦10,000 checkout (₦5k Mushroom Power + ₦5k compulsory first slot).
- [x] **2.2 Dual Webhook & Idempotent Payment Integration:** Paystack SHA-512 and Flutterwave `verif-hash` listeners with idempotent ledger posting.
- [x] **2.3 5×7 Matrix Placement & Spillover Engine:** Breadth-First Search auto-placement; direct bonuses stay with original sponsor.
- [x] **2.4 7-Level Product Commission Engine:** 40% statutory ceiling (12% retail, 5% L1, 3.5% L2, 3% L3, 2.5% L4–L7, 4% leadership, 2% sustainability, 0.5% company margin).
- [x] **2.5 The 5-Direct Referral Unlock Rule:** Auto-unlocking locked multilevel earnings upon 5th active direct referral.
- [x] **2.6 Monthly PQV Qualification Engine:** ₦5,000 monthly PQV evaluation; zero forfeiture policy.
- [x] **2.7 Member Dashboard Organogram & Downline Tree:** Interactive 5×7 downline tree viewer.
- [x] **2.8 Double-Entry Wallet Ledger & Financial Ledger:** Discrete ledger rows with real-time balance queries.

### ⚪ MILESTONE 3: Farms, Harvest Cycles & Dual Ledger Accounting
- [ ] **3.1 Group Farm Directory & Slot Management:** 1,000-slot target clusters with 250-slot kickoff threshold.
- [ ] **3.2 Group Farm Creation & Multi-Tenant Boundaries:** Scoped access for resident coordinators.
- [ ] **3.3 Cycle 1 Capacity Doubling Engine:** 90-day biological bag multiplication (2→4 bags, ₦0 cash distribution).
- [ ] **3.4 Cycle 2+ Quarterly Waterfall Calculator:** ₦10,000 gross - ₦4,000 continuation = ₦6,000 distributable (40% / 20% / 20% / 10% / 10%).
- [ ] **3.5 Maker-Checker Farm Harvest Close Workflow:** Coordinator drafts, Farm Accountant validates and approves.
- [ ] **3.6 Automated Wallet Disbursement:** Approved cycle balances post automatically to slot owners' wallets.

### ⚪ MILESTONE 4: Financial Dashboard, Maker-Checker Controls & Production Hardening
- [ ] **4.1 Super Admin Financial Dashboard (Option A FinTech Model):** Gross inflows, member liabilities, company retained margin, and Liquidity Coverage Ratio (LCR).
- [ ] **4.2 Pre-Payout Solvency Shield & Batch NUBAN Disbursement:** Automated liquidity verification prior to executing batch bank transfers.
- [ ] **4.3 Farm Audit & Reconciliation Tools:** Tools to resolve unbacked bags and orphan paying members.
- [ ] **4.4 Security Hardening & Penetration Defense:** RLS policy verification, SQL injection prevention, rate limiting.
- [ ] **4.5 Production Deployment & Final Acceptance:** Railway backend, Render frontends, Supabase production database.
