-- ===================================================================================
-- FARM-BRIGHT DIGI - EMERGENCY RECOVERY SCRIPT (PATCH V4)
-- Run this to fix "Profiles Empty", "RLS Blocked", and "Saving Failed" issues.
-- ===================================================================================

-- 1. Ensure the "Main Farm" exists
INSERT INTO public.farms (id, name)
VALUES ('28e107ba-3384-4b6e-9917-8a694803cb82', 'Egbert Farm')
ON CONFLICT (id) DO UPDATE SET name = 'Egbert Farm';

-- 2. Create the missing profile for your user account
-- This links your account (wsegbert@yahoo.com) to the farm.
INSERT INTO public.profiles (id, farm_id, email, role)
SELECT id, '28e107ba-3384-4b6e-9917-8a694803cb82', email, 'admin'
FROM auth.users
WHERE email = 'wsegbert@yahoo.com'
ON CONFLICT (id) DO UPDATE SET farm_id = '28e107ba-3384-4b6e-9917-8a694803cb82';

-- 3. Force-sync your login "key" (App Metadata)
UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('farm_id', '28e107ba-3384-4b6e-9917-8a694803cb82')
WHERE email = 'wsegbert@yahoo.com';

-- 4. Fix any schema inconsistencies in activity tables
-- Ensure spray_records has the correct date column name
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spray_records' AND column_name='spray_date') THEN
        ALTER TABLE public.spray_records ADD COLUMN spray_date DATE;
    END IF;
END $$;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
