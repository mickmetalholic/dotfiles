[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\common.ps1"

$root = Get-DotfilesRoot

function Get-DotPosixFiles {
  $files = @()
  $files += Get-ChildItem -LiteralPath $root -Filter "*.sh" -File
  $files += Get-ChildItem -LiteralPath (Join-Path $root "scripts") -Filter "*.sh" -Recurse -File
  $files += Get-ChildItem -LiteralPath (Join-Path $root "home") -Filter "*.sh.tmpl" -Recurse -File
  return $files
}

function Get-DotPowerShellFiles {
  $files = @()
  $files += Get-ChildItem -LiteralPath $root -Filter "*.ps1" -File
  $files += Get-ChildItem -LiteralPath (Join-Path $root "scripts") -Filter "*.ps1" -Recurse -File
  $files += Get-ChildItem -LiteralPath (Join-Path $root "home") -Filter "*.ps1.tmpl" -Recurse -File
  return $files
}

Write-DotSection "OpenSpec"
if (Test-DotCommand openspec) {
  & openspec validate --all --strict
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-DotStatus ok openspec "validated"
} else {
  Write-DotStatus missing openspec
  Write-DotFix "install openspec and re-run dot validate"
  exit 1
}

Write-DotSection "POSIX Syntax"
if (Test-DotCommand sh) {
  foreach ($file in Get-DotPosixFiles) {
    & sh -n $file.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
  Write-DotStatus ok sh "syntax valid"
} else {
  Write-DotStatus warn sh "syntax validation skipped"
  Write-DotFix "install a POSIX shell to validate *.sh files on this host"
}

Write-DotSection "POSIX Static Analysis"
if (Test-DotCommand shellcheck) {
  foreach ($file in Get-DotPosixFiles) {
    & shellcheck --severity=error $file.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
  Write-DotStatus ok shellcheck "static analysis valid"
} else {
  Write-DotStatus warn shellcheck "static analysis skipped"
  Write-DotFix "install ShellCheck to validate POSIX scripts on this host"
}

Write-DotSection "PowerShell Syntax"
foreach ($file in Get-DotPowerShellFiles) {
  [scriptblock]::Create((Get-Content -Raw -LiteralPath $file.FullName)) > $null
}
Write-DotStatus ok pwsh "syntax valid"

Write-DotSection "PowerShell Static Analysis"
if (Test-DotCommand Invoke-ScriptAnalyzer) {
  $diagnostics = foreach ($file in Get-DotPowerShellFiles) {
    Invoke-ScriptAnalyzer -ScriptDefinition (Get-Content -Raw -LiteralPath $file.FullName) -Severity Error
  }
  if ($diagnostics) {
    $diagnostics | Format-List
    exit 1
  }
  Write-DotStatus ok PSScriptAnalyzer "static analysis valid"
} else {
  Write-DotStatus warn PSScriptAnalyzer "static analysis skipped"
  Write-DotFix "install PSScriptAnalyzer to validate PowerShell scripts on this host"
}
