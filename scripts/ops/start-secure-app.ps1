param(
    [string]$AppDir = ".\\app"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$envFile = Join-Path $AppDir ".env.local"
if (-not (Test-Path $envFile)) {
    throw "Missing $envFile. Run scripts/ops/generate-app-secrets.ps1 first."
}

$content = Get-Content $envFile -Raw
if ($content -match "REPLACE_WITH_LONG_RANDOM_SECRET|REPLACE_WITH_LONG_RANDOM_API_KEY") {
    throw "Found placeholder values in .env.local. Replace them before startup."
}

$portLine = Get-Content $envFile | Where-Object { $_ -like "PORT=*" } | Select-Object -First 1
$port = if ($portLine) { [int](($portLine -replace "^PORT=", "").Trim()) } else { 3000 }

$inUse = $false
try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", $port, $null, $null)
    $inUse = $iar.AsyncWaitHandle.WaitOne(250)
    if ($client.Connected) { $client.EndConnect($iar) | Out-Null }
    $client.Close()
}
catch {
    $inUse = $false
}

if ($inUse) {
    throw "Port $port appears in use. Stop the existing process or change PORT in $envFile."
}

Write-Host "Starting secure Trading Ecosystem app..."
Set-Location $AppDir
node server.js
