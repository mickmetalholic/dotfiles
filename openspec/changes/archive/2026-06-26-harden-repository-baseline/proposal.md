## Why

Repository-level safeguards are currently mostly local and manual. The project has a useful `dot validate` command, but there is no CI gate, root editor configuration, static-analysis path, or fully consistent cross-platform validation discovery to keep infrastructure drift visible.

## What Changes

- Add repository CI that runs validation on POSIX and Windows hosts.
- Make PowerShell validation discover POSIX scripts and templates automatically instead of relying on a hand-maintained file list.
- Add root repository editing defaults for contributors and local tools.
- Add optional static-analysis validation for shell and PowerShell scripts when the analyzers are available.
- Expand repository line-ending/file-type attributes for existing config file types.
- Expand ignored local cache and tool-state paths to reduce accidental commits.
- Document or pin expected development tool versions through repository-level configuration where practical.

## Non-goals

- Do not change dotfiles business behavior, package lists, host data, or applied home-directory configuration.
- Do not add contribution or development-process documentation in this change.
- Do not make validation install missing analyzers or tools.
- Do not require optional static analyzers to be present on every local host unless CI explicitly installs them.

## Capabilities

### New Capabilities
- `repository-baseline`: Repository-level CI, validation, editor, ignore, attributes, and development tool baseline behavior.

### Modified Capabilities
- `validation-workflow`: Validation gains CI execution, automatic POSIX file discovery on Windows, and optional static-analysis checks.

## Impact

- Affects repository metadata such as `.github/workflows/`, `.editorconfig`, `.gitattributes`, `.gitignore`, and optional tool-version configuration.
- Affects validation scripts under `scripts/`.
- CI may install or provision validation-only tooling in runner environments, but local validation remains read-only and does not change machine configuration.
