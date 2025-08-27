<?php
require "db.php"; require "util.php";
$b = body_json();
$lid  = (int)($b["lancamentoId"] ?? 0);
$valor= (float)($b["valor"] ?? 0);
$data = $b["data"] ?? date("Y-m-d");
if($lid<=0 || $valor<=0) j_err("Parâmetros inválidos.");
$stmt = $conn->prepare("INSERT INTO pagamentos (lancamento_id, valor, data) VALUES (?,?,?)");
$stmt->bind_param("ids", $lid, $valor, $data);
if(!$stmt->execute()) j_err("Erro ao inserir pagamento: ".$conn->error,500);
j_ok(true);
