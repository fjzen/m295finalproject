-- =========================
-- ENUM TYPES
-- =========================

CREATE TYPE employee_role AS ENUM (
  'GL',
  'ADMIN',
  'BL',
  'MA'
);

CREATE TYPE task_status AS ENUM (
  'CREATED',
  'ASSIGNED',
  'COMPLETED',
  'APPROVED',
  'INVOICED'
);

-- =========================
-- TABLES
-- =========================

-- Customers
CREATE TABLE customer (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  address VARCHAR(150),
  phone VARCHAR(20),
  email VARCHAR(100)
);

-- Employees
CREATE TABLE employee (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  role employee_role NOT NULL
);

-- Tasks (formerly service_order / Auftrag)
CREATE TABLE task (
  id SERIAL PRIMARY KEY,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_date DATE,
  description TEXT,
  status task_status NOT NULL DEFAULT 'CREATED',

  contact_customer_id INT NOT NULL,
  billing_customer_id INT NOT NULL,
  employee_id INT,

  CONSTRAINT fk_task_contact_customer
    FOREIGN KEY (contact_customer_id) REFERENCES customer(id),

  CONSTRAINT fk_task_billing_customer
    FOREIGN KEY (billing_customer_id) REFERENCES customer(id),

  CONSTRAINT fk_task_employee
    FOREIGN KEY (employee_id) REFERENCES employee(id)
);

-- Reports
CREATE TABLE report (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  task_id INT NOT NULL,

  CONSTRAINT fk_report_task
    FOREIGN KEY (task_id) REFERENCES task(id)
);

-- Invoices
CREATE TABLE invoice (
  id SERIAL PRIMARY KEY,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL,
  task_id INT NOT NULL,

  CONSTRAINT fk_invoice_task
    FOREIGN KEY (task_id) REFERENCES task(id)
);
