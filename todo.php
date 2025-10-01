<?php
$jsonFile = "todo.json";
$tasks = file_exists($jsonFile) ? json_decode(file_get_contents($jsonFile), true) : [];
// logger for income
$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data["task"])) exit;

$taskText = trim($data["task"]);

if (isset($data["delete"]) && $data["delete"]) {
  $tasks = array_filter($tasks, fn($t) => $t["text"] !== $taskText);
} elseif (isset($data["update"]) && isset($data["done"])) {
  foreach ($tasks as &$t) {
    if ($t["text"] === $taskText) {
      $t["done"] = $data["done"];
      break;
    }
  }
} else {
  $exists = array_filter($tasks, fn($t) => $t["text"] === $taskText);
  if (!$exists) {
    $tasks[] = ["text" => $taskText, "done" => $data["done"] ?? false];
  }
}

file_put_contents($jsonFile, json_encode(array_values($tasks), JSON_PRETTY_PRINT));
?>