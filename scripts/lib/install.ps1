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

function Install-DotScoopPackage {
  param(
    [Parameter(Mandatory)][string]$Name,
    [switch]$DryRun
  )

  if (-not (Test-DotCommand scoop)) {
    Write-DotStatus warn scoop "not installed"
    Write-DotFix "install scoop or skip scoop packages"
    return
  }

  $installed = scoop list 2>$null
  if ($installed -match "(?m)^\s*$([regex]::Escape($Name))\s") {
    Write-DotStatus ok $Name "scoop"
    return
  }

  if ($DryRun) {
    Write-DotStatus warn $Name "would install with scoop"
  } else {
    Write-DotStatus warn $Name "installing with scoop"
    scoop install $Name
  }
}
