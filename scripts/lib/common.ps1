function Get-DotfilesRoot {
  Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

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

function Test-DotCommand {
  param([Parameter(Mandatory)][string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}
