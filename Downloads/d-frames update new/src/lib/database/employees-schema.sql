-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'support')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS employees_email_idx ON employees(email);

-- Create RLS policies for employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Only admins can view all employees
CREATE POLICY employees_view_policy ON employees
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can create new employees
CREATE POLICY employees_insert_policy ON employees
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update employees, and employees can update their own profile
CREATE POLICY employees_update_policy ON employees
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    (
      id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM employees
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Only admins can delete employees
CREATE POLICY employees_delete_policy ON employees
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create order_history table to track changes
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for order lookups
CREATE INDEX IF NOT EXISTS order_history_order_id_idx ON order_history(order_id);

-- Enable RLS on order_history
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Only employees can view order history
CREATE POLICY order_history_view_policy ON order_history
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid()
    )
  );

-- Only employees can insert order history
CREATE POLICY order_history_insert_policy ON order_history
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid()
    )
  );

-- Add columns to orders table for tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by UUID;
