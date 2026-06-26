## Why

`dot doctor` currently reports many checks but leaves the user to infer whether a machine is usable, partially ready, or blocked. Validation is also documented as separate commands, which makes it easy for POSIX, PowerShell, and OpenSpec checks to drift.

## What Changes

- Add a final `dot doctor` summary that separates blocking missing requirements from optional warnings.
- Keep `dot doctor` read-only while making its output easier to act on after a new-machine run.
- Add a repository validation workflow that runs OpenSpec validation plus POSIX and PowerShell script syntax checks through one command.
- Make POSIX install/bootstrap paths automatically install `chezmoi` when a supported installer is available, matching the Windows install entrypoint behavior.
- Document the new validation entrypoint after implementation.

## Non-goals

- Do not change `dot bootstrap` force handling or GUI package behavior in this change.
- Do not perform the larger README reorganization; keep documentation updates limited to the new validation command.
- Do not install missing tools from `dot doctor`.

## Capabilities

### New Capabilities

- `validation-workflow`: Repository-level validation command covering OpenSpec, POSIX shell syntax, and PowerShell syntax where the runtime is available.

### Modified Capabilities

- `dot-doctor`: Doctor output gains an actionable summary that distinguishes blocking requirements from optional warnings.
- `bootstrap-workflow`: POSIX install/bootstrap paths actively install `chezmoi` when supported, with clear fallback instructions when they cannot.

## Impact

- Affects POSIX and PowerShell doctor implementations, shared check/output helpers, and the unified `dot` command wrappers.
- Adds validation scripts or command paths for POSIX and PowerShell.
- Updates POSIX install helper behavior for `chezmoi` installation.
- Affects README validation instructions after implementation.
- The doctor and validation paths are read-only with respect to managed dotfiles and machine configuration. POSIX install/bootstrap paths may install `chezmoi` as explicit setup behavior.
