-- Create employees table
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
