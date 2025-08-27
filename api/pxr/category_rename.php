<?php
require "db.php"; require "util.php";
$body = body_json();
$id   = (int)($body["id"] ?? 0);
$name = trim($body["name"] ?? "");
if($id<=0 || $name==="") j_err("Parâmetros inválidos.");
$stmt = $conn->prepare("UPDATE categorias SET nome=? WHERE id=?");
$stmt->bind_param("si", $name, $id);
if(!$stmt->execute()) j_err("Erro ao renomear: ".$conn->error,500);
j_ok(true);
