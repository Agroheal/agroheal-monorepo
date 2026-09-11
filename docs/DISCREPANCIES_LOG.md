# AGROHEAL DISCREPANCIES & AUDIT LOG

This document tracks all discovered contradictions, bugs, and legacy logic errors found in the previous codebase against the official **PRD v1.2**, **SRS v1.2**, and **48-Slide Deck**.

---

### 1. "Leased" Farm Slots vs. Cooperative Production Units
- **Legacy Code:** `supabase/sql/admin_schema_and_policies.sql` lines 56–58 and `Legal.tsx` line 50 described farm slots as being "leased under community group farm agreements."
- **Official Specification:** PRD §2 and Deck §5 state that farm participation is *cooperative production facilitated by Agroheal, not passive investment or leasing*. Slots represent units of substrate bags, operational inputs, and shared harvest rights.
- **Action Required:** Update default terms in `admin_schema_and_policies.sql` and `Legal.tsx` to remove landlord/lease phrasing and reflect cooperative production participation.

---

### 2. The 10× Cycle 2+ Waterfall Ambiguity
- **Discrepancy:**
  - *Deck Slide 16:* States revenue is ₦10,000 *per slot* (4 bags × 1kg × ₦2,500). Less ₦4,000 continuation = ₦6,000 net, with 40% (₦2,400) paid per slot to the owner.
  - *Deck Slide 35:* Treats ₦10,000 as the *entire farm's revenue*, ₦2,400 as the total owner pool, and divides it by 10 slots = ₦240 per slot.
- **Impact:** 10× difference in owner payouts.
- **Action Required:** Biological yield math indicates Slide 16 is the intended model (each slot has 4 bags yielding 4kg). Defer exact implementation until Milestone 3 and confirm with founders.

---

### 3. Farm Slots Wrongly Treated as Monthly Recurring Subscriptions
- **Legacy Code:** `Dashboard.tsx`, `MonthlyPayment.tsx`, and `FarmManagement.tsx` treated farm slots like a monthly SaaS subscription (`slot_subscriptions.next_payment_date`, `months_farm_setup` ₦5,000/mo, `months_farm_support` ₦500/mo).
- **Official Specification:** A farm slot is a **one-time ₦5,000 production unit per cycle** (Cycle 1 is 3 months!). There is no monthly ₦5,000 slot fee. Monthly qualification comes from ₦5,000 **PQV** (purchasing/selling products), not repurchasing slots.
- **Action Required:** Remove recurring monthly slot charges. Separate product PQV from one-time slot purchases.

---

### 4. Admin Offline Registration Fee Bug (₦1,000 vs ₦2,000)
- **Legacy Code:** `apps/admin/src/pages/MembersPage.tsx` line 60 has a confirmation dialog:
  `"Confirm offline payment (₦1,000) and issue Green Card status for ${member.full_name}?"`
- **Official Specification:** PRD BR-01 mandates that Green Card registration is **₦2,000** (₦1,000 referrer credit + ₦1,000 company administration).
- **Action Required:** Fix offline admin modal to charge ₦2,000 and properly split the amounts.

---

### 5. Mutable Balance Columns vs. Immutable Ledger
- **Legacy Code:** Referrals and slot bonuses were credited by directly updating scalar numbers in the `profiles` table (`referral_earnings = referral_earnings + 1000`).
- **Official Specification:** SRS §6 and PRD BR-08 mandate that the wallet is ledger-first. Balances must derive from immutable, append-only transactions in a `wallet_ledger` table with reversal links.
- **Action Required:** Introduce `wallet_ledger` table and compute balances dynamically.

---

### 6. Missing 5×7 Placement Tree & Spillover Engine
- **Legacy Code:** Only a single flat `referred_by` column existed on `profiles`.
- **Official Specification:** PRD BR-05 requires separating the Sponsor/Referrer (for direct rewards) from the Placement Parent (for 5×7 geometric tree placement and level commissions).
- **Action Required:** Add `sponsor_id`, `placement_parent_id`, `matrix_position` (1–5), and `matrix_depth` to `profiles`, and build matrix spillover logic.

---

### 7. Duplicate Farm Slug Route
- **Legacy Code:** In `apps/web/src/main.tsx`, `/:farmSlug` is registered twice on lines 75 and 81.
- **Action Required:** Remove duplicate route.

---

