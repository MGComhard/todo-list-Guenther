<?php
function logAction($message) {
  $timestamp = date("Y-m-d H:i:s");
  file_put_contents("log.txt", "[$timestamp] $message\n", FILE_APPEND);
}

$jsonFile = "todo.json";
$tasks = file_exists($jsonFile) ? json_decode(file_get_contents($jsonFile), true) : [];

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data["id"])) {
  logAction("Ungültige Eingabe empfangen: " . json_encode($data));
  exit;
}

$id = trim($data["id"]);
$text = trim($data["task"] ?? "");
$done = $data["done"] ?? false;

if (isset($data["delete"]) && $data["delete"]) {
  $tasks = array_filter($tasks, fn($t) => $t["id"] !== $id);
  logAction("Aufgabe gelöscht: ID=$id, Text='$text'");
}

elseif (isset($data["update"])) {
  foreach ($tasks as &$t) {
    if ($t["id"] === $id) {
      $t["done"] = $done;
      logAction("Status geändert: ID=$id, Text='{$t["text"]}' → " . ($done ? "erledigt" : "offen"));
      break;
    }
  }
}

else {
  $exists = array_filter($tasks, fn($t) => $t["id"] === $id);
  if (!$exists) {
    $tasks[] = [
      "id" => $id,
      "text" => $text,
      "done" => $done
    ];
    logAction("Neue Aufgabe hinzugefügt: ID=$id, Text='$text'");
  }
}
file_put_contents($jsonFile, json_encode(array_values($tasks), JSON_PRETTY_PRINT));
?>
