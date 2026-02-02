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

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data["task_id"]) || empty($data["amount"])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing task_id or amount"]);
    exit;
}

try {
    $pdo->beginTransaction();
    // Insert invoice record
    $stmt = $pdo->prepare("INSERT INTO invoice (amount, task_id) VALUES (:amount, :task)");
    $stmt->execute([":amount" => $data["amount"], ":task" => $data["task_id"]]);

    // Update task status
    $stmt2 = $pdo->prepare("UPDATE task SET status = 'INVOICED' WHERE id = :task");
    $stmt2->execute([":task" => $data["task_id"]]);

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}