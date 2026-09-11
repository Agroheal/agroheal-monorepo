# AGROHEAL API CONTRACT (EXPRESS BACKEND)

The Express backend (`agroheal-server`) runs authoritatively between the React frontends (`apps/web` and `apps/admin`) and PostgreSQL/Supabase.

---

## 1. Authentication & Security
- **Header:** `Authorization: Bearer <Supabase_Access_Token>`
- **Middleware:** Express verifies the JWT using Supabase Auth (`supabase.auth.getUser(token)`).
- Attaches `req.user = { id, email, role }`.

---

## 2. Milestone 1 Endpoints (Foundation & Registration)
- `POST /api/v1/auth/register-verify`
  - Verifies Paystack/Flutterwave transaction for ₦2,000 Green Card registration.
  - Inserts ₦1,000 referral credit to sponsor in `wallet_ledger`.
  - Accrues ₦50 Core Driver Growth Bonus to Developer in `wallet_ledger`.
  - Generates unique Green Card Member ID (`AGH-YYYY-XXXX`).
- `GET /api/v1/member/green-card`
  - Returns member Green Card details & status.
- `GET /api/v1/courses`
  - Returns organic farming courses and module progress for authenticated member.

---

## 3. Milestone 2 Endpoints (Activation, MLM & Wallet)
- `POST /api/v1/checkout/activate`
  - Initiates or verifies the ₦10,000 Wealth Creation bundle (₦5k Mushroom Power + ₦5k compulsory slot + optional extra slots).
  - Triggers 5×7 matrix placement and spillover logic.
  - Generates ₦500 direct slot bonus.
  - Generates 7-level product commissions (up to 40% cap) to qualified uplines.
  - Records ₦200 to Leadership Pool ledger, ₦100 to Sustainability reserve ledger.
  - Updates monthly PQV record for the buyer.
- `GET /api/v1/genealogy/matrix`
  - Returns tree node hierarchy (5×7 matrix) for organogram rendering.
- `GET /api/v1/genealogy/sponsorship`
  - Returns direct personally sponsored downline.
- `GET /api/v1/wallet/summary`
  - Returns:
    - `available_balance`: Total withdrawable cash.
    - `pending_balance`: Clearances in progress.
    - `held_balance`: Under review.
    - `total_withdrawn`: Historical payouts.
- `GET /api/v1/wallet/ledger`
  - Paginated list of immutable ledger entries with transaction links and source orders.
- `GET /api/v1/pqv/status`
  - Current calendar month PQV progress towards the ₦5,000 threshold.

---

## 4. Milestone 3 Endpoints (Farms & Production Cycles)
- `GET /api/v1/farms/my-slots`
  - Returns member's active slots and assigned group farm.
- `POST /api/v1/cycles/draft`
  - Coordinator drafts a cycle production close report.
- `POST /api/v1/cycles/:id/validate`
  - Validator marks report as validated and moves state to `pending_approval`.
- `POST /api/v1/cycles/:id/approve`
  - Reviewer/Accountant approves report. Enforces maker-checker (fails if actor drafted or validated).
- `POST /api/v1/cycles/:id/post`
  - Posts immutable harvest proceeds to slot owners' wallets.

---

## 5. Milestone 4 Endpoints (Withdrawals & Admin Governance)
- `POST /api/v1/withdrawals/request`
  - Validates available balance ≥ ₦2,000.
  - Debits wallet ledger and transitions to `requested`.
- `POST /api/v1/admin/withdrawals/:id/approve`
  - Initiates Paystack Transfer payout.
- `POST /api/v1/webhooks/paystack`
  - Webhook listener for charge successes, transfer callbacks, and reversals.
- `GET /api/v1/admin/reconciliation`
  - Reconciles gateway receipts vs orders vs commissions vs withdrawals.
