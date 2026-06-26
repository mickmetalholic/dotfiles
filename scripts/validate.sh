#!/usr/bin/env sh
set -eu

DOTFILES_ROOT="${DOTFILES_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
. "$DOTFILES_ROOT/scripts/lib/output.sh"
. "$DOTFILES_ROOT/scripts/lib/detect.sh"

dot_section "OpenSpec"
if dot_has openspec; then
  openspec validate --all --strict
  dot_status ok openspec "validated"
else
  dot_status missing openspec
  dot_fix "install openspec and re-run dot validate"
  exit 1
fi

dot_section "POSIX Syntax"
sh -n \
  "$DOTFILES_ROOT/install.sh" \
  "$DOTFILES_ROOT"/scripts/*.sh \
  "$DOTFILES_ROOT"/scripts/lib/*.sh \
  "$DOTFILES_ROOT"/home/run_onchange_*.sh.tmpl \
  "$DOTFILES_ROOT"/home/run_once_*.sh.tmpl
dot_status ok sh "syntax valid"

dot_section "PowerShell Syntax"
if dot_has pwsh; then
  pwsh -NoProfile -Command '
    $ErrorActionPreference = "Stop"
    $root = $env:DOTFILES_ROOT
    $files = @()
    $files += Get-ChildItem -LiteralPath $root -Filter "*.ps1" -File
    $files += Get-ChildItem -LiteralPath (Join-Path $root "scripts") -Filter "*.ps1" -Recurse -File
    $files += Get-ChildItem -LiteralPath (Join-Path $root "home") -Filter "*.ps1.tmpl" -Recurse -File
    foreach ($file in $files) {
      [scriptblock]::Create((Get-Content -Raw -LiteralPath $file.FullName)) > $null
    }
  '
  dot_status ok pwsh "syntax valid"
else
  dot_status warn pwsh "syntax validation skipped"
  dot_fix "install PowerShell to validate *.ps1 files on this host"
fi
