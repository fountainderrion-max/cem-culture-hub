param(
    [ValidateSet("stooq", "mock")]
    [string]$Provider = "mock",

    [string]$OutFile = ".\data\commodity_prices.csv",

    [double]$AlertThresholdPercent = 0.5,

    [int]$IntervalSeconds = 60,

    [int]$Iterations = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$symbolToLabel = @{
    "XAUUSD" = "Gold"
    "XAGUSD" = "Silver"
    "USOIL"  = "Oil"
}

function Ensure-Directory {
    param([string]$FilePath)
    $dir = Split-Path -Path $FilePath -Parent
    if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

function Get-StooqPrices {
    # Stooq symbols:
    # xauusd = gold spot in USD
    # xagusd = silver spot in USD
    # cl.f    = crude oil futures proxy in USD
    $stooqMap = @{
        "XAUUSD" = "xauusd"
        "XAGUSD" = "xagusd"
        "USOIL"  = "cl.f"
    }

    $prices = @{}
    foreach ($pair in $stooqMap.GetEnumerator()) {
        $url = "https://stooq.com/q/l/?s=$($pair.Value)&f=sd2t2ohlcv&h&e=csv"
        $csv = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 20
        $rows = $csv | ConvertFrom-Csv
        if (-not $rows -or -not $rows.Close -or $rows.Close -eq "N/D") {
            throw "No valid quote returned for $($pair.Key) from Stooq."
        }
        $prices[$pair.Key] = [double]$rows.Close
    }

    return $prices
}

function Get-MockPrices {
    param([hashtable]$PreviousPrices)

    $base = @{
        "XAUUSD" = 2150.0
        "XAGUSD" = 24.5
        "USOIL"  = 78.0
    }

    $prices = @{}
    foreach ($symbol in $base.Keys) {
        $anchor = if ($PreviousPrices -and $PreviousPrices.ContainsKey($symbol)) {
            [double]$PreviousPrices[$symbol]
        } else {
            [double]$base[$symbol]
        }

        # Random drift between -0.4% and +0.4%
        $drift = ((Get-Random -Minimum -40 -Maximum 41) / 10000.0)
        $next = [math]::Round($anchor * (1 + $drift), 4)
        $prices[$symbol] = $next
    }

    return $prices
}

function Get-ProviderFunction {
    param([string]$ProviderName)
    switch ($ProviderName) {
        "stooq" { return { param($prev) Get-StooqPrices } }
        "mock"  { return { param($prev) Get-MockPrices -PreviousPrices $prev } }
        default { throw "Unsupported provider: $ProviderName" }
    }
}

function Get-LatestSnapshot {
    param([string]$Path)

    if (-not (Test-Path -Path $Path)) {
        return @{}
    }

    $latestRows = Import-Csv -Path $Path | Sort-Object Timestamp | Select-Object -Last 3
    $last = @{}
    foreach ($row in $latestRows) {
        $last[$row.Symbol] = [double]$row.Price
    }
    return $last
}

function Write-Snapshot {
    param(
        [string]$Path,
        [datetime]$Timestamp,
        [hashtable]$Prices
    )

    foreach ($symbol in $Prices.Keys) {
        $obj = [pscustomobject]@{
            Timestamp = $Timestamp.ToString("o")
            Symbol    = $symbol
            Asset     = $symbolToLabel[$symbol]
            Price     = [double]$Prices[$symbol]
        }
        $obj | Export-Csv -Path $Path -NoTypeInformation -Append
    }
}

function Show-Alerts {
    param(
        [hashtable]$Prev,
        [hashtable]$Current,
        [double]$Threshold
    )

    foreach ($symbol in $Current.Keys) {
        if (-not $Prev.ContainsKey($symbol)) {
            continue
        }
        $oldPrice = [double]$Prev[$symbol]
        $newPrice = [double]$Current[$symbol]
        if ($oldPrice -le 0) {
            continue
        }

        $pct = (($newPrice - $oldPrice) / $oldPrice) * 100
        if ([math]::Abs($pct) -ge $Threshold) {
            $direction = if ($pct -ge 0) { "UP" } else { "DOWN" }
            Write-Host ("[{0}] ALERT {1} {2}: {3:N4} -> {4:N4} ({5:+0.00;-0.00;0.00}%)" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $symbol, $direction, $oldPrice, $newPrice, $pct)
        }
    }
}

Ensure-Directory -FilePath $OutFile
$providerFn = Get-ProviderFunction -ProviderName $Provider

$iteration = 0
while ($true) {
    try {
        $prev = Get-LatestSnapshot -Path $OutFile
        $now = Get-Date
        $current = & $providerFn $prev

        Write-Snapshot -Path $OutFile -Timestamp $now -Prices $current
        Show-Alerts -Prev $prev -Current $current -Threshold $AlertThresholdPercent

        $summary = $current.Keys | Sort-Object | ForEach-Object { "$_=$($current[$_])" }
        Write-Host ("[{0}] Snapshot saved ({1}) -> {2}" -f $now.ToString("yyyy-MM-dd HH:mm:ss"), $Provider, ($summary -join ", "))
    }
    catch {
        Write-Warning ("[{0}] Monitor loop failed: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $_.Exception.Message)
        if ($Provider -eq "stooq") {
            Write-Warning "Tip: try -Provider mock when network access is unavailable."
        }
    }

    $iteration++
    if ($Iterations -gt 0 -and $iteration -ge $Iterations) {
        break
    }
    Start-Sleep -Seconds $IntervalSeconds
}
