# AGROHEAL ECOSYSTEM: SYSTEM LOGIC, MATH & ARCHITECTURE KB

This document is the single source of truth for all mathematical formulas, financial splits, network rules, and database logic across the Agroheal Green Card Ecosystem. Zero fluff. Straight to the point.

---

## 1. FINANCIAL FLOWS & SPLIT FORMULAS

### 1.1. Green Card Registration (₦2,000)
- **Trigger:** Member signs up and pays ₦2,000.
- **Split Math:**
  | Beneficiary | Amount | Ledger Type | Rule |
  | :--- | :--- | :--- | :--- |
  | **Direct Sponsor** | ₦1,000 | `REFERRAL_BONUS` | Credited immediately to the person whose affiliate link was used. |
  | **Company Admin** | ₦700 | `ADMIN_REVENUE` | Platform operating margin. |
  | **Core Drivers Pool** | ₦300 | `CORE_DRIVER_BONUS` | 15% of ₦2,000 split equally among 6 Core Drivers (**₦50.00 each**). |
- **Output:** Digital Green Card generated with unique identifier (`GC-YYYY-XXXXX`).
- **Validity:** **Permanent / Lifetime Active**. There is NO expiration date, recurring subscription fee, or annual renewal. Once registered, a Green Card remains active permanently.
- **Company Admin Accounting (Option A — FinTech SaaS Model):** The ₦700 admin share is recognized directly as **Platform Retained Operating Margin** (retained profit) rather than sitting in a personal user wallet. On the Super Admin Financial Dashboard (Milestone 4), it is visually displayed as: `Gross Cash Inflow` minus `Member Wallet Liabilities` = `Net Company Retained Margin`, backed by automated Liquidity Reserve monitoring against unwithdrawn wallet balances.

### 1.2. Mushroom Group Farm Slot (₦5,000 per slot)
- **Trigger:** Member purchases 1 production slot (or multiple in batches of ₦5,000).
- **Split Math (Per ₦5,000 Slot):**
  | Beneficiary / Purpose | Amount | Category | Description |
  | :--- | :--- | :--- | :--- |
  | **Direct Sponsor** | ₦500 | `SLOT_BONUS` | Direct affiliate commission to sponsor. |
  | **Company Admin** | ₦1,000 | `ADMIN_FEE` | Farm management, technical supervision & platform fee. |
  | **Farm Setup / Production** | ₦3,500 | `FARM_CAPEX` | • ₦1,400 for 2 mushroom substrate bags<br>• ₦2,100 for fruiting house, logistics & labor |
- **Database Output:**
  1. Insert row into `slot_subscriptions` (`slots_count = N`, `status = 'ACTIVE'`).
  2. Insert or increment row in `farm_records` for the group farm assigned to that member.

### 1.3. Producer-Consumer Welcome Pack / Network Activation (₦5,000)
- **Trigger:** Member activates the 5×7 Producer-Consumer network.
- **Product:** 1 Welcome Pack of "Mushroom Power" (retail value ₦6,000).
- **Marketing Math:**
  - **40% of Retail Price (₦2,000)** is distributed as marketing compensation across 7 levels, leadership, and sustainability pools:

  | Level / Beneficiary | Commission % | On ₦5,000 Product (₦) | Description |
  | :--- | :--- | :--- | :--- |
  | **Direct Retail Seller** | **12.0%** | **₦600.00** | Person who made the direct retail sale |
  | **Level 1 (Direct Sponsor)** | **5.0%** | **₦250.00** | First immediate upline |
  | **Level 2** | **3.5%** | **₦175.00** | Second upline |
  | **Level 3** | **3.0%** | **₦150.00** | Third upline |
  | **Level 4** | **2.5%** | **₦125.00** | Fourth upline |
  | **Level 5** | **2.5%** | **₦125.00** | Fifth upline |
  | **Level 6** | **2.5%** | **₦125.00** | Sixth upline |
  | **Level 7** | **2.5%** | **₦125.00** | Seventh upline |
  | **Leadership Development Pool** | **4.0%** | **₦200.00** | Pool for top producers & coordinators |
  | **Network Sustainability Reserve**| **2.0%** | **₦100.00** | Liquidity buffer & network health fund |
  | **Agroheal Company Margin** | **0.5%** | **₦25.00** | Retained network admin margin |
  | **Total Marketing Pool** | **40.0%** | **₦2,000.00** | **100% of 40% marketing allocation** |

  - Remaining ₦3,000 covers manufacturing COGS, packaging, and company margin.

