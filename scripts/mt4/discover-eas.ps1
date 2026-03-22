param(
    [string]$SearchRoot = ".",
    [string]$OutFile = ".\\data\\backtests\\ea-inventory.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-FileSha1 {
    param([string]$Path)
    return (Get-FileHash -Path $Path -Algorithm SHA1).Hash
}

$root = Resolve-Path -Path $SearchRoot
$eaFiles = Get-ChildItem -Path $root -Recurse -File -Include *.mq4, *.ex4

$rows = @()
foreach ($file in $eaFiles) {
    $rows += [pscustomobject]@{
        EAName           = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        FilePath         = $file.FullName
        FileType         = $file.Extension.TrimStart(".").ToUpperInvariant()
        SizeBytes        = $file.Length
        LastWriteTimeUtc = $file.LastWriteTimeUtc.ToString("o")
        Sha1             = Get-FileSha1 -Path $file.FullName
    }
}

$outDir = Split-Path -Path $OutFile -Parent
if (-not (Test-Path -Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$rows | Sort-Object EAName, FileType, FilePath | Export-Csv -Path $OutFile -NoTypeInformation
Write-Host "EA inventory saved: $OutFile"
Write-Host "EA files found: $($rows.Count)"
