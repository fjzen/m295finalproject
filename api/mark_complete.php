<?php
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data["task_id"])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing task_id"]);
    exit;
}

$pdo->prepare("
    UPDATE task
    SET status = 'COMPLETED'
    WHERE id = :task
")->execute([
    ":task" => $data["task_id"]
]);

echo json_encode(["success" => true]);
