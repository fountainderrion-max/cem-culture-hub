param(
    [string]$ConsoleBaseUrl = "http://localhost:3000",
    [string]$Symbol = "XAUUSD",
    [string]$OutFile = "$env:APPDATA\MetaQuotes\Terminal\Common\Files\TE\ai\consensus.csv",
    [string]$ApiKey = "",
    [int]$IntervalSeconds = 0,
    [string]$LocalStoreFile = "C:\Users\jaque\Documents\TRADING ECOSYSTEM\app\data\trade-console-store.json",
    [string]$ForceAction = "",
    [double]$ForceConfidence = 0.70,
    [double]$ForceLotMultiplier = 1.20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-Consensus {
    param(
        [string]$BaseUrl,
        [string]$Pair,
        [string]$ApiKeyHeader
    )
    $url = "$BaseUrl/api/swarm/consensus?symbol=$Pair"
    $headers = @{}
    if ($ApiKeyHeader -ne "") {
        $headers["x-api-key"] = $ApiKeyHeader
    }
    try {
        $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Headers $headers -TimeoutSec 20
        return ($resp.Content | ConvertFrom-Json)
    }
    catch {
        return $null
    }
}

function Get-ConsensusFromLocalStore {
    param(
        [string]$StorePath,
        [string]$Pair
    )
    if (-not (Test-Path $StorePath)) {
        return $null
    }

    $raw = Get-Content -Path $StorePath -Raw
    if (-not $raw) {
        return $null
    }
    $obj = $raw | ConvertFrom-Json
    if (-not $obj.botBusEvents) {
        return $null
    }

    $events = @($obj.botBusEvents | Where-Object { $_.symbol -eq $Pair } | Select-Object -First 500)
    if ($events.Count -eq 0) {
        return [pscustomobject]@{
            action = "HOLD"
            confidence = 0.40
        }
    }

    $buy = 0.0
    $sell = 0.0
    $hold = 0.0
    foreach ($e in $events) {
        $w = [double]$e.confidence
        if ($w -le 0) { $w = 0.5 }
        if ($e.signal -eq "BUY") { $buy += $w }
        elseif ($e.signal -eq "SELL") { $sell += $w }
        else { $hold += $w }
    }
    $total = $buy + $sell + $hold
    if ($total -le 0) { $total = 1.0 }

    $action = "HOLD"
    $conf = $hold / $total
    if ($buy -gt $sell -and $buy -gt $hold) { $action = "BUY"; $conf = $buy / $total }
    elseif ($sell -gt $buy -and $sell -gt $hold) { $action = "SELL"; $conf = $sell / $total }

    return [pscustomobject]@{
        action = $action
        confidence = $conf
    }
}

function Write-ConsensusLine {
    param(
        [object]$ConsensusRow,
        [string]$Path,
        [string]$Pair
    )
    $dir = Split-Path -Path $Path -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    if (-not $ConsensusRow) {
        $line = "$Pair,HOLD,0.40,1.00,$([int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
    }
    else {
        $action = [string]$ConsensusRow.action
        $conf = [double]$ConsensusRow.confidence
        $lotMult = if ($conf -ge 0.75) { 1.35 } elseif ($conf -ge 0.60) { 1.15 } elseif ($conf -ge 0.50) { 1.00 } else { 0.80 }
        $line = "$Pair,$action,$([math]::Round($conf,4)),$([math]::Round($lotMult,2)),$([int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
    }

    Set-Content -Path $Path -Value $line -Encoding ASCII
    return $line
}

do {
    $row = $null
    if ($ForceAction -ne "") {
        $row = [pscustomobject]@{
            action = $ForceAction.ToUpperInvariant()
            confidence = $ForceConfidence
        }
    }
    else {
        $payload = Get-Consensus -BaseUrl $ConsoleBaseUrl -Pair $Symbol -ApiKeyHeader $ApiKey
        if ($payload -and $payload.consensus) {
            $row = $payload.consensus | Select-Object -First 1
        }
        elseif ($payload -and $payload.action) {
            $row = $payload
        }
        else {
            $row = Get-ConsensusFromLocalStore -StorePath $LocalStoreFile -Pair $Symbol
        }
    }

    if ($ForceAction -ne "") {
        $dir = Split-Path -Path $OutFile -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
        }
        $line = "$Symbol,$($ForceAction.ToUpperInvariant()),$([math]::Round($ForceConfidence,4)),$([math]::Round($ForceLotMultiplier,2)),$([int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
        Set-Content -Path $OutFile -Value $line -Encoding ASCII
    }
    else {
        $line = Write-ConsensusLine -ConsensusRow $row -Path $OutFile -Pair $Symbol
    }
    Write-Host "Consensus feed updated: $line"

    if ($IntervalSeconds -gt 0) {
        Start-Sleep -Seconds $IntervalSeconds
    }
}
while ($IntervalSeconds -gt 0)
