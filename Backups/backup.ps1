$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Backup-Dateiname
$backupFile = "todo_list_$timestamp.sql"

# Zielordner
$backupFolder = "backups"
if (!(Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder
}

# Dump ausführen
sqlite3.exe .\database.db ".dump" > "$backupFolder\$backupFile"



# Ausführen mit .\backup.ps1

