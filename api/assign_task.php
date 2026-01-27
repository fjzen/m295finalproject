<?php
// Always return JSON
header("Content-Type: application/json");

// Load database connection ($pdo)
require "db.php";

// Read raw JSON request body
$input = file_get_contents("php://input");
$data  = json_decode($input, true);

// Validate required fields
if (
    empty($data["task_id"]) ||
    empty($data["employee_id"])
) {
    http_response_code(400);
    echo json_encode(["error" => "Missing data"]);
    exit;
}

// Prepare SQL statement (prevents SQL injection)
$stmt = $pdo->prepare("
    UPDATE task
    SET
        employee_id = :employee_id,
        status = 'ASSIGNED'
    WHERE id = :task_id
");

// Execute with bound parameters
$stmt->execute([
    ":employee_id" => $data["employee_id"],
    ":task_id"     => $data["task_id"]
]);

// Return success response
echo json_encode(["success" => true]);
