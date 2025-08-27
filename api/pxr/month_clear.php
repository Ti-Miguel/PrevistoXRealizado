<?php
require "db.php"; require "util.php";
$b = body_json();
$setor = $b["setor"] ?? ""; $mes = $b["mes"] ?? "";
if(!in_array($setor,["ODONTOLOGIA","MEDICINA"])) j_err("Setor inválido.");
if(!preg_match('/^\d{4}-\d{2}$/',$mes)) j_err("Mês inválido.");
$stmt = $conn->prepare("DELETE FROM lancamentos WHERE setor=? AND mes=?");
$stmt->bind_param("ss",$setor,$mes);
if(!$stmt->execute()) j_err("Erro ao limpar mês: ".$conn->error,500);
j_ok(true);
