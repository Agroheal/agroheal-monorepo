# AGROHEAL DATABASE ARCHITECTURE & SCALING BLUEPRINT

*Authoritative PostgreSQL schema specification, relational design, RLS security policies, verified production state, and scaling architecture for the AgroHeal Green Card Ecosystem.*

---

## 1. Verified Production State & Data Integrity

- **Database Engine:** PostgreSQL 15+ hosted on Supabase (`ptowfacejneezksyhntk` prod / `exzomqrswbcuqeipatfo` dev).
- **Public Tables:** 20 verified relational tables with 100% Row-Level Security (RLS) coverage.
- **Auth & Profile Parity:** 100% 1-to-1 sync between `auth.users` and `public.profiles` (539 accounts, zero orphan accounts).
- **Marketing Leads:** 103 unconfirmed signup leads preserved in `auth.users` and exported to [`docs/unconfirmed_marketing_leads.csv`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/docs/unconfirmed_marketing_leads.csv).
- **Canonical Farm Groups (Physical Consolidation):**
  1. Pioneers Farm (58 records)
  2. Goshen Farm (39 records)
  3. Favoured Farm (21 records)
  4. Sustenance Farm (16 records)
  5. Pacesetters Farm (10 records)
  6. Alpha Farm (1 record)
  7. Eagles Farm (1 record)
  *(All 146 farm records preserved with zero data loss).*

---

## 2. Core Schema Blueprint & Relational Types

### 2.1. Identity, Roles & Member Profiles
```sql
-- Role enum (6 canonical roles)
CREATE TYPE user_role AS ENUM (
  'member',
  'coordinator',
  'reviewer', -- Farm Accountant
  'admin',
  'super_admin',
  'support'
);

-- Member profile extension
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.profiles(id),       -- Direct referrer
  ADD COLUMN IF NOT EXISTS placement_parent_id UUID REFERENCES public.profiles(id), -- 5x7 matrix parent
  ADD COLUMN IF NOT EXISTS matrix_position SMALLINT CHECK (matrix_position BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS matrix_depth INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS member_id TEXT UNIQUE, -- e.g. AGH-2026-0042
  ADD COLUMN IF NOT EXISTS is_wealth_creation_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_five_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14, 2) DEFAULT 0.00;

-- Privilege escalation guard
CREATE OR REPLACE FUNCTION trg_prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != OLD.role AND (auth.jwt() ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Role mutations require super_admin privileges';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2. Wallet & Immutable Double-Entry Ledger
```sql
CREATE TYPE ledger_entry_type AS ENUM (
  'green_card_referral',       -- ₦1,000 to direct sponsor
  'farm_slot_referral',        -- ₦500 per slot to direct sponsor
  'direct_retail_commission',   -- 12% on product retail sale
  'level_1_commission',        -- 5.0%
  'level_2_commission',        -- 3.5%
  'level_3_commission',        -- 3.0%
  'level_4_commission',        -- 2.5%
  'level_5_commission',        -- 2.5%
  'level_6_commission',        -- 2.5%
  'level_7_commission',        -- 2.5%
  'core_driver_growth_bonus',  -- ₦50 to Core Driver per registration
  'farm_cycle_allocation',     -- Quarterly harvest distribution
  'withdrawal',                -- NUBAN bank transfer
  'reversal'                   -- Correcting debit/credit or refund clawback
);

CREATE TYPE ledger_status AS ENUM (
  'pending',     -- Awaiting clearance or verification
  'available',   -- Fully withdrawable cash
  'locked',      -- Held pending PQV or 5-direct qualification
  'pending_payout', -- In flight to payment gateway
  'withdrawn'    -- Cleared to external bank
);

CREATE TABLE public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14, 2) NOT NULL, -- Positive = credit, Negative = debit
  entry_type ledger_entry_type NOT NULL,
  status ledger_status NOT NULL DEFAULT 'available',
  source_order_id UUID,
  source_payment_id UUID,
  source_cycle_id UUID,
  reversal_of_id UUID REFERENCES public.wallet_ledger(id),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_wallet_ledger_user ON public.wallet_ledger(user_id, status);
CREATE INDEX idx_wallet_ledger_source ON public.wallet_ledger(source_order_id);
```

### 2.3. Leadership Pool & Sustainability Sub-Ledger
```sql
CREATE TABLE public.leadership_pool_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_order_id UUID,
  amount NUMERIC(14, 2) NOT NULL, -- 4% leadership / 2% sustainability
  pool_type TEXT NOT NULL DEFAULT 'leadership_pool', -- 'leadership_pool' or 'sustainability_reserve'
  status TEXT NOT NULL DEFAULT 'accumulated', -- 'accumulated', 'distributed'
  distribution_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.4. Products, Orders & Slot Subscriptions
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(14, 2) NOT NULL,
  pv NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- Point volume for monthly PQV
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  total_amount NUMERIC(14, 2) NOT NULL,
  total_pv NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  payment_gateway TEXT NOT NULL, -- 'paystack', 'flutterwave', 'wallet'
  gateway_reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.slot_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  farm_group_id UUID REFERENCES public.farm_groups(id),
  slots INT NOT NULL DEFAULT 1,
  amount NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.5. Group Farms, Farm Records & Accounting
