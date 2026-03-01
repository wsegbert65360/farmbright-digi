-- PRODUCTION_HARDENING.sql
-- Force RLS on all tables and apply tenant isolation policies

-- 1. Enable RLS
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spray_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hay_harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grain_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grain_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spray_recipes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.fields;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.plant_records;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.spray_records;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.harvest_records;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.hay_harvest_records;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.grain_bins;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.grain_movements;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.saved_seeds;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.spray_recipes;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 3. Create Tenant Isolation Policies (FOR ALL operations)
-- Logic: tenant_id must match the farm_id stored in the User's JWT metadata
CREATE POLICY "Tenant Isolation" ON public.fields FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);
CREATE POLICY "Tenant Isolation" ON public.plant_records FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);
CREATE POLICY "Tenant Isolation" ON public.spray_records FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);
CREATE POLICY "Tenant Isolation" ON public.harvest_records FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);
CREATE POLICY "Tenant Isolation" ON public.hay_harvest_records FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);
CREATE POLICY "Tenant Isolation" ON public.grain_bins FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);
CREATE POLICY "Tenant Isolation" ON public.grain_movements FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);
CREATE POLICY "Tenant Isolation" ON public.saved_seeds FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);
CREATE POLICY "Tenant Isolation" ON public.spray_recipes FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid);

-- 4. Enable service role to bypass RLS for administrative tasks
ALTER TABLE public.fields FORCE ROW LEVEL SECURITY;
ALTER TABLE public.plant_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.spray_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.hay_harvest_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.grain_bins FORCE ROW LEVEL SECURITY;
ALTER TABLE public.grain_movements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.saved_seeds FORCE ROW LEVEL SECURITY;
ALTER TABLE public.spray_recipes FORCE ROW LEVEL SECURITY;
