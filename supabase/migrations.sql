-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  price DECIMAL(15, 2),
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area DECIMAL(10, 2),
  address VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to existing properties table (if they don't exist)
DO $$
BEGIN
    -- Add property_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'property_code') THEN
        ALTER TABLE properties ADD COLUMN property_code VARCHAR(20) UNIQUE;
    END IF;

    -- Add owner_details column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'owner_details') THEN
        ALTER TABLE properties ADD COLUMN owner_details JSONB;
    END IF;

    -- Add broker_details column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'broker_details') THEN
        ALTER TABLE properties ADD COLUMN broker_details JSONB;
    END IF;

    -- Add location_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'location_url') THEN
        ALTER TABLE properties ADD COLUMN location_url TEXT;
    END IF;

    -- Add price_per_sqft column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'price_per_sqft') THEN
        ALTER TABLE properties ADD COLUMN price_per_sqft DECIMAL(10, 2);
    END IF;

    -- Add property_code_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'property_code_type') THEN
        ALTER TABLE properties ADD COLUMN property_code_type VARCHAR(50);
    END IF;

    -- Add source_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'source_type') THEN
        ALTER TABLE properties ADD COLUMN source_type VARCHAR(20) DEFAULT 'Others';
    END IF;
END $$;

-- Add CHECK constraint (outside DO block for better compatibility)
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_source_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_source_type_check 
    CHECK (source_type IS NULL OR source_type IN ('Inhouse', 'Others'));

-- Set default value
ALTER TABLE properties ALTER COLUMN source_type SET DEFAULT 'Others';

-- Create function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
CREATE POLICY "Users can update their own profile."
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile." ON profiles;
CREATE POLICY "Admins can update any profile."
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete profiles." ON profiles;
CREATE POLICY "Admins can delete profiles."
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Projects policies
DROP POLICY IF EXISTS "Projects are viewable by authenticated users." ON projects;
CREATE POLICY "Projects are viewable by authenticated users."
  ON projects FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert projects." ON projects;
CREATE POLICY "Authenticated users can insert projects."
  ON projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update projects they created." ON projects;
CREATE POLICY "Users can update projects they created."
  ON projects FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can update any project." ON projects;
CREATE POLICY "Admins can update any project."
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete projects they created." ON projects;
CREATE POLICY "Users can delete projects they created."
  ON projects FOR DELETE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can delete any project." ON projects;
CREATE POLICY "Admins can delete any project."
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Properties policies
DROP POLICY IF EXISTS "Properties are viewable by authenticated users." ON properties;
CREATE POLICY "Properties are viewable by authenticated users."
  ON properties FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Agents can insert properties." ON properties;
CREATE POLICY "Agents can insert properties."
  ON properties FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Agents can update their own properties." ON properties;
CREATE POLICY "Agents can update their own properties."
  ON properties FOR UPDATE
  USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any property." ON properties;
CREATE POLICY "Admins can update any property."
  ON properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Agents can delete their own properties." ON properties;
CREATE POLICY "Agents can delete their own properties."
  ON properties FOR DELETE
  USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete any property." ON properties;
CREATE POLICY "Admins can delete any property."
  ON properties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_profiles_email;
CREATE INDEX idx_profiles_email ON profiles(email);
DROP INDEX IF EXISTS idx_profiles_role;
CREATE INDEX idx_profiles_role ON profiles(role);
DROP INDEX IF EXISTS idx_projects_created_by;
CREATE INDEX idx_projects_created_by ON projects(created_by);
DROP INDEX IF EXISTS idx_properties_project_id;
CREATE INDEX idx_properties_project_id ON properties(project_id);
DROP INDEX IF EXISTS idx_properties_agent_id;
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
DROP INDEX IF EXISTS idx_properties_status;
CREATE INDEX idx_properties_status ON properties(status);
DROP INDEX IF EXISTS idx_properties_type;
CREATE INDEX idx_properties_type ON properties(type);
DROP INDEX IF EXISTS idx_properties_property_code;
CREATE UNIQUE INDEX idx_properties_property_code ON properties(property_code);

-- Insert a default admin user (optional - update with your email)
-- Note: You'll need to sign up with this email first, then run this update
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property images
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can update their own uploaded images" ON storage.objects;
CREATE POLICY "Users can update their own uploaded images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-images'
    AND auth.uid() = owner::uuid
  );

DROP POLICY IF EXISTS "Users can delete their own uploaded images" ON storage.objects;
CREATE POLICY "Users can delete their own uploaded images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND auth.uid() = owner::uuid
  );

DROP POLICY IF EXISTS "Admins can delete any property image" ON storage.objects;
CREATE POLICY "Admins can delete any property image"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


