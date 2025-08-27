<?php
require "db.php"; require "util.php";

$cats = [];
if ($res = $conn->query("SELECT id, nome FROM categorias ORDER BY nome")) {
  while($r = $res->fetch_assoc()) $cats[] = ["id"=>(int)$r["id"], "name"=>$r["nome"]];
}

$subs = [];
if ($res2 = $conn->query("SELECT id, categoria_id, nome FROM subcategorias ORDER BY nome")) {
  while($r = $res2->fetch_assoc()) $subs[] = ["id"=>(int)$r["id"], "categoryId"=>(int)$r["categoria_id"], "name"=>$r["nome"]];
}

j_ok(["categories"=>$cats, "subcategories"=>$subs]);
