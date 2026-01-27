<?php
require __DIR__ . "/env.php";

$pdo = new PDO(
  "pgsql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME",
  $DB_USER,
  $DB_PASS,
  [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]
);
