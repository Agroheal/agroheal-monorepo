-- Applied directly to the live DB on 2026-09-03 after discovering that any
-- signed-up user could escalate themselves to role='admin' and that several
-- tables had unconditional "authenticated = full access" policies masking
-- their intended per-row / admin-only scoping. Verified end-to-end against
-- production with disposable throwaway accounts (created and deleted in the
-- same session): the exploit is blocked, legitimate own-row writes and real
-- admin actions still work.
--
-- Background: column-level REVOKE on profiles.role has NO effect here,
-- because Supabase grants table-level privileges to authenticated/anon by
-- default (GRANT ALL ON ALL TABLES ...), and a column-level REVOKE cannot
-- override a broader table-level GRANT. The only reliable way to restrict a
-- single column is a trigger.

-- 1. Block self (or anyone-but-admin/service-role) role escalation.
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM COALESCE(OLD.role, 'user') THEN
    IF auth.role() = 'service_role' THEN
      RETURN NEW;
    END IF;
    IF is_admin(auth.uid()) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Not authorized to change role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_self_escalation
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 2. These three granted unrestricted ALL access to any authenticated user
--    on payment/subscription/slot tables. The existing 'own row' and
--    is_admin() policies on the same tables already cover every legitimate
--    path (regular users write only their own rows; admins via is_admin()),
--    so these are pure backdoors with no legitimate purpose.
DROP POLICY IF EXISTS allow_all_authenticated_writes_subscriptions ON public.subscriptions;
DROP POLICY IF EXISTS allow_all_authenticated_writes_slot_subscriptions ON public.slot_subscriptions;
DROP POLICY IF EXISTS allow_all_authenticated_writes_other_payments ON public.other_payments;

-- 3. These three were named like admin-only policies but their actual
--    condition was literally `true` — every authenticated user, not just
--    admins, could manage any farm group / farm record / farm expense.
--    Coordinator-scoped policies already exist separately for the
--    legitimate self-service case; these just needed their condition fixed
--    to match their name.
ALTER POLICY "Admins can manage all farm groups" ON public.farm_groups
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
ALTER POLICY "Admins can manage all farm records" ON public.farm_records
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
ALTER POLICY "Allow authenticated users full access to expenses" ON public.farm_expenses
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