### 1.4. Activation Bundle (₦10,000)
- **Description:** Combined upgrade for registered members to become producers and marketers:
  - ₦5,000 Mushroom Slot (1 production unit)
  - ₦5,000 Mushroom Power Pack (5×7 network activation)

### 1.5. Full Cooperative Onboarding Package (₦12,000 per member)
- **Description:** Standard institutional package for Cooperatives, Church Groups, Associations:
  - ₦2,000 Green Card Registration
  - ₦5,000 Mushroom Slot
  - ₦5,000 Mushroom Power Welcome Pack
- **Cooperative Rule:** Bulk payments made to company account. System auto-creates the Group Farm and individually provisions each member's personal 5×7 account.

---

## 2. 5×7 MATRIX & NETWORK RULES

### 2.1. Dual Hierarchy: Sponsor vs. Placement Parent
Every member has two distinct upline links:
1. `sponsor_id`: The person whose affiliate link was clicked. Receives **100% of direct bonuses** (₦1,000 registration + ₦500 per slot).
2. `placement_parent_id`: The physical node directly above the member in the 5×7 geometric tree. Receives **multilevel matrix commissions**.
- **Un-Referred / Organic Signups (Master Root Sponsor):** If a user signs up organically without an affiliate link, the system automatically assigns **Adetola Esther (Co-founder)** (`referral_code = '356FV1'`) as the default root sponsor. This prevents orphaned network nodes and consolidates organic growth under the co-founder master lineage.

### 2.2. Matrix Topology & Auto-Placement (Spillover)
- **Width:** 5 legs per node.
- **Depth:** 7 levels.
- **Maximum Network Capacity:** 
  $$\sum_{L=1}^{7} 5^L = 5 + 25 + 125 + 625 + 3,125 + 15,625 + 78,125 = 97,655 \text{ members}$$
- **Placement Algorithm:**
  1. Check sponsor's direct children (`COUNT(*) WHERE placement_parent_id = sponsor_id`).
  2. If count < 5: Member is placed directly under sponsor. Position = `count + 1`.
  3. If count == 5: Run Breadth-First Search (BFS) down the sponsor's tree, finding the shallowest, leftmost node with `< 5` children.
  4. Set `placement_parent_id = selected_node.id` and `matrix_depth = selected_node.matrix_depth + 1`.

### 2.3. The "5-Direct Unlock" Rule
- **Rule:** A member accumulates multilevel/indirect commissions from their downline matrix into their wallet ledger, but the balance is held in a **`LOCKED`** status.
- **Unlock Condition:** The member must personally recruit at least **5 direct active members** (`COUNT(*) WHERE sponsor_id = member_id AND status = 'ACTIVE' >= 5`).
- **Trigger:** When the 5th direct referral is registered, a background job updates all `LOCKED` ledger entries for that user to `AVAILABLE`.

### 2.4. ₦5,000 Monthly Personal Qualifying Volume (PQV)
- **Rule:** To withdraw commissions earned in a given calendar month, the member must maintain ₦5,000 PQV through personal purchases or retail customer sales.
- **Safety Provision:** If a member fails to hit ₦5,000 PQV in Month X:
  - Commissions are **NOT forfeited** or deleted.
  - Funds remain frozen in the ledger.
  - As soon as the member hits ₦5,000 PQV in a subsequent month, accumulated funds unlock for withdrawal.

---

## 3. FARM PRODUCTION & CYCLE WATERFALL MATH

### 3.1. Group Farm Operational Boundaries
- **Ideal Size:** 1,000 slots per Group Farm.
- **Minimum Operational Kickoff:** **250 slots** required before a Group Farm can begin production.

### 3.2. Cycle 1: Establishment & Capacity Doubling (3 Months)
- **Duration:** 90 Days (Month 1: bag production & colonization; Months 2 & 3: fruiting & harvest).
- **Production Baseline:** 2 substrate bags per slot.
- **Yield Baseline:** 1kg fresh mushrooms per bag = 2kg total per slot.
- **Revenue Baseline:** 2kg × ₦2,500/kg = **₦5,000 revenue per slot** (100% gross on slot cost).
- **Cycle 1 Distribution Waterfall:**
  | Beneficiary / Allocation | Percentage | Amount / Slot | Description |
  | :--- | :--- | :--- | :--- |
  | **Member / Slot Owner** | **0%** | **₦0.00** | Zero cash distribution in Cycle 1. |
  | **Agroheal Company** | **10%** | **₦500.00** | Farm administration, agronomist supervision. |
  | **Reinvestment Pool** | **90%** | **₦4,500.00** | Ploughed back to double capacity to 4 bags/slot, extend fruiting house, logistics. |

