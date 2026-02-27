-- ===================================================================================
-- FARM-BRIGHT DIGI - GLOBAL RLS & JWT REPAIR (PATCH V5)
-- This is the final step to unlock all saving and viewing functionality.
-- ===================================================================================

-- 1. Correct the Tenant Assignment Function
-- Must look inside 'app_metadata' in the JWT
CREATE OR REPLACE FUNCTION public.assign_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.farm_id IS NULL THEN
        NEW.farm_id := (auth.jwt() -> 'app_metadata' ->> 'farm_id')::uuid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Correct the Synchronization Trigger
-- Uses raw_app_meta_data (your specific Supabase version's column name)
CREATE OR REPLACE FUNCTION public.sync_farm_id_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        coalesce(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('farm_id', NEW.farm_id)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Correct all RLS Policies
-- Loops through all tables and applies the fix for nested JWT metadata
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
                AND deleted_at IS NULL
            )
            WITH CHECK (
                (farm_id = (auth.jwt() -> ''app_metadata'' ->> ''farm_id'')::uuid)
            )', t);
    END LOOP;
END $$;

-- 4. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
