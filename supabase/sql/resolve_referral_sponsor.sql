-- Function: resolve_referral_sponsor
-- Allows anonymous or authenticated users during signup to securely resolve the sponsor's name, referral code, and member ID
CREATE OR REPLACE FUNCTION resolve_referral_sponsor(sponsor_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trimmed text;
  found_profile record;
BEGIN
  trimmed := trim(sponsor_input);
  IF trimmed IS NULL OR trimmed = '' THEN
    RETURN json_build_object('found', false);
  END IF;

  SELECT id, full_name, referral_code, member_id
  INTO found_profile
  FROM public.profiles
  WHERE upper(referral_code) = upper(trimmed)
     OR upper(member_id) = upper(trimmed)
     OR id::text = trimmed
  LIMIT 1;

  IF found_profile IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;

  RETURN json_build_object(
    'found', true,
    'id', found_profile.id,
    'fullName', found_profile.full_name,
    'referralCode', found_profile.referral_code,
    'memberId', found_profile.member_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION resolve_referral_sponsor(text) TO anon, authenticated, service_role;
