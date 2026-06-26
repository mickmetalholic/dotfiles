## 1. Doctor Summary

- [x] 1.1 Update POSIX shared doctor helpers to track blocking issue and warning counts while preserving existing status output.
- [x] 1.2 Add a final POSIX `dot doctor` summary that reports ready, usable-with-warnings, or blocked state.
- [x] 1.3 Mirror doctor summary behavior in the PowerShell helpers and `doctor.ps1`.
- [x] 1.4 Ensure missing required command checks keep fix hints near the original check output.

## 2. Validation Command

- [x] 2.1 Add POSIX `scripts/validate.sh` to run `openspec validate --all --strict` and shell syntax checks without changing machine state.
- [x] 2.2 Add PowerShell `scripts/validate.ps1` to run OpenSpec validation and PowerShell syntax checks.
- [x] 2.3 Route `dot validate` through POSIX and PowerShell command dispatchers.
- [x] 2.4 Report PowerShell syntax validation as skipped when `pwsh` is unavailable on POSIX hosts.

## 3. POSIX Chezmoi Auto-install

- [x] 3.1 Update POSIX install helpers to install `chezmoi` with Homebrew when available.
- [x] 3.2 Add a non-Homebrew POSIX fallback for installing `chezmoi` into a user-writable location or produce a clear manual install error.
- [x] 3.3 Update `install.sh` so a fresh macOS/Linux run can install `chezmoi` before `chezmoi init --apply`.
- [x] 3.4 Verify `dot doctor` remains read-only and does not install `chezmoi`.

## 4. Documentation and Verification

- [x] 4.1 Update README validation instructions to prefer `dot validate` and document POSIX install auto-install behavior.
- [x] 4.2 Run `openspec validate --all --strict`.
- [x] 4.3 Run POSIX shell syntax validation for install, scripts, and shell templates.
- [x] 4.4 Run PowerShell syntax validation when `pwsh` is available, or record the skip when unavailable.
- [x] 4.5 Run `dot doctor` and verify the final summary matches the detected machine state.
