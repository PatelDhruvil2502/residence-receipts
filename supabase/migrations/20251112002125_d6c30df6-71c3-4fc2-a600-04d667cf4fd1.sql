-- Create enum for package status
CREATE TYPE package_status AS ENUM ('checked_in', 'checked_out');

-- Create residents table
CREATE TABLE public.residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  house_number text NOT NULL UNIQUE,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create storage locations table
CREATE TABLE public.storage_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id text NOT NULL UNIQUE,
  description text,
  color text,
  size text,
  resident_id uuid REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
  storage_location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  status package_status DEFAULT 'checked_in',
  checked_in_at timestamptz DEFAULT now(),
  checked_in_by text,
  checked_out_at timestamptz,
  checked_out_by text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Allow public read access on residents"
  ON public.residents FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on residents"
  ON public.residents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on residents"
  ON public.residents FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on residents"
  ON public.residents FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access on storage_locations"
  ON public.storage_locations FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on storage_locations"
  ON public.storage_locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on storage_locations"
  ON public.storage_locations FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on storage_locations"
  ON public.storage_locations FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access on packages"
  ON public.packages FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on packages"
  ON public.packages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on packages"
  ON public.packages FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on packages"
  ON public.packages FOR DELETE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_residents_updated_at
  BEFORE UPDATE ON public.residents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default storage locations
INSERT INTO public.storage_locations (location_name, description) VALUES
  ('Section A', 'Main entrance storage area'),
  ('Section B', 'North wing storage'),
  ('Section C', 'South wing storage'),
  ('Section D', 'East wing storage');

-- Enable realtime for packages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;