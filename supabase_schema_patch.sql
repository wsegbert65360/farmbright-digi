-- Supplemental SQL Patch to add missing columns for naming consistency & persistence
-- Run this in your Supabase SQL Editor

-- 1. Profiles: Active Season
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_season INTEGER DEFAULT 2026;

-- 2. Fields: FSA and compliance columns
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS fsa_farm_number TEXT;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS fsa_tract_number TEXT;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS fsa_field_number TEXT;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS producer_share DECIMAL;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS irrigation_practice TEXT;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS intended_use TEXT;

-- 3. Plant Records: FSA and compliance columns
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS fsa_farm_number TEXT;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS fsa_tract_number TEXT;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS fsa_field_number TEXT;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS intended_use TEXT;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS producer_share DECIMAL;
ALTER TABLE public.plant_records ADD COLUMN IF NOT EXISTS irrigation_practice TEXT;

-- 4. Harvest Records: FSA and compliance columns
ALTER TABLE public.harvest_records ADD COLUMN IF NOT EXISTS fsa_farm_number TEXT;
ALTER TABLE public.harvest_records ADD COLUMN IF NOT EXISTS fsa_tract_number TEXT;
ALTER TABLE public.harvest_records ADD COLUMN IF NOT EXISTS crop TEXT;
