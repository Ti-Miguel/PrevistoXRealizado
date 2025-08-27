<?php
require "db.php"; require "util.php";
$setor = $_GET["setor"] ?? ""; $mes = $_GET["mes"] ?? "";
if(!in_array($setor, ["ODONTOLOGIA","MEDICINA"])) j_err("Setor inválido.");
if(!preg_match('/^\d{4}-\d{2}$/',$mes)) j_err("Mês inválido.");

$sql = "SELECT pg.data, pg.valor, l.categoria_id, l.subcategoria_id, l.vencimento, l.valor_previsto
        FROM pagamentos pg
        INNER JOIN lancamentos l ON l.id = pg.lancamento_id
        WHERE l.setor=? AND l.mes=?
        ORDER BY pg.data DESC, pg.id DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss",$setor,$mes);
$stmt->execute();
$res = $stmt->get_result();

$out = [];
while($r = $res->fetch_assoc()){
  $out[] = [
    "data" => $r["data"],
    "valor" => (float)$r["valor"],
    "categoriaId" => (int)$r["categoria_id"],
    "subcategoriaId" => (int)$r["subcategoria_id"],
    "vencimento" => $r["vencimento"],
    "valorPrevisto" => (float)$r["valor_previsto"]
  ];
}
j_ok($out);
