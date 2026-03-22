param(
    [string]$OutFile = ".\\app\\.env.local"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-HexSecret {
    param([int]$Bytes = 32)
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return ($buffer | ForEach-Object { $_.ToString("x2") }) -join ""
}

$sessionSecret = New-HexSecret -Bytes 48
$apiKey = New-HexSecret -Bytes 32

$content = @"
PORT=3000
HOST=127.0.0.1
SESSION_SECRET=$sessionSecret
REQUIRE_MEMBER_LOGIN=true
ALLOW_DEV_LOGIN=false
REQUIRE_API_KEY=true
TRADING_APP_API_KEY=$apiKey
BASE_URL=https://localhost
TLS_CERT_PATH=
TLS_KEY_PATH=
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=150
MAX_BODY_BYTES=25000
"@

Set-Content -Path $OutFile -Value $content -Encoding UTF8
Write-Host "Generated secure env template: $OutFile"
