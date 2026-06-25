## Why

System packages and development runtimes should be declared in one place and applied consistently. Splitting package installation from runtime installation keeps OS package managers and mise responsibilities clear.

## What Changes

- Add `data/packages.yaml` as the package and runtime declaration source.
- Add `dot packages` for winget, scoop, Homebrew, apt, and Linuxbrew/Homebrew where available.
- Add `dot runtime` for `mise install`.
- Add chezmoi `run_onchange_*` hooks that delegate to scripts instead of embedding large logic.
- Keep package commands idempotent and tolerant of already-installed tools.

## Non-goals

- Do not guarantee full parity across all OS package names in the first version.
- Do not replace mise with language-specific installers.
- Do not install GUI apps without an explicit GUI flag or host setting.

## Capabilities

### New Capabilities

- `package-runtime-management`: Declarative package and runtime installation.

### Modified Capabilities

- None.

## Impact

- Adds package/runtime scripts and chezmoi run hooks.
- May modify system state when package or runtime commands are invoked.
