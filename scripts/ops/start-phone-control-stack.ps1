Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = "C:\Users\jaque\Documents\TRADING ECOSYSTEM"
$appDir = Join-Path $root "app"

Write-Host "Starting Trading Ecosystem app..."
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Process -FilePath node -ArgumentList "server.js" -WorkingDirectory $appDir
Start-Sleep -Seconds 1

$health = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/api/health" -TimeoutSec 10
Write-Host "App health:" $health.Content

Write-Host "Starting ngrok tunnel..."
powershell -ExecutionPolicy Bypass -File "$root\scripts\ops\start-sms-webhook-tunnel.ps1" -Port 3000
