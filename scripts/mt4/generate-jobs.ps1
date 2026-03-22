param(
    [string]$InventoryFile = ".\\data\\backtests\\ea-inventory.csv",
    [string]$ConfigFile = ".\\config\\mt4\\pipeline.config.json",
    [string]$ParameterSpaceFile = ".\\config\\mt4\\parameter-space.json",
    [string]$OutFile = ".\\data\\backtests\\jobs.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-CartesianProduct {
    param([hashtable]$ParamMap)

    $keys = @($ParamMap.Keys | Sort-Object)
    if ($keys.Count -eq 0) {
        return ,(@{})
    }

    $result = @(@{})
    foreach ($key in $keys) {
        $next = @()
        foreach ($base in $result) {
            foreach ($value in $ParamMap[$key]) {
                $copy = @{}
                foreach ($k in $base.Keys) {
                    $copy[$k] = $base[$k]
                }
                $copy[$key] = $value
                $next += ,$copy
            }
        }
        $result = $next
    }
    return $result
}

if (-not (Test-Path -Path $InventoryFile)) {
    throw "Inventory file not found: $InventoryFile"
}
if (-not (Test-Path -Path $ConfigFile)) {
    throw "Config file not found: $ConfigFile"
}
if (-not (Test-Path -Path $ParameterSpaceFile)) {
    throw "Parameter space file not found: $ParameterSpaceFile"
}

$inventory = Import-Csv -Path $InventoryFile
$config = Get-Content -Path $ConfigFile -Raw | ConvertFrom-Json
$paramSpace = Get-Content -Path $ParameterSpaceFile -Raw | ConvertFrom-Json

$symbols = @($config.symbols)
$timeframes = @($config.timeframes)
$splits = @($config.splits)
$defaultDeposit = [double]$config.defaultDeposit

$rows = @()
$jobId = 1

foreach ($ea in $inventory) {
    $eaName = $ea.EAName

    $paramMap = @{}
    foreach ($prop in $paramSpace.defaults.PSObject.Properties) {
        $paramMap[$prop.Name] = @($prop.Value)
    }

    if ($paramSpace.overrides -and $paramSpace.overrides.PSObject.Properties.Name -contains $eaName) {
        foreach ($overrideProp in $paramSpace.overrides.$eaName.PSObject.Properties) {
            $paramMap[$overrideProp.Name] = @($overrideProp.Value)
        }
    }

    $paramCombos = Get-CartesianProduct -ParamMap $paramMap

    foreach ($symbol in $symbols) {
        foreach ($tf in $timeframes) {
            foreach ($split in $splits) {
                foreach ($combo in $paramCombos) {
                    $paramJson = ($combo | ConvertTo-Json -Compress)
                    $comboKeyRaw = "$eaName|$symbol|$tf|$paramJson"
                    $comboKey = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($comboKeyRaw))) -Algorithm SHA1).Hash
                    $rows += [pscustomobject]@{
                        JobId       = $jobId
                        ComboKey    = $comboKey
                        EAName      = $eaName
                        EAFilePath  = $ea.FilePath
                        Symbol      = $symbol
                        Timeframe   = $tf
                        SplitName   = $split.name
                        SplitKind   = $split.kind
                        FromDate    = $split.from
                        ToDate      = $split.to
                        Deposit     = $defaultDeposit
                        ParamsJson  = $paramJson
                    }
                    $jobId += 1
                }
            }
        }
    }
}

$outDir = Split-Path -Path $OutFile -Parent
if (-not (Test-Path -Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$rows | Export-Csv -Path $OutFile -NoTypeInformation
Write-Host "Job file saved: $OutFile"
Write-Host "Jobs created: $($rows.Count)"
