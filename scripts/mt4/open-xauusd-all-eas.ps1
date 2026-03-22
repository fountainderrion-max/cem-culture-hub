param(
    [string]$TerminalExe = "",
    [string]$DataFolder = "",
    [string]$Symbol = "XAUUSD",
    [string]$Period = "M15",
    [int]$MaxCharts = 60,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-PrimaryTerminal {
    param([string]$TerminalExeHint, [string]$DataFolderHint)

    if ($TerminalExeHint -and $DataFolderHint -and (Test-Path $TerminalExeHint) -and (Test-Path $DataFolderHint)) {
        return [pscustomobject]@{ TerminalExe = $TerminalExeHint; DataFolder = $DataFolderHint }
    }

    $pairs = @()
    $mapPath = Join-Path $PSScriptRoot "..\..\data\backtests\mt4-terminal-map.csv"
    $mapPath = [System.IO.Path]::GetFullPath($mapPath)
    if (Test-Path $mapPath) {
        $pairs += Import-Csv $mapPath |
            Where-Object { $_.TerminalExe -and $_.DataFolder -and $_.ExeExists -eq "True" }
    }

    $pairs += @(
        [pscustomobject]@{ TerminalExe = "C:\KOT MT4 Terminal\terminal.exe"; DataFolder = "C:\Users\jaque\AppData\Roaming\MetaQuotes\Terminal\BAEC37CBBA31C26B3C8E7E5183FE4CC4" },
        [pscustomobject]@{ TerminalExe = "C:\Program Files (x86)\KOT MT4 Terminal\terminal.exe"; DataFolder = "C:\Users\jaque\AppData\Roaming\MetaQuotes\Terminal\1B8F1999BB6DD66DB2E8726E16123521" }
    )

    $best = $null
    $bestCount = -1
    foreach ($p in $pairs) {
        if (-not (Test-Path $p.TerminalExe)) { continue }
        if (-not (Test-Path $p.DataFolder)) { continue }
        $expertsPath = Join-Path $p.DataFolder "MQL4\Experts"
        if (-not (Test-Path $expertsPath)) { continue }
        $count = @(Get-ChildItem -Path $expertsPath -Recurse -File -Filter *.ex4 -ErrorAction SilentlyContinue).Count
        if ($count -gt $bestCount) {
            $bestCount = $count
            $best = [pscustomobject]@{ TerminalExe = $p.TerminalExe; DataFolder = $p.DataFolder }
        }
    }
    if ($best -ne $null) {
        return $best
    }

    throw "Could not resolve a valid MT4 TerminalExe/DataFolder pair. Pass -TerminalExe and -DataFolder explicitly."
}

$resolved = Resolve-PrimaryTerminal -TerminalExeHint $TerminalExe -DataFolderHint $DataFolder
$TerminalExe = $resolved.TerminalExe
$DataFolder = $resolved.DataFolder

$expertsRoot = Join-Path $DataFolder "MQL4\Experts"
if (-not (Test-Path $expertsRoot)) {
    throw "Experts folder not found: $expertsRoot"
}

$workspaceManifestDir = Join-Path $PSScriptRoot "..\..\data\backtests\live-charts"
$workspaceManifestDir = [System.IO.Path]::GetFullPath($workspaceManifestDir)
New-Item -ItemType Directory -Force -Path $workspaceManifestDir | Out-Null

$manifestFileName = "xauusd-ea-templates.csv"
$manifestWorkspace = Join-Path $workspaceManifestDir $manifestFileName
$checklistWorkspace = Join-Path $workspaceManifestDir "xauusd-template-checklist.csv"
$inventoryWorkspace = Join-Path $workspaceManifestDir "xauusd-ea-inventory.csv"

$commonFiles = Join-Path $env:APPDATA "MetaQuotes\Terminal\Common\Files"
New-Item -ItemType Directory -Force -Path $commonFiles | Out-Null
$manifestCommon = Join-Path $commonFiles $manifestFileName

$templatesDir = Join-Path $DataFolder "templates"
if (-not (Test-Path $templatesDir)) {
    New-Item -ItemType Directory -Force -Path $templatesDir | Out-Null
}

$scriptSource = Join-Path $PSScriptRoot "mql4\OpenXAUUSDChartsFromManifest.mq4"
$scriptsDir = Join-Path $DataFolder "MQL4\Scripts"
New-Item -ItemType Directory -Force -Path $scriptsDir | Out-Null
$scriptTarget = Join-Path $scriptsDir "OpenXAUUSDChartsFromManifest.mq4"

$metaEditor = Join-Path (Split-Path -Parent $TerminalExe) "metaeditor.exe"
if (-not (Test-Path $metaEditor)) {
    throw "metaeditor.exe not found next to terminal: $metaEditor"
}

$experts = Get-ChildItem -Path $expertsRoot -Recurse -File -Filter *.ex4 |
    Where-Object { $_.FullName -notmatch "\\(Indicators|Scripts|Libraries)\\" } |
    Sort-Object FullName

if (-not $experts -or $experts.Count -eq 0) {
    throw "No EA .ex4 files found under $expertsRoot"
}

$rows = @()
$checkRows = @()
$invRows = @()
$seen = @{}

foreach ($ea in $experts) {
    $rel = $ea.FullName.Substring($expertsRoot.Length).TrimStart("\")
    if ($seen.ContainsKey($rel)) { continue }
    $seen[$rel] = $true

    $eaName = [System.IO.Path]::GetFileNameWithoutExtension($ea.Name)
    $safe = ($eaName -replace "[^a-zA-Z0-9_\-]", "_")
    $template = "AUTO_$safe.tpl"
    $templatePath = Join-Path $templatesDir $template

    $rows += [pscustomobject]@{
        Enabled = 1
        TemplateFile = $template
        BotLabel = $eaName
        ExpertRelativePath = $rel
    }

    $checkRows += [pscustomobject]@{
        TemplateFile = $template
        ExpertRelativePath = $rel
        TemplateExists = [int](Test-Path $templatePath)
    }

    $invRows += [pscustomobject]@{
        EAName = $eaName
        ExpertRelativePath = $rel
        SizeBytes = $ea.Length
        LastWriteTimeUtc = $ea.LastWriteTimeUtc.ToString("o")
    }
}

$rows | Export-Csv -Path $manifestWorkspace -NoTypeInformation -Encoding ASCII
$rows | Export-Csv -Path $manifestCommon -NoTypeInformation -Encoding ASCII
$checkRows | Export-Csv -Path $checklistWorkspace -NoTypeInformation -Encoding ASCII
$invRows | Export-Csv -Path $inventoryWorkspace -NoTypeInformation -Encoding ASCII

Copy-Item -Path $scriptSource -Destination $scriptTarget -Force
& $metaEditor "/compile:$scriptTarget" | Out-Null

$scriptEx4 = [System.IO.Path]::ChangeExtension($scriptTarget, ".ex4")

if ($DryRun) {
    Write-Host "DryRun enabled. Generated files only."
} else {
    Start-Process -FilePath $TerminalExe | Out-Null
}

$availableTemplates = @($checkRows | Where-Object { $_.TemplateExists -eq 1 }).Count
$missingTemplates = @($checkRows | Where-Object { $_.TemplateExists -eq 0 }).Count

Write-Host "Prepared XAUUSD chart-attach workflow:"
Write-Host "  Terminal: $TerminalExe"
Write-Host "  DataFolder: $DataFolder"
Write-Host "  EAs discovered: $($rows.Count)"
Write-Host "  Manifest (workspace): $manifestWorkspace"
Write-Host "  Manifest (Common Files): $manifestCommon"
Write-Host "  Inventory: $inventoryWorkspace"
Write-Host "  Template checklist: $checklistWorkspace"
Write-Host "  MT4 Script source: $scriptTarget"
Write-Host "  MT4 Script compiled: $scriptEx4"
Write-Host "  Existing AUTO templates: $availableTemplates"
Write-Host "  Missing AUTO templates: $missingTemplates"
Write-Host ""
Write-Host "In MT4 do this once:"
Write-Host "  1) Create template files named AUTO_<EANameSafe>.tpl for bots you want auto-attached."
Write-Host "  2) Navigator -> Scripts -> OpenXAUUSDChartsFromManifest."
Write-Host "  3) Inputs: InpSymbol=$Symbol, InpTimeframe=$Period, InpMaxCharts=$MaxCharts."
Write-Host "  4) Leave InpManifestFile=$manifestFileName and InpCloseTaggedChartsFirst=true for idempotent reruns."
