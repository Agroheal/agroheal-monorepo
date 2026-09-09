-- Migration: Add farm_sales table, produce sales revenue tracking, and audit attribution/timestamps
-- Run on Supabase: ptowfacejneezksyhntk

-- 1. Create public.farm_sales table
CREATE TABLE IF NOT EXISTS public.farm_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farm_groups(id) ON DELETE CASCADE,
  produce_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL,
  buyer_name TEXT,
  sales_channel TEXT DEFAULT 'Offtaker',
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_farm_sales_farm_id ON public.farm_sales(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_sales_sale_date ON public.farm_sales(sale_date);

ALTER TABLE public.farm_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view farm sales" ON public.farm_sales;
DROP POLICY IF EXISTS "Coordinators can manage farm sales" ON public.farm_sales;
DROP POLICY IF EXISTS "Admins can manage farm sales" ON public.farm_sales;

CREATE POLICY "Users can view farm sales"
  ON public.farm_sales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Coordinators can manage farm sales"
  ON public.farm_sales FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farm_groups
      WHERE farm_groups.id = farm_sales.farm_id
        AND farm_groups.coordinator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farm_groups
      WHERE farm_groups.id = farm_sales.farm_id
        AND farm_groups.coordinator_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage farm sales"
  ON public.farm_sales FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. Add audit attribution and timestamps to farm_expenses
ALTER TABLE public.farm_expenses 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Add audit attribution to farm_records
ALTER TABLE public.farm_records
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
