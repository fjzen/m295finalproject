-- ============================================================
-- MIGRATIONS for Glauser Service Management Platform
-- Run these in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Migration 1: Enhance task table
ALTER TABLE task
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS location_address VARCHAR(200),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by_id INT REFERENCES employee(id),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by_id INT REFERENCES employee(id);

-- Migration 2: Enhance report table
ALTER TABLE report
ADD COLUMN IF NOT EXISTS work_performed TEXT,
ADD COLUMN IF NOT EXISTS hours_worked NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS materials_used TEXT,
ADD COLUMN IF NOT EXISTS work_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS work_end_time TIMESTAMP;

-- Migration 3: Enhance invoice table
ALTER TABLE invoice
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 8.1,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS invoice_notes TEXT;

-- Migration 4: Create user_account table (links Supabase Auth to employees)
CREATE TABLE IF NOT EXISTS user_account (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employee(id) UNIQUE,
  email VARCHAR(100) UNIQUE NOT NULL,
  supabase_user_id UUID UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS: Allow authenticated users to read their own user_account row
ALTER TABLE user_account ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own account" ON user_account;
CREATE POLICY "Users can read own account" ON user_account
  FOR SELECT
  USING (auth.uid() = supabase_user_id);

-- RLS: Allow service role / authenticated to insert (for admin setup)
DROP POLICY IF EXISTS "Allow insert for authenticated" ON user_account;
CREATE POLICY "Allow insert for authenticated" ON user_account
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for authenticated" ON user_account;
CREATE POLICY "Allow update for authenticated" ON user_account
  FOR UPDATE
  USING (auth.uid() = supabase_user_id);

-- Migration 5: Create task_comment table
CREATE TABLE IF NOT EXISTS task_comment (
  id SERIAL PRIMARY KEY,
  task_id INT REFERENCES task(id) ON DELETE CASCADE,
  employee_id INT REFERENCES employee(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration 6: Create task_status_history table
CREATE TABLE IF NOT EXISTS task_status_history (
  id SERIAL PRIMARY KEY,
  task_id INT REFERENCES task(id) ON DELETE CASCADE,
  old_status task_status,
  new_status task_status NOT NULL,
  changed_by INT REFERENCES employee(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Migration 7: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_status ON task(status);
CREATE INDEX IF NOT EXISTS idx_task_employee ON task(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_customer ON task(contact_customer_id);
CREATE INDEX IF NOT EXISTS idx_task_date ON task(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_report_task ON report(task_id);
CREATE INDEX IF NOT EXISTS idx_invoice_task ON invoice(task_id);

-- Migration 8: Sample data (optional - skip if you already have data)
-- INSERT INTO customer (first_name, last_name, address, phone, email) VALUES
-- ('Max', 'Müller', 'Hauptstrasse 123, 8330 Pfäffikon', '+41 44 123 45 67', 'max.mueller@email.ch'),
-- ('Anna', 'Meier', 'Seestrasse 45, 8600 Dübendorf', '+41 44 234 56 78', 'anna.meier@email.ch')
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- RLS POLICIES for customer, employee, task (allow authenticated access)
-- ============================================================

ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON customer;
CREATE POLICY "Allow all for authenticated" ON customer
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE employee ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON employee;
CREATE POLICY "Allow all for authenticated" ON employee
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE task ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON task;
CREATE POLICY "Allow all for authenticated" ON task
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE report ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON report;
CREATE POLICY "Allow all for authenticated" ON report
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON invoice;
CREATE POLICY "Allow all for authenticated" ON invoice
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- LINK YOUR SUPABASE AUTH USER TO AN EMPLOYEE
-- Run this AFTER creating a user in Supabase Auth (Dashboard > Authentication)
-- Replace YOUR_SUPABASE_USER_UUID with the user's UUID from Auth > Users
-- Replace EMPLOYEE_ID with the employee.id you want to link
-- Replace EMAIL with the user's email
-- ============================================================
-- INSERT INTO user_account (employee_id, email, supabase_user_id) VALUES
--   (1, 'your-email@example.com', 'YOUR_SUPABASE_USER_UUID');
