-- SQL Migration: Hardened Multi-Tenant Isolation & Soft Deletes
-- Targets: Livestock, Sprayer, Harvest, Fields

-- 1. Setup Farms Table
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Refactor Existing Tables
DO $$
DECLARE
    t text;
    tables_to_harden text[] := ARRAY['Livestock', 'Sprayer', 'Harvest', 'Fields'];
BEGIN
    FOREACH t IN ARRAY tables_to_harden LOOP
        -- Add farm_id if missing
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id)', t);
        
        -- Add soft delete timestamp if missing
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ', t);
        
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation" ON %I', t);
        
        -- Create hardened tenant isolation policy
        -- 1. Restricts by farm_id from JWT
        -- 2. Automatically filters out soft-deleted records
        EXECUTE format('
            CREATE POLICY "tenant_isolation" ON %I
            FOR ALL
            USING (
                farm_id = (auth.jwt() ->> ''farm_id'')::uuid
                AND deleted_at IS NULL
            )
            WITH CHECK (
                farm_id = (auth.jwt() ->> ''farm_id'')::uuid
            )', t);
    END LOOP;
END $$;

-- 3. Automatic farm_id Assignment Trigger
-- Ensures farm_id is automatically set from the user's authenticated session on INSERT
CREATE OR REPLACE FUNCTION assign_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.farm_id := (auth.jwt() ->> 'farm_id')::uuid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
    t text;
    tables_to_harden text[] := ARRAY['Livestock', 'Sprayer', 'Harvest', 'Fields'];
BEGIN
    FOREACH t IN ARRAY tables_to_harden LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_assign_tenant_id ON %I', t);
        EXECUTE format('CREATE TRIGGER tr_assign_tenant_id 
                        BEFORE INSERT ON %I 
                        FOR EACH ROW 
                        EXECUTE FUNCTION assign_tenant_id()', t);
    END LOOP;
END $$;

-- 4. Deployment Check: Point-in-Time Recovery (PITR)
-- [NOTE]: PITR is a Supabase dashboard setting. 
-- Ensure you enable it in: Settings -> Database -> Backups -> Point-in-time recovery.
