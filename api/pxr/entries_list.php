<?php
require "db.php"; require "util.php";
$setor = $_GET["setor"] ?? "";
$mes   = $_GET["mes"] ?? "";
if(!in_array($setor, ["ODONTOLOGIA","MEDICINA"])) j_err("Setor inválido.");
if(!preg_match('/^\d{4}-\d{2}$/',$mes)) j_err("Mês inválido (YYYY-MM).");

$sql = "SELECT l.id, l.categoria_id, l.subcategoria_id, l.vencimento, l.valor_previsto, l.criado_em
        FROM lancamentos l WHERE l.setor=? AND l.mes=?
        ORDER BY l.criado_em DESC, l.id DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss",$setor,$mes);
$stmt->execute();
$res = $stmt->get_result();

$items = [];
while($r = $res->fetch_assoc()){
  $items[] = [
    "id" => (int)$r["id"],
    "categoriaId" => (int)$r["categoria_id"],
    "subcategoriaId" => (int)$r["subcategoria_id"],
    "vencimento" => $r["vencimento"],
    "valorPrev" => (float)$r["valor_previsto"],
    "criadoEm" => $r["criado_em"]
  ];
}

if(count($items)){
  $ids = implode(",", array_map(fn($i)=> (int)$i["id"], $items));
  $pg = $conn->query("SELECT lancamento_id, valor, data FROM pagamentos WHERE lancamento_id IN ($ids) ORDER BY data DESC, id DESC");
  $map = [];
  if($pg){
    while($p = $pg->fetch_assoc()){
      $lid = (int)$p["lancamento_id"];
      if(!isset($map[$lid])) $map[$lid] = [];
      $map[$lid][] = ["valor"=>(float)$p["valor"], "data"=>$p["data"]];
    }
  }
  foreach($items as &$it){ $it["pagamentos"] = $map[$it["id"]] ?? []; }
}

j_ok(["entries"=>$items]);
