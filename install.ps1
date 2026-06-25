[CmdletBinding()]
param(
  [string]$Repo = $(if ($env:DOTFILES_REPO) { $env:DOTFILES_REPO } else { "https://github.com/mickmetalholic/dotfiles.git" })
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command chezmoi -ErrorAction SilentlyContinue)) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    winget install --id twpayne.chezmoi --exact --accept-package-agreements --accept-source-agreements
  } else {
    throw "chezmoi is required and winget is unavailable. Install chezmoi and re-run this script."
  }
}

chezmoi init --apply $Repo
$source = (& chezmoi source-path)
& (Join-Path $source "scripts\bootstrap.ps1")
& (Join-Path $source "scripts\doctor.ps1")
