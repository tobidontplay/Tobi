-- Create shipping_addresses table
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for shipping_addresses
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own addresses
CREATE POLICY "Users can view their own shipping addresses"
  ON shipping_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own addresses
CREATE POLICY "Users can insert their own shipping addresses"
  ON shipping_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own addresses
CREATE POLICY "Users can update their own shipping addresses"
  ON shipping_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own addresses
CREATE POLICY "Users can delete their own shipping addresses"
  ON shipping_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);

-- Update orders table to include shipping_address_id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES shipping_addresses(id);
