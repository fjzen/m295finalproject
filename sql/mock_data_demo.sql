-- ============================================================
-- DEMO / TEST DATA for Service Task Management Dashboard
-- Use for grading, demos, and local testing.
-- NOT production-ready. Run after schema.sql (and migrations if used).
-- ============================================================

-- Clear existing data (optional; comment out if you want to keep data)
-- TRUNCATE invoice, report, task, employee, customer RESTART IDENTITY CASCADE;

-- =========================
-- CUSTOMERS
-- =========================
INSERT INTO customer (first_name, last_name, address, phone, email) VALUES
('Max', 'Muster', 'Hauptstrasse 1, 8330 Pfäffikon', '+41 44 111 11 11', 'max.muster@example.ch'),
('Anna', 'Meier', 'Seestrasse 45, 8600 Dübendorf', '+41 44 222 22 22', 'anna.meier@example.ch'),
('Lukas', 'Keller', 'Bahnhofstrasse 10, 8001 Zürich', '+41 44 333 33 33', 'lukas.keller@example.ch'),
('Sara', 'Fischer', 'Dorfstrasse 5, 8852 Altendorf', '+41 55 444 44 44', 'sara.fischer@example.ch'),
('Thomas', 'Weber', 'Industriestrasse 20, 8640 Rapperswil', '+41 55 555 55 55', 'thomas.weber@example.ch');

-- =========================
-- EMPLOYEES (all roles: GL=ADMIN, ADMIN, BL=MANAGER, MA=WORKER)
-- =========================
INSERT INTO employee (first_name, last_name, role) VALUES
('Maria', 'Admin', 'ADMIN'),
('Peter', 'Geschäftsführer', 'GL'),
('Lisa', 'Büro', 'BL'),
('Tom', 'Worker', 'MA'),
('Julia', 'Mitarbeiterin', 'MA');

-- If your schema has salary (e.g. via migration): uncomment and adjust.
-- ALTER TABLE employee ADD COLUMN IF NOT EXISTS salary NUMERIC(10,2);
-- UPDATE employee SET salary = 85000 WHERE role IN ('ADMIN','GL');
-- UPDATE employee SET salary = 72000 WHERE role = 'BL';
-- UPDATE employee SET salary = 65000 WHERE role = 'MA';

-- =========================
-- TASKS (one per status: CREATED, ASSIGNED, COMPLETED, APPROVED, INVOICED)
-- =========================
-- Base schema has no priority column; migrations add it. Omit priority for base schema.
INSERT INTO task (description, status, contact_customer_id, billing_customer_id, employee_id) VALUES
('Fenster reparieren', 'CREATED', 1, 1, NULL),
('Glasbruch ersetzen', 'ASSIGNED', 2, 2, 4),
('Dichtung erneuern', 'COMPLETED', 3, 3, 4),
('Neue Scheibe einbauen', 'APPROVED', 4, 4, 5),
('Notfall: undicht', 'INVOICED', 5, 5, 5);

-- =========================
-- REPORTS (for completed+ tasks; workers submit, managers approve)
-- =========================
INSERT INTO report (task_id, description, report_date) VALUES
((SELECT id FROM task WHERE status = 'COMPLETED' LIMIT 1), 'Dichtung ausgetauscht, getestet.', CURRENT_DATE - 2),
((SELECT id FROM task WHERE status = 'APPROVED' LIMIT 1), 'Scheibe eingebaut, gereinigt.', CURRENT_DATE - 1),
((SELECT id FROM task WHERE status = 'INVOICED' LIMIT 1), 'Leck abgedichtet, Folie angebracht.', CURRENT_DATE - 3);

-- =========================
-- INVOICES (for invoiced task)
-- =========================
INSERT INTO invoice (task_id, amount, invoice_date) VALUES
((SELECT id FROM task WHERE status = 'INVOICED' LIMIT 1), 450.00, CURRENT_DATE - 1);

-- ============================================================
-- LINK SUPABASE AUTH TO EMPLOYEE (run manually after creating users)
-- ============================================================
-- INSERT INTO user_account (employee_id, email, supabase_user_id) VALUES
--   (1, 'admin@example.com', 'YOUR_SUPABASE_USER_UUID');
-- Repeat for each employee that should log in.
