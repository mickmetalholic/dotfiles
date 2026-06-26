# dot-command-docs Specification

## Purpose
TBD - created by archiving change polish-dot-command-and-docs. Update Purpose after archive.
## Requirements
### Requirement: Unified command surface
The repository SHALL expose `doctor`, `bootstrap`, `apply`, `update`, `diff`, `edit`, `packages`, and `runtime` through the `dot` command on supported platforms.

#### Scenario: User requests help
- **WHEN** the user runs `dot help`
- **THEN** the command lists the supported subcommands

### Requirement: Chezmoi command delegation
The `dot` command SHALL delegate apply, update, diff, and edit operations to chezmoi.

#### Scenario: User checks pending changes
- **WHEN** the user runs `dot diff`
- **THEN** the command invokes `chezmoi diff`

### Requirement: First-version documentation
The repository SHALL document new-machine installation, daily workflow, repository layout, validation commands, and secret safety.

#### Scenario: User opens README
- **WHEN** the user reads the README
- **THEN** they can find install commands, daily commands, and safety boundaries

