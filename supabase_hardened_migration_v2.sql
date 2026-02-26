-- Hardened Multi-Tenant Migration Schema v2
-- This script migrates from JSONB blobs to structured relational tables with RLS.

-- 0. Enable Extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Farms Table
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table (linking users to farms)
-- Note: id should be the auth.user_id
ALTER TABLE IF EXISTS profiles 
    ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id),
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- 3. App Tables with farm_id isolation
CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    name TEXT NOT NULL,
    acreage DECIMAL NOT NULL,
    lat DECIMAL,
    lng DECIMAL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    name TEXT NOT NULL,
    capacity DECIMAL NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plant_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    field_id UUID REFERENCES fields(id),
    field_name TEXT, -- cache for history
    seed_variety TEXT,
    acreage DECIMAL,
    crop TEXT,
    plant_date DATE,
    season_year INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS spray_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    field_id UUID REFERENCES fields(id),
    field_name TEXT,
    product TEXT,
    products JSONB, -- list of granular products
    wind_speed DECIMAL,
    temperature DECIMAL,
    spray_date DATE,
    start_time TIME,
    equipment_id TEXT,
    applicator_name TEXT,
    license_number TEXT,
    epa_reg_number TEXT,
    season_year INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS harvest_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    field_id UUID REFERENCES fields(id),
    field_name TEXT,
    destination TEXT, -- 'bin' or 'town'
    bin_id UUID REFERENCES bins(id),
    bushels DECIMAL,
    moisture_percent DECIMAL,
    landlord_split_percent DECIMAL,
    harvest_date DATE,
    season_year INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hay_harvest_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    field_id UUID REFERENCES fields(id),
    field_name TEXT,
    date DATE,
    bale_count INTEGER,
    cutting_number INTEGER,
    bale_type TEXT, -- 'Round' or 'Square'
    temperature DECIMAL,
    conditions TEXT,
    season_year INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS grain_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    bin_id UUID REFERENCES bins(id),
    bin_name TEXT,
    type TEXT, -- 'in' or 'out'
    bushels DECIMAL,
    moisture_percent DECIMAL,
    source_field_name TEXT,
    destination TEXT,
    price DECIMAL,
    season_year INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS saved_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    name TEXT NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS spray_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    name TEXT NOT NULL,
    products JSONB, -- list of products and rates
    deleted_at TIMESTAMPTZ
);

-- 4. Enable RLS on all tables
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
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Policy: Users can only access rows belonging to their farm_id and not soft-deleted
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

-- 5. Trigger for automatic farm_id assignment
CREATE OR REPLACE FUNCTION assign_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If farm_id is already provided (e.g. migration script), use it
    -- Otherwise, default to the user's JWT farm_id
    IF NEW.farm_id IS NULL THEN
        NEW.farm_id := (auth.jwt() ->> 'farm_id')::uuid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to all tables
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
        EXECUTE format('CREATE TRIGGER tr_assign_tenant_id_%I 
                        BEFORE INSERT ON %I 
                        FOR EACH ROW 
                        EXECUTE FUNCTION assign_tenant_id()', t, t);
    END LOOP;
END $$;

-- 6. Sync farm_id to auth.users metadata (for JWT claims)
CREATE OR REPLACE FUNCTION sync_farm_id_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_metadata = 
        coalesce(raw_app_metadata, '{}'::jsonb) || 
        jsonb_build_object('farm_id', NEW.farm_id)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_farm_id_to_auth ON profiles;
CREATE TRIGGER tr_sync_farm_id_to_auth
    AFTER INSERT OR UPDATE OF farm_id ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_farm_id_to_auth();
