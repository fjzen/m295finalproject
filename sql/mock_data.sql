INSERT INTO customer (first_name, last_name, email) VALUES
('Max', 'Muster', 'max@example.com'),
('Anna', 'Meier', 'anna@example.com'),
('Lukas', 'Keller', 'lukas@example.com');

INSERT INTO employee (first_name, last_name, role) VALUES
('Peter', 'Admin', 'ADMIN'),
('Sandra', 'Boss', 'GL'),
('Tom', 'Worker', 'MA');

INSERT INTO task (description, contact_customer_id, billing_customer_id)
VALUES
('Fix leaking sink', 1, 1),
('Install new window', 2, 2),
('Replace broken glass', 3, 3);
