param(
    [string]$EnvFile = ".\\app\\.env.local"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
    throw "Missing $EnvFile"
}

$map = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $parts = $line.Split("=", 2)
    if ($parts.Count -eq 2) {
        $map[$parts[0].Trim()] = $parts[1].Trim()
    }
}

$errors = New-Object System.Collections.Generic.List[string]

function Get-EnvValue {
    param([string]$Name)
    if ($map.ContainsKey($Name)) {
        return [string]$map[$Name]
    }
    return ""
}

if ((Get-EnvValue "REQUIRE_MEMBER_LOGIN").ToLower() -ne "true") {
    $errors.Add("REQUIRE_MEMBER_LOGIN must be true.")
}
if ((Get-EnvValue "REQUIRE_API_KEY").ToLower() -ne "true") {
    $errors.Add("REQUIRE_API_KEY must be true.")
}
if ((Get-EnvValue "ALLOW_DEV_LOGIN").ToLower() -ne "false") {
    $errors.Add("ALLOW_DEV_LOGIN must be false for public exposure.")
}
if ((Get-EnvValue "SESSION_SECRET").Length -lt 64) {
    $errors.Add("SESSION_SECRET should be at least 64 chars.")
}
if ((Get-EnvValue "TRADING_APP_API_KEY").Length -lt 48) {
    $errors.Add("TRADING_APP_API_KEY should be at least 48 chars.")
}
if (-not ((Get-EnvValue "BASE_URL").StartsWith("https://"))) {
    $errors.Add("BASE_URL must use https://")
}

if ($errors.Count -gt 0) {
    Write-Host "Secure config audit: FAILED"
    $errors | ForEach-Object { Write-Host (" - " + $_) }
    exit 1
}

Write-Host "Secure config audit: PASSED"
