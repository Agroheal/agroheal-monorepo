-- Migration: Add Core Driver Growth Pool Auto-Distribution (₦50 for Lead Architect, ₦41.67 across 6 core drivers)
-- Date: 2026-09-24

-- 1. Create or replace distribute_core_driver_bonuses function
CREATE OR REPLACE FUNCTION public.distribute_core_driver_bonuses(
  p_member_id text,
  p_source_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver RECORD;
  v_new_bal NUMERIC;
  v_amount NUMERIC;
  v_driver_emails TEXT[] := ARRAY[
    'developerelijah360@gmail.com',
    'estherbola888@gmail.com',
    'ifoodeconomy@gmail.com',
    'davidomokanye141@gmail.com',
    'efortunefb@gmail.com',
    'tonyinyang118@gmail.com',
    'gkygmr56@gmail.com'
  ];
BEGIN
  -- For each of the 7 core drivers
  FOR v_driver IN
    SELECT id, email, wallet_balance
    FROM public.profiles
    WHERE lower(email) = ANY(v_driver_emails)
  LOOP
    -- Elijah gets ₦50.00; the other 6 drivers divide ₦250 equally (₦41.67 each)
    IF lower(v_driver.email) = 'developerelijah360@gmail.com' THEN
      v_amount := 50.00;
    ELSE
      v_amount := 41.67;
    END IF;

    -- Check if bonus already recorded for this driver and member_id to avoid double-crediting
    IF NOT EXISTS (
      SELECT 1 FROM public.wallet_ledger
      WHERE user_id = v_driver.id
        AND category = 'CORE_DRIVER_BONUS'
        AND reference_id = p_member_id
    ) THEN
      -- Increment driver wallet balance
      UPDATE public.profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_amount
      WHERE id = v_driver.id
      RETURNING wallet_balance INTO v_new_bal;

      -- Record ledger entry
      INSERT INTO public.wallet_ledger (
        user_id,
        amount,
        balance_after,
        entry_type,
        category,
        status,
        reference_id,
        description,
        created_at
      ) VALUES (
        v_driver.id,
        v_amount,
        v_new_bal,
        'CREDIT',
        'CORE_DRIVER_BONUS',
        'AVAILABLE',
        p_member_id,
        'Core Driver Growth Pool Share (₦' || v_amount::text || ') - ' || COALESCE(p_member_id, 'Green Card'),
        NOW()
      );
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.distribute_core_driver_bonuses(text, uuid) TO authenticated, service_role;

-- 2. Update admin_activate_green_card to call distribute_core_driver_bonuses
CREATE OR REPLACE FUNCTION public.admin_activate_green_card(
  p_user_id uuid,
  p_credit_referrer boolean DEFAULT true
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
BEGIN
  -- Check if already has a subscription
  SELECT NOT EXISTS (
    SELECT 1 FROM public.subscriptions WHERE user_id = p_user_id AND plan = 'green_card'
  ) INTO v_is_first_activation;

  -- Calculate 1 year expiry from now
  v_expires_at := now() + interval '1 year';

  -- Upsert active Green Card subscription
  DELETE FROM public.subscriptions WHERE user_id = p_user_id AND plan = 'green_card';
  INSERT INTO public.subscriptions (user_id, plan, status, started_at, expires_at)
  VALUES (p_user_id, 'green_card', 'active', now(), v_expires_at);

  -- Assign / Retrieve Member ID
  v_member_id := public.get_or_create_green_card_member_id(p_user_id, extract(year from now())::int);

  -- Record payment in other_payments log
  v_tx_ref := 'ADMIN_GC_' || floor(extract(epoch from now()))::text || '_' || substr(md5(random()::text), 1, 4);
  INSERT INTO public.other_payments (
    user_id,
    payment_type,
    amount,
    slots,
    project_category,
    status,
    transaction_ref,
    created_at
  )
  VALUES (
    p_user_id,
    'green_card_offline',
    2000,
    0,
    'Green Card Membership (Admin Offline Activation)',
    'success',
    v_tx_ref,
    now()
  );

  -- Credit referral earnings if first activation (₦1,000 instant commission)
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

  -- Distribute Core Driver Bonus (₦50 to each of the 6 drivers)
  IF v_is_first_activation THEN
    BEGIN
      PERFORM public.distribute_core_driver_bonuses(v_member_id, p_user_id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'expires_at', v_expires_at
  );
END;
$$;

-- 3. Trigger on subscriptions to guarantee core drivers always get ₦50 bonus on any green card activation
CREATE OR REPLACE FUNCTION public.trig_on_subscription_green_card_activated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mem_id TEXT;
BEGIN
  IF NEW.plan = 'green_card' AND NEW.status = 'active' THEN
    SELECT member_id INTO v_mem_id FROM public.profiles WHERE id = NEW.user_id;
    IF v_mem_id IS NOT NULL THEN
      PERFORM public.distribute_core_driver_bonuses(v_mem_id, NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trig_subscriptions_gc_core_driver ON public.subscriptions;
CREATE TRIGGER trig_subscriptions_gc_core_driver
  AFTER INSERT OR UPDATE OF status, plan ON public.subscriptions
  FOR EACH ROW
  WHEN (NEW.plan = 'green_card' AND NEW.status = 'active')
  EXECUTE FUNCTION public.trig_on_subscription_green_card_activated();
