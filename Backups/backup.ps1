$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$databasePath = Resolve-Path (Join-Path $scriptPath "..\backend\database.db")

if (-Not (Test-Path $databasePath)) {
    Write-Error "Datenbank nicht gefunden unter: $databasePath"
    exit 1
}

$backupFolder = Join-Path $scriptPath "Backups"
if (-Not (Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
}

$backupFile = "todo_list_$timestamp.sql"
$backupFullPath = Join-Path $backupFolder $backupFile

Write-Output "Backup wird gespeichert unter: $backupFullPath"
sqlite3.exe $databasePath ".dump" > $backupFullPath
Write-Output "Backup erfolgreich!"




# Ausführen mit .\backup.ps1
