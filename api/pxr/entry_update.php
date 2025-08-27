<?php
require "db.php"; require "util.php";
$b = body_json();
$id   = (int)($b["id"] ?? 0);
$cat  = (int)($b["categoriaId"] ?? 0);
$sub  = (int)($b["subcategoriaId"] ?? 0);
$venc = $b["vencimento"] ?? null;
$prev = (float)($b["valorPrev"] ?? 0);
if($id<=0 || $cat<=0 || $sub<=0 || $prev<=0) j_err("Parâmetros inválidos.");
$stmt = $conn->prepare("UPDATE lancamentos SET categoria_id=?, subcategoria_id=?, vencimento=?, valor_previsto=? WHERE id=?");
$stmt->bind_param("iisdi", $cat, $sub, $venc, $prev, $id);
if(!$stmt->execute()) j_err("Erro ao atualizar: ".$conn->error,500);
j_ok(true);