-- Create function for admin to update user password
-- This function allows admins to directly update agent passwords
CREATE OR REPLACE FUNCTION admin_update_user_password(
  user_id UUID,
  new_password TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user passwords';
  END IF;

  -- Update the user's password in auth.users
  -- Note: This requires the postgres role to have permission
  -- In production, this should use Supabase's auth admin API
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  result := json_build_object(
    'success', true,
    'message', 'Password updated successfully'
  );

  RETURN result;
END;
$$;

-- Create property_requirements table
CREATE TABLE IF NOT EXISTS property_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  property_type VARCHAR(100),
  price DECIMAL(15, 2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area DECIMAL(10, 2),
  preferred_locations JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'fulfilled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add migration to change from min/max to single fields (if table already exists)
DO $$
BEGIN
    -- Add new single columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'property_requirements' AND column_name = 'price') THEN
        ALTER TABLE property_requirements ADD COLUMN price DECIMAL(15, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'property_requirements' AND column_name = 'bedrooms') THEN
        ALTER TABLE property_requirements ADD COLUMN bedrooms INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'property_requirements' AND column_name = 'bathrooms') THEN
        ALTER TABLE property_requirements ADD COLUMN bathrooms INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'property_requirements' AND column_name = 'area') THEN
        ALTER TABLE property_requirements ADD COLUMN area DECIMAL(10, 2);
    END IF;

    -- Copy data from min/max fields to single fields (using max values as defaults)
    -- Only update if the max columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'max_price') THEN
        UPDATE property_requirements 
        SET price = max_price 
        WHERE max_price IS NOT NULL AND price IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'max_bedrooms') THEN
        UPDATE property_requirements 
        SET bedrooms = max_bedrooms 
        WHERE max_bedrooms IS NOT NULL AND bedrooms IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'max_bathrooms') THEN
        UPDATE property_requirements 
        SET bathrooms = max_bathrooms 
        WHERE max_bathrooms IS NOT NULL AND bathrooms IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'max_area') THEN
        UPDATE property_requirements 
        SET area = max_area 
        WHERE max_area IS NOT NULL AND area IS NULL;
    END IF;

    -- Drop the min/max columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'min_price') THEN
        ALTER TABLE property_requirements DROP COLUMN min_price;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'max_price') THEN
        ALTER TABLE property_requirements DROP COLUMN max_price;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'min_bedrooms') THEN
        ALTER TABLE property_requirements DROP COLUMN min_bedrooms;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'max_bedrooms') THEN
        ALTER TABLE property_requirements DROP COLUMN max_bedrooms;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'min_bathrooms') THEN
        ALTER TABLE property_requirements DROP COLUMN min_bathrooms;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'max_bathrooms') THEN
        ALTER TABLE property_requirements DROP COLUMN max_bathrooms;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'min_area') THEN
        ALTER TABLE property_requirements DROP COLUMN min_area;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_requirements' AND column_name = 'max_area') THEN
        ALTER TABLE property_requirements DROP COLUMN max_area;
    END IF;
END $$;

-- Add property requirements policies
ALTER TABLE property_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Property requirements are viewable by authenticated users." ON property_requirements;
CREATE POLICY "Property requirements are viewable by authenticated users."
  ON property_requirements FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Agents can insert property requirements." ON property_requirements;
CREATE POLICY "Agents can insert property requirements."
  ON property_requirements FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Agents can update their assigned requirements." ON property_requirements;
CREATE POLICY "Agents can update their assigned requirements."
  ON property_requirements FOR UPDATE
  USING (assigned_agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all property requirements." ON property_requirements;
CREATE POLICY "Admins can manage all property requirements."
  ON property_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger for property_requirements updated_at
DROP TRIGGER IF EXISTS update_property_requirements_updated_at ON property_requirements;
CREATE TRIGGER update_property_requirements_updated_at BEFORE UPDATE ON property_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for property_requirements
DROP INDEX IF EXISTS idx_property_requirements_assigned_agent_id;
CREATE INDEX idx_property_requirements_assigned_agent_id ON property_requirements(assigned_agent_id);
DROP INDEX IF EXISTS idx_property_requirements_status;
CREATE INDEX idx_property_requirements_status ON property_requirements(status);
DROP INDEX IF EXISTS idx_property_requirements_priority;
CREATE INDEX idx_property_requirements_priority ON property_requirements(priority);
DROP INDEX IF EXISTS idx_property_requirements_created_by;
CREATE INDEX idx_property_requirements_created_by ON property_requirements(created_by);

-- Create function to generate property codes (moved here to ensure property_code column exists)
CREATE OR REPLACE FUNCTION generate_property_code(
  property_type TEXT,
  is_new BOOLEAN DEFAULT true
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  prefix TEXT;
  next_number INTEGER;
  property_code TEXT;
BEGIN
  -- Debug logging
  RAISE NOTICE 'Input: property_type=%, is_new=%', property_type, is_new;
  
  -- Determine prefix based on property type and condition
  CASE 
    WHEN property_type ILIKE '%apartment%' AND is_new THEN prefix := 'NA';
    WHEN property_type ILIKE '%apartment%' AND NOT is_new THEN prefix := 'OA';
    WHEN property_type ILIKE '%house%' AND is_new THEN prefix := 'NH';
    WHEN property_type ILIKE '%house%' AND NOT is_new THEN prefix := 'OH';
    WHEN property_type ILIKE '%site%' OR property_type ILIKE '%land%' THEN prefix := 'S';
    ELSE prefix := 'PR'; -- Default prefix for other types
  END CASE;

  RAISE NOTICE 'Generated prefix: %', prefix;

  -- Get the next number for this prefix
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(property_code FROM '^' || prefix || '(\d+)$') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM properties 
  WHERE property_code LIKE prefix || '%';

  RAISE NOTICE 'Next number: %', next_number;

  -- Format the property code
  property_code := prefix || LPAD(next_number::TEXT, 3, '0');

  RAISE NOTICE 'Final property code: %', property_code;

  RETURN property_code;
END;
$$;

