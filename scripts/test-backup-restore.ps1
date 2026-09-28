param([Parameter(Mandatory = $true)][string]$BackupPath)

$ErrorActionPreference = 'Stop'
$identity = $env:BACKUP_AGE_IDENTITY
$targetUrl = $env:RESTORE_TEST_DATABASE_URL
if ([string]::IsNullOrWhiteSpace($identity)) { throw 'BACKUP_AGE_IDENTITY is required.' }
if ([string]::IsNullOrWhiteSpace($targetUrl)) { throw 'RESTORE_TEST_DATABASE_URL is required.' }
if ($targetUrl -notmatch '/[^/?]*restore_test(?:\?|$)') {
  throw 'Safety check failed: the target database name must end with restore_test.'
}

$encrypted = (Resolve-Path -LiteralPath $BackupPath).Path
$checksumPath = "$encrypted.sha256"
if (-not (Test-Path -LiteralPath $checksumPath)) { throw "Missing checksum: $checksumPath" }
$expected = ((Get-Content -LiteralPath $checksumPath -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
$actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $encrypted).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw 'Backup checksum validation failed.' }

$age = Get-Command age -ErrorAction Stop
$pgRestore = Get-Command pg_restore -ErrorAction Stop
$psql = Get-Command psql -ErrorAction Stop
if ((& $pgRestore.Source --version) -notmatch 'PostgreSQL\) 17\.') { throw 'pg_restore 17 is required.' }

$temporary = Join-Path ([IO.Path]::GetTempPath()) "movieflix-restore-$([Guid]::NewGuid().ToString('N')).dump"
try {
  & $age.Source --decrypt --identity $identity --output $temporary $encrypted
  if ($LASTEXITCODE -ne 0) { throw 'Backup decryption failed.' }
  & $pgRestore.Source --dbname=$targetUrl --clean --if-exists --exit-on-error --no-owner --no-acl $temporary
  if ($LASTEXITCODE -ne 0) { throw 'pg_restore failed.' }
  & $psql.Source $targetUrl --set ON_ERROR_STOP=1 --command 'SELECT COUNT(*) AS migrations FROM "_prisma_migrations";'
  if ($LASTEXITCODE -ne 0) { throw 'Restore verification query failed.' }
  Write-Host 'Backup checksum, decryption, PostgreSQL 17 restore, and migration-table verification succeeded.'
}
finally {
  if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
}
