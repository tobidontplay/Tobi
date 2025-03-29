-- Check if delivery_tracking table exists and create it if needed
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  location JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant permissions on the delivery_tracking table
GRANT ALL PRIVILEGES ON TABLE public.delivery_tracking TO anon;
GRANT ALL PRIVILEGES ON TABLE public.delivery_tracking TO service_role;

-- Enable RLS for security
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Anyone can view delivery tracking" ON public.delivery_tracking
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert delivery tracking" ON public.delivery_tracking
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Anyone can update delivery tracking" ON public.delivery_tracking
  FOR UPDATE USING (true);
  
CREATE POLICY "Anyone can delete delivery tracking" ON public.delivery_tracking
  FOR DELETE USING (true);
