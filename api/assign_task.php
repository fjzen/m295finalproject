<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require "db.php";

$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Ensure keys match the frontend api.js (task_id)
if (empty($data["task_id"]) || empty($data["employee_id"])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing task_id or employee_id"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        UPDATE task 
        SET employee_id = :employee_id, status = 'ASSIGNED' 
        WHERE id = :task_id
    ");
    $stmt->execute([
        ":employee_id" => $data["employee_id"],
        ":task_id"     => $data["task_id"]
    ]);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}