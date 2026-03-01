-- 1. Correct the sync_farm_id_to_auth function with the correct Supabase column name
CREATE OR REPLACE FUNCTION public.sync_farm_id_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- CRITICAL FIX: Use raw_app_meta_data (Supabase auth.users internal column name)
    UPDATE auth.users
    SET raw_app_meta_data = 
        coalesce(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('farm_id', NEW.farm_id)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Relax RLS policies to enforce tenant isolation but allow soft-delete updates
-- We remove the 'deleted_at IS NULL' from the policy USING clause 
-- so that the UPDATE itself (setting deleted_at) doesn't run into RLS visibility issues.
-- The app queries already include .is('deleted_at', null) for data isolation.

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'fields', 'bins', 'plant_records', 'spray_records', 
        'harvest_records', 'hay_harvest_records', 'grain_movements', 
        'saved_seeds', 'spray_recipes'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation" ON public.%I', t);
        EXECUTE format('
            CREATE POLICY "tenant_isolation" ON public.%I
            FOR ALL
            USING (
                (farm_id = (auth.jwt() -> ''app_metadata'' ->> ''farm_id'')::uuid)
            )
            WITH CHECK (
                (farm_id = (auth.jwt() -> ''app_metadata'' ->> ''farm_id'')::uuid)
            )', t, t);
    END LOOP;
END $$;
