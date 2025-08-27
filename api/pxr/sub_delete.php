<?php
require "db.php"; require "util.php";
$id = (int)($_GET["id"] ?? 0);
if($id<=0) j_err("ID inválido.");
// bloqueia se estiver em uso
$chk = $conn->prepare("SELECT COUNT(*) c FROM lancamentos WHERE subcategoria_id=?");
$chk->bind_param("i",$id); $chk->execute(); $rc=$chk->get_result()->fetch_assoc();
if((int)$rc["c"]>0) j_err("Subcategoria em uso em lançamentos.");
$conn->query("DELETE FROM subcategorias WHERE id={$id}");
j_ok(true);
