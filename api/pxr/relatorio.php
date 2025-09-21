<?php
require "db.php"; require "util.php";
$setor = $_GET["setor"] ?? ""; $mes = $_GET["mes"] ?? "";
if(!in_array($setor, ["ODONTOLOGIA","MEDICINA"])) j_err("Setor inválido.");
if(!preg_match('/^\d{4}-\d{2}$/',$mes)) j_err("Mês inválido.");

$sql = "
  SELECT
    l.categoria_id,
    l.subcategoria_id,
    SUM(l.valor_previsto) AS prev,
    SUM(COALESCE(p.total_pago, 0)) AS pago
  FROM lancamentos l
  LEFT JOIN (
    SELECT lancamento_id, SUM(valor) AS total_pago
    FROM pagamentos
    GROUP BY lancamento_id
  ) p ON p.lancamento_id = l.id
  WHERE l.setor = ? AND l.mes = ?
  GROUP BY l.categoria_id, l.subcategoria_id
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $setor, $mes);
$stmt->execute();
$res = $stmt->get_result();

$out = [];
while($r = $res->fetch_assoc()){
  $out[] = [
    "categoriaId"   => (int)$r["categoria_id"],
    "subcategoriaId"=> (int)$r["subcategoria_id"],
    "prev"          => (float)$r["prev"],
    "pago"          => (float)$r["pago"]
  ];
}
j_ok($out);