### 8. Missing Flutterwave Webhook (Root Cause of "Payments Sometimes Don't Reflect")
- **Legacy Code:** Only `paystack-webhook` exists in `supabase/functions/`. There is **NO Flutterwave webhook**.
- **Impact:** When a user pays on Flutterwave and switches to their mobile banking app to complete a transfer, the browser tab often sleeps or refreshes. Flutterwave sends an asynchronous webhook event, but Agroheal has no endpoint listening for it. The payment succeeds with Flutterwave, but the user's dashboard never updates.
- **Action Required:** Add an authoritative Flutterwave webhook listener (`/api/v1/webhooks/flutterwave`) in `agroheal-server` with signature verification and idempotency keys.

---

### 9. Disconnected Slot Crediting vs. Farm Records
- **Legacy Code:** `verify-slot-payment` edge function inserts into `slot_subscriptions`, but **never** inserts the member into `farm_records`.
- **Impact:** Online purchases gave members slots in the database, but group farm coordinators never saw them on the farm roster. Admins had to manually perform a secondary assignment.
- **Action Required:** Combine slot crediting and group farm assignment into a single atomic backend transaction.

---

### 10. Coordinator Edit Permissions Overreach
- **Legacy Code:** In `FarmRecordsView.tsx`, coordinators have editable inputs for setup/support fees and an active delete trash button for members.
- **Official Specification:** Coordinators must never be able to alter paid slot counts, fake financial formulas, or delete paid members. Coordinators only log physical production data (bags, harvest, sales) and expenses with receipts.
- **Action Required:** Restrict coordinator views to read-only financial figures and remove the delete member action.

---

### 11. Ghost Categories in Admin Toolbar ("Sweet Potato", "Ginger")
- **Legacy Code:** `apps/admin/src/components/admin/MembersToolbar.tsx` lines 56–58 contains `<SelectItem value="Sweet Potato">` and `<SelectItem value="Ginger">`.
- **Official Specification:** The database constraint strictly permits only:
  1. `Gingertown`
  2. `Mushroom Village`
  3. `Organic FoodNation (1 Million Hectares against Hunger)`
- **Impact:** Filtering by "Sweet Potato" or "Ginger" breaks or returns 0 members.
- **Action Required:** Clean up toolbar dropdowns to match official project categories.

---

### 12. Sustenance Group Farm Column Misalignment (Taofik Oyekan Issue)
- **Legacy Code:** `FarmRecordsView.tsx` hardcodes slot fees to ₦1,000 and shows generic Ginger columns (Support, Absentee fine).
- **Official Specification:** Mushroom Village slots cost ₦5,000 and break down into:
  - `Slot Admin & Affiliate Commission`: ₦1,500 per slot (₦1,000 Admin + ₦500 Affiliate).
  - `Farm Setup`: ₦3,500 per slot.
  - Total: ₦5,000 per slot.
- **Action Required:** Update Mushroom Village table view in `FarmRecordsView.tsx` to render these exact columns and calculations.

---

### 13. Resolution of Cycle 2+ Waterfall Math (Per-Slot Economics Confirmed)
- **Status:** **RESOLVED via Founder Q&A (Sept 4, 2026)**
- **Clarification:** Scenario 1 (Slide 16) is the authoritative rule. Revenue and distributions are calculated **strictly per slot**, NOT as a fixed flat farm pool:
  - **Cycle 1 (3 Months):** 2 bags/slot × 1kg × ₦2,500 = ₦5,000 revenue. **0% distributed to owners.** 10% company administration; 90% reinvested into expanding capacity to 4 bags/slot for Cycle 2.
  - **Cycle 2+ (Quarterly):** 4 bags/slot × 1kg × ₦2,500 = **₦10,000 revenue per slot**.
    - Continuation cost: **₦4,000 per slot**.
    - Net distributable pool: **₦6,000 per slot**, allocated as:
      - **₦2,400 (40%)** to Farm Slot Owner.
      - **₦600 (10%)** to Group Farm Coordinator.
      - **₦600 (10%)** to Agroheal Company.
      - **₦1,200 (20%)** to Gingertown Expansion Pool.
      - **₦1,200 (20%)** to Organic FoodNation Expansion Pool.
  - **Kickoff Threshold:** A group farm requires at least 250 slots to launch operations (ideal size: 1,000 slots).

---

### 14. 5×7 Matrix Auto-Placement & Direct Commission Integrity
- **Status:** **RESOLVED via Founder Q&A (Sept 4, 2026)**
- **Rule:**
  - When a sponsor's first 5 direct slots are filled, the 6th referral automatically spills over to the next available position in their tree (left-to-right, top-to-bottom).
  - **Direct referral bonus** (₦1,000 registration / ₦500 slot) ALWAYS credits to the **original Sponsor**, regardless of where in the tree the downline lands.
  - **Multilevel product commissions** (7 levels) credit to the placement upline.
  - **5-Direct Referral Unlock Requirement:** A member's accumulated indirect/matrix earnings remain in a **LOCKED/PENDING** state and cannot be withdrawn until they have personally onboarded at least **5 direct members**.

