. "$PSScriptRoot\common.ps1"

function Install-DotWingetPackage {
  param(
    [Parameter(Mandatory)][string]$Id,
    [switch]$DryRun
  )

  if (-not (Test-DotCommand winget)) {
    Write-DotStatus missing winget
    Write-DotFix "install App Installer from Microsoft Store"
    return
  }

  $installed = winget list --id $Id --exact 2>$null
  if ($LASTEXITCODE -eq 0 -and $installed -match [regex]::Escape($Id)) {
    Write-DotStatus ok $Id "winget"
    return
  }

  if ($DryRun) {
    Write-DotStatus warn $Id "would install with winget"
  } else {
    Write-DotStatus warn $Id "installing with winget"
    winget install --id $Id --exact --accept-package-agreements --accept-source-agreements
  }
}
