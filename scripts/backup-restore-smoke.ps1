$ErrorActionPreference = 'Stop'

$containerName = "codematch-m6-backup-$([Guid]::NewGuid().ToString('N').Substring(0, 12))"
$workDir = Join-Path ([IO.Path]::GetTempPath()) "codematch-m6-backup-smoke-$([Guid]::NewGuid().ToString('N'))"
$dumpInContainer = '/tmp/codematch-smoke.dump'
$containerStarted = $false

function Invoke-DockerChecked {
    param([Parameter(Mandatory)][string[]]$DockerArgs)
    & docker @DockerArgs
    if ($LASTEXITCODE -ne 0) {
        throw "docker $($DockerArgs -join ' ') failed with exit code $LASTEXITCODE"
    }
}

try {
    New-Item -ItemType Directory -Path $workDir | Out-Null
    $cvDir = Join-Path $workDir 'private-cvs'
    $restoreDir = Join-Path $workDir 'restored-cvs'
    New-Item -ItemType Directory -Path $cvDir, $restoreDir | Out-Null
    $cvPath = Join-Path $cvDir 'synthetic-cv.txt'
    $cvText = 'Synthetic M6 backup smoke file; contains no personal data.'
    [IO.File]::WriteAllText($cvPath, $cvText, [Text.Encoding]::UTF8)
    $cvHash = (Get-FileHash -Algorithm SHA256 $cvPath).Hash

    Invoke-DockerChecked @('run', '--detach', '--rm', '--name', $containerName, '--env', 'POSTGRES_USER=smoke', '--env', 'POSTGRES_PASSWORD=smoke-only', '--env', 'POSTGRES_DB=smoke', 'postgres:17-alpine') | Out-Null
    $containerStarted = $true

    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        & docker exec $containerName pg_isready -U smoke -d smoke *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'Disposable PostgreSQL did not become ready within 60 seconds.' }
    # The official image briefly starts a temporary initialization server before
    # replacing it with the persistent server. Wait for the final server to settle.
    Start-Sleep -Seconds 3
    $stable = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        & docker exec $containerName psql -U smoke -d smoke -tA -c 'SELECT 1' *> $null
        if ($LASTEXITCODE -eq 0) { $stable = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $stable) { throw 'Disposable PostgreSQL did not stabilize after image initialization.' }

    Invoke-DockerChecked @('exec', $containerName, 'psql', '-U', 'smoke', '-d', 'smoke', '-v', 'ON_ERROR_STOP=1', '-c', 'CREATE TABLE backup_probe (id integer PRIMARY KEY, marker text NOT NULL); INSERT INTO backup_probe VALUES (1, ''synthetic-m6-row'');') | Out-Null
    Invoke-DockerChecked @('exec', $containerName, 'pg_dump', '-Fc', '-U', 'smoke', '-d', 'smoke', '-f', $dumpInContainer) | Out-Null
    $dumpPath = Join-Path $workDir 'smoke.dump'
    Invoke-DockerChecked @('cp', "${containerName}:$dumpInContainer", $dumpPath) | Out-Null
    Invoke-DockerChecked @('exec', $containerName, 'createdb', '-U', 'smoke', 'smoke_restore') | Out-Null
    Invoke-DockerChecked @('cp', $dumpPath, "${containerName}:/tmp/codematch-smoke-restore.dump") | Out-Null
    Invoke-DockerChecked @('exec', $containerName, 'pg_restore', '--username=smoke', '--no-owner', '--dbname=smoke_restore', '/tmp/codematch-smoke-restore.dump') | Out-Null

    $restoredMarker = (& docker exec $containerName psql -U smoke -d smoke_restore -tA -c 'SELECT marker FROM backup_probe WHERE id=1') -join ''
    if ($LASTEXITCODE -ne 0 -or $restoredMarker.Trim() -ne 'synthetic-m6-row') { throw 'Restored PostgreSQL row did not match the synthetic backup marker.' }

    $archive = Join-Path $workDir 'private-cvs.tar.gz'
    & tar -czf $archive -C $cvDir .
    if ($LASTEXITCODE -ne 0) { throw 'tar archive creation failed.' }
    & tar -xzf $archive -C $restoreDir
    if ($LASTEXITCODE -ne 0) { throw 'tar archive extraction failed.' }
    $restoredCv = Join-Path $restoreDir 'synthetic-cv.txt'
    if ((Get-FileHash -Algorithm SHA256 $restoredCv).Hash -ne $cvHash) { throw 'Restored private-file hash did not match the original.' }

    Write-Output 'PASS: disposable PostgreSQL custom dump restored the expected synthetic row.'
    Write-Output "PASS: synthetic private-file SHA-256 verified after archive restore: $cvHash"
    Write-Output 'This verifies local archive/restore mechanics only, not encryption, off-host retention, or production recovery.'
}
finally {
    if ($containerStarted) {
        & docker rm --force $containerName *> $null
    }
    if (Test-Path -LiteralPath $workDir) { Remove-Item -LiteralPath $workDir -Recurse -Force }
}
