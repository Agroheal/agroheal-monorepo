-- ==============================================================================
-- Migration: Add Atomic Split Payment Stored Procedure (pay_checkout_with_split)
-- Purpose: Enables members to pay part of their farm slot order with cleared 
--          AVAILABLE wallet balance (e.g. ₦2,000) and pay the remaining difference 
--          via Card/Transfer (e.g. ₦3,000), maintaining comprehensive double-entry records.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.pay_checkout_with_split(
  p_user_id uuid,
  p_checkout_id bigint,
  p_wallet_amount numeric,
  p_card_amount numeric,
  p_slots integer,
  p_slot_price numeric,
  p_category text,
  p_flw_ref text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance NUMERIC;
  v_wallet_ref TEXT;
  v_total_amount NUMERIC;
BEGIN
  v_total_amount := p_wallet_amount + p_card_amount;

  -- 1. Check current available balance
  SELECT COALESCE(referral_earnings, 0) INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User profile not found.');
  END IF;

  IF v_current_balance < p_wallet_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Insufficient available wallet balance. Available: ₦' || v_current_balance || ', requested: ₦' || p_wallet_amount || '.'
    );
  END IF;

  -- Generate unique double-entry reference
  v_wallet_ref := 'WAL-SPLIT-' || substr(md5(random()::text), 1, 10);

  -- 2. Deduct available wallet portion from profile
  UPDATE public.profiles
  SET 
    referral_earnings = GREATEST(0, referral_earnings - p_wallet_amount),
    wallet_balance = GREATEST(0, COALESCE(wallet_balance, 0) - p_wallet_amount)
  WHERE id = p_user_id;

  -- 3. Record double-entry debit in wallet_ledger
  INSERT INTO public.wallet_ledger (
    user_id,
    amount,
    balance_after,
    category,
    status,
    reference_id,
    description,
    entry_type
  ) VALUES (
    p_user_id,
    -p_wallet_amount,
    v_current_balance - p_wallet_amount,
    'SLOT_PURCHASE',
    'AVAILABLE',
    v_wallet_ref,
    'Split Payment Reinvestment: ₦' || p_wallet_amount || ' applied from available wallet towards ' || p_slots || ' slot(s) (Card paid: ₦' || p_card_amount || ')',
    'DEBIT'
  );

  -- 4. Record card payment receipt in other_payments
  INSERT INTO public.other_payments (
    user_id,
    payment_type,
    months,
    slots,
    amount,
    status,
    transaction_ref,
    project_category
  ) VALUES (
    p_user_id,
    'slot_split_card',
    12,
    p_slots,
    p_card_amount,
    'completed',
    p_flw_ref,
    p_category
  );

  -- 5. Mark checkout as paid with dual reference
  UPDATE public.checkout
  SET 
    status = 'paid',
    payment_method = 'split',
    transaction_ref = p_flw_ref || ' / ' || v_wallet_ref
  WHERE id = p_checkout_id AND user_id = p_user_id;

  -- 6. Create active slot subscription
  INSERT INTO public.slot_subscriptions (
    user_id,
    checkout_id,
    amount,
    slotprice,
    status,
    slots,
    last_payment_date,
    next_payment_date,
    project_category
  ) VALUES (
    p_user_id,
    p_checkout_id,
    v_total_amount,
    p_slot_price,
    'active',
    p_slots,
    NOW(),
    NOW() + INTERVAL '30 days',
    p_category
  );

  RETURN jsonb_build_object(
    'success', true,
    'wallet_ref', v_wallet_ref,
    'message', 'Split payment processed successfully. ₦' || p_wallet_amount || ' debited from available wallet, ₦' || p_card_amount || ' confirmed via card.'
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.pay_checkout_with_split(uuid, bigint, numeric, numeric, integer, numeric, text, text) TO authenticated, service_role, anon;
