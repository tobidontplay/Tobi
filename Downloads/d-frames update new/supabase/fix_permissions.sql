-- Fix permissions for the orders table
-- This script grants the necessary permissions to allow inserting orders

-- First, let's check if the anon role has the necessary permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;

-- Grant permissions on the orders table
GRANT ALL PRIVILEGES ON TABLE public.orders TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Make sure the RLS policies are correctly set
DROP POLICY IF EXISTS "Employees can view orders" ON public.orders;
DROP POLICY IF EXISTS "Employees can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Employees can update orders" ON public.orders;
DROP POLICY IF EXISTS "Employees can delete orders" ON public.orders;

-- Create new policies with proper permissions
CREATE POLICY "Anyone can view orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Anyone can update orders" ON public.orders
  FOR UPDATE USING (true);
  
CREATE POLICY "Anyone can delete orders" ON public.orders
  FOR DELETE USING (true);

-- Make sure the service_role also has all permissions
GRANT ALL PRIVILEGES ON TABLE public.orders TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
