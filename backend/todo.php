<?php
header('Content-Type: application/json');

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/database.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankverbindung fehlgeschlagen', 'details' => $e->getMessage()]);
    exit;
}

function logAction($message): void {
    $timestamp = date("Y-m-d H:i:s");
    file_put_contents(__DIR__ . "/log.txt", "[$timestamp] $message\n", FILE_APPEND);
}

function loadTasks(PDO $pdo): array {
    $stmt = $pdo->query("SELECT * FROM todos ORDER BY position ASC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function createTask(PDO $pdo, $id, $text, $done): void {
    $stmt = $pdo->query("SELECT MAX(position) FROM todos");
    $maxPos = $stmt->fetchColumn();
    $newPos = is_numeric($maxPos) ? $maxPos + 1 : 0;
    $stmt = $pdo->prepare("INSERT INTO todos (id, text, done, position) VALUES (?, ?, ?, ?)");
    $stmt->execute([$id, $text, $done ? 1 : 0, $newPos]);
    logAction("Neue Aufgabe hinzugefügt: ID=$id, Text='$text', Position=$newPos");
}

function sortTasks(PDO $pdo, array $idOrder): void {
    $pdo->beginTransaction();
    try {
        foreach ($idOrder as $position => $id) {
            $stmt = $pdo->prepare("UPDATE todos SET position = ? WHERE id = ?");
            $stmt->execute([$position, $id]);
        }
        $pdo->commit();
        logAction("Sortierung aktualisiert: " . implode(", ", $idOrder));
    } catch (Exception $e) {
        $pdo->rollBack();
        logAction("Fehler bei Sortierung: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Fehler beim Sortieren"]);
        exit;
    }
}

function updateTask(PDO $pdo, $id, $text, $done): void {
    if (!is_null($done)) {
        $stmt = $pdo->prepare("UPDATE todos SET done = ? WHERE id = ?");
        $stmt->execute([$done ? 1 : 0, $id]);
        logAction("Status geändert: ID=$id → " . ($done ? "erledigt" : "offen"));
    }

    if (!is_null($text) && trim($text) !== "") {
        $stmt = $pdo->prepare("UPDATE todos SET text = ? WHERE id = ?");
        $stmt->execute([$text, $id]);
        logAction("Text geändert: ID=$id → '$text'");
    }
}

function deleteTask(PDO $pdo, $id): void {
    $stmt = $pdo->prepare("DELETE FROM todos WHERE id = ?");
    $stmt->execute([$id]);
    logAction("Aufgabe gelöscht: ID=$id");
}

// --------------------------------------------------
// --------------------- Ablauf ---------------------
// --------------------------------------------------

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(loadTasks($pdo));
    exit;
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);


if (json_last_error() !== JSON_ERROR_NONE) {
    logAction("Ungültiges JSON empfangen: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode(["error" => "Ungültiges JSON"]);
    exit;
}

$id   = trim($data["id"] ?? "");
$text = isset($data["task"]) ? trim($data["task"]) : null;
$done = isset($data["done"]) ? $data["done"] : false;

if (isset($data["sort"]) && is_array($data["sort"])) {
    sortTasks($pdo, $data["sort"]);
    echo json_encode(["success" => true]);
    exit;
}


if (!$id) {
    logAction("Ungültige Eingabe empfangen: " . json_encode($data));
    http_response_code(400);
    echo json_encode(["error" => "Ungültige Eingabe"]);
    exit;
}

if (!empty($data["delete"])) {
    deleteTask($pdo, $id);
    echo json_encode(["success" => true]);
    exit;
}

if (!empty($data["update"])) {
    updateTask($pdo, $id, $text, $done);
    echo json_encode(["success" => true]);
    exit;
}

$stmt = $pdo->prepare("SELECT COUNT(*) FROM todos WHERE id = ?");
$stmt->execute([$id]);
$exists = $stmt->fetchColumn() > 0;

if (is_null($text) || $text === "") {
    http_response_code(400);
    echo json_encode(["error" => "Leerer Text ist nicht erlaubt"]);
    logAction("Fehlgeschlagene Aufgabe: Leerer Text");
    exit;
}

if (!$exists) {
    createTask($pdo, $id, $text, $done);
    echo json_encode(["success" => true]);
    exit;
}

// Fallback
echo json_encode(["success" => true]);
exit;
