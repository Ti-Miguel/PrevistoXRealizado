<?php
require "db.php"; require "util.php";
$body = body_json();
$catId = (int)($body["categoryId"] ?? 0);
$name  = trim($body["name"] ?? "");
if($catId<=0 || $name==="") j_err("Parâmetros inválidos.");
$stmt = $conn->prepare("INSERT INTO subcategorias (categoria_id, nome) VALUES (?,?)");
$stmt->bind_param("is",$catId,$name);
if(!$stmt->execute()) j_err("Erro ao inserir subcategoria: ".$conn->error,500);
j_ok(["id"=>$stmt->insert_id, "categoryId"=>$catId, "name"=>$name]);
