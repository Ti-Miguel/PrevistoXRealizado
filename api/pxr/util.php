<?php
function j_ok($data){ echo json_encode(["ok"=>true,"data"=>$data], JSON_UNESCAPED_UNICODE); exit; }
function j_err($msg, $code=400){ http_response_code($code); echo json_encode(["ok"=>false,"erro"=>$msg], JSON_UNESCAPED_UNICODE); exit; }
function body_json(){
  $raw = file_get_contents("php://input");
  $j = json_decode($raw, true);
  return is_array($j) ? $j : [];
}
