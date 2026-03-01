-- Add boundary column to fields table for GIS polygon storage
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS boundary JSONB;

-- Update the master schema reference
-- (This is just a note for the user, I will manually update the MASTER file as well if needed)
COMMENT ON COLUMN public.fields.boundary IS 'Stores the GeoJSON polygon or geometry points for the field boundary';
