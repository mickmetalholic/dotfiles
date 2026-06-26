function Get-DotfilesRoot {
  Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

$script:DotStatusMissingCount = 0
$script:DotStatusWarningCount = 0
$script:DotStatusFailureCount = 0

function Write-DotSection {
  param([Parameter(Mandatory)][string]$Name)
  Write-Host ""
  Write-Host $Name
}

function Write-DotStatus {
  param(
    [Parameter(Mandatory)][string]$Status,
    [Parameter(Mandatory)][string]$Name,
    [string]$Detail
  )

  switch ($Status) {
    "missing" { $script:DotStatusMissingCount++ }
    "warn" { $script:DotStatusWarningCount++ }
    "fail" { $script:DotStatusFailureCount++ }
  }

  if ($Detail) {
    Write-Host ("  [{0}] {1}: {2}" -f $Status, $Name, $Detail)
  } else {
    Write-Host ("  [{0}] {1}" -f $Status, $Name)
  }
}

function Write-DotFix {
  param([Parameter(Mandatory)][string]$Message)
  Write-Host ("        fix: {0}" -f $Message)
}

function Write-DotStatusPlain {
  param(
    [Parameter(Mandatory)][string]$Status,
    [Parameter(Mandatory)][string]$Name,
    [string]$Detail
  )

  if ($Detail) {
    Write-Host ("  [{0}] {1}: {2}" -f $Status, $Name, $Detail)
  } else {
    Write-Host ("  [{0}] {1}" -f $Status, $Name)
  }
}

function Write-DotSummary {
  $blocking = $script:DotStatusMissingCount + $script:DotStatusFailureCount
  Write-DotSection "Summary"
  if ($blocking -gt 0) {
    Write-DotStatusPlain blocked "machine setup" ("{0} blocking issue(s), {1} warning(s)" -f $blocking, $script:DotStatusWarningCount)
    Write-DotFix "resolve missing/failing required checks first"
  } elseif ($script:DotStatusWarningCount -gt 0) {
    Write-DotStatusPlain warn "machine setup" ("usable with {0} warning(s)" -f $script:DotStatusWarningCount)
    Write-DotFix "review warnings when you have time"
  } else {
    Write-DotStatusPlain ok "machine setup" "ready"
  }
}

function Test-DotCommand {
  param([Parameter(Mandatory)][string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}
