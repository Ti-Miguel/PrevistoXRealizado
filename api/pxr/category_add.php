<?php
require "db.php"; require "util.php";
$body = body_json();
$name = trim($body["name"] ?? "");
if($name==="") j_err("Nome obrigatório.");
$stmt = $conn->prepare("INSERT INTO categorias (nome) VALUES (?)");
$stmt->bind_param("s", $name);
if(!$stmt->execute()) j_err("Erro ao inserir categoria: ".$conn->error,500);
j_ok(["id"=>$stmt->insert_id, "name"=>$name]);
