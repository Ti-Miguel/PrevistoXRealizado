<?php
require "db.php"; require "util.php";
$id = (int)($_GET["id"] ?? 0);
if($id<=0) j_err("ID inválido.");
// bloqueia se houver subcats
$chk = $conn->prepare("SELECT COUNT(*) c FROM subcategorias WHERE categoria_id=?");
$chk->bind_param("i",$id); $chk->execute(); $rc=$chk->get_result()->fetch_assoc();
if((int)$rc["c"]>0) j_err("Remova/realocar subcategorias antes.");
// bloqueia se estiver em uso
$chk2 = $conn->prepare("SELECT COUNT(*) c FROM lancamentos WHERE categoria_id=?");
$chk2->bind_param("i",$id); $chk2->execute(); $rc2=$chk2->get_result()->fetch_assoc();
if((int)$rc2["c"]>0) j_err("Categoria em uso em lançamentos.");
$conn->query("DELETE FROM categorias WHERE id={$id}");
j_ok(true);
