[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\common.ps1"

$root = Get-DotfilesRoot

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
  & sh -n `
    (Join-Path $root "install.sh") `
    (Join-Path $root "scripts/bootstrap.sh") `
    (Join-Path $root "scripts/doctor.sh") `
    (Join-Path $root "scripts/dot.sh") `
    (Join-Path $root "scripts/packages.sh") `
    (Join-Path $root "scripts/public-readiness.sh") `
    (Join-Path $root "scripts/runtime.sh") `
    (Join-Path $root "scripts/validate.sh") `
    (Join-Path $root "scripts/lib/checks.sh") `
    (Join-Path $root "scripts/lib/detect.sh") `
    (Join-Path $root "scripts/lib/install.sh") `
    (Join-Path $root "scripts/lib/output.sh") `
    (Join-Path $root "scripts/lib/packages.sh") `
    (Join-Path $root "home/run_onchange_10_install_packages.sh.tmpl") `
    (Join-Path $root "home/run_onchange_20_configure_runtime.sh.tmpl") `
    (Join-Path $root "home/run_once_00_bootstrap.sh.tmpl")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-DotStatus ok sh "syntax valid"
} else {
  Write-DotStatus warn sh "syntax validation skipped"
  Write-DotFix "install a POSIX shell to validate *.sh files on this host"
}

Write-DotSection "PowerShell Syntax"
$files = @()
$files += Get-ChildItem -LiteralPath $root -Filter "*.ps1" -File
$files += Get-ChildItem -LiteralPath (Join-Path $root "scripts") -Filter "*.ps1" -Recurse -File
$files += Get-ChildItem -LiteralPath (Join-Path $root "home") -Filter "*.ps1.tmpl" -Recurse -File
foreach ($file in $files) {
  [scriptblock]::Create((Get-Content -Raw -LiteralPath $file.FullName)) > $null
}
Write-DotStatus ok pwsh "syntax valid"
