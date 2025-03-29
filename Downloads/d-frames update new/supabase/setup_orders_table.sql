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
('Bob Johnson', 'bob.johnson@example.com', '555-555-5555', 'Photo Frame', 'FRAME-003', 3, 149.97, 'processing', '789 Pine Rd, Nowhere, USA', 'credit_card', 'pay_ghi789', 'Rush delivery requested');
