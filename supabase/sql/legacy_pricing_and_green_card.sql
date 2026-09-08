-- ==============================================================================
-- AGROHEAL: LEGACY GREEN CARD PRICING MIGRATION
-- Scope:
--   1. Add green_card_fee column defaulting to 2000.00 for all future registrations.
--   2. Grandfather exactly 264 early identified members to 1000.00.
-- ==============================================================================

-- 1. Add column if not exists with 2000.00 default
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS green_card_fee NUMERIC(10,2) NOT NULL DEFAULT 2000.00;

-- 2. Lock in 1000.00 for identified early members who joined before now without Green Card
UPDATE public.profiles
SET green_card_fee = 1000.00
WHERE (member_id IS NULL OR member_id = '')
  AND created_at <= NOW();
