<?php
// logger for income
$data = json_decode(file_get_contents("php://input"), true);
if (isset($data["task"])) {
  $task = trim($data["task"]);
  if ($task !== "") {
    $jsonFile = "todo.json";
    $existing = file_exists($jsonFile) ? json_decode(file_get_contents($jsonFile), true) : [];
    $existing[] = ["task" => $task, "timestamp" => date("c")];
    file_put_contents($jsonFile, json_encode($existing, JSON_PRETTY_PRINT));
  }
}
?>