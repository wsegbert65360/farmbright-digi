-- ===================================================================================
-- FARM-BRIGHT DIGI - SCHEMA SYNCHRONIZER (PATCH V3)
-- Run this if "Fields" or "Activities" are not saving.
-- This script FORCES the existing tables to include the new compliance columns.
-- ===================================================================================

-- 1. FIELDS: Add missing FSA and compliance columns
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS fsa_farm_number TEXT;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS fsa_tract_number TEXT;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS fsa_field_number TEXT;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS producer_share DECIMAL;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS irrigation_practice TEXT;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS intended_use TEXT;

-- 2. PLANT RECORDS: Add missing FSA and compliance columns
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS fsa_farm_number TEXT;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS fsa_tract_number TEXT;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS fsa_field_number TEXT;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS intended_use TEXT;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS producer_share DECIMAL;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS irrigation_practice TEXT;

-- 3. SPRAY RECORDS: Add missing regulatory auditing columns
ALTER TABLE public.spray_records ADD COLUMN IF NOT EXISTS target_pest TEXT;
ALTER TABLE public.spray_records ADD COLUMN IF NOT EXISTS wind_direction TEXT;
ALTER TABLE public.spray_records ADD COLUMN IF NOT EXISTS relative_humidity DECIMAL;
ALTER TABLE public.spray_records ADD COLUMN IF NOT EXISTS treated_area_size TEXT;
ALTER TABLE public.spray_records ADD COLUMN IF NOT EXISTS total_amount_applied TEXT;
ALTER TABLE public.spray_records ADD COLUMN IF NOT EXISTS involved_technicians TEXT;
ALTER TABLE public.spray_records ADD COLUMN IF NOT EXISTS mixture_rate TEXT;
ALTER TABLE public.spray_records ADD COLUMN IF NOT EXISTS total_mixture_volume TEXT;

-- 4. HARVEST RECORDS: Add missing FSA and compliance columns
ALTER TABLE public.harvest_records ADD COLUMN IF NOT EXISTS fsa_farm_number TEXT;
ALTER TABLE public.harvest_records ADD COLUMN IF NOT EXISTS fsa_tract_number TEXT;
ALTER TABLE public.harvest_records ADD COLUMN IF NOT EXISTS crop TEXT;

-- 5. SPRAY RECIPES: Add support for regulatory defaults
ALTER TABLE public.spray_recipes ADD COLUMN IF NOT EXISTS applicator_name TEXT;
ALTER TABLE public.spray_recipes ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.spray_recipes ADD COLUMN IF NOT EXISTS target_pest TEXT;
ALTER TABLE public.spray_recipes ADD COLUMN IF NOT EXISTS epa_reg_number TEXT;

-- 6. RELOAD SCHEMA CACHE (Force Supabase to see the new columns)
NOTIFY pgrst, 'reload schema';
