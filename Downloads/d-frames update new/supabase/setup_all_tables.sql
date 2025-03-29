-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create employees table first
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees (email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees (role);

-- Enable RLS for security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Employees can view their own profile" ON public.employees
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all employees" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage employees" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert a default admin user (password: admin123)
INSERT INTO public.employees (name, email, password_hash, role)
VALUES (
  'Admin User',
  'admin@dframes.com',
  '$2a$10$ORqTxV9Nh7XUP8/3GZZJo.Rl.YrTlj1QFCrjwCMsK2aMYFPzpvyXa',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- 2. Create emails table
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  starred BOOLEAN DEFAULT FALSE NOT NULL,
  folder TEXT DEFAULT 'inbox' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_emails_from ON public.emails (from_email);
CREATE INDEX IF NOT EXISTS idx_emails_subject ON public.emails (subject);
CREATE INDEX IF NOT EXISTS idx_emails_date ON public.emails (date);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON public.emails (folder);

-- Enable RLS for security
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Employees can view their emails" ON public.emails
  FOR SELECT USING (true);

CREATE POLICY "Employees can insert emails" ON public.emails
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Employees can update emails" ON public.emails
  FOR UPDATE USING (true);
  
CREATE POLICY "Employees can delete emails" ON public.emails
  FOR DELETE USING (true);

-- 3. Create the email_errors table to track failures
CREATE TABLE IF NOT EXISTS public.email_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    attempted_action TEXT NOT NULL,
    email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ
);

-- Create index for efficient timestamp-based queries
CREATE INDEX IF NOT EXISTS email_errors_timestamp_idx ON public.email_errors (timestamp DESC);

-- Create index for finding errors by type
CREATE INDEX IF NOT EXISTS email_errors_type_idx ON public.email_errors (error_type);

-- Create a view for analytics on error frequency
CREATE OR REPLACE VIEW public.email_error_analytics AS
SELECT 
    date_trunc('hour', timestamp) as time_bucket,
    error_type,
    COUNT(*) as error_count,
    COUNT(CASE WHEN resolved THEN 1 END) as resolved_count
FROM 
    public.email_errors
GROUP BY 
    date_trunc('hour', timestamp),
    error_type
ORDER BY 
    time_bucket DESC;

-- Create a function to record email errors
CREATE OR REPLACE FUNCTION public.record_email_error(
    p_error_type TEXT,
    p_error_message TEXT,
    p_attempted_action TEXT,
    p_email_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_error_id UUID;
BEGIN
    INSERT INTO public.email_errors (
        error_type,
        error_message,
        attempted_action,
        email_id
    ) VALUES (
        p_error_type,
        p_error_message,
        p_attempted_action,
        p_email_id
    ) RETURNING id INTO v_error_id;
    
    RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to resolve email errors
CREATE OR REPLACE FUNCTION public.resolve_email_error(
    p_error_id UUID,
    p_resolution_notes TEXT,
    p_resolved_by UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.email_errors
    SET 
        resolved = true,
        resolution_notes = p_resolution_notes,
        resolved_by = p_resolved_by,
        resolved_at = now()
    WHERE id = p_error_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table to track database connectivity
CREATE TABLE IF NOT EXISTS public.db_connectivity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'degraded')),
    latency_ms INTEGER,
    notes TEXT
);

-- Create index for efficient timestamp-based queries
CREATE INDEX IF NOT EXISTS db_connectivity_timestamp_idx ON public.db_connectivity (timestamp DESC);

