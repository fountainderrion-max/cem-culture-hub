param(
    [string]$ConfigFile = ".\config\mt4\df-quantum-coordinator.config.json",
    [switch]$RunOnce
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-DirectoryForFile {
    param([string]$Path)
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

function Read-JsonFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        throw "Config file not found: $Path"
    }
    return (Get-Content -Path $Path -Raw | ConvertFrom-Json)
}

function Write-LogLine {
    param(
        [string]$LogFile,
        [string]$Message
    )
    $line = "[{0}] {1}" -f ([DateTime]::UtcNow.ToString("o")), $Message
    Add-Content -Path $LogFile -Value $line -Encoding ASCII
}

function Normalize-Bool {
    param([object]$Value)
    if ($null -eq $Value) { return $false }
    $s = $Value.ToString().Trim().ToLowerInvariant()
    return @("1", "true", "yes", "y", "on") -contains $s
}

function Read-HeartbeatRows {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        return @()
    }
    try {
        return @(Import-Csv -Path $Path)
    }
    catch {
        return @()
    }
}

function Parse-UtcDate {
    param([object]$Raw)
    if ($null -eq $Raw -or [string]::IsNullOrWhiteSpace($Raw.ToString())) {
        return $null
    }

    $styles = [System.Globalization.DateTimeStyles]::AssumeUniversal -bor [System.Globalization.DateTimeStyles]::AdjustToUniversal
    $out = [datetime]::MinValue
    if ([datetime]::TryParse($Raw.ToString(), [System.Globalization.CultureInfo]::InvariantCulture, $styles, [ref]$out)) {
        return $out
    }
    return $null
}

function Get-RunningBots {
    param(
        [object[]]$HeartbeatRows,
        [int]$HeartbeatTimeoutSeconds
    )

    $cutoff = [DateTime]::UtcNow.AddSeconds(-1 * $HeartbeatTimeoutSeconds)
    $running = @()

    foreach ($row in $HeartbeatRows) {
        $updated = Parse-UtcDate -Raw $row.UpdatedUtc
        if ($null -eq $updated) { continue }
        if ($updated -lt $cutoff) { continue }

        $status = ""
        if ($null -ne $row.Status) { $status = $row.Status.ToString().Trim().ToLowerInvariant() }
        if ($status -and @("stopped", "offline", "disabled") -contains $status) { continue }

        $running += [pscustomobject]@{
            BotName       = $row.BotName
            Symbol        = $row.Symbol
            Status        = $row.Status
            NeedsHelp     = Normalize-Bool -Value $row.NeedsHelp
            Issue         = $row.Issue
            DrawdownPct   = $row.DrawdownPct
            LastSignalUtc = Parse-UtcDate -Raw $row.LastSignalUtc
            UpdatedUtc    = $updated
        }
    }

    return $running
}

function Get-ActionForBot {
    param(
        [pscustomobject]$Bot,
        [object[]]$Rules
    )

    $issue = ""
    if ($null -ne $Bot.Issue) { $issue = $Bot.Issue.ToString().ToLowerInvariant() }
    $drawdown = 0.0
    [double]::TryParse(($Bot.DrawdownPct | Out-String).Trim(), [ref]$drawdown) | Out-Null

    foreach ($rule in $Rules) {
        $triggered = $false
        $hasNeedsHelpOnly = $rule.PSObject.Properties.Name -contains "needsHelpOnly"
        $hasMinDrawdown = $rule.PSObject.Properties.Name -contains "minDrawdownPct"
        $hasIssueContains = $rule.PSObject.Properties.Name -contains "issueContains"

        if ($hasNeedsHelpOnly -and $rule.needsHelpOnly -eq $true -and $Bot.NeedsHelp) {
            $triggered = $true
        }
        if (-not $triggered -and $hasMinDrawdown -and $rule.minDrawdownPct -ne $null) {
            $threshold = [double]$rule.minDrawdownPct
            if ($drawdown -ge $threshold) { $triggered = $true }
        }
        if (-not $triggered -and $hasIssueContains -and $rule.issueContains) {
            $needle = $rule.issueContains.ToString().ToLowerInvariant()
            if ($needle -and $issue.Contains($needle)) { $triggered = $true }
        }
        if ($triggered) {
            return [pscustomobject]@{
                Action   = $rule.action
                Priority = [int]$rule.priority
                Reason   = $rule.reason
            }
        }
    }

    return [pscustomobject]@{
        Action   = "monitor_only"
        Priority = 10
        Reason   = "No escalation rule triggered."
    }
}

function Read-Tasks {
    param([string]$TaskFile)
    if (-not (Test-Path $TaskFile)) {
        return @()
    }
    try {
        return @(Import-Csv -Path $TaskFile)
    }
    catch {
        return @()
    }
}

