## Why

New machines need a conservative path from empty environment to managed dotfiles. Bootstrap should install only foundational tools by default, then apply chezmoi and report health through doctor.

## What Changes

- Add `install.sh` and `install.ps1` remote entrypoints.
- Add `dot bootstrap` for Windows, macOS, and Linux.
- Install or guide installation of chezmoi, package managers, core CLI tools, mise, and runtime setup.
- Support `--gui` for GUI apps and `--force` for explicitly allowing stronger overwrite behavior.
- Run `dot doctor` at the end of bootstrap.

## Non-goals

- Do not silently overwrite existing user configuration without `--force`.
- Do not install GUI applications unless `--gui` is present.
- Do not store or retrieve real secrets during bootstrap.

## Capabilities

### New Capabilities

- `bootstrap-workflow`: New-machine installation and bootstrap orchestration.

### Modified Capabilities

- None.

## Impact

- Adds install and bootstrap scripts that may modify host state when invoked.
- Depends on the chezmoi foundation and doctor command for apply and validation.
