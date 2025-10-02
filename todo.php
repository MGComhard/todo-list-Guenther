<?php
function logAction($message) {
  $timestamp = date("Y-m-d H:i:s");
  file_put_contents("log.txt", "[$timestamp] $message\n", FILE_APPEND);
}

$jsonFile = "todo.json";
$tasks = file_exists($jsonFile) ? json_decode(file_get_contents($jsonFile), true) : [];

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data["task"])) {
  logAction("Ungültige Eingabe empfangen: " . json_encode($data));
  exit;
}

$taskText = trim($data["task"]);
if (isset($data["delete"]) && $data["delete"]) {
  $tasks = array_filter($tasks, fn($t) => $t["text"] !== $taskText);
  logAction("Aufgabe gelöscht: $taskText");
} elseif (isset($data["update"]) && isset($data["done"])) {
  foreach ($tasks as &$t) {
    if ($t["text"] === $taskText) {
      $t["done"] = $data["done"];
      break;
    }
  }
  logAction("Status geändert: '$taskText' → " . ($data["done"] ? "erledigt" : "offen"));
} else {
  $exists = array_filter($tasks, fn($t) => $t["text"] === $taskText);
  if (!$exists) {
    $tasks[] = ["text" => $taskText, "done" => $data["done"] ?? false];
    logAction("Neue Aufgabe hinzugefügt: $taskText");
  }
}

file_put_contents($jsonFile, json_encode(array_values($tasks), JSON_PRETTY_PRINT));
?>