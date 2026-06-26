[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
. "$PSScriptRoot\lib\common.ps1"
. "$PSScriptRoot\lib\checks.ps1"

$root = Get-DotfilesRoot

Write-DotSection "System"
Write-DotStatus ok os $PSVersionTable.OS
Write-DotStatus ok host $env:COMPUTERNAME
Write-DotStatus ok arch $env:PROCESSOR_ARCHITECTURE
Write-DotStatus ok user $env:USERNAME
Write-DotStatus ok shell "pwsh"
Write-DotStatus ok path (($env:PATH -split [IO.Path]::PathSeparator | Select-Object -First 3) -join [IO.Path]::PathSeparator)

Write-DotSection "Core Tools"
Test-DotRequiredCommand git "dot bootstrap"
Test-DotRequiredCommand gh "dot bootstrap"
Test-DotRequiredCommand ssh "install OpenSSH client"
Test-DotRequiredCommand curl "dot bootstrap"
Test-DotRequiredCommand unzip "dot bootstrap"
Test-DotRequiredCommand jq "dot packages"
Test-DotRequiredCommand rg "dot packages"
Test-DotRequiredCommand fd "dot packages"
Test-DotRequiredCommand fzf "dot packages"

Write-DotSection "Config"
Test-DotRequiredCommand chezmoi "dot bootstrap"
if (Test-DotCommand git) {
  $dirty = (& git -C $root status --porcelain)
  if ($dirty) {
    Write-DotStatus warn "dotfiles repo" "has local changes"
    Write-DotFix "review git diff in $root"
  } else {
    Write-DotStatus ok "dotfiles repo" "clean"
  }
}
if (Test-DotCommand chezmoi) {
  $diff = (& chezmoi diff 2>$null)
  if ($LASTEXITCODE -eq 0 -and -not $diff) {
    Write-DotStatus ok "chezmoi diff" "clean"
  } else {
    Write-DotStatus warn "chezmoi diff" "pending changes or unavailable"
    Write-DotFix "run dot diff"
  }
}

Write-DotSection "Package Managers"
Test-DotOptionalCommand brew
Test-DotOptionalCommand winget
Test-DotOptionalCommand scoop
Test-DotOptionalCommand apt
Test-DotOptionalCommand dnf
Test-DotOptionalCommand pacman

Write-DotSection "Runtime"
Test-DotRequiredCommand mise "dot bootstrap"
foreach ($cmd in @("node", "pnpm", "uv", "python", "bun", "go", "rustc")) {
  Test-DotOptionalCommand $cmd
}

Write-DotSection "Shell"
foreach ($cmd in @("zsh", "pwsh", "starship", "zoxide", "direnv")) {
  Test-DotOptionalCommand $cmd
}

Write-DotSection "Auth"
if (Test-DotCommand gh) {
  & gh auth status *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-DotStatus ok "gh auth" "authenticated"
  } else {
    Write-DotStatus warn "gh auth" "not authenticated"
    Write-DotFix "gh auth login"
  }
}
if (Test-DotCommand ssh) {
  & ssh -T git@github.com *> $null
  if ($LASTEXITCODE -eq 1) {
    Write-DotStatus ok "github ssh" "reachable"
  } else {
    Write-DotStatus warn "github ssh" "failed or not configured"
    Write-DotFix "ssh-add ~/.ssh/id_ed25519"
  }
}
Test-DotOptionalCommand op
Test-DotOptionalCommand bw

Write-DotSection "Editor / Terminal"
foreach ($cmd in @("nvim", "code", "cursor", "wezterm", "ghostty")) {
  Test-DotOptionalCommand $cmd
}

Write-DotSection "Security"
$managed = Join-Path $root "home"
$pathHits = @()
if (Test-Path -LiteralPath $managed) {
  $pathHits = Get-ChildItem -LiteralPath $managed -Recurse -File -Force |
    Where-Object { $_.Name -match '^\.env(\.|$)|\.pem$|\.key$|^id_|cookies|history' }
}
if ($pathHits.Count -gt 0) {
  Write-DotStatus warn "managed secrets" "suspicious file paths found"
  $pathHits | ForEach-Object { Write-Host ("        {0}" -f $_.FullName) }
  Write-DotFix "remove secrets from repository-managed paths"
} else {
  Write-DotStatus ok "managed secrets" "no suspicious paths"
}

$tokenHits = @()
foreach ($dir in @("home", "data")) {
  $full = Join-Path $root $dir
  if (Test-Path -LiteralPath $full) {
    $files = Get-ChildItem -LiteralPath $full -Recurse -File -Force -ErrorAction SilentlyContinue
    $tokenHits += $files | Select-String -Pattern "gho_|ghp_|api[_-]?key|secret|token=" -ErrorAction SilentlyContinue
  }
}
if ($tokenHits.Count -gt 0) {
  Write-DotStatus warn "plaintext token scan" "possible secret-like text"
  Write-DotFix "move secrets to 1Password or Bitwarden"
} else {
  Write-DotStatus ok "plaintext token scan" "no obvious tokens"
}

Write-DotSummary
