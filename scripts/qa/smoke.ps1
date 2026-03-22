param(
  [int]$StartupTimeoutSeconds = 30,
  [int]$RequestTimeoutSeconds = 8
)

Set-StrictMode -Version Latest

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$appDir = Resolve-Path (Join-Path $scriptRoot '..\..')
$serverDir = Join-Path $appDir 'app'
if (-not (Test-Path $serverDir)) {
  throw "Unable to locate app directory at $serverDir"
}

$basePort = Get-Random -Minimum 4500 -Maximum 7900
$baseUrl = "http://localhost:$basePort"

function Wait-ForServerReady($healthUrl, $timeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5 -Method GET
      if ($response.StatusCode -eq 200) {
        Write-Host "Server responded to health check at $healthUrl"
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  throw "Server did not respond to $healthUrl within $timeoutSeconds seconds."
}

function Invoke-PathCheck($baseUrl, $relativePath, $requestTimeout) {
  $url = "${baseUrl}${relativePath}"
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $requestTimeout -Method GET
    $statusCode = $response.StatusCode
    if ($statusCode -ge 200 -and $statusCode -lt 300) {
      Write-Host "[PASS] $relativePath -> $statusCode"
      return $null
    }

    return "[$relativePath] returned status code $statusCode"
  } catch {
    $code = $null
    if ($_.Exception -and $_.Exception.Response) {
      $code = $_.Exception.Response.StatusCode
    }
    $message = if ($code) { "status $code" } else { $_.Exception.Message }
    return "[$relativePath] request failed: $message"
  }
}

$endpointsToCheck = @('/', '/app/feed', '/war-room/overview', '/admin')
$apiEndpoints = @('/api/health', '/api/public-config')
$failures = @()
$serverJob = $null

try {
  $serverJob = Start-Job -ArgumentList $serverDir, $basePort -ScriptBlock {
    param($dir, $port)
    Set-Location $dir
    $env:PORT = "$port"
    node server.js
  }

  Wait-ForServerReady "$baseUrl/api/health" $StartupTimeoutSeconds

  foreach ($relativePath in $endpointsToCheck) {
    $issue = Invoke-PathCheck $baseUrl $relativePath $RequestTimeoutSeconds
    if ($issue) { $failures += $issue }
  }

  foreach ($relPath in $apiEndpoints) {
    $issue = Invoke-PathCheck $baseUrl $relPath $RequestTimeoutSeconds
    if ($issue) { $failures += $issue }
  }

  if ($failures.Count -gt 0) {
    throw "Smoke checks failed:`n" + ($failures | ForEach-Object { "  - $_" }) -join "`n"
  }

  Write-Host "All smoke checks passed. Application shell is responding on $baseUrl."
} finally {
  if ($serverJob) {
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue | Out-Null
  }
}