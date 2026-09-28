param(
  [string]$BackupRoot = "$PSScriptRoot\..\backups\postgres",
  [ValidateSet('Daily', 'Weekly', 'Monthly')][string]$Tier = 'Daily'
)

$ErrorActionPreference = 'Stop'
$databaseUrl = $env:DATABASE_BACKUP_URL
$recipient = $env:BACKUP_AGE_RECIPIENT
if ([string]::IsNullOrWhiteSpace($databaseUrl)) { throw 'DATABASE_BACKUP_URL is required.' }
if ([string]::IsNullOrWhiteSpace($recipient)) { throw 'BACKUP_AGE_RECIPIENT is required; unencrypted backups are refused.' }

$pgDump = Get-Command pg_dump -ErrorAction Stop
$age = Get-Command age -ErrorAction Stop
$version = & $pgDump.Source --version
if ($version -notmatch 'PostgreSQL\) 17\.') { throw "pg_dump 17 is required. Found: $version" }

$resolvedRoot = [System.IO.Path]::GetFullPath($BackupRoot)
$tierDirectory = Join-Path $resolvedRoot $Tier.ToLowerInvariant()
New-Item -ItemType Directory -Force -Path $tierDirectory | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$temporary = Join-Path $tierDirectory "movieflix-$stamp.dump"
$encrypted = "$temporary.age"

try {
  & $pgDump.Source --dbname=$databaseUrl --format=custom --compress=9 --no-owner --no-acl --file=$temporary
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
  & $age.Source --recipient $recipient --output $encrypted $temporary
  if ($LASTEXITCODE -ne 0) { throw "age encryption failed with exit code $LASTEXITCODE" }
  $checksum = (Get-FileHash -Algorithm SHA256 -LiteralPath $encrypted).Hash.ToLowerInvariant()
  Set-Content -LiteralPath "$encrypted.sha256" -Value "$checksum  $([IO.Path]::GetFileName($encrypted))" -Encoding ascii
}
finally {
  if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
}

$keep = @{ Daily = 7; Weekly = 4; Monthly = 6 }[$Tier]
$files = Get-ChildItem -LiteralPath $tierDirectory -Filter '*.dump.age' -File | Sort-Object LastWriteTimeUtc -Descending
$files | Select-Object -Skip $keep | ForEach-Object {
  $checksumPath = "$($_.FullName).sha256"
  Remove-Item -LiteralPath $_.FullName -Force
  if (Test-Path -LiteralPath $checksumPath) { Remove-Item -LiteralPath $checksumPath -Force }
}

Write-Host "Encrypted $Tier backup created: $encrypted"
