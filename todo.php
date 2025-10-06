<?php
function logAction($message) {
  $timestamp = date("Y-m-d H:i:s");
  file_put_contents("log.txt", "[$timestamp] $message\n", FILE_APPEND);
}

$jsonFile = "todo.json";
$tasks = file_exists($jsonFile) ? json_decode(file_get_contents($jsonFile), true) : [];

$data = json_decode(file_get_contents("php://input"), true);
if (isset($data["sort"]) && is_array($data["sort"])) {
  $idOrder = $data["sort"];
  $idMap = array_flip($idOrder);
  usort($tasks, fn($a, $b) => $idMap[$a["id"]] <=> $idMap[$b["id"]]);
  logAction("Sortierung aktualisiert: " . implode(", ", $idOrder));
  file_put_contents($jsonFile, json_encode(array_values($tasks), JSON_PRETTY_PRINT));
  exit;
}
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
  if (trim($text) === "") {
    http_response_code(400);
    echo json_encode(["error" => "Leerer Text ist nicht erlaubt"]);
    logAction("Fehlgeschlagene Aufgabe: Leerer Text");
    exit;
  }
  if (!$exists) {
    $tasks[] = [
      "id" => $id,
      "text" => $text,
      "done" => $done
    ];
    logAction("Neue Aufgabe hinzugefügt: ID=$id, Text='$text'");
  }
}

if (isset($data["sort"]) && is_array($data["sort"])) {
  $idOrder = $data["sort"];
  $idMap = array_flip($idOrder);
  usort($tasks, fn($a, $b) => $idMap[$a["id"]] <=> $idMap[$b["id"]]);
  logAction("Sortierung aktualisiert: " . implode(", ", $idOrder));
}

file_put_contents($jsonFile, json_encode(array_values($tasks), JSON_PRETTY_PRINT));
?>