-- Create a function to record database connectivity
CREATE OR REPLACE FUNCTION public.record_db_connectivity(
    p_status TEXT,
    p_latency_ms INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_connectivity_id UUID;
BEGIN
    INSERT INTO public.db_connectivity (
        status,
        latency_ms,
        notes
    ) VALUES (
        p_status,
        p_latency_ms,
        p_notes
    ) RETURNING id INTO v_connectivity_id;
    
    RETURN v_connectivity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data for email errors
INSERT INTO public.email_errors (error_type, error_message, attempted_action)
VALUES 
('connection_timeout', 'Connection timed out after 30 seconds', 'fetch_emails'),
('authentication_failed', 'Invalid credentials', 'fetch_emails'),
('server_error', 'Server returned 500 error', 'fetch_emails'),
('parse_error', 'Failed to parse email content', 'process_email'),
('connection_timeout', 'Connection timed out after 30 seconds', 'fetch_emails'),
('rate_limit', 'Too many requests, rate limited by server', 'fetch_emails'),
('server_error', 'Server returned 503 error', 'fetch_emails'),
('authentication_failed', 'Token expired', 'fetch_emails'),
('connection_timeout', 'Connection timed out after 30 seconds', 'fetch_emails'),
('parse_error', 'Invalid email format', 'process_email');

-- Insert some sample data for database connectivity
INSERT INTO public.db_connectivity (status, latency_ms, notes)
VALUES 
('online', 15, 'Normal operation'),
('online', 18, 'Normal operation'),
('degraded', 120, 'High latency detected'),
('offline', NULL, 'Connection lost'),
('online', 22, 'Connection restored');

-- 4. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  product_name TEXT NOT NULL,
  product_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- Enable RLS for security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Employees can view orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Employees can insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Employees can update orders" ON public.orders
  FOR UPDATE USING (true);
  
CREATE POLICY "Employees can delete orders" ON public.orders
  FOR DELETE USING (true);

-- Insert some sample orders
INSERT INTO public.orders (customer_name, customer_email, customer_phone, product_name, product_id, quantity, total_price, status, shipping_address, payment_method, payment_id, notes)
VALUES
('John Doe', 'john.doe@example.com', '555-123-4567', 'Premium Frame', 'FRAME-001', 2, 129.98, 'delivered', '123 Main St, Anytown, USA', 'credit_card', 'pay_abc123', 'Gift wrapped'),
('Jane Smith', 'jane.smith@example.com', '555-987-6543', 'Custom Frame', 'FRAME-002', 1, 89.99, 'shipped', '456 Oak Ave, Somewhere, USA', 'paypal', 'pay_def456', NULL),
('Bob Johnson', ' bob.johnson@example.com', '555-555-5555', 'Photo Frame', 'FRAME-003', 3, 149.97, 'processing', '789 Pine Rd, Nowhere, USA', 'credit_card', 'pay_ghi789', 'Rush delivery requested');

-- 5. Create sales analytics table
CREATE TABLE IF NOT EXISTS public.sales_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  region TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  customer_segment TEXT NOT NULL,
  sale_type TEXT NOT NULL CHECK (sale_type IN ('online', 'in-store', 'wholesale')),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_product ON public.sales_analytics (product_id);
CREATE INDEX IF NOT EXISTS idx_sales_region ON public.sales_analytics (region);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales_analytics (sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_category ON public.sales_analytics (category);

-- Enable RLS for security
ALTER TABLE public.sales_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Employees can view sales analytics" ON public.sales_analytics
  FOR SELECT USING (true);

CREATE POLICY "Employees can insert sales analytics" ON public.sales_analytics
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Employees can update sales analytics" ON public.sales_analytics
  FOR UPDATE USING (true);
  
CREATE POLICY "Employees can delete sales analytics" ON public.sales_analytics
  FOR DELETE USING (true);

-- Create a view for sales performance
CREATE OR REPLACE VIEW public.sales_performance AS
SELECT
  date_trunc('day', sale_date) AS sale_day,
  region,
  category,
  SUM(quantity) AS total_quantity,
  SUM(total_price) AS total_revenue,
  COUNT(*) AS total_transactions
FROM public.sales_analytics
GROUP BY
  date_trunc('day', sale_date),
  region,
  category
ORDER BY sale_day DESC;

-- Create a view for top selling products
CREATE OR REPLACE VIEW public.top_selling_products AS
SELECT
  product_id,
  product_name,
  SUM(quantity) AS total_quantity,
  SUM(total_price) AS total_revenue
FROM public.sales_analytics
GROUP BY
  product_id,
  product_name
ORDER BY total_revenue DESC;

-- Create a view for regional sales distribution
CREATE OR REPLACE VIEW public.regional_sales_distribution AS
SELECT
  region,
  SUM(total_price) AS total_revenue,
  COUNT(*) AS total_transactions
FROM public.sales_analytics
GROUP BY region
ORDER BY total_revenue DESC;

-- Create a function to record sales
CREATE OR REPLACE FUNCTION public.record_sale(
  p_order_id UUID,
  p_product_id TEXT,
  p_product_name TEXT,
  p_category TEXT,
  p_region TEXT,
  p_quantity INTEGER,
  p_unit_price DECIMAL(10, 2),
  p_customer_segment TEXT,
  p_sale_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_sale_id UUID;
BEGIN
  INSERT INTO public.sales_analytics (
    order_id,
    product_id,
    product_name,
    category,
    region,
    quantity,
    unit_price,
    total_price,
    customer_segment,
    sale_type
  ) VALUES (
    p_order_id,
    p_product_id,
    p_product_name,
    p_category,
    p_region,
    p_quantity,
    p_unit_price,
    p_quantity * p_unit_price,
    p_customer_segment,
    p_sale_type
  ) RETURNING id INTO v_sale_id;
  
  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample sales data
INSERT INTO public.sales_analytics (
  order_id,
  product_id,
  product_name,
  category,
  region,
  quantity,
  unit_price,
  total_price,
  customer_segment,
  sale_type
) VALUES
((SELECT id FROM public.orders LIMIT 1 OFFSET 0), 'FRAME-001', 'Premium Frame', 'Frames', 'North America', 2, 64.99, 129.98, 'retail', 'online'),
((SELECT id FROM public.orders LIMIT 1 OFFSET 1), 'FRAME-002', 'Custom Frame', 'Frames', 'Europe', 1, 89.99, 89.99, 'wholesale', 'in-store'),
((SELECT id FROM public.orders LIMIT 1 OFFSET 2), 'FRAME-003', 'Photo Frame', 'Frames', 'Asia', 3, 49.99, 149.97, 'retail', 'online');
