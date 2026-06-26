# package-runtime-management Specification

## Purpose
TBD - created by archiving change add-package-runtime-management. Update Purpose after archive.
## Requirements
### Requirement: Declarative package data
The repository SHALL declare shared runtimes and OS-specific package manager entries in `data/packages.yaml`.

#### Scenario: Package scripts locate declarations
- **WHEN** a package script starts
- **THEN** it can find shared runtime declarations and the current OS package groups

### Requirement: Package installation command
`dot packages` SHALL install or update supported packages through available OS package managers while tolerating already-installed packages.

#### Scenario: Package already installed
- **WHEN** a declared package is already present
- **THEN** the command does not treat that package as a fatal error

### Requirement: Runtime installation command
`dot runtime` SHALL delegate runtime installation to mise.

#### Scenario: Mise is available
- **WHEN** the user runs `dot runtime`
- **THEN** the command invokes `mise install`

### Requirement: Chezmoi package hooks
Chezmoi onchange hooks SHALL delegate package and runtime work to repository scripts.

#### Scenario: Package data changes
- **WHEN** chezmoi detects package data changed
- **THEN** the run hook calls the package script instead of containing installer logic inline

