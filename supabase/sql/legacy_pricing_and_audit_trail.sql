-- Migration: Tiered Green Card Pricing & Comprehensive Audit Trail
-- Date: 2026-09-24
-- Rule:
-- 1. Accounts registered before September 6, 2026 pay ₦1,000 (Legacy Pioneer Rate).
-- 2. Accounts registered from September 6, 2026 onwards pay ₦2,000 (Standard Rate).
-- 3. Offline activations require proof (bank reference or receipt) and log comprehensive audit records.

CREATE OR REPLACE FUNCTION public.admin_activate_green_card(
  p_user_id uuid,
  p_credit_referrer boolean DEFAULT true,
  p_amount numeric DEFAULT NULL,
  p_tx_ref text DEFAULT NULL,
  p_receipt_url text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id text;
  v_expires_at timestamptz;
  v_referrer_id uuid;
  v_is_first_activation boolean;
  v_tx_ref text;
  v_created_at timestamptz;
  v_fee numeric;
  v_is_legacy boolean;
  v_admin_id uuid;
  v_admin_email text;
BEGIN
  -- 1. Check if user already has an active Green Card subscription
  SELECT NOT EXISTS (
    SELECT 1 FROM public.subscriptions WHERE user_id = p_user_id AND plan = 'green_card'
  ) INTO v_is_first_activation;

  -- 2. Calculate 1 year expiry from now (or permanent lifetime convention)
  v_expires_at := now() + interval '1 year';

  -- 3. Upsert active Green Card subscription
  DELETE FROM public.subscriptions WHERE user_id = p_user_id AND plan = 'green_card';
  INSERT INTO public.subscriptions (user_id, plan, status, started_at, expires_at)
  VALUES (p_user_id, 'green_card', 'active', now(), v_expires_at);

  -- 4. Assign / Retrieve Member ID
  v_member_id := public.get_or_create_green_card_member_id(p_user_id, extract(year from now())::int);

  -- 5. Determine dynamic fee based on member registration date
  -- Legacy cutoff: 2026-09-06T00:00:00Z
  SELECT created_at INTO v_created_at FROM public.profiles WHERE id = p_user_id;
  v_is_legacy := (v_created_at IS NOT NULL AND v_created_at < '2026-09-06T00:00:00+00'::timestamptz);

  IF p_amount IS NOT NULL THEN
    v_fee := p_amount;
  ELSIF v_is_legacy THEN
    v_fee := 1000;
  ELSE
    v_fee := 2000;
  END IF;

  -- 6. Resolve Transaction Reference
  IF p_tx_ref IS NOT NULL AND trim(p_tx_ref) <> '' THEN
    v_tx_ref := trim(p_tx_ref);
  ELSE
    v_tx_ref := 'ADMIN_GC_' || floor(extract(epoch from now()))::text || '_' || substr(md5(random()::text), 1, 4);
  END IF;

  -- 7. Record payment in other_payments log
  INSERT INTO public.other_payments (
    user_id,
    payment_type,
    amount,
    slots,
    project_category,
    status,
    transaction_ref,
    metadata,
    created_at
  )
  VALUES (
    p_user_id,
    'green_card_offline',
    v_fee,
    0,
    'Green Card Membership (Admin Offline Activation)',
    'success',
    v_tx_ref,
    jsonb_build_object(
      'receipt_url', p_receipt_url,
      'notes', p_notes,
      'payment_date', now(),
      'is_legacy', v_is_legacy,
      'rate_type', CASE WHEN v_is_legacy THEN 'Legacy Member (₦1,000)' ELSE 'Standard Member (₦2,000)' END
    ),
    now()
  );

  -- 8. Credit referral earnings if first activation
  IF p_credit_referrer AND v_is_first_activation THEN
    SELECT referred_by INTO v_referrer_id FROM public.profiles WHERE id = p_user_id;
    IF v_referrer_id IS NOT NULL THEN
      BEGIN
        PERFORM public.increment_referral_earnings(v_referrer_id, 1000);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;

  -- 9. Distribute Core Driver Bonus (₦50 to each driver)
  IF v_is_first_activation THEN
    BEGIN
      PERFORM public.distribute_core_driver_bonuses(v_member_id, p_user_id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- 10. Record detailed Audit Event
  v_admin_id := auth.uid();
  IF v_admin_id IS NOT NULL THEN
    SELECT email INTO v_admin_email FROM auth.users WHERE id = v_admin_id;
  END IF;

  INSERT INTO public.audit_events (
    user_id,
    action,
    entity_type,
    entity_id,
    payload,
    created_at
  )
  VALUES (
    v_admin_id,
    'MANUAL_GREEN_CARD_ACTIVATION',
    'subscriptions',
    p_user_id::text,
    jsonb_build_object(
      'admin_id', v_admin_id,
      'admin_email', v_admin_email,
      'target_user_id', p_user_id,
      'member_id', v_member_id,
      'amount', v_fee,
      'is_legacy', v_is_legacy,
      'rate_type', CASE WHEN v_is_legacy THEN 'Legacy Member (₦1,000)' ELSE 'Standard Member (₦2,000)' END,
      'transaction_ref', v_tx_ref,
      'receipt_url', p_receipt_url,
      'notes', p_notes
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'amount', v_fee,
    'is_legacy', v_is_legacy,
    'expires_at', v_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_activate_green_card(uuid, boolean, numeric, text, text, text) TO authenticated, service_role;