### 3.3. Cycle 2+ Quarterly Waterfall: Continuous Production
- **Production Baseline:** 4 substrate bags per slot.
- **Yield Baseline:** 4kg fresh mushrooms per slot (1kg/bag).
- **Gross Revenue:** 4kg × ₦2,500/kg = **₦10,000 gross revenue per slot**.
- **Production Continuation Cost:** **₦4,000 per slot** deducted first.
- **Net Distributable Pool:** **₦6,000 per slot** (100% of net margin).
- **Quarterly Distribution Waterfall (Per Slot):**
  | Allocation | Share % | Amount / Slot | 1,000-Slot Farm Total |
  | :--- | :--- | :--- | :--- |
  | **Farm Slot Owners** | **40%** | **₦2,400.00** | ₦2,400,000.00 |
  | **Group Farm Coordinator** | **10%** | **₦600.00** | ₦600,000.00 |
  | **Agroheal Company** | **10%** | **₦600.00** | ₦600,000.00 |
  | **Gingertown Expansion Fund** | **20%** | **₦1,200.00** | ₦1,200,000.00 |
  | **Organic FoodNation Fund** | **20%** | **₦1,200.00** | ₦1,200,000.00 |
  | **Total** | **100%** | **₦6,000.00** | **₦6,000,000.00** |

### 3.4. Multi-Farm Mature Phase Waterfall
Once Gingertown and Organic FoodNation farms are fully producing, the three farm pools merge:
- **80% of net profits** distributed to Group Farm Owners across the 3 farms.
- **10%** to Coordinators.
- **10%** to Agroheal Company.

---

## 4. WALLET, LEDGER & WITHDRAWAL ENGINE

