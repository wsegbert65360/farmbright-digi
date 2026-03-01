-- SUPABASE EMERGENCY SCHEMA PATCH: Add missing 'boundary' column to 'fields'
-- Run this in the Supabase SQL Editor to fix the PGRST204 error.

ALTER TABLE public.fields 
ADD COLUMN IF NOT EXISTS boundary JSONB;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN public.fields.boundary IS 'Stores the field boundary as a GeoJSON Polygon object.';