---

### 15. Core Drivers Growth Bonus Allocation
- **Status:** **CONFIRMED via Founder Q&A (Sept 4, 2026)**
- **Specification:**
  - 15% of every ₦2,000 Green Card registration (₦300 total pool) is reserved for the 6 Core Drivers (Esther, Taiwo, David, Elijah, and 2 others).
  - Each Core Driver automatically receives **₦50 per registration** credited instantly to their earnings ledger.
  - Core Drivers can withdraw their earnings once they accumulate the standard ₦2,000 minimum withdrawal threshold.

---

### 16. Pioneers Group Farm Slot Count Discrepancy (943 vs 1,004)
- **Status:** **IDENTIFIED & ITEMIZED**
- **Discrepancy:** The website displays 943 slots taken for Pioneers Group Farm, whereas 1,004 have been paid for.
- **Pending Member Backfill:**
  - `ngmojedayo@gmail.com`: 10 slots
  - `Oluwasolapeo@gmail.com`: 20 slots
  - `soaiyejumoh@gmail.com`: 1 slot
  - `lolabimyusuf@gmail.com`: 30 slots
  - (Total = 61 slots. 943 + 61 = 1,004 slots).
- **High-Value Gingertown & Mushroom Allocations:**
  - `arinodu@gmail.com`: Paid ₦995,000 (₦500,000 for 100 Mushroom slots + ₦495,000 for 15 Gingertown slots @ ₦33,000/slot).
  - `moy_otulana@yahoo.com`: Paid for 20 Mushroom slots (₦100,000) + 10 Gingertown slots.

---

### 17. Sustenance Group Farm Roster & Slot Backfill
- **Status:** **IDENTIFIED & ITEMIZED**
- **Target:** Sustenance Mushroom Group Farm must be set to 1,000 slots total (fully populated).
- **Pending Allocations:**
  - `oyekantaofikg@gmail.com`: 200 extra slots (₦1,000,000) + ~16 existing slots.
  - `bankolemotunrayo84@gmail.com`: 400 extra slots (₦2,000,000) + ~18 existing slots.
  - `oyekantaofiky@yahoo.co.uk` (Phone: 09051835772, placed under Bankole Motunrayo): 239 slots (₦1,194,000).

---

### 18. Goshen Mushroom Group Farm Referral & Slot Omission
- **Status:** **ROOT CAUSE TRACED**
- **Discrepancy:**
  - `truprice7@gmail.com` (5 slots / ₦25,000): Referrer `philipoladeni52@gmail.com` owed ₦2,500 slot bonus. Member missing from coordinator dashboard.
  - `nkechiagboola737@gmail.com` (10 slots / ₦50,000) & `agboolaboyeji@gmail.com` (10 slots / ₦50,000): Referrer `boyejiagboola1727@gmail.com` owed ₦10,000 slot bonus.
- **Fix Required:** Run database backfill script to credit referrer ledgers and insert member rows into `farm_records`.

---

## 📌 DEFERRED ARCHITECTURAL & PRODUCT DECISIONS

### 19. Paywall Gating Strategy (Marketing vs Exclusivity)
- **Status:** **DEFERRED PRODUCT DECISION**
- **Context:** Currently, `RequireSubscription.tsx` intercepts all routes under `/dashboard` and forces a redirect to `/subscribe` (₦2,000 Green Card payment) immediately upon login.
- **Discussion Point:** Does hard-gating everything immediately cause high user drop-off? Should prospective members have a "freemium" preview (e.g. browsing public farm updates, viewing course trailers, exploring the marketplace) before paying ₦2,000 to unlock wallets and slot purchasing?
- **Action:** Retain current hard-gating for M1–M2 as specified by founders; revisit in Milestone 3/4 after analyzing initial signup-to-activation conversion metrics.

### 20. Public Un-Gating of Careers and Informational Pages
- **Status:** **DEFERRED PRODUCT DECISION**
- **Context:** Pages like `/about`, `/careers`, and `/legal` must never be trapped inside auth or paywalls.
- **Specification:** When the Careers page is built, it must be placed directly under the public `Layout` in `apps/web/src/main.tsx` alongside `/about` and `/legal` to maximize Google indexing (SEO) and applicant conversion.
