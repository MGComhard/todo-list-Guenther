<?php
function logAction($message): void {
    $timestamp = date("Y-m-d H:i:s");
    file_put_contents("log.txt", "[$timestamp] $message\n", FILE_APPEND);
}

function loadTasks($filename): array {
    return file_exists($filename) ? json_decode(file_get_contents($filename), true) : [];
}

function saveTasks($filename, $tasks): void {
    file_put_contents($filename, json_encode(array_values($tasks), JSON_PRETTY_PRINT));
}

function sortTasks(&$tasks, $idOrder): void {
    $idMap = array_flip($idOrder);
    usort($tasks, function($a, $b) use ($idMap): int {
        return $idMap[$a["id"]] <=> $idMap[$b["id"]];
    });
    logAction("Sortierung aktualisiert: " . implode(", ", $idOrder));
}

function deleteTask(&$tasks, $id): void {
    foreach ($tasks as $t) {
        if ($t["id"] === $id) {
            logAction("Aufgabe gelöscht: ID=$id, Text='{$t["text"]}'");
            break;
        }
    }
    $tasks = array_filter($tasks, function($t) use ($id): bool {
        return $t["id"] !== $id;
    });
}

function updateTask(&$tasks, $id, $text, $done): void {
    foreach ($tasks as &$t) {
        if ($t["id"] === $id) {
            $originalText = $t["text"];

            if (!is_null($done)) {
                $t["done"] = $done;
                logAction("Status geändert: ID=$id, Text='{$t["text"]}' → " . ($done ? "erledigt" : "offen"));
            }

            if (!is_null($text)) {
                if (trim($text) === "") {
                    logAction("Fehlgeschlagenes Update: Leerer Text (ID=$id)");
                    http_response_code(400);
                    echo json_encode(["error" => "Leerer Text ist nicht erlaubt"]);
                    exit;
                }
                $t["text"] = $text;
                logAction("Text geändert: ID=$id → '$text' (vorher: '$originalText')");
            }
            break;
        }
    }
}

function createTask(&$tasks, $id, $text, $done): void {
    $tasks[] = [
        "id" => $id,
        "text" => $text,
        "done" => $done
    ];
    logAction("Neue Aufgabe hinzugefügt: ID=$id, Text='$text'");
}

// --------------------------------------------------
// --------------------- Ablauf ---------------------
// --------------------------------------------------
$jsonFile = "todo.json";
$tasks = loadTasks($jsonFile);
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    logAction("Ungültiges JSON empfangen: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode(["error" => "Ungültiges JSON"]);
    exit;
}

$id   = trim($data["id"]);
$text = isset($data["task"]) ? trim($data["task"]) : null;
$done = isset($data["done"]) ? $data["done"] : false;

if (isset($data["sort"]) && is_array($data["sort"])) {
    sortTasks($tasks, $data["sort"]);
    saveTasks($jsonFile, $tasks);
    echo json_encode(["success" => true]);
    exit;
}

if (!$data || !isset($data["id"])) {
    logAction("Ungültige Eingabe empfangen: " . json_encode($data));
    http_response_code(400);
    echo json_encode(["error" => "Ungültige Eingabe"]);
    exit;
}

if (!empty($data["delete"]) && !empty($data["id"])) {
    deleteTask($tasks, $id);
    saveTasks($jsonFile, $tasks);
    echo json_encode(["success" => true]);
    exit;
}

if (!empty($data["update"])) {
    updateTask($tasks, $id, $text, isset($data["done"]) ? $data["done"] : null);
    saveTasks($jsonFile, $tasks);
    echo json_encode(["success" => true]);
    exit;
}

$exists = array_filter($tasks, function($t) use ($id) {
    return $t["id"] === $id;
});

if (is_null($text) || $text === "") {
    http_response_code(400);
    echo json_encode(["error" => "Leerer Text ist nicht erlaubt"]);
    logAction("Fehlgeschlagene Aufgabe: Leerer Text");
    exit;
}

if (!$exists) {
    createTask($tasks, $id, $text, $done);
    saveTasks($jsonFile, $tasks);
    echo json_encode(["success" => true]);
    exit;
}

// Fallback falls nichts von den oberen Bedingungen zutrifft (= einfach speichern)
saveTasks($jsonFile, $tasks);
echo json_encode(["success" => true]);
exit;