### 4.1. The Immutable Ledger Rule
- Never update a single balance column directly (`UPDATE profiles SET balance = balance + X` is strictly prohibited).
- All financial credits and debits exist as discrete rows in `wallet_ledger`:
  ```sql
  CREATE TABLE wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    amount NUMERIC(12, 2) NOT NULL, -- Positive for credits, negative for debits
    type VARCHAR(50) NOT NULL, -- REFERRAL_BONUS, SLOT_BONUS, MATRIX_COMMISSION, FARM_PAYOUT, WITHDRAWAL, CLAWBACK
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, LOCKED, PENDING_PAYOUT, CLEARED, CANCELLED
    reference_id VARCHAR(100) UNIQUE, -- Idempotency key (e.g. 'flw_tx_12345_slot_bonus')
    source_order_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **Real-Time Balance Query:**
  ```sql
  SELECT COALESCE(SUM(amount), 0) AS withdrawable_balance
  FROM wallet_ledger
  WHERE user_id = $1 AND status = 'AVAILABLE';
  ```

### 4.2. Withdrawal Execution Rules
- **Minimum Withdrawal:** **₦2,000.00**.
- **Validation Steps:**
  1. Check `withdrawable_balance >= requested_amount` and `requested_amount >= 2000`.
  2. Check member has ₦5,000 PQV in current or past qualified month.
  3. Verify bank account details via Paystack/Flutterwave recipient API.
  4. Write debit row to `wallet_ledger` with `status = 'PENDING_PAYOUT'`.
  5. Dispatch transfer via payment gateway.
  6. On webhook confirmation: update status to `CLEARED`. If failed: insert refund reversal row.

### 4.4. Option A Corporate Treasury, Retained Operating Margin & Pre-Payout Solvency Shield
- **The Core Architecture Principle (Option A — FinTech SaaS Model):**
  - The ₦700 admin share from Green Card registrations, the ₦1,000 maintenance fee from slot purchases, and the 10% company share from harvest distributions are **never credited to an internal user wallet**.
  - Crediting company margin to an internal user wallet creates toxic liquidity risks (accidental self-withdrawal loops, confusion of corporate equity with user liabilities, and database clutter).
  - Instead, these revenues are recognized as **Corporate Retained Operating Margin / Platform Equity**.
- **Super Admin Visual Representation:**
  - **Metric Card 1: Gross Platform Cash Inflows:** Total lifetime payments received via Paystack, Flutterwave, and verified bank transfers.
  - **Metric Card 2: Member Wallet Liabilities:** Total unwithdrawn cash owed to users (`SELECT COALESCE(SUM(amount), 0) FROM wallet_ledger WHERE status = 'AVAILABLE'`).
  - **Metric Card 3: Platform Retained Operating Margin:** True platform earnings (`Inflows - Liabilities - Production Capex Pools`).
  - **Metric Card 4: Liquidity Coverage Ratio (LCR):** `(Gateway Available Balance / Member Wallet Liabilities) × 100%`. Must remain ≥ 100% at all times.
- **Pre-Payout Solvency Shield in Disbursal Engine (Milestone 4):**
  - When the admin triggers or schedules a batch withdrawal, the Payout Engine executes an automated solvency check:
    ```typescript
    const totalPendingPayouts = await getPendingPayoutBatchSum();
    const availableGatewayLiquidity = await gatewayService.getAvailableBalance();
    if (availableGatewayLiquidity < totalPendingPayouts) {
      throw new InsufficientPlatformLiquidityError('Gateway liquidity reserve below required payout threshold');
    }
    ```
  - Disbursals are debited strictly against individual member wallet rows on `wallet_ledger` without touching or diluting retained company profit.

---

### 4.3. Product Return & Commission Clawback Math
- When an order is refunded, any commissions paid on that order are calculated.
- The system inserts a negative entry (`type = 'CLAWBACK'`, `amount = -commission`) linked to the recipient's ledger.
- If the member's balance becomes negative, future earnings automatically offset the deficit until the ledger is back in the black.

---

## 5. WEBHOOK & IDEMPOTENCY SPECIFICATION

### 5.1. Dual Webhook Infrastructure
Both **Paystack** and **Flutterwave** must hit backend endpoints with HMAC signature validation:
- Paystack: `/api/v1/webhooks/paystack` (Verifies `x-paystack-signature` using SHA512 of raw body).
- Flutterwave: `/api/v1/webhooks/flutterwave` (Verifies `verif-hash` header against `FLW_SECRET_HASH`).

### 5.2. Atomic Order Settlement Flow
When a `charge.completed` event is received:
1. **Idempotency Check:** Look up `transaction_ref` in `payment_transactions`. If already `SUCCESS`, return HTTP 200 immediately.
2. **Begin DB Transaction:**
   - Mark `payment_transactions.status = 'SUCCESS'`.
   - Update `orders.status = 'PAID'`.
   - If Green Card registration:
     - Activate profile (`is_active = true`, assign Green Card number).
     - Run 5×7 auto-placement algorithm.
     - Credit ₦1,000 to Sponsor ledger (`REFERRAL_BONUS`).
     - Credit ₦50 to each of the 6 Core Drivers (`CORE_DRIVER_BONUS`).
   - If Slot Purchase:
     - Insert/update `slot_subscriptions`.
     - Insert member into `farm_records` for the target Group Farm.
     - Credit ₦500 to Sponsor ledger (`SLOT_BONUS`).
   - If Welcome Pack / Product:
     - Distribute 40% margin up 7 levels of the 5×7 placement tree (`MATRIX_COMMISSION`, status conditioned on the 5-direct rule).
3. **Commit Transaction & Return HTTP 200.**

---

## 6. PRODUCTION BASELINE AUDIT (AS OF SEPT 7, 2026)

Verified real-time database snapshot queried directly from PostgreSQL:

| Metric | Database Count | Senior Architectural Analysis |
| :--- | :--- | :--- |
| **Total Auth Users** | **538** | Total unique users who have completed initial sign-up credentials in `auth.users`. |
| **Total Profiles** | **317** | Total rows in `public.profiles`. Discrepancy of **221 users** confirms the legacy bug where profile rows were only created lazily upon visiting the dashboard. |
| **Members with Green Card ID** | **31** | Members who reached official Green Card status and had a unique sequential Member ID (`AGC-XXXXXX-YYYY`) generated. |
| **Active Green Card Subscriptions** | **38** | Members with an active, unexpired plan row in `subscriptions` (`plan = 'green_card' AND status = 'active' AND expires_at > NOW()`). |

| **Grand Gross Revenue** | **₦20,655,900.00** | Total inward verified cash received across slot subscriptions and offline/other payments. |
| **Total Active Slots** | **3,011 slots** | Calculated from active Capex pool (₦10,538,500 / ₦3,500) and commissions (₦1,505,500 / ₦500). |
| **Production Capex Pool** | **₦10,538,500.00** | Dedicated capital expenditure for substrate bags (2 bags/slot = 6,022 bags), fruiting house, and labor. |
| **Affiliate Commissions Due** | **₦1,505,500.00** | 10% direct sponsor bonus liabilities earned across the 3,011 active slots (₦500/slot). |
| **Estimated Net Company Profit** | **₦8,139,050.00** | Total platform operating gross profit / margin (~39.4% effective margin including other payments). |
| **Unique Registered Paying Accounts** | **326** | Total registered users who have completed at least one monetary payment. |
| **Unique Farm Slot Owners** | **92** | Members with active credited slots assigned in `farm_records`. |
| **Grand Total Unique Paying Individuals** | **327** | Combined deduplicated humans across registered web users and offline co-op members. |

### 6.1. Breakdown of Paying Users by Category (326 Accounts)
| Payment Category | Total Users | Analysis |
| :--- | :--- | :--- |
| **Green Card Membership Only** | **220** | Paid for Green Card access/training/affiliate privileges but have not purchased farm slots. |
| **Both Slots & Farm Setup/Support** | **88** | Core farm participants with active slot subscriptions and infrastructure setup fees. |
| **Slots Only (`slot_subscriptions`)** | **18** | Purchased farm slots via checkout but lack separate legacy setup/support records. |
| **Total** | **326** | Complete universe of paying platform members. |

### 6.2. Compressed Farm Groups & Operational Inventory (16 Groups Total)

| Category | Groups | Total Slots | Top Performing Groups | Operational Threshold Status |
| :--- | :--- | :--- | :--- | :--- |
| **Mushroom Village** | 8 | **4,062** | • **SUSTENANCE FARMING** (Taofik Oyekan): **2,343 slots**<br>• **Pioneers' farm** (Oyebukunola Kogbe): **1,305 slots**<br>• **LAND OF GOSHEN** (Philip Olasunkanmi): **252 slots**<br>• **Favoured Community** (Abosede Adeyemo): **135 slots** | • **Sustenance & Pioneers:** Fully Funded (exceeds 1,000 capacity)<br>• **Goshen:** Ready for Production Kickoff (crossed 250 threshold)<br>• **Others (5 groups, 27 slots):** Incubation / Formation |
| **Gingertown** | 7 | **632** | • **Gingertown Pioneers** (470 slots)<br>• **Goshen Ginger** (92 slots)<br>• **Sustenance Ginger** (26 slots) | Legacy ginger production clusters |
| **Organic FoodNation** | 1 | **2** | • **Water Farm plus** (2 slots) | Pre-launch pilot |

> **Top Growth Drivers:** Taofik Oyekan (**2,369 slots** across groups), Oyebukunola Kogbe (**1,775 slots** across groups), Philip Olasunkanmi (**344 slots** across groups).

---



---

## 7. MARKET DEMAND & ECONOMIC RISK HEDGE (EXTERNAL OFF-TAKERS)

### 7.1. National Supply Deficit (Nigeria Market 2025–2026)
- **National Consumption:** ~1,200 tonnes annually.
- **Domestic Production:** ~300 tonnes annually.
- **National Deficit:** **900-tonne unmet demand** driven by the hospitality sector (hotels, high-end restaurants) and health-conscious urban consumers.

### 7.2. Price Realities & Price-Floor Safety Buffer
| Channel | Nigerian Market Price (per kg) | Agroheal Baseline Math | Safety Buffer |
| :--- | :--- | :--- | :--- |
| **Wholesale / Farm Gate** | **₦2,500 – ₦6,000 / kg** | **₦2,500 / kg** | **Absolute worst-case floor** |
| **Urban Retail / Supermarkets (Lagos/Abuja)** | **₦7,280 – ₦13,195 / kg** | ₦2,500 / kg | **+190% to +420% upside buffer** |
| **Dehydrated / Dried Mushrooms** | **₦16,000+ / kg** | N/A | **+540% value-add hedge** (12-month shelf life) |

### 7.3. System Solvency Guarantee
Agroheal's per-slot harvest returns (Cycle 1 ₦5,000 revenue; Cycle 2+ ₦10,000 revenue) are modeled strictly on **₦2,500/kg**. Because this is the lowest wholesale tier in Nigeria, **the platform does NOT depend on internal member purchases to sustain payouts**. If internal network consumption stalls, bulk sales to external off-takers (supermarkets, food processors, dried export buyers) ensure continuous solvency.
