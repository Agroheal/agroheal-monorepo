-- ==============================================================================
-- AGROHEAL 5-ROLE RBAC SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Phase 1.2: Roles: 'super_admin', 'admin', 'support', 'coordinator', 'user'
-- ==============================================================================

-- 1. Enforce Role Check Constraint on profiles table
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS chk_profiles_role;

ALTER TABLE public.profiles 
  ADD CONSTRAINT chk_profiles_role 
  CHECK (role IN ('super_admin', 'admin', 'support', 'coordinator', 'user'));

-- 2. Update is_admin helper to include super_admin (fixes super_admin lockout bug)
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role IN ('admin', 'super_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- 3. Create is_super_admin helper
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, anon;

-- 4. Create is_coordinator_for_farm helper
CREATE OR REPLACE FUNCTION public.is_coordinator_for_farm(p_farm_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_groups
    WHERE id = p_farm_id AND coordinator_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_coordinator_for_farm(uuid, uuid) TO authenticated, anon;

-- 5. Fix RLS on farm_expenses:
-- Rule: Farm Coordinators ALONE manage operating expenses on their assigned farm group
--       Platform Admins CANNOT manage farm expenses (must not tamper with ground operations)
--       Super Admin retains audit/maintenance override
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access to expenses" ON public.farm_expenses;
DROP POLICY IF EXISTS "Admins can manage all farm expenses" ON public.farm_expenses;
DROP POLICY IF EXISTS "Coordinators manage expenses for assigned farm" ON public.farm_expenses;
DROP POLICY IF EXISTS "Authenticated users can view farm expenses" ON public.farm_expenses;

-- Read policy: Authenticated users (members of farm, coordinators, admins) can view expenses for transparency
CREATE POLICY "Authenticated users can view farm expenses"
  ON public.farm_expenses FOR SELECT
  USING (auth.role() = 'authenticated');

-- Write policy: Designated Farm Coordinator ALONE (and Super Admin for emergency audit)
CREATE POLICY "Coordinators manage expenses for assigned farm"
  ON public.farm_expenses FOR ALL
  USING (
    public.is_coordinator_for_farm(farm_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_coordinator_for_farm(farm_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- 6. Fix RLS on farm_records:
-- Rule: Platform Admins + Designated Farm Coordinators can manage member records
ALTER TABLE public.farm_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all farm records" ON public.farm_records;
DROP POLICY IF EXISTS "Admins and Coordinators can manage farm records" ON public.farm_records;

CREATE POLICY "Admins and Coordinators can manage farm records"
  ON public.farm_records FOR ALL
  USING (
    public.is_admin(auth.uid())
    OR public.is_coordinator_for_farm(farm_id, auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.is_coordinator_for_farm(farm_id, auth.uid())
  );

-- 7. Fix RLS on farm_groups:
-- Rule: Platform Admins (admin, super_admin) can create and manage farm groups
ALTER TABLE public.farm_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all farm groups" ON public.farm_groups;
DROP POLICY IF EXISTS "Platform admins can manage farm groups" ON public.farm_groups;

CREATE POLICY "Platform admins can manage farm groups"
  ON public.farm_groups FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
