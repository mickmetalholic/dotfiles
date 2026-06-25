[CmdletBinding()]
param(
  [switch]$Gui,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\common.ps1"
. "$PSScriptRoot\lib\install.ps1"

$root = Get-DotfilesRoot

Write-DotSection "Bootstrap"
Write-DotStatus ok mode ("gui={0} force={1}" -f [bool]$Gui, [bool]$Force)

if (-not (Test-DotCommand chezmoi)) {
  Install-DotWingetPackage -Id "twpayne.chezmoi"
} else {
  Write-DotStatus ok chezmoi "already installed"
}

if (-not (Test-DotCommand git)) {
  Install-DotWingetPackage -Id "Git.Git"
}

if (-not (Test-DotCommand gh)) {
  Install-DotWingetPackage -Id "GitHub.cli"
}

if (-not (Test-DotCommand mise)) {
  Install-DotWingetPackage -Id "jdx.mise"
}

if ($Gui) {
  Install-DotWingetPackage -Id "Microsoft.WindowsTerminal"
  Install-DotWingetPackage -Id "Microsoft.VisualStudioCode"
}

if (Test-DotCommand chezmoi) {
  Write-DotStatus warn chezmoi "applying source"
  & chezmoi apply
}

& "$root\scripts\doctor.ps1"
