[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Command = "help",
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Rest
)

$ErrorActionPreference = "Stop"
$DotfilesRoot = Split-Path -Parent $PSScriptRoot

function Show-DotHelp {
  @"
dot commands:
  doctor      inspect this machine without modifying it
  bootstrap   install foundational tooling and apply dotfiles
  apply       run chezmoi apply
  update      run chezmoi update
  diff        run chezmoi diff
  edit        open the chezmoi source directory
  packages    install/update declared packages
  public-readiness
              check whether repository content is ready to publish
  runtime     run mise install
  validate    run repository validation checks
"@
}

switch ($Command) {
  "doctor" { & "$DotfilesRoot\scripts\doctor.ps1" @Rest }
  "bootstrap" { & "$DotfilesRoot\scripts\bootstrap.ps1" @Rest }
  "packages" { & "$DotfilesRoot\scripts\packages.ps1" @Rest }
  "public-readiness" { & "$DotfilesRoot\scripts\public-readiness.ps1" @Rest }
  "runtime" { & "$DotfilesRoot\scripts\runtime.ps1" @Rest }
  "validate" { & "$DotfilesRoot\scripts\validate.ps1" @Rest }
  "apply" { & chezmoi apply @Rest }
  "update" { & chezmoi update @Rest }
  "diff" { & chezmoi diff @Rest }
  "edit" {
    $source = (& chezmoi source-path)
    $editor = if ($env:EDITOR) { $env:EDITOR } else { "nvim" }
    & $editor $source
  }
  { $_ -in @("help", "-h", "--help") } { Show-DotHelp }
  default {
    Write-Error "Unknown command: $Command"
    Show-DotHelp
    exit 2
  }
}
