-- supabase/migrations/001_create_stands_table.sql
-- Migration to create or update the stands table for property mapping

-- Create stands table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    type VARCHAR(50) DEFAULT 'tree_stand',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing installations)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stands' AND column_name='latitude') THEN
        ALTER TABLE public.stands ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stands' AND column_name='longitude') THEN
        ALTER TABLE public.stands ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stands' AND column_name='type') THEN
        ALTER TABLE public.stands ADD COLUMN type VARCHAR(50) DEFAULT 'tree_stand';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stands' AND column_name='active') THEN
        ALTER TABLE public.stands ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stands_updated_at ON public.stands;
CREATE TRIGGER update_stands_updated_at
    BEFORE UPDATE ON public.stands
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stands_active ON public.stands(active);
CREATE INDEX IF NOT EXISTS idx_stands_type ON public.stands(type);
CREATE INDEX IF NOT EXISTS idx_stands_coordinates ON public.stands(latitude, longitude);

-- Enable Row Level Security (RLS)
ALTER TABLE public.stands ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed for your auth setup)
DROP POLICY IF EXISTS "Authenticated users can view stands" ON public.stands;
CREATE POLICY "Authenticated users can view stands" 
    ON public.stands FOR SELECT 
    TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert stands" ON public.stands;
CREATE POLICY "Authenticated users can insert stands" 
    ON public.stands FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update stands" ON public.stands;
CREATE POLICY "Authenticated users can update stands" 
    ON public.stands FOR UPDATE 
    TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete stands" ON public.stands;
CREATE POLICY "Authenticated users can delete stands" 
    ON public.stands FOR DELETE 
    TO authenticated 
    USING (true);

-- Allow anonymous users to view stands (for public property map access)
DROP POLICY IF EXISTS "Anonymous users can view active stands" ON public.stands;
CREATE POLICY "Anonymous users can view active stands" 
    ON public.stands FOR SELECT 
    TO anon 
    USING (active = true);

-- Insert sample data if stands table is empty
INSERT INTO public.stands (name, description, latitude, longitude, type, active)
SELECT * FROM (
    VALUES 
        ('North Ridge Stand', 'Elevated tree stand overlooking northern property boundary', 36.429270, -79.508880, 'tree_stand', true),
        ('Creek Bottom Stand', 'Ground blind near the creek crossing', 36.425270, -79.513880, 'ground_blind', true),
        ('Oak Grove Ladder', 'Ladder stand in the oak grove', 36.428270, -79.510880, 'ladder_stand', true),
        ('Field Edge Stand', 'Tower stand on the edge of the food plot', 36.425270, -79.508880, 'tower_stand', true)
) AS sample_data(name, description, latitude, longitude, type, active)
WHERE NOT EXISTS (SELECT 1 FROM public.stands LIMIT 1);

-- Add comments for documentation
COMMENT ON TABLE public.stands IS 'Hunting stands and blinds with GPS coordinates for property mapping';
COMMENT ON COLUMN public.stands.latitude IS 'GPS latitude coordinate (decimal degrees)';
COMMENT ON COLUMN public.stands.longitude IS 'GPS longitude coordinate (decimal degrees)';
COMMENT ON COLUMN public.stands.type IS 'Type of stand: tree_stand, ground_blind, ladder_stand, tower_stand, etc.';
COMMENT ON COLUMN public.stands.active IS 'Whether the stand is currently active/usable';
