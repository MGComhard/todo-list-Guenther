$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Backup-Dateiname
$backupFile = "todo_list_$timestamp.sql"

# Zielordner
$backupFolder = Split-Path -Parent $MyInvocation.MyCommand.Path

# Pfad zur Datenbank (eine Ebene höher, im Ordner "backend")
$databasePath = Join-Path $backupFolder "..\backend\database.db"

# Dump ausführen
sqlite3.exe $databasePath ".dump" > (Join-Path $backupFolder $backupFile)


# Ausführen mit .\backup.ps1

