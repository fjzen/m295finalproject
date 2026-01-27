<?php
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (
    empty($data["description"]) ||
    empty($data["contact_customer_id"]) ||
    empty($data["billing_customer_id"])
) {
    http_response_code(400);
    echo json_encode(["error" => "Missing data"]);
    exit;
}

$stmt = $pdo->prepare("
    INSERT INTO task
      (description, contact_customer_id, billing_customer_id)
    VALUES
      (:description, :contact, :billing)
");

$stmt->execute([
    ":description" => $data["description"],
    ":contact" => $data["contact_customer_id"],
    ":billing" => $data["billing_customer_id"]
]);

echo json_encode(["success" => true]);
