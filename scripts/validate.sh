#!/usr/bin/env sh
set -eu

DOTFILES_ROOT="${DOTFILES_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
. "$DOTFILES_ROOT/scripts/lib/output.sh"
. "$DOTFILES_ROOT/scripts/lib/detect.sh"

dot_find_posix_files() {
  find "$DOTFILES_ROOT" -maxdepth 1 -type f -name "*.sh" -print
  find "$DOTFILES_ROOT/scripts" -type f -name "*.sh" -print
  find "$DOTFILES_ROOT/home" -type f -name "*.sh.tmpl" -print
}

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
dot_find_posix_files | while IFS= read -r file; do
  sh -n "$file"
done
dot_status ok sh "syntax valid"

dot_section "POSIX Static Analysis"
if dot_has shellcheck; then
  dot_find_posix_files | while IFS= read -r file; do
    shellcheck --severity=error "$file"
  done
  dot_status ok shellcheck "static analysis valid"
else
  dot_status warn shellcheck "static analysis skipped"
  dot_fix "install ShellCheck to validate POSIX scripts on this host"
fi

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

  dot_section "PowerShell Static Analysis"
  if pwsh -NoProfile -Command 'if (Get-Command Invoke-ScriptAnalyzer -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }'; then
    pwsh -NoProfile -Command '
      $ErrorActionPreference = "Stop"
      $root = $env:DOTFILES_ROOT
      $files = @()
      $files += Get-ChildItem -LiteralPath $root -Filter "*.ps1" -File
      $files += Get-ChildItem -LiteralPath (Join-Path $root "scripts") -Filter "*.ps1" -Recurse -File
      $files += Get-ChildItem -LiteralPath (Join-Path $root "home") -Filter "*.ps1.tmpl" -Recurse -File
      $diagnostics = foreach ($file in $files) {
        Invoke-ScriptAnalyzer -ScriptDefinition (Get-Content -Raw -LiteralPath $file.FullName) -Severity Error
      }
      if ($diagnostics) {
        $diagnostics | Format-List
        exit 1
      }
    '
    dot_status ok PSScriptAnalyzer "static analysis valid"
  else
    dot_status warn PSScriptAnalyzer "static analysis skipped"
    dot_fix "install PSScriptAnalyzer to validate PowerShell scripts on this host"
  fi
else
  dot_status warn pwsh "syntax validation skipped"
  dot_fix "install PowerShell to validate *.ps1 files on this host"

  dot_section "PowerShell Static Analysis"
  dot_status warn PSScriptAnalyzer "static analysis skipped"
  dot_fix "install PowerShell and PSScriptAnalyzer to validate PowerShell scripts on this host"
fi
