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

function Write-DotOfficialFallback {
  param(
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][string]$Instruction
  )

  Write-DotStatus warn $Name "official fallback required"
  Write-DotFix $Instruction
}

function Install-DotPowerShellModule {
  param(
    [Parameter(Mandatory)][string]$Name,
    [switch]$DryRun
  )

  if (Get-Module -ListAvailable -Name $Name) {
    Write-DotStatus ok $Name "PowerShell module"
    return
  }

  if ($DryRun) {
    Write-DotStatus warn $Name "would install from PowerShell Gallery"
    return
  }

  Write-DotStatus warn $Name "installing from PowerShell Gallery"
  Install-Module -Name $Name -Scope CurrentUser -Force -AllowClobber
}

foreach ($id in @(
  "Git.Git",
  "GitHub.cli",
  "Microsoft.PowerShell",
  "Microsoft.WindowsTerminal",
  "jdx.mise",
  "sharkdp.fd",
  "BurntSushi.ripgrep.MSVC",
  "jqlang.jq",
  "junegunn.fzf",
  "Starship.Starship",
  "ajeetdsouza.zoxide",
  "eza-community.eza",
  "sharkdp.bat",
  "tldr-pages.tlrc",
  "dandavison.delta",
  "JesseDuffield.lazygit",
  "Casey.Just",
  "MikeFarah.yq",
  "koalaman.shellcheck",
  "mvdan.shfmt"
)) {
  Install-DotWingetPackage -Id $id -DryRun:$DryRun
}

Install-DotPowerShellModule -Name "PSScriptAnalyzer" -DryRun:$DryRun
Write-DotOfficialFallback "httpie-cli" "https://httpie.io/cli"
Write-DotOfficialFallback "codex-cli" "https://developers.openai.com/codex/cli"
Write-DotOfficialFallback "codex-app" "https://developers.openai.com/codex/app"
Write-DotOfficialFallback "reasonix-cli" "https://api-docs.deepseek.com/quick_start/agent_integrations/reasonix"
Write-DotOfficialFallback "reasonix-app" "https://github.com/esengine/DeepSeek-Reasonix/releases"
Write-DotOfficialFallback "taplo" "https://taplo.tamasfe.dev/cli/installation/"
Write-DotOfficialFallback "stylua" "https://github.com/JohnnyMorganz/StyLua"

if ($Gui) {
  foreach ($id in @("Microsoft.VisualStudioCode", "HTTPie.HTTPie", "Anysphere.Cursor")) {
    Install-DotWingetPackage -Id $id -DryRun:$DryRun
  }
}
