. "$PSScriptRoot\common.ps1"

function Test-DotRequiredCommand {
  param(
    [Parameter(Mandatory)][string]$Name,
    [string]$Fix
  )

  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) {
    $version = try { (& $Name --version 2>$null | Select-Object -First 1) } catch { $null }
    Write-DotStatus ok $Name ($version ?? "available")
  } else {
    Write-DotStatus missing $Name
    if ($Fix) { Write-DotFix $Fix }
  }
}

function Test-DotOptionalCommand {
  param([Parameter(Mandatory)][string]$Name)

  if (Test-DotCommand $Name) {
    Write-DotStatus ok $Name "available"
  } else {
    Write-DotStatus warn $Name "optional"
  }
}
