/*
  # Dashboard Database Schema

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `role` (text)
      - `created_at` (timestamp)
      - `last_login` (timestamp)
    
    - `customers`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `created_at` (timestamp)
      - `status` (text)
    
    - `addresses`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `type` (text)
      - `street` (text)
      - `city` (text)
      - `state` (text)
      - `country` (text)
      - `postal_code` (text)
      - `is_default` (boolean)
    
    - `orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `status` (text)
      - `total_amount` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `price` (numeric)
    
    - `payments`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `amount` (numeric)
      - `status` (text)
      - `payment_method` (text)
      - `created_at` (timestamp)
    
    - `shipping`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `tracking_number` (text)
      - `carrier` (text)
      - `status` (text)
      - `estimated_delivery` (timestamp)
      - `actual_delivery` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for employee access based on role
    - Ensure data privacy and GDPR compliance
*/

-- Create employees table
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'support')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked'))
);

-- Create addresses table
CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('billing', 'shipping')),
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL,
  postal_code text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create shipping table
CREATE TABLE shipping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number text,
  carrier text,
  status text NOT NULL CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed')),
  estimated_delivery timestamptz,
  actual_delivery timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping ENABLE ROW LEVEL SECURITY;

-- Create policies for employees
CREATE POLICY "Employees can view all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = auth.uid()
  ));

CREATE POLICY "Employees can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = auth.uid()
  ));

CREATE POLICY "Employees can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = auth.uid()
  ));

CREATE POLICY "Employees can view all shipping"
  ON shipping
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = auth.uid()
  ));

-- Create policies for data modification
CREATE POLICY "Admins and managers can modify customer data"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id = auth.uid() 
      AND employees.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can modify order data"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id = auth.uid() 
      AND employees.role IN ('admin', 'manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_shipping_order_id ON shipping(order_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);