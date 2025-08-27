<?php
require "db.php"; require "util.php";
$id = (int)($_GET["id"] ?? 0);
if($id<=0) j_err("ID inválido.");
$stmt = $conn->prepare("DELETE FROM lancamentos WHERE id=?");
$stmt->bind_param("i",$id);
if(!$stmt->execute()) j_err("Erro ao excluir: ".$conn->error,500);
j_ok(true);
