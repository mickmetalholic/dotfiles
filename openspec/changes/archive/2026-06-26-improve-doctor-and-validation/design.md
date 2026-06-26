## Context

The repository already has POSIX and PowerShell implementations for `doctor`, command dispatch, package/runtime management, and bootstrap. The current doctor output is readable but does not provide a final decision point; missing core tools, optional tools, and authentication warnings all appear inline with no summary.

Validation currently exists as README command snippets. That makes validation easy to skip or run inconsistently, especially because PowerShell syntax checks depend on `pwsh` being available on the current machine.

## Goals / Non-Goals

**Goals:**

- Make `dot doctor` end with a concise summary of blocking issues, warnings, and next actions.
- Keep doctor implementations read-only on POSIX and Windows.
- Add a single repository validation entrypoint that runs OpenSpec, POSIX shell syntax checks, and PowerShell syntax checks.
- Let validation report a skipped PowerShell syntax check when `pwsh` is unavailable, rather than hiding the gap.
- Make macOS/Linux install and bootstrap entrypoints actively install `chezmoi` when Homebrew or the official installer path is available.

**Non-Goals:**

- Do not change bootstrap force semantics, GUI package handling, or general package install behavior beyond `chezmoi` setup.
- Do not install tools from doctor or validation commands.
- Do not reorganize the full README in this change.

## Decisions

1. Track check severity in shared helpers.

   The POSIX and PowerShell doctor helpers should record counts for required failures and warnings while still printing each existing status line. This keeps current output stable and adds the final summary without requiring every check callsite to reimplement aggregation.

   Alternative considered: parse printed doctor output after the fact. That would couple behavior to human-readable formatting and make future output changes fragile.

2. Treat missing required tools as blocking, and optional/auth/config warnings as non-blocking.

   Required command checks already have fix hints and represent the smallest set needed for the dotfiles workflow to run. Optional commands and authentication/config warnings still matter, but they should not make the summary say the machine is unusable.

   Alternative considered: make every warning blocking. That would make fresh machines look broken even when only optional tools are absent.

3. Add `dot validate` and script-level `validate` entrypoints.

   The unified command surface should expose validation the same way it exposes doctor, bootstrap, packages, and runtime. POSIX should delegate to `scripts/validate.sh`; Windows should delegate to `scripts/validate.ps1`.

   Alternative considered: keep validation only in README. That preserves the current drift risk and does not give users one command to run before changes are reviewed.

4. Make PowerShell validation explicit when unavailable.

   On POSIX machines without `pwsh`, validation should pass the checks it can run and print a warning that PowerShell syntax validation was skipped. On Windows or any host with `pwsh`, it should parse PowerShell scripts and templates.

   Alternative considered: require `pwsh` everywhere. That would make validation harder to run on minimal macOS/Linux hosts and could slow early bootstrap work.

5. Install `chezmoi` from setup paths, not from doctor.

   Windows already installs `chezmoi` from `install.ps1` with `winget` when available. POSIX should follow the same setup contract in `install.sh` and shared install helpers: prefer Homebrew when present, otherwise use the official chezmoi install script into a user-writable location such as `$HOME/.local/bin` when possible. Doctor should remain read-only and continue to report missing tools.

   Alternative considered: keep POSIX install manual-only. That contradicts the archived bootstrap workflow requirement that install entrypoints ensure `chezmoi` is available and keeps first-run behavior inconsistent across platforms.

## Risks / Trade-offs

- Summary counts can drift if new check helpers bypass the aggregation path. Mitigation: keep status recording inside shared output helpers and include validation coverage for doctor output.
- A skipped PowerShell check can hide Windows-only syntax errors on hosts without `pwsh`. Mitigation: report the skip prominently and keep CI or a Windows host validation path as a follow-up option.
- `dot validate` adds another command to maintain. Mitigation: keep it thin and delegate to testable scripts, matching existing repository patterns.
- Automatic POSIX `chezmoi` installation can fail on locked-down hosts or when neither Homebrew nor the official installer path is usable. Mitigation: print the failed install path and a manual install fallback, then stop before `chezmoi init`.

## Migration Plan

Implement POSIX `chezmoi` auto-install first, then the POSIX doctor/validation path, then mirror doctor/validation behavior in PowerShell. Update README validation commands to point to `dot validate` while retaining the underlying commands as useful troubleshooting detail if needed.

Rollback is straightforward: restore manual-only POSIX install behavior, remove the validation command from dispatchers, remove validation scripts, and leave existing doctor section output unchanged.

## Open Questions

- Should a future CI workflow run `dot validate` on both macOS/Linux and Windows? This change should make that possible but does not need to add CI.
