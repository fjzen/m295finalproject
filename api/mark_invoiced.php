<?php
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (
    empty($data["task_id"]) ||
    empty($data["amount"])
) {
    http_response_code(400);
    echo json_encode(["error" => "Missing data"]);
    exit;
}

$pdo->prepare("
    INSERT INTO invoice (amount, task_id)
    VALUES (:amount, :task)
")->execute([
    ":amount" => $data["amount"],
    ":task" => $data["task_id"]
]);

$pdo->prepare("
    UPDATE task
    SET status = 'INVOICED'
    WHERE id = :task
")->execute([
    ":task" => $data["task_id"]
]);

echo json_encode(["success" => true]);
