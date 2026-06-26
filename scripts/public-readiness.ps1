[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\common.ps1"

$root = Get-DotfilesRoot
$unsafeCount = 0
$reviewCount = 0

function Get-PublicReadinessFiles {
  $paths = @(
    (Join-Path $root "README.md"),
    (Join-Path $root "install.sh"),
    (Join-Path $root "install.ps1")
  )
  foreach ($dir in @("data", "home", "scripts")) {
    $full = Join-Path $root $dir
    if (Test-Path -LiteralPath $full) {
      $paths += Get-ChildItem -LiteralPath $full -Recurse -File -Force |
        Where-Object { $_.Name -notin @("public-readiness.sh", "public-readiness.ps1") } |
        ForEach-Object { $_.FullName }
    }
  }
  $paths
}

function Write-PublicFinding {
  param([Parameter(Mandatory)]$Finding)
  foreach ($item in $Finding) {
    $path = if ($item.Path) { $item.Path } else { $item.FullName }
    $relative = $path.Replace($root + [IO.Path]::DirectorySeparatorChar, "")
    if ($item.LineNumber) {
      Write-Host ("        {0}:{1}:{2}" -f $relative, $item.LineNumber, $item.Line.Trim())
    } else {
      Write-Host ("        {0}" -f $relative)
    }
  }
}

$files = Get-PublicReadinessFiles

Write-DotSection "Public Readiness"
Write-DotStatus ok scope "README, install entrypoints, data, home, scripts"

$managedRoots = @("data", "home", "scripts") | ForEach-Object { Join-Path $root $_ }
$pathHits = foreach ($managedRoot in $managedRoots) {
  if (Test-Path -LiteralPath $managedRoot) {
    Get-ChildItem -LiteralPath $managedRoot -Recurse -File -Force |
      Where-Object { $_.Name -match '^\.env(\.|$)|\.pem$|\.key$|^id_|cookies|history|cache' }
  }
}

if ($pathHits) {
  $unsafeCount++
  Write-DotStatus fail "forbidden paths" "unsafe to publish"
  Write-PublicFinding $pathHits
  Write-DotFix "remove forbidden files from repository-managed paths"
} else {
  Write-DotStatus ok "forbidden paths" "none"
}

$secretPattern = '-----BEGIN [A-Z ]*PRIVATE KEY-----|github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16}|(api[_-]?key|token|password)\s*[:=]\s*["'']?[A-Za-z0-9._/-]{20,}'
$secretHits = $files | Select-String -Pattern $secretPattern -ErrorAction SilentlyContinue
if ($secretHits) {
  $unsafeCount++
  Write-DotStatus fail "secret-like content" "unsafe to publish"
  Write-PublicFinding $secretHits
  Write-DotFix "move secrets to 1Password or Bitwarden before making the repository public"
} else {
  Write-DotStatus ok "secret-like content" "none"
}

$metadataHits = @()
$metadataHits += $files | Select-String -Pattern '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|includeIf "gitdir:~/(work|personal)/"' -ErrorAction SilentlyContinue
$hostsFile = Join-Path $root "data\hosts.yaml"
if (Test-Path -LiteralPath $hostsFile) {
  $metadataHits += Select-String -LiteralPath $hostsFile -Pattern '^\s{2}[A-Za-z0-9._-]+:' -ErrorAction SilentlyContinue
}
foreach ($dir in @("data", "home")) {
  $full = Join-Path $root $dir
  if (Test-Path -LiteralPath $full) {
    $metadataHits += Get-ChildItem -LiteralPath $full -Recurse -File -Force |
      Select-String -Pattern '(^|[^A-Za-z])(work|company|corp|internal|bytedance)([^A-Za-z]|$)' -ErrorAction SilentlyContinue
  }
}
$metadataHits = $metadataHits |
  Where-Object { $_.Line -notmatch 'git@github\.com' } |
  Sort-Object Path, LineNumber, Line -Unique
if ($metadataHits) {
  $reviewCount++
  Write-DotStatus warn "review metadata" "manual review required"
  Write-PublicFinding $metadataHits
  Write-DotFix "confirm hostnames, emails, SSH aliases, and work markers are safe to publish"
} else {
  Write-DotStatus ok "review metadata" "none"
}

Write-DotSection "Publish Gate"
if ($unsafeCount -gt 0) {
  Write-DotStatus fail "public visibility" ("{0} unsafe finding group(s)" -f $unsafeCount)
  Write-DotFix "do not make the repository public until unsafe findings are removed"
  exit 1
}

if ($reviewCount -gt 0) {
  Write-DotStatus warn "public visibility" ("{0} review finding group(s)" -f $reviewCount)
  Write-DotFix "review findings manually before changing GitHub repository visibility"
} else {
  Write-DotStatus ok "public visibility" "no unsafe or review-required findings"
}

Write-DotFix "change GitHub repository visibility manually only after this review"
