<?php
require "db.php"; require "util.php";
$b = body_json();
$setor = $b["setor"] ?? ""; $mes = $b["mes"] ?? "";
$catId = (int)($b["categoriaId"] ?? 0);
$subId = (int)($b["subcategoriaId"] ?? 0);
$venc  = $b["vencimento"] ?? null;
$prev  = (float)($b["valorPrev"] ?? 0);

if(!in_array($setor,["ODONTOLOGIA","MEDICINA"])) j_err("Setor inválido.");
if(!preg_match('/^\d{4}-\d{2}$/',$mes)) j_err("Mês inválido.");
if($catId<=0 || $subId<=0 || $prev<=0) j_err("Dados incompletos.");

$criado = date("Y-m-d");
$stmt = $conn->prepare("INSERT INTO lancamentos (setor,mes,categoria_id,subcategoria_id,vencimento,valor_previsto,criado_em) VALUES (?,?,?,?,?,?,?)");
$stmt->bind_param("ssiisds", $setor,$mes,$catId,$subId,$venc,$prev,$criado);
if(!$stmt->execute()) j_err("Erro ao inserir: ".$conn->error,500);
j_ok(["id"=>$stmt->insert_id]);
