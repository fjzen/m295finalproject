<?php
// Basic CORS handling for browser requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Reply to preflight (OPTIONS) without touching the database
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require "db.php";

$stmt = $pdo->query("
    SELECT
        t.id,
        t.created_at,
        t.status,
        t.description,
        c.last_name AS customer,
        e.last_name AS employee
    FROM task t
    JOIN customer c ON t.contact_customer_id = c.id
    LEFT JOIN employee e ON t.employee_id = e.id
    ORDER BY t.created_at DESC
");

echo json_encode($stmt->fetchAll());
