param(
    [string]$AppDir = ".\\app",
    [int]$Port = 3100
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$envFile = Join-Path $AppDir ".env.local"
if (-not (Test-Path $envFile)) {
    throw "Missing $envFile"
}

$map = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $parts = $line.Split("=", 2)
    if ($parts.Count -eq 2) {
        $map[$parts[0].Trim()] = $parts[1].Trim()
    }
}

function Get-Val([string]$k, [string]$d = "") {
    if ($map.ContainsKey($k)) { return [string]$map[$k] }
    return $d
}

$apiKey = Get-Val "TRADING_APP_API_KEY"
if (-not $apiKey) {
    throw "TRADING_APP_API_KEY missing in .env.local"
}

$env:PORT = [string]$Port
$env:HOST = "127.0.0.1"
$env:TRADING_APP_API_KEY = $apiKey
$env:REQUIRE_API_KEY = Get-Val "REQUIRE_API_KEY" "true"
$env:REQUIRE_MEMBER_LOGIN = Get-Val "REQUIRE_MEMBER_LOGIN" "true"
$env:ALLOW_DEV_LOGIN = "true"
$env:SESSION_SECRET = Get-Val "SESSION_SECRET" "verify-secret-override"

$proc = Start-Process -FilePath node -ArgumentList "server.js" -WorkingDirectory (Resolve-Path $AppDir).Path -PassThru
Start-Sleep -Seconds 2

try {
    $headers = @{ "x-api-key" = $apiKey }
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $health = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/health" -Headers $headers
    $stateNoSession = $null
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/state" -Headers $headers -WebSession $session -ErrorAction Stop | Out-Null
        $stateNoSession = 200
    }
    catch {
        $stateNoSession = $_.Exception.Response.StatusCode.value__
    }

    $null = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/auth/dev-login" -Method Post -Headers $headers -WebSession $session -ContentType "application/json" -Body (@{ handle = "Verifier"; email = "" } | ConvertTo-Json)
    $stateWithSession = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/state" -Headers $headers -WebSession $session

    if ($health.StatusCode -ne 200) { throw "Health check failed." }
    if ($stateNoSession -ne 401) { throw "Expected /api/state without session to return 401, got $stateNoSession." }
    if ($stateWithSession.StatusCode -ne 200) { throw "Expected /api/state with session to return 200." }

    Write-Host "Secure server verification PASSED"
    Write-Host " - Health with API key: 200"
    Write-Host " - State without session: 401"
    Write-Host " - State with session: 200"
}
finally {
    if (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) {
        Stop-Process -Id $proc.Id -Force
    }
}
