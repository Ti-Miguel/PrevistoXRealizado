<?php
header('Content-Type: application/json; charset=utf-8');
// (Opcional) CORS se acessar de outro domínio/subdomínio
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$host   = "localhost";
$user   = "u380360322_previsxrealiza";
$pass   = "Miguel847829";
$dbname = "u380360322_previsxrealiza";

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["ok"=>false, "erro"=>"Falha na conexão: ".$conn->connect_error]);
  exit;
}
$conn->set_charset("utf8mb4");
