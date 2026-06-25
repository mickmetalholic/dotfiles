## Why

Dotfiles are only useful when the current machine can be inspected safely. A read-only doctor command gives fast feedback about missing tools, pending configuration drift, runtime state, auth, and common security issues.

## What Changes

- Add `dot doctor` for PowerShell and POSIX shells.
- Check system information, core tools, chezmoi state, package managers, runtimes, shell helpers, authentication, editors, terminals, and security risks.
- Standardize `[ok]`, `[warn]`, `[missing]`, and `[fail]` output with actionable `fix:` hints.
- Keep all doctor checks read-only.

## Non-goals

- Do not install missing tools from doctor.
- Do not modify shell profiles, package managers, SSH state, or GitHub auth.
- Do not require every optional GUI app to be present.

## Capabilities

### New Capabilities

- `dot-doctor`: Read-only machine health checks and fix suggestions.

### Modified Capabilities

- None.

## Impact

- Adds doctor scripts under `scripts/` and exposes them through the unified `dot` command.
- Later bootstrap and package changes can point users to `dot doctor` as the validation entrypoint.
