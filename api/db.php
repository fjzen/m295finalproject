<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Load .env manually
$envPath = __DIR__ . '/.env';
if (!file_exists($envPath)) {
  http_response_code(500);
  echo json_encode(["error" => ".env file not found in api/"]);
  exit;
}

$env = parse_ini_file($envPath);

try {
  $dsn = sprintf(
    "pgsql:host=%s;port=%s;dbname=%s;sslmode=require",
    $env['host'] ?? '',
    $env['port'] ?? '',
    $env['dbname'] ?? ''
  );

  $pdo = new PDO(
    $dsn,
    $env['user'] ?? '',
    $env['password'] ?? '',
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]
  );
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(["error" => "DB connection failed: " . $e->getMessage()]);
  exit;
}

?>