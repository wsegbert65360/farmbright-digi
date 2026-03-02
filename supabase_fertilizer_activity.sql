-- Migration: Add Fertilizer Activity
-- Description: Creates fertilizer_applications table with RLS and tenant isolation.

CREATE TABLE IF NOT EXISTS public.fertilizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  acres NUMERIC(10,2) NOT NULL CHECK (acres > 0),
  fertilizer_formula TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fertilizer_farm ON fertilizer_applications(farm_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_field ON fertilizer_applications(field_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_date ON fertilizer_applications(date);

ALTER TABLE fertilizer_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "tenant_isolation" ON public.fertilizer_applications;
    CREATE POLICY "tenant_isolation" ON public.fertilizer_applications
    FOR ALL
    USING (
        (farm_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid)
    )
    WITH CHECK (
        (farm_id = (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid)
    );
END $$;

-- Assignment trigger for automated farm_id management
DROP TRIGGER IF EXISTS tr_assign_tenant_id_fertilizer_applications ON public.fertilizer_applications;
CREATE TRIGGER tr_assign_tenant_id_fertilizer_applications 
    BEFORE INSERT ON public.fertilizer_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION public.assign_tenant_id();