```sql
CREATE TABLE public.farm_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'mushroom',
  coordinator_id UUID REFERENCES public.profiles(id),
  total_capacity_slots INT NOT NULL DEFAULT 1000,
  active_slots INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.farm_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_group_id UUID NOT NULL REFERENCES public.farm_groups(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  bags_allocated INT NOT NULL DEFAULT 2,
  slots_count INT NOT NULL DEFAULT 1,
  setup_fee_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  support_fee_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(farm_group_id, user_id)
);
```

### 2.6. Farm Production Cycles & Harvest Distributions
```sql
CREATE TYPE cycle_status AS ENUM (
  'active',
  'draft',
  'pending_approval',
  'approved',
  'distributed'
);

CREATE TABLE public.farm_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_group_id UUID NOT NULL REFERENCES public.farm_groups(id),
  cycle_number INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_bags_fruiting INT NOT NULL,
  total_yield_kg NUMERIC(10, 2) NOT NULL,
  gross_revenue NUMERIC(14, 2) NOT NULL,
  continuation_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  distributable_balance NUMERIC(14, 2) NOT NULL,
  status cycle_status NOT NULL DEFAULT 'active',
  drafted_by UUID REFERENCES auth.users(id),
  validated_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);
```

---

## 3. Business Logic Implementation & Stored Procedures

### 3.1. Unsubscribed Member Policy & ₦10,000 Wallet Activation
Unsubscribed members accumulate referral earnings in their wallet safely. Bank withdrawals lock until they subscribe to a project or activate Wealth Creation directly from their balance:

```sql
CREATE OR REPLACE FUNCTION public.subscribe_with_wallet_balance(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_balance NUMERIC(14, 2);
  v_first_farm_id UUID;
BEGIN
  -- 1. Check available balance
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM public.wallet_ledger
  WHERE user_id = p_user_id AND status = 'available';

  IF v_balance < 10000.00 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient wallet balance. ₦10,000 required.');
  END IF;

  -- 2. Deduct ₦10,000 atomically
  INSERT INTO public.wallet_ledger (
    user_id, amount, entry_type, status, description
  ) VALUES (
    p_user_id, -10000.00, 'reversal', 'withdrawn', 'Wealth Creation Team activation from wallet balance'
  );

  -- 3. Select default active group farm cluster
  SELECT id INTO v_first_farm_id FROM public.farm_groups WHERE category = 'mushroom' LIMIT 1;

  -- 4. Create compulsory first farm slot
  INSERT INTO public.slot_subscriptions (
    user_id, farm_group_id, slots, amount, status
  ) VALUES (
    p_user_id, v_first_farm_id, 1, 5000.00, 'active'
  );

  -- 5. Mark profile as Wealth Creation active
  UPDATE public.profiles
  SET is_wealth_creation_active = true,
      wallet_balance = wallet_balance - 10000.00
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Wealth Creation activated successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Route Security Hierarchy (Public vs. Protected vs. Gated)

### 4.1. Public Informational Routes (No Auth Required)
- `/` — Homepage & LEAP Value Proposition
- `/how-it-works` — Framework & Pillar Overview
- `/courses` — Public Course Catalog Preview (Top 7 Courses)
- `/farm-slots` — Cluster Economics & Farm Slot Overview
- `/affiliate` — 5×7 Producer-Consumer Compensation Model
- `/about` — AgroHeal Mission & History
- `/careers` — Career & Volunteer Opportunities
- `/legal`, `/terms`, `/privacy` — Terms of Service & Legal Agreements
- `/signin`, `/signup`, `/forgot-password`, `/reset-password` — Authentication
- `/verify-card/:memberId` — Digital Green Card QR Verification

### 4.2. Member Portal Routes (Session Protected — All Registered Users)
- `/dashboard` — Member HUD, Referral Stats, Wallet Balance
- `/dashboard/transactions` — Double-Entry Transaction Ledger
- `/dashboard/compound-referrals` — 5×7 Organogram & Team Downline Directory
- `/dashboard/profile` — Account Profile & Credentials
- `/dashboard/kin` — Next-of-Kin Succession Details
- `/dashboard/legal` — In-Dashboard Legal Agreement (**Unrestricted**)

### 4.3. Paid Project Routes (Gated by `<RequireSubscription>`)
- `/dashboard/courses`, `/dashboard/courses/:slug` — Organic Agronomy LMS Classroom
- `/dashboard/slots-subscription` — Slot Subscriptions & Management
- `/dashboard/group-farm-accounts` — Group Farm Accounting Ledger

---

## 5. Scaling Recommendations & Best Practices

1. **Transactional RPC Enforcement:** Route all wallet operations through transactional RPCs (`public.subscribe_with_wallet_balance`, `public.process_order_commissions`) to prevent concurrent write race conditions.
2. **Newsletter Bounce Automation:** Connect newsletter delivery services (Resend / Mailchimp / Brevo) webhooks to automatically flag bouncing emails in `auth.users` and `profiles`.
3. **Audit Event Log Retention:** Partition `audit_events` by month to maintain sub-second index lookups as total system transactions cross hundreds of thousands.
