# bootstrap-workflow Specification

## Purpose
TBD - created by archiving change add-bootstrap-workflow. Update Purpose after archive.
## Requirements
### Requirement: Conservative bootstrap
`dot bootstrap` SHALL install foundational tooling and apply dotfiles only through explicit, idempotent steps.

#### Scenario: Bootstrap runs without GUI flag
- **WHEN** the user runs `dot bootstrap`
- **THEN** GUI applications are not installed by default

### Requirement: Remote install entrypoints
The repository SHALL provide POSIX and PowerShell install entrypoints that install chezmoi when needed, initialize the repository, run bootstrap, and finish with doctor.

#### Scenario: User runs Windows install entrypoint
- **WHEN** `install.ps1` is invoked
- **THEN** it ensures chezmoi is available and delegates further setup to repository bootstrap scripts

### Requirement: Explicit stronger behavior
Bootstrap SHALL require explicit flags for GUI installation and forceful overwrite behavior.

#### Scenario: User allows GUI apps
- **WHEN** bootstrap receives `--gui`
- **THEN** GUI package groups may be installed according to host settings

