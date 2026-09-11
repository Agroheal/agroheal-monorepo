# AGROHEAL DATABASE SCHEMA BLUEPRINT

This blueprint defines the target PostgreSQL schema to be hosted on Supabase and managed by the Express API / Supabase migrations.

---

## 1. Identity, Roles & Members
```sql
-- Role enum (PRD Section 3 / SRS Section 5)
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
  ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.profiles(id),       -- Who invited them (unlimited direct referrals)
  ADD COLUMN IF NOT EXISTS placement_parent_id UUID REFERENCES public.profiles(id), -- Matrix parent in 5x7 tree
  ADD COLUMN IF NOT EXISTS matrix_position SMALLINT CHECK (matrix_position BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS matrix_depth INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS member_id TEXT UNIQUE, -- e.g. AGH-2026-0042
  ADD COLUMN IF NOT EXISTS is_wealth_creation_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_five_completed BOOLEAN DEFAULT false;
```

---

## 2. Wallet & Immutable Ledger Subsystem
```sql
CREATE TYPE ledger_entry_type AS ENUM (
  'green_card_referral',      -- ₦1,000 to direct sponsor
  'farm_slot_referral',       -- ₦500 per slot to direct sponsor
  'direct_retail_commission',  -- 12% on product
  'level_1_commission',       -- 5%
  'level_2_commission',       -- 3.5%
  'level_3_commission',       -- 3%
  'level_4_commission',       -- 2.5%
  'level_5_commission',       -- 2.5%
  'level_6_commission',       -- 2.5%
  'level_7_commission',       -- 2.5%
  'core_driver_growth_bonus', -- ₦50 to Developer per registration
  'farm_cycle_allocation',    -- Distributed from approved farm cycle
  'withdrawal',               -- Payout request
  'reversal'                  -- Correcting debit/credit
);

CREATE TYPE ledger_status AS ENUM (
  'pending',    -- Awaiting clearance / return window
  'available',  -- Withdrawable
  'held',       -- Policy hold / pending investigation
  'withdrawn'   -- Successfully paid out
);

CREATE TABLE public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14, 2) NOT NULL, -- Positive for credits, negative for debits
  entry_type ledger_entry_type NOT NULL,
  status ledger_status NOT NULL DEFAULT 'available',
  source_order_id UUID,
  source_payment_id UUID,
  source_cycle_id UUID,
  reversal_of_id UUID REFERENCES public.wallet_ledger(id),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_wallet_ledger_user ON public.wallet_ledger(user_id, status);
CREATE INDEX idx_wallet_ledger_source ON public.wallet_ledger(source_order_id);
```

---

## 3. Leadership Pool & Sustainability Sub-Ledger
```sql
CREATE TABLE public.leadership_pool_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_order_id UUID,
  amount NUMERIC(14, 2) NOT NULL, -- 4% of product value
  pool_type TEXT NOT NULL DEFAULT 'leadership_pool', -- 'leadership_pool' or 'sustainability_reserve'
  status TEXT NOT NULL DEFAULT 'accumulated', -- 'accumulated', 'distributed'
  distribution_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Products, Orders & Farm Slots
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, -- e.g. "Mushroom Power"
  description TEXT,
  price NUMERIC(12, 2) NOT NULL, -- ₦5,000
  commissionable_percentage NUMERIC(5, 2) NOT NULL DEFAULT 40.00, -- Maximum 40%
  is_activation_product BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  total_amount NUMERIC(12, 2) NOT NULL,
  product_amount NUMERIC(12, 2) NOT NULL,
  slot_amount NUMERIC(12, 2) NOT NULL,
  slot_quantity INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_payment', -- pending_payment, paid, fulfilled, cancelled, refunded
  payment_reference TEXT,
  payment_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL
);

CREATE TABLE public.farm_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  order_id UUID REFERENCES public.orders(id),
  farm_group_id UUID REFERENCES public.farm_groups(id), -- Nullable if in holding queue
  status TEXT NOT NULL DEFAULT 'active', -- 'holding', 'assigned', 'completed'
  is_compulsory_first_slot BOOLEAN DEFAULT false,
  purchase_date TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Monthly PQV Engine
```sql
CREATE TABLE public.pqv_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id),
  calendar_month TEXT NOT NULL, -- 'YYYY-MM'
  accumulated_pqv NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Threshold: ₦5,000
  is_qualified BOOLEAN NOT NULL DEFAULT false,
  snapshot_taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, calendar_month)
);
```

---

## 6. Production Cycles & Maker-Checker Audit
```sql
CREATE TYPE cycle_state AS ENUM (
  'draft',
  'validating',
  'pending_approval',
  'approved',
  'posted',
  'closed'
);

CREATE TABLE public.production_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_group_id UUID NOT NULL REFERENCES public.farm_groups(id),
  cycle_name TEXT NOT NULL, -- e.g. "Mushroom Cycle 1 - 2026Q1"
  state cycle_state NOT NULL DEFAULT 'draft',
  start_date DATE NOT NULL,
  projected_end_date DATE,
  actual_end_date DATE,
  
  -- Metrics
  slot_count INT NOT NULL DEFAULT 0,
  bag_count INT NOT NULL DEFAULT 0,
  harvest_quantity_kg NUMERIC(10, 2) DEFAULT 0,
  sales_quantity_kg NUMERIC(10, 2) DEFAULT 0,
  gross_revenue NUMERIC(14, 2) DEFAULT 0,
  continuation_cost NUMERIC(14, 2) DEFAULT 0,
  distributable_balance NUMERIC(14, 2) DEFAULT 0,
  
  -- Maker-Checker Segregation of Duties (SRS Section 5)
  drafted_by UUID REFERENCES auth.users(id),
  drafted_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  posted_by UUID REFERENCES auth.users(id),
  posted_at TIMESTAMPTZ,
  
  -- Constraint: Approver cannot be drafter or validator
  CONSTRAINT chk_maker_checker_segregation CHECK (
    approved_by IS NULL OR (approved_by != drafted_by AND approved_by != validated_by)
  )
);
```

---

## 7. Withdrawals Subsystem
```sql
CREATE TYPE withdrawal_state AS ENUM (
  'requested',
  'review',
  'approved',
  'processing',
  'paid',
  'failed',
  'reversed'
);

CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 2000.00), -- Minimum ₦2,000 (BR-09)
  state withdrawal_state NOT NULL DEFAULT 'requested',
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  provider_reference TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

## 8. Audit Log Subsystem
```sql
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g. "cycle.approved", "withdrawal.initiated", "commission.reversed"
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