function Save-Tasks {
    param(
        [string]$TaskFile,
        [object[]]$Tasks
    )
    $Tasks | Export-Csv -Path $TaskFile -NoTypeInformation -Encoding ASCII
}

function Upsert-Task {
    param(
        [System.Collections.ArrayList]$Tasks,
        [pscustomobject]$Bot,
        [pscustomobject]$ActionInfo
    )

    $open = $Tasks | Where-Object {
        $_.BotName -eq $Bot.BotName -and
        $_.Action -eq $ActionInfo.Action -and
        @("NEW", "QUEUED", "IN_PROGRESS") -contains $_.Status
    } | Select-Object -First 1

    if ($null -ne $open) {
        $open.LastSeenUtc = [DateTime]::UtcNow.ToString("o")
        return $false
    }

    $id = [guid]::NewGuid().ToString()
    $Tasks.Add([pscustomobject]@{
        TaskId          = $id
        CreatedUtc      = [DateTime]::UtcNow.ToString("o")
        LastSeenUtc     = [DateTime]::UtcNow.ToString("o")
        DelegatedTo     = "DF_QUANTUM"
        BotName         = $Bot.BotName
        Symbol          = $Bot.Symbol
        Action          = $ActionInfo.Action
        Priority        = $ActionInfo.Priority
        Reason          = $ActionInfo.Reason
        SourceStatus    = $Bot.Status
        SourceIssue     = $Bot.Issue
        SourceDrawdown  = $Bot.DrawdownPct
        SourceUpdatedUtc= $Bot.UpdatedUtc.ToString("o")
        Status          = "QUEUED"
    }) | Out-Null

    return $true
}

if (-not (Test-Path $ConfigFile)) {
    throw "Config file not found: $ConfigFile"
}

$cfg = Read-JsonFile -Path $ConfigFile
$paths = $cfg.paths
$watchdog = $cfg.watchdog

$heartbeatInFile = $paths.botHeartbeatFile
$taskOutFile = $paths.dfQuantumTaskFile
$runLogFile = $paths.coordinatorLogFile
$heartbeatOutFile = $paths.coordinatorHeartbeatFile
$stopFile = $paths.stopFile

New-DirectoryForFile -Path $taskOutFile
New-DirectoryForFile -Path $runLogFile
New-DirectoryForFile -Path $heartbeatOutFile
New-DirectoryForFile -Path $stopFile

$intervalSeconds = [int]$watchdog.intervalSeconds
if ($intervalSeconds -lt 2) { $intervalSeconds = 2 }
$heartbeatTimeoutSeconds = [int]$watchdog.heartbeatTimeoutSeconds
if ($heartbeatTimeoutSeconds -lt 5) { $heartbeatTimeoutSeconds = 5 }

if (Test-Path $stopFile) {
    Remove-Item -Path $stopFile -Force
}

Write-LogLine -LogFile $runLogFile -Message "Coordinator started. Config=$ConfigFile"

while ($true) {
    if (Test-Path $stopFile) {
        Write-LogLine -LogFile $runLogFile -Message "Stop file detected. Coordinator stopping cleanly."
        Remove-Item -Path $stopFile -Force
        break
    }

    $rawHeartbeatRows = Read-HeartbeatRows -Path $heartbeatInFile
    $runningBots = Get-RunningBots -HeartbeatRows $rawHeartbeatRows -HeartbeatTimeoutSeconds $heartbeatTimeoutSeconds
    $existingTasks = [System.Collections.ArrayList]::new()
    foreach ($t in (Read-Tasks -TaskFile $taskOutFile)) {
        $existingTasks.Add($t) | Out-Null
    }

    $newTasks = 0
    foreach ($bot in $runningBots) {
        $actionInfo = Get-ActionForBot -Bot $bot -Rules @($cfg.rules)
        $created = Upsert-Task -Tasks $existingTasks -Bot $bot -ActionInfo $actionInfo
        if ($created) { $newTasks++ }
    }

    Save-Tasks -TaskFile $taskOutFile -Tasks @($existingTasks)

    $hbObj = [pscustomobject]@{
        TimestampUtc = [DateTime]::UtcNow.ToString("o")
        Coordinator  = "DF_QUANTUM_HELPER_COORDINATOR"
        RunningBots  = @($runningBots).Count
        NewTasks     = $newTasks
        TaskFile     = $taskOutFile
        StopFile     = $stopFile
    }
    $hbObj | ConvertTo-Json | Set-Content -Path $heartbeatOutFile -Encoding ASCII

    Write-LogLine -LogFile $runLogFile -Message ("Tick complete. RunningBots={0}, NewTasks={1}, TotalTasks={2}" -f @($runningBots).Count, $newTasks, @($existingTasks).Count)

    if ($RunOnce) { break }
    Start-Sleep -Seconds $intervalSeconds
}

Write-LogLine -LogFile $runLogFile -Message "Coordinator exited."
