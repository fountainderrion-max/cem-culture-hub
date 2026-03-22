param(
    [int]$Port = 3000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ngrokExe = "C:\Users\jaque\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
if (-not (Test-Path $ngrokExe)) {
    throw "ngrok not found at $ngrokExe"
}

Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Process -FilePath $ngrokExe -ArgumentList "http $Port"
Start-Sleep -Seconds 2

$api = "http://127.0.0.1:4040/api/tunnels"
$resp = Invoke-WebRequest -UseBasicParsing -Uri $api -TimeoutSec 10
$json = $resp.Content | ConvertFrom-Json
$tunnel = $json.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1

if (-not $tunnel) {
    throw "No HTTPS tunnel found. Check ngrok console."
}

Write-Host "Public URL: $($tunnel.public_url)"
Write-Host "Webhook base: $($tunnel.public_url)/api/phone/sms/webhook?token=YOUR_TWILIO_WEBHOOK_TOKEN"
