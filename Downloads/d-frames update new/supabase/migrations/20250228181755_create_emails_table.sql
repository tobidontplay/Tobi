-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
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
CREATE INDEX idx_emails_from ON emails (from_email);
CREATE INDEX idx_emails_subject ON emails (subject);
CREATE INDEX idx_emails_date ON emails (date);
CREATE INDEX idx_emails_folder ON emails (folder);

-- Enable RLS for security
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Employees can view their emails" ON emails
  FOR SELECT USING (true);

CREATE POLICY "Employees can manage their emails" ON emails
  FOR INSERT WITH CHECK (true),
  FOR UPDATE USING (true),
  FOR DELETE USING (true);