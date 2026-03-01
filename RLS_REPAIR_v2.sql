-- RLS_REPAIR_v2.sql
-- Fixes broken RLS policies that were using 'tenant_id' instead of 'farm_id'

-- 1. Enable RLS on ALL tables with the correct names
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spray_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hay_harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.grain_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spray_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop the broken policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.fields;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.plant_records;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.spray_records;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.harvest_records;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.hay_harvest_records;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.bins;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.grain_movements;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.saved_seeds;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.spray_recipes;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.profiles;
    DROP POLICY IF EXISTS "Profile Isolation" ON public.profiles;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 3. Create CORRECT policies using farm_id column
-- Logic: farm_id must match the farm_id stored in the User's JWT (app_metadata or user_metadata)
CREATE POLICY "Tenant Isolation" ON public.fields FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);
CREATE POLICY "Tenant Isolation" ON public.plant_records FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);
CREATE POLICY "Tenant Isolation" ON public.spray_records FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);
CREATE POLICY "Tenant Isolation" ON public.harvest_records FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);
CREATE POLICY "Tenant Isolation" ON public.hay_harvest_records FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);
CREATE POLICY "Tenant Isolation" ON public.bins FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);
CREATE POLICY "Tenant Isolation" ON public.grain_movements FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);
CREATE POLICY "Tenant Isolation" ON public.saved_seeds FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);
CREATE POLICY "Tenant Isolation" ON public.spray_recipes FOR ALL USING (
  farm_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'farm_id', auth.jwt() -> 'user_metadata' ->> 'farm_id'))::uuid
);

-- Profiles Isolation: A user can only see/edit their own profile record
CREATE POLICY "Profile Isolation" ON public.profiles FOR ALL USING (auth.uid() = id);
