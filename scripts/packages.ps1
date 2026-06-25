[CmdletBinding()]
param(
  [switch]$DryRun,
  [switch]$Gui
)

$ErrorActionPreference = "Continue"
. "$PSScriptRoot\lib\common.ps1"
. "$PSScriptRoot\lib\install.ps1"

$root = Get-DotfilesRoot
Write-DotSection "Packages"
Write-DotStatus ok data (Join-Path $root "data\packages.yaml")

foreach ($id in @(
  "Git.Git",
  "GitHub.cli",
  "Microsoft.PowerShell",
  "Microsoft.WindowsTerminal",
  "jdx.mise",
  "sharkdp.fd",
  "BurntSushi.ripgrep.MSVC"
)) {
  Install-DotWingetPackage -Id $id -DryRun:$DryRun
}

if (Test-DotCommand scoop) {
  foreach ($name in @("jq", "fzf", "starship", "zoxide")) {
    Install-DotScoopPackage -Name $name -DryRun:$DryRun
  }
} else {
  Write-DotStatus warn scoop "not installed"
  Write-DotFix "install scoop or skip scoop packages"
}

if ($Gui) {
  foreach ($id in @("Microsoft.VisualStudioCode", "Obsidian.Obsidian")) {
    Install-DotWingetPackage -Id $id -DryRun:$DryRun
  }
}
