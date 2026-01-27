<?php
// Load database connection ($pdo)
require "db.php";

// Read raw JSON request body
$data = json_decode(file_get_contents("php://input"), true);

if (
    empty($data["task_id"]) ||
    empty($data["description"])
) {
    http_response_code(400);
    echo json_encode(["error" => "Missing data"]);
    exit;
}

$pdo->prepare("
    INSERT INTO report (description, task_id)
    VALUES (:description, :task)
")->execute([
    ":description" => $data["description"],
    ":task" => $data["task_id"]
]);

$pdo->prepare("
    UPDATE task
    SET status = 'COMPLETED'
    WHERE id = :task
")->execute([
    ":task" => $data["task_id"]
]);

echo json_encode(["success" => true]);
