[CmdletBinding()]
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Rest
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\common.ps1"

Write-DotSection "Runtime"
if (Test-DotCommand mise) {
  Write-DotStatus ok mise "installing declared runtimes"
  & mise install @Rest
} else {
  Write-DotStatus missing mise
  Write-DotFix "dot bootstrap"
  exit 1
}
