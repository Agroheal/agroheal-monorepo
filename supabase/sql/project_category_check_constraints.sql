-- Constrains project_category to the 3 real categories across every table that
-- stores it. Applied directly to the live DB on 2026-09-02 after a mismatched
-- string ("Ginger Village" vs "Gingertown") silently caused customer slot
-- credits to never show up on their farm dashboard — a CHECK constraint makes
-- that class of typo fail loudly at insert time instead of succeeding silently.
--
-- Add a 4th value here (and re-run for all 5 tables) if a new farm category
-- is ever introduced.

ALTER TABLE public.slot_subscriptions ADD CONSTRAINT slot_subscriptions_project_category_check
  CHECK (project_category IN ('Gingertown','Mushroom Village','Organic FoodNation (1 Million Hectares against Hunger)'));

ALTER TABLE public.other_payments ADD CONSTRAINT other_payments_project_category_check
  CHECK (project_category IN ('Gingertown','Mushroom Village','Organic FoodNation (1 Million Hectares against Hunger)'));

ALTER TABLE public.farm_records ADD CONSTRAINT farm_records_project_category_check
  CHECK (project_category IN ('Gingertown','Mushroom Village','Organic FoodNation (1 Million Hectares against Hunger)'));

ALTER TABLE public.farm_groups ADD CONSTRAINT farm_groups_project_category_check
  CHECK (project_category IN ('Gingertown','Mushroom Village','Organic FoodNation (1 Million Hectares against Hunger)'));

ALTER TABLE public.checkout ADD CONSTRAINT checkout_project_category_check
  CHECK (project_category IN ('Gingertown','Mushroom Village','Organic FoodNation (1 Million Hectares against Hunger)'));
